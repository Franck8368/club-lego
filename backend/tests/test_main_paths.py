import unittest
from datetime import date, time
from pathlib import Path

from sqlalchemy import create_engine, text
from starlette.routing import Mount

from app.crud.affectation import create_affectation, update_affectation, validate_lego_set_availability
from app.database import SessionLocal, ensure_lego_set_columns
from app.main import app
from app.models.affectation import Affectation
from app.models.eleve import Eleve
from app.models.lego_set import LegoSet
from app.models.session import Session
from app.schemas.affectation import AffectationCreate
from app.schemas.lego_set import LegoSetCreate


class MainPathResolutionTest(unittest.TestCase):
    def test_legacy_lego_sets_get_an_empty_brand(self):
        database_engine = create_engine("sqlite://")
        try:
            with database_engine.begin() as connection:
                connection.execute(text(
                    "CREATE TABLE lego_sets (id INTEGER PRIMARY KEY, numero VARCHAR(20), nom VARCHAR(100))"
                ))
                connection.execute(text(
                    "INSERT INTO lego_sets (id, numero, nom) VALUES (1, 'SET-OLD', 'Ancien set')"
                ))

            ensure_lego_set_columns(database_engine)

            with database_engine.connect() as connection:
                marque = connection.execute(
                    text("SELECT marque FROM lego_sets WHERE id = 1")
                ).scalar_one()

            self.assertEqual(marque, "")
            self.assertEqual(LegoSetCreate(numero="SET-NEW", nom="Nouveau set").marque, "")
        finally:
            database_engine.dispose()

    def test_static_directory_uses_repo_root(self):
        repo_root = Path(__file__).resolve().parents[2]
        static_dir = repo_root / "frontend" / "build" / "static"

        static_route = next(
            route for route in app.router.routes if isinstance(route, Mount) and route.path == "/static"
        )

        self.assertEqual(static_route.app.directory, str(static_dir))

    def test_favicon_route_serves_icon_file(self):
        favicon_paths = [
            route.path for route in app.router.routes if getattr(route, "path", None) == "/favicon.ico"
        ]

        self.assertTrue(favicon_paths)

    def test_affectation_accepts_arrival_and_departure_times(self):
        payload = AffectationCreate(
            eleve_id=1,
            lego_set_id=2,
            session_id=3,
            date_affectation=date(2026, 9, 26),
            heure_arrivee=time(9, 30),
            heure_depart=time(12, 15),
        )

        self.assertEqual(payload.heure_arrivee, time(9, 30))
        self.assertEqual(payload.heure_depart, time(12, 15))

    def test_affectation_rejects_departure_before_arrival(self):
        with self.assertRaises(ValueError):
            AffectationCreate(
                eleve_id=1,
                lego_set_id=2,
                session_id=3,
                date_affectation=date(2026, 9, 26),
                heure_arrivee=time(12, 15),
                heure_depart=time(9, 30),
            )

    def test_same_student_same_set_same_slot_is_blocked(self):
        db = SessionLocal()
        try:
            db.query(Affectation).delete()
            db.query(LegoSet).delete()
            db.query(Eleve).delete()
            db.query(Session).delete()
            db.commit()

            eleve = Eleve(nom='Martin', prenom='Alice', classe='CM2', sexe='F', date_inscription=date(2026, 9, 1))
            lego_set = LegoSet(numero='SET-101', nom='Voiture', theme='Vitesse', nombre_pieces=200, disponible=True)
            session = Session(date=date(2026, 9, 26), creneau='Matin', ouvert=True)

            db.add_all([eleve, lego_set, session])
            db.commit()
            db.refresh(eleve)
            db.refresh(lego_set)
            db.refresh(session)

            db.add(Affectation(
                eleve_id=eleve.id,
                lego_set_id=lego_set.id,
                session_id=session.id,
                date_affectation=session.date,
            ))
            db.commit()

            with self.assertRaises(ValueError):
                validate_lego_set_availability(
                    db,
                    lego_set_id=lego_set.id,
                    session_id=session.id,
                    date_affectation=session.date,
                    eleve_id=eleve.id,
                )

            with self.assertRaises(Exception):
                create_affectation(
                    db,
                    AffectationCreate(
                        eleve_id=eleve.id,
                        lego_set_id=lego_set.id,
                        session_id=session.id,
                        date_affectation=session.date,
                    ),
                )
        finally:
            db.close()

    def test_same_student_different_set_same_slot_is_allowed(self):
        db = SessionLocal()
        try:
            db.query(Affectation).delete()
            db.query(LegoSet).delete()
            db.query(Eleve).delete()
            db.query(Session).delete()
            db.commit()

            eleve = Eleve(nom='Martin', prenom='Alice', classe='CM2', sexe='F', date_inscription=date(2026, 9, 1))
            set_one = LegoSet(numero='SET-102', nom='Train', theme='Transport', nombre_pieces=180, disponible=True)
            set_two = LegoSet(numero='SET-103', nom='Maison', theme='Construction', nombre_pieces=220, disponible=True)
            session = Session(date=date(2026, 9, 26), creneau='Matin', ouvert=True)

            db.add_all([eleve, set_one, set_two, session])
            db.commit()
            db.refresh(eleve)
            db.refresh(set_one)
            db.refresh(set_two)
            db.refresh(session)

            db.add(Affectation(
                eleve_id=eleve.id,
                lego_set_id=set_one.id,
                session_id=session.id,
                date_affectation=session.date,
            ))
            db.commit()

            self.assertTrue(
                validate_lego_set_availability(
                    db,
                    lego_set_id=set_two.id,
                    session_id=session.id,
                    date_affectation=session.date,
                    eleve_id=eleve.id,
                )
            )
        finally:
            db.close()

    def test_same_set_same_slot_for_a_different_student_is_blocked(self):
        db = SessionLocal()
        try:
            db.query(Affectation).delete()
            db.query(LegoSet).delete()
            db.query(Eleve).delete()
            db.query(Session).delete()
            db.commit()

            first_eleve = Eleve(nom='Martin', prenom='Alice', classe='CM2', sexe='F', date_inscription=date(2026, 9, 1))
            second_eleve = Eleve(nom='Dupont', prenom='Paul', classe='CM1', sexe='M', date_inscription=date(2026, 9, 1))
            lego_set = LegoSet(numero='SET-104', nom='Village', theme='Construction', nombre_pieces=260, disponible=True)
            session = Session(date=date(2026, 9, 26), creneau='Matin', ouvert=True)

            db.add_all([first_eleve, second_eleve, lego_set, session])
            db.commit()
            db.refresh(first_eleve)
            db.refresh(second_eleve)
            db.refresh(lego_set)
            db.refresh(session)

            db.add(Affectation(
                eleve_id=first_eleve.id,
                lego_set_id=lego_set.id,
                session_id=session.id,
                date_affectation=session.date,
                statut='en_cours',
            ))
            db.commit()

            with self.assertRaises(ValueError):
                validate_lego_set_availability(
                    db,
                    lego_set_id=lego_set.id,
                    session_id=session.id,
                    date_affectation=session.date,
                    eleve_id=second_eleve.id,
                )
        finally:
            db.close()

    def test_same_student_same_slot_shares_arrival_and_departure_times(self):
        db = SessionLocal()
        try:
            db.query(Affectation).delete()
            db.query(LegoSet).delete()
            db.query(Eleve).delete()
            db.query(Session).delete()
            db.commit()

            eleve = Eleve(nom='Martin', prenom='Alice', classe='CM2', sexe='F', date_inscription=date(2026, 9, 1))
            first_set = LegoSet(numero='SET-106', nom='Train', theme='Transport', nombre_pieces=180, disponible=True)
            second_set = LegoSet(numero='SET-107', nom='Maison', theme='Construction', nombre_pieces=220, disponible=True)
            session = Session(date=date(2026, 9, 26), creneau='Matin', ouvert=True)

            db.add_all([eleve, first_set, second_set, session])
            db.commit()
            db.refresh(eleve)
            db.refresh(first_set)
            db.refresh(second_set)
            db.refresh(session)

            first_affectation = create_affectation(
                db,
                AffectationCreate(
                    eleve_id=eleve.id,
                    lego_set_id=first_set.id,
                    session_id=session.id,
                    date_affectation=session.date,
                    heure_arrivee=time(9, 0),
                    heure_depart=time(11, 30),
                    statut='en_cours',
                ),
            )

            second_affectation = create_affectation(
                db,
                AffectationCreate(
                    eleve_id=eleve.id,
                    lego_set_id=second_set.id,
                    session_id=session.id,
                    date_affectation=session.date,
                    statut='en_cours',
                ),
            )

            self.assertEqual(first_affectation.heure_arrivee, time(9, 0))
            self.assertEqual(first_affectation.heure_depart, time(11, 30))
            self.assertEqual(second_affectation.heure_arrivee, time(9, 0))
            self.assertEqual(second_affectation.heure_depart, time(11, 30))

            updated = update_affectation(
                db,
                second_affectation.id,
                {
                    'eleve_id': eleve.id,
                    'lego_set_id': second_set.id,
                    'session_id': session.id,
                    'date_affectation': session.date,
                    'statut': 'en_cours',
                    'heure_arrivee': time(10, 0),
                    'heure_depart': time(12, 0),
                },
            )
            self.assertEqual(updated.heure_arrivee, time(10, 0))
            self.assertEqual(updated.heure_depart, time(12, 0))
            self.assertEqual(db.query(Affectation).filter(Affectation.eleve_id == eleve.id, Affectation.session_id == session.id).count(), 2)
            for row in db.query(Affectation).filter(Affectation.eleve_id == eleve.id, Affectation.session_id == session.id):
                self.assertEqual(row.heure_arrivee, time(10, 0))
                self.assertEqual(row.heure_depart, time(12, 0))
        finally:
            db.close()

    def test_completed_assignment_does_not_block_set_reuse(self):
        db = SessionLocal()
        try:
            db.query(Affectation).delete()
            db.query(LegoSet).delete()
            db.query(Eleve).delete()
            db.query(Session).delete()
            db.commit()

            first_eleve = Eleve(nom='Martin', prenom='Alice', classe='CM2', sexe='F', date_inscription=date(2026, 9, 1))
            second_eleve = Eleve(nom='Dupont', prenom='Paul', classe='CM1', sexe='M', date_inscription=date(2026, 9, 1))
            lego_set = LegoSet(numero='SET-108', nom='Aéroplane', theme='Voyage', nombre_pieces=300, disponible=True)
            session = Session(date=date(2026, 9, 28), creneau='Matin', ouvert=True)

            db.add_all([first_eleve, second_eleve, lego_set, session])
            db.commit()
            db.refresh(first_eleve)
            db.refresh(second_eleve)
            db.refresh(lego_set)
            db.refresh(session)

            db.add(Affectation(
                eleve_id=first_eleve.id,
                lego_set_id=lego_set.id,
                session_id=session.id,
                date_affectation=session.date,
                statut='complet',
            ))
            db.commit()

            self.assertTrue(
                validate_lego_set_availability(
                    db,
                    lego_set_id=lego_set.id,
                    session_id=session.id,
                    date_affectation=session.date,
                    eleve_id=second_eleve.id,
                )
            )

            created = create_affectation(
                db,
                AffectationCreate(
                    eleve_id=second_eleve.id,
                    lego_set_id=lego_set.id,
                    session_id=session.id,
                    date_affectation=session.date,
                    statut='en_cours',
                ),
            )
            self.assertEqual(created.eleve_id, second_eleve.id)
            self.assertEqual(created.lego_set_id, lego_set.id)
        finally:
            db.close()

    def test_incomplete_assignment_blocks_set_reuse_in_another_session(self):
        db = SessionLocal()
        try:
            db.query(Affectation).delete()
            db.query(LegoSet).delete()
            db.query(Eleve).delete()
            db.query(Session).delete()
            db.commit()

            eleve = Eleve(nom='Martin', prenom='Alice', classe='CM2', sexe='F', date_inscription=date(2026, 9, 1))
            lego_set = LegoSet(numero='SET-109', nom='Véhicule lunaire', marque='CaDa', nombre_pieces=192, disponible=True)
            first_session = Session(date=date(2026, 9, 26), creneau='Matin', ouvert=False)
            next_session = Session(date=date(2026, 10, 3), creneau='Matin', ouvert=True)
            db.add_all([eleve, lego_set, first_session, next_session])
            db.commit()
            db.refresh(eleve)
            db.refresh(lego_set)
            db.refresh(first_session)
            db.refresh(next_session)

            db.add(Affectation(
                eleve_id=eleve.id,
                lego_set_id=lego_set.id,
                session_id=first_session.id,
                date_affectation=first_session.date,
                statut='en_cours',
            ))
            db.commit()

            with self.assertRaisesRegex(ValueError, 'indisponible'):
                validate_lego_set_availability(
                    db,
                    lego_set_id=lego_set.id,
                    session_id=next_session.id,
                    date_affectation=next_session.date,
                    eleve_id=eleve.id,
                )
        finally:
            db.close()

    def test_duplicate_assignment_raises_clear_business_error(self):
        db = SessionLocal()
        try:
            db.query(Affectation).delete()
            db.query(LegoSet).delete()
            db.query(Eleve).delete()
            db.query(Session).delete()
            db.commit()

            eleve = Eleve(nom='Martin', prenom='Alice', classe='CM2', sexe='F', date_inscription=date(2026, 9, 1))
            lego_set = LegoSet(numero='SET-105', nom='Aéroport', theme='Voyage', nombre_pieces=260, disponible=True)
            session = Session(date=date(2026, 9, 27), creneau='Après-midi', ouvert=True)

            db.add_all([eleve, lego_set, session])
            db.commit()
            db.refresh(eleve)
            db.refresh(lego_set)
            db.refresh(session)

            db.add(Affectation(
                eleve_id=eleve.id,
                lego_set_id=lego_set.id,
                session_id=session.id,
                date_affectation=session.date,
            ))
            db.commit()

            with self.assertRaises(ValueError):
                create_affectation(
                    db,
                    AffectationCreate(
                        eleve_id=eleve.id,
                        lego_set_id=lego_set.id,
                        session_id=session.id,
                        date_affectation=session.date,
                    ),
                )
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
