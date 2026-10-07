from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.schemas.historique_eleve import EleveHistoriqueResponse
from app.crud.historique_eleve import get_eleve_historique
from app.database import get_db

router = APIRouter(prefix="/eleves")

@router.get("/{eleve_id}/historique", response_model=EleveHistoriqueResponse)
def get_eleve_historique_route(eleve_id: int, db: Session = Depends(get_db)):
    """
    Récupère l'historique complet d'un élève : ses informations et toutes ses affectations
    avec les sessions et sets LEGO associés.
    """
    eleve_historique = get_eleve_historique(db, eleve_id)
    if eleve_historique is None:
        raise HTTPException(status_code=404, detail="Élève non trouvé")
    return eleve_historique