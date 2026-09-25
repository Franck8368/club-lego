from sqlalchemy.orm import Session
from app.models.session import Session as SessionModel
from app.schemas.session import SessionCreate

def get_session(db: Session, session_id: int):
    return db.query(SessionModel).filter(SessionModel.id == session_id).first()

def get_sessions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(SessionModel).offset(skip).limit(limit).all()

def create_session(db: Session, session: SessionCreate):
    db_session = SessionModel(**session.model_dump())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def update_session(db: Session, session_id: int, session_data: dict):
    db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if db_session:
        for key, value in session_data.items():
            setattr(db_session, key, value)
        db.commit()
        db.refresh(db_session)
    return db_session

def delete_session(db: Session, session_id: int):
    db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if db_session:
        db.delete(db_session)
        db.commit()
    return db_session