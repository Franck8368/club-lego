from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import os

# 1. Base de données
from app.database import engine, get_db

# 2. Imports EXPLICITES de TOUS les modèles et de la Base
from app.models import Base, Eleve, LegoSet, Session, Affectation

# 3. Imports des routeurs
from app.routes.eleves import router as eleves_router
from app.routes.lego_sets import router as lego_sets_router
from app.routes.sessions import router as sessions_router
from app.routes.affectations import router as affectations_router

app = FastAPI(title="Club LEGO", version="0.1.0")

# 4. Créer les tables (APRÈS tous les imports)
Base.metadata.create_all(bind=engine)

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
app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")

# 8. Servir index.html
@app.get("/{path:path}")
async def serve_frontend(request: Request):
    if request.url.path.startswith("/api"):
        raise HTTPException(status_code=404, detail="Not found")
    index_path = os.path.join(os.getcwd(), "frontend", "build", "index.html")
    if not os.path.exists(index_path):
        raise HTTPException(status_code=500, detail=f"File {index_path} does not exist")
    return HTMLResponse(content=open(index_path, "r", encoding="utf-8").read(), media_type="text/html")