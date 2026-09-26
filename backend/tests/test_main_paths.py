import unittest
from datetime import date, time
from pathlib import Path

from starlette.routing import Mount

from app.main import app
from app.schemas.affectation import AffectationCreate


class MainPathResolutionTest(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
