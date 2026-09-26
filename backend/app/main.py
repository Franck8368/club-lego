from pathlib import Path

from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

# 1. Base de données
from app.database import engine, get_db, ensure_affectation_columns

# 2. Imports EXPLICITES de TOUS les modèles et de la Base
from app.models import Base, Eleve, LegoSet, Session, Affectation

# 3. Imports des routeurs
from app.routes.eleves import router as eleves_router
from app.routes.lego_sets import router as lego_sets_router
from app.routes.sessions import router as sessions_router
from app.routes.affectations import router as affectations_router

def resolve_repo_root() -> Path:
    candidates = [
        Path("/app"),
        Path(__file__).resolve().parents[2],
        Path(__file__).resolve().parents[1],
        Path(__file__).resolve().parent.parent,
    ]
    for candidate in candidates:
        if (candidate / "frontend" / "build").exists():
            return candidate
    return Path(__file__).resolve().parents[2]


REPO_ROOT = resolve_repo_root()
FRONTEND_BUILD_DIR = REPO_ROOT / "frontend" / "build"
STATIC_DIR = FRONTEND_BUILD_DIR / "static"
INDEX_PATH = FRONTEND_BUILD_DIR / "index.html"

app = FastAPI(title="Club LEGO", version="0.1.0")

# 4. Créer les tables (APRÈS tous les imports)
Base.metadata.create_all(bind=engine)
ensure_affectation_columns()

# 5. Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 6. Routeurs
app.include_router(eleves_router, prefix="/api", tags=["eleves"])
app.include_router(lego_sets_router, prefix="/api", tags=["lego_sets"])
app.include_router(sessions_router, prefix="/api", tags=["sessions"])
app.include_router(affectations_router, prefix="/api", tags=["affectations"])

# 7. Fichiers statiques
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/favicon.ico")
async def favicon():
    favicon_candidates = [
        REPO_ROOT / "frontend" / "public" / "favicon.ico",
        REPO_ROOT / "frontend" / "build" / "favicon.ico",
    ]
    favicon_path = next((path for path in favicon_candidates if path.exists()), None)
    if favicon_path is None:
        raise HTTPException(status_code=404, detail="Favicon not found")
    return FileResponse(favicon_path)

# 8. Servir index.html
@app.get("/{path:path}")
async def serve_frontend(request: Request):
    if request.url.path.startswith("/api"):
        raise HTTPException(status_code=404, detail="Not found")
    if not INDEX_PATH.exists():
        raise HTTPException(status_code=500, detail=f"File {INDEX_PATH} does not exist")
    return HTMLResponse(content=INDEX_PATH.read_text(encoding="utf-8"), media_type="text/html")