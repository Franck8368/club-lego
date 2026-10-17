from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud.parametres import (
    activate_next_school_year as crud_activate_next_school_year,
    cancel_next_school_year as crud_cancel_next_school_year,
    get_parametres as crud_get_parametres,
    prepare_next_school_year as crud_prepare_next_school_year,
    update_parametres as crud_update_parametres,
)
from app.database import get_db
from app.schemas.parametres import ParametresResponse, ParametresUpdate

router = APIRouter(prefix="/parametres")


@router.get("", response_model=ParametresResponse)
def read_parametres(db: Session = Depends(get_db)):
    return crud_get_parametres(db)


@router.put("", response_model=ParametresResponse)
def update_parametres(parametres: ParametresUpdate, db: Session = Depends(get_db)):
    return crud_update_parametres(db, parametres.model_dump())


@router.post("/nouvelle-annee", response_model=ParametresResponse)
def prepare_new_school_year(db: Session = Depends(get_db)):
    """Prépare l'année scolaire suivante (sans changer l'année courante)."""
    return crud_prepare_next_school_year(db)


@router.delete("/nouvelle-annee", response_model=ParametresResponse)
def cancel_new_school_year(db: Session = Depends(get_db)):
    """Annule la préparation de l'année scolaire suivante."""
    return crud_cancel_next_school_year(db)


@router.post("/activer-nouvelle-annee", response_model=ParametresResponse)
def activate_new_school_year(db: Session = Depends(get_db)):
    """Active l'année scolaire préparée comme année courante (données conservées)."""
    try:
        return crud_activate_next_school_year(db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
