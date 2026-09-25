import unittest
from pathlib import Path

from starlette.routing import Mount

from app.main import app


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


if __name__ == "__main__":
    unittest.main()
