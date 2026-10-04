import os
from datetime import date
from pathlib import Path

from sqlalchemy.engine import URL

BACKEND_DIRECTORY = Path(__file__).resolve().parent
DEMO_DIRECTORY = BACKEND_DIRECTORY.parent / "demo"
DEMO_DIRECTORY.mkdir(exist_ok=True)
DEMO_DATABASE_PATH = DEMO_DIRECTORY / "lego_club_demo.db"
os.environ["DATABASE_URL"] = URL.create(
    "sqlite", database=str(DEMO_DATABASE_PATH)
).render_as_string(hide_password=False)

from app.database import SessionLocal, engine
from app.models import Affectation, Base, Eleve, LegoSet, Session as SessionModel


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        tables = (Eleve, LegoSet, SessionModel, Affectation)
        if any(db.query(model).first() is not None for model in tables):
            print(f"Base de démonstration déjà alimentée : {DEMO_DATABASE_PATH}")
            return

        eleves = [
            Eleve(nom="Martin", prenom="Lina", classe="6ème", sexe="F", date_inscription=date(2026, 9, 1)),
            Eleve(nom="Bernard", prenom="Hugo", classe="6ème", sexe="M", date_inscription=date(2026, 9, 1)),
            Eleve(nom="Petit", prenom="Emma", classe="6ème", sexe="F", date_inscription=date(2026, 9, 1)),
            Eleve(nom="Robert", prenom="Adam", classe="5ème", sexe="M", date_inscription=date(2026, 9, 2)),
            Eleve(nom="Richard", prenom="Inès", classe="5ème", sexe="F", date_inscription=date(2026, 9, 2)),
            Eleve(nom="Durand", prenom="Noah", classe="5ème", sexe="M", date_inscription=date(2026, 9, 2)),
            Eleve(nom="Dubois", prenom="Jade", classe="4ème", sexe="F", date_inscription=date(2026, 9, 3)),
            Eleve(nom="Moreau", prenom="Louis", classe="4ème", sexe="M", date_inscription=date(2026, 9, 3)),
            Eleve(nom="Laurent", prenom="Zoé", classe="4ème", sexe="F", date_inscription=date(2026, 9, 3)),
            Eleve(nom="Simon", prenom="Gabriel", classe="3ème", sexe="M", date_inscription=date(2026, 9, 4)),
            Eleve(nom="Michel", prenom="Chloé", classe="3ème", sexe="F", date_inscription=date(2026, 9, 4)),
            Eleve(nom="Lefebvre", prenom="Arthur", classe="3ème", sexe="M", date_inscription=date(2026, 9, 4)),
        ]
        sets = [
            LegoSet(numero=f"D-{index:03}", nom=nom, theme=theme, nombre_pieces=pieces, disponible=True)
            for index, nom, theme, pieces in [
                (1, "Base spatiale", "Espace", 174),
                (2, "Camion de chantier", "Ville", 94),
                (3, "Dino Explorer", "Dinosaures", 305),
                (4, "Voiture de course", "Véhicules", 248),
                (5, "Navette orbitale", "Espace", 144),
                (6, "Atelier des robots", "Robots", 386),
                (7, "Bateau de sauvetage", "Ville", 212),
                (8, "Dragon des montagnes", "Fantasy", 427),
                (9, "Station météo", "Science", 318),
                (10, "Train miniature", "Transport", 563),
                (11, "Jardin botanique", "Nature", 291),
                (12, "Forteresse médiévale", "Histoire", 684),
                (13, "Sous-marin", "Océan", 236),
                (14, "Véhicule lunaire", "Espace", 192),
                (15, "Grand pont", "Architecture", 512),
                (16, "Centre animalier", "Nature", 349),
            ]
        ]
        sessions = [
            SessionModel(date=date(2026, 9, 12), creneau="09h00-11h00", ouvert=False),
            SessionModel(date=date(2026, 9, 19), creneau="09h00-11h00", ouvert=False),
            SessionModel(date=date(2026, 9, 26), creneau="09h00-11h00", ouvert=False),
            SessionModel(date=date(2026, 10, 3), creneau="09h00-11h00", ouvert=False),
        ]

        db.add_all(eleves + sets + sessions)
        db.flush()

        affectations_par_session = [
            [(0, 0, "complet"), (1, 1, "complet"), (3, 2, "en_cours"), (6, 3, "non_fini")],
            [(2, 4, "complet"), (4, 5, "complet"), (5, 6, "complet"), (7, 7, "en_cours")],
            [(0, 8, "non_fini"), (3, 9, "complet"), (6, 10, "complet"), (9, 11, "complet")],
            [(1, 12, "complet"), (7, 13, "en_cours"), (10, 14, "complet"), (11, 15, "complet")],
        ]
        for session, session_affectations in zip(sessions, affectations_par_session):
            for eleve_index, set_index, statut in session_affectations:
                db.add(Affectation(
                    eleve_id=eleves[eleve_index].id,
                    lego_set_id=sets[set_index].id,
                    session_id=session.id,
                    date_affectation=session.date,
                    statut=statut,
                ))

        db.commit()
        print(
            f"Base de démonstration créée : {DEMO_DATABASE_PATH} "
            f"({len(eleves)} élèves, {len(sets)} sets, {len(sessions)} sessions, 16 affectations)."
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()