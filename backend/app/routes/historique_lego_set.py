from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.schemas.historique_lego_set import LegoSetHistoriqueResponse
from app.crud.historique_lego_set import get_lego_set_historique
from app.database import get_db

router = APIRouter(prefix="/lego_sets")

@router.get("/{lego_set_id}/historique", response_model=LegoSetHistoriqueResponse)
def get_lego_set_historique_route(lego_set_id: int, db: Session = Depends(get_db)):
    """
    Récupère l'historique complet d'un set LEGO : ses informations et toutes ses affectations
    avec les élèves et sessions associés.
    """
    lego_set_historique = get_lego_set_historique(db, lego_set_id)
    if lego_set_historique is None:
        raise HTTPException(status_code=404, detail="Set LEGO non trouvé")
    return lego_set_historique
