from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.schemas.session import SessionCreate, SessionResponse
from app.crud.session import (
    create_session as crud_create_session,
    get_session as crud_get_session,
    get_sessions as crud_get_sessions,
    update_session as crud_update_session,
    delete_session as crud_delete_session
)
from app.database import get_db

router = APIRouter(prefix="/sessions")

@router.post("", response_model=SessionResponse)
def create_session(session: SessionCreate, db: Session = Depends(get_db)):
    # ouvert: bool = True est géré dans SessionCreate
    return crud_create_session(db, session)

@router.get("", response_model=List[SessionResponse])
def read_sessions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_get_sessions(db, skip, limit)

@router.get("/{session_id}", response_model=SessionResponse)
def read_session(session_id: int, db: Session = Depends(get_db)):
    db_session = crud_get_session(db, session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    return db_session

@router.put("/{session_id}", response_model=SessionResponse)
def update_session(session_id: int, session: SessionCreate, db: Session = Depends(get_db)):
    db_session = crud_update_session(db, session_id, session.model_dump())
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    return db_session

@router.delete("/{session_id}", response_model=SessionResponse)
def delete_session(session_id: int, db: Session = Depends(get_db)):
    db_session = crud_delete_session(db, session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    return db_session