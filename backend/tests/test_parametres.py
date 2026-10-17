import unittest
from datetime import date

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.crud.eleve import create_eleve, update_eleve
from app.crud.parametres import get_parametres, update_parametres
from app.crud.session import create_session
from app.database import ensure_annee_scolaire_columns
from app.models import Base
from app.schemas.eleve import EleveCreate
from app.schemas.parametres import ParametresUpdate
from app.schemas.session import SessionCreate
from app.school_year import annee_scolaire_from_date, default_parametres_values


class ParametresCrudTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(bind=self.engine)
        self.db = sessionmaker(bind=self.engine)()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_parametres_created_with_defaults(self):
        parametres = get_parametres(self.db)
        defaults = default_parametres_values()
        self.assertEqual(parametres.annee_scolaire, defaults["annee_scolaire"])
        self.assertEqual(parametres.jours_seances, defaults["jours_seances"])

    def test_update_normalizes_days_and_derives_school_year(self):
        payload = ParametresUpdate(
            annee_scolaire="",
            date_debut=date(2026, 9, 1),
            date_fin=date(2027, 7, 7),
            jours_seances="4,2,2",
        )

        parametres = update_parametres(self.db, payload.model_dump())

        self.assertEqual(parametres.jours_seances, "2,4")
        self.assertEqual(parametres.annee_scolaire, "2026-2027")

    def test_update_rejects_end_before_start(self):
        with self.assertRaises(ValueError):
            ParametresUpdate(
                date_debut=date(2026, 9, 1),
                date_fin=date(2026, 8, 1),
                jours_seances="2",
            )

    def test_update_requires_at_least_one_day(self):
        with self.assertRaises(ValueError):
            ParametresUpdate(
                date_debut=date(2026, 9, 1),
                date_fin=date(2027, 7, 7),
                jours_seances="",
            )

    def test_new_eleve_and_session_are_tagged_with_current_school_year(self):
        update_parametres(
            self.db,
            ParametresUpdate(
                annee_scolaire="2025-2026",
                date_debut=date(2025, 9, 1),
                date_fin=date(2026, 8, 31),
                jours_seances="2",
            ).model_dump(),
        )

        eleve = create_eleve(
            self.db, EleveCreate(nom="Martin", prenom="Lina", classe="6e", sexe="F")
        )
        session = create_session(
            self.db, SessionCreate(date=date(2026, 9, 9), creneau="Matin")
        )

        self.assertEqual(eleve.annee_scolaire, "2025-2026")
        self.assertEqual(session.annee_scolaire, "2025-2026")

    def test_update_eleve_keeps_school_year_when_not_provided(self):
        eleve = create_eleve(
            self.db, EleveCreate(nom="Martin", prenom="Lina", classe="6e", sexe="F")
        )
        original = eleve.annee_scolaire

        updated = update_eleve(self.db, eleve.id, {"nom": "Durand", "annee_scolaire": None})

        self.assertEqual(updated.annee_scolaire, original)


class SchoolYearHelperTest(unittest.TestCase):
    def test_label_from_start_date(self):
        self.assertEqual(annee_scolaire_from_date(date(2026, 9, 1)), "2026-2027")

    def test_january_belongs_to_previous_start(self):
        self.assertEqual(annee_scolaire_from_date(date(2027, 1, 15)), "2026-2027")


class AnneeScolaireMigrationTest(unittest.TestCase):
    def test_legacy_rows_are_backfilled_with_current_school_year(self):
        engine = create_engine("sqlite://")
        try:
            with engine.begin() as connection:
                connection.execute(
                    text("CREATE TABLE eleves (id INTEGER PRIMARY KEY, nom VARCHAR(50))")
                )
                connection.execute(
                    text("INSERT INTO eleves (id, nom) VALUES (1, 'Ancien')")
                )

            ensure_annee_scolaire_columns(engine)

            with engine.connect() as connection:
                annee = connection.execute(
                    text("SELECT annee_scolaire FROM eleves WHERE id = 1")
                ).scalar_one()

            self.assertEqual(annee, default_parametres_values()["annee_scolaire"])
        finally:
            engine.dispose()


if __name__ == "__main__":
    unittest.main()
