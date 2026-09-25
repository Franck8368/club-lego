from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.schemas.eleve import EleveCreate, EleveResponse
from app.crud.eleve import (
    create_eleve as crud_create_eleve,
    get_eleve as crud_get_eleve,
    get_eleves as crud_get_eleves,
    update_eleve as crud_update_eleve,
    delete_eleve as crud_delete_eleve
)
from app.database import get_db

router = APIRouter(prefix="/eleves")

@router.post("", response_model=EleveResponse)
def create_eleve(eleve: EleveCreate, db: Session = Depends(get_db)):
    # La date est automatiquement gérée dans EleveCreate (date_inscription: date = date.today())
    return crud_create_eleve(db, eleve)

@router.get("", response_model=List[EleveResponse])
def read_eleves(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_get_eleves(db, skip, limit)

@router.get("/{eleve_id}", response_model=EleveResponse)
def read_eleve(eleve_id: int, db: Session = Depends(get_db)):
    db_eleve = crud_get_eleve(db, eleve_id)
    if db_eleve is None:
        raise HTTPException(status_code=404, detail="Élève non trouvé")
    return db_eleve

@router.put("/{eleve_id}", response_model=EleveResponse)
def update_eleve(eleve_id: int, eleve: EleveCreate, db: Session = Depends(get_db)):
    db_eleve = crud_update_eleve(db, eleve_id, eleve.model_dump())
    if db_eleve is None:
        raise HTTPException(status_code=404, detail="Élève non trouvé")
    return db_eleve

@router.delete("/{eleve_id}", response_model=EleveResponse)
def delete_eleve(eleve_id: int, db: Session = Depends(get_db)):
    db_eleve = crud_delete_eleve(db, eleve_id)
    if db_eleve is None:
        raise HTTPException(status_code=404, detail="Élève non trouvé")
    return db_eleve