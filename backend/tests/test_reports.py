import asyncio
import unittest
from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import (
    Affectation,
    Base,
    Eleve,
    LegoSet,
    Parametres,
    Session as SessionModel,
)

try:
    import reportlab  # noqa: F401

    REPORTLAB_DISPONIBLE = True
except ImportError:  # pragma: no cover
    REPORTLAB_DISPONIBLE = False


async def _collecter(iterator):
    return [chunk async for chunk in iterator]


@unittest.skipUnless(REPORTLAB_DISPONIBLE, "reportlab non installé")
class BilanActivitePdfTest(unittest.TestCase):
    """Vérifie que le bilan d'activité PDF se génère (récap niveaux / sexes inclus)."""

    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(bind=self.engine)
        self.db = sessionmaker(bind=self.engine)()
        self._alimenter()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def _alimenter(self):
        annee = "2026-2027"
        self.db.add(
            Parametres(
                annee_scolaire=annee,
                date_debut=date(2026, 9, 1),
                date_fin=date(2027, 8, 31),
                jours_seances="1,3",
            )
        )
        eleves = [
            Eleve(nom="A", prenom="A", classe="6ème", sexe="F", date_inscription=date(2026, 9, 1), annee_scolaire=annee),
            Eleve(nom="B", prenom="B", classe="6ème", sexe="M", date_inscription=date(2026, 9, 1), annee_scolaire=annee),
            Eleve(nom="C", prenom="C", classe="5ème", sexe="F", date_inscription=date(2026, 9, 1), annee_scolaire=annee),
            Eleve(nom="D", prenom="D", classe="3ème", sexe="M", date_inscription=date(2026, 9, 1), annee_scolaire=annee),
        ]
        sets = [
            LegoSet(numero="T-01", nom="Set 1", theme="Test", nombre_pieces=100, disponible=True),
            LegoSet(numero="T-02", nom="Set 2", theme="Test", nombre_pieces=200, disponible=True),
        ]
        session = SessionModel(
            date=date(2026, 9, 12), creneau="09h00-11h00", ouvert=False, annee_scolaire=annee
        )
        self.db.add_all(eleves + sets + [session])
        self.db.flush()
        self.db.add(
            Affectation(
                eleve_id=eleves[0].id,
                lego_set_id=sets[0].id,
                session_id=session.id,
                date_affectation=session.date,
                statut="complet",
                annee_scolaire=annee,
            )
        )
        self.db.commit()

    def _generer_pdf(self) -> bytes:
        from app.routes.reports import generate_report

        response = generate_report(None, None, self.db)
        iterator = response.body_iterator
        if hasattr(iterator, "__aiter__"):
            chunks = asyncio.run(_collecter(iterator))
        else:
            chunks = list(iterator)
        return b"".join(chunks)

    def test_le_bilan_activite_se_genere(self):
        body = self._generer_pdf()
        self.assertTrue(body.startswith(b"%PDF"))
        self.assertGreater(len(body), 1000)


if __name__ == "__main__":
    unittest.main()
