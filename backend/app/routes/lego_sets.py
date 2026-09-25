from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.schemas.lego_set import LegoSetCreate, LegoSetResponse
from app.crud.lego_set import (
    create_lego_set as crud_create_lego_set,
    get_lego_set as crud_get_lego_set,
    get_lego_sets as crud_get_lego_sets,
    update_lego_set as crud_update_lego_set,
    delete_lego_set as crud_delete_lego_set
)
from app.database import get_db

router = APIRouter(prefix="/lego_sets")

@router.post("", response_model=LegoSetResponse)
def create_lego_set(lego_set: LegoSetCreate, db: Session = Depends(get_db)):
    # disponible: bool = True est géré dans LegoSetCreate
    return crud_create_lego_set(db, lego_set)

@router.get("", response_model=List[LegoSetResponse])
def read_lego_sets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_get_lego_sets(db, skip, limit)

@router.get("/{lego_set_id}", response_model=LegoSetResponse)
def read_lego_set(lego_set_id: int, db: Session = Depends(get_db)):
    db_lego_set = crud_get_lego_set(db, lego_set_id)
    if db_lego_set is None:
        raise HTTPException(status_code=404, detail="Set LEGO non trouvé")
    return db_lego_set

@router.put("/{lego_set_id}", response_model=LegoSetResponse)
def update_lego_set(lego_set_id: int, lego_set: LegoSetCreate, db: Session = Depends(get_db)):
    db_lego_set = crud_update_lego_set(db, lego_set_id, lego_set.model_dump())
    if db_lego_set is None:
        raise HTTPException(status_code=404, detail="Set LEGO non trouvé")
    return db_lego_set

@router.delete("/{lego_set_id}", response_model=LegoSetResponse)
def delete_lego_set(lego_set_id: int, db: Session = Depends(get_db)):
    db_lego_set = crud_delete_lego_set(db, lego_set_id)
    if db_lego_set is None:
        raise HTTPException(status_code=404, detail="Set LEGO non trouvé")
    return db_lego_set