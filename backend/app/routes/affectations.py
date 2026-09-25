from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.schemas.affectation import AffectationCreate, AffectationResponse
from app.crud.affectation import (
    create_affectation as crud_create_affectation,
    get_affectation as crud_get_affectation,
    get_affectations as crud_get_affectations,
    get_affectations_by_session as crud_get_affectations_by_session,
    delete_affectation as crud_delete_affectation
)
from app.database import get_db

router = APIRouter(prefix="/affectations")

@router.post("", response_model=AffectationResponse)
def create_affectation(affectation: AffectationCreate, db: Session = Depends(get_db)):
    # date_affectation: date = date.today() est géré dans AffectationCreate
    return crud_create_affectation(db, affectation)

@router.get("", response_model=List[AffectationResponse])
def read_affectations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_get_affectations(db, skip, limit)

@router.get("/{session_id}", response_model=List[AffectationResponse])
def read_affectations_by_session(session_id: int, db: Session = Depends(get_db)):
    return crud_get_affectations_by_session(db, session_id)

@router.get("/{affectation_id}", response_model=AffectationResponse)
def read_affectation(affectation_id: int, db: Session = Depends(get_db)):
    db_affectation = crud_get_affectation(db, affectation_id)
    if db_affectation is None:
        raise HTTPException(status_code=404, detail="Affectation non trouvée")
    return db_affectation

@router.delete("/{affectation_id}", response_model=AffectationResponse)
def delete_affectation(affectation_id: int, db: Session = Depends(get_db)):
    db_affectation = crud_delete_affectation(db, affectation_id)
    if db_affectation is None:
        raise HTTPException(status_code=404, detail="Affectation non trouvée")
    return db_affectation