from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud.parametres import (
    get_parametres as crud_get_parametres,
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
