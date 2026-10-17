from sqlalchemy.orm import Session
from app.crud.parametres import get_annee_scolaire
from app.models.session import Session as SessionModel
from app.schemas.session import SessionCreate

def get_session(db: Session, session_id: int):
    return db.query(SessionModel).filter(SessionModel.id == session_id).first()

def get_sessions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(SessionModel).offset(skip).limit(limit).all()

def create_session(db: Session, session: SessionCreate):
    data = session.model_dump()
    if not data.get("annee_scolaire"):
        data["annee_scolaire"] = get_annee_scolaire(db)
    db_session = SessionModel(**data)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def update_session(db: Session, session_id: int, session_data: dict):
    db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if db_session:
        data = dict(session_data)
        # Ne jamais écraser l'année scolaire existante si elle n'est pas fournie
        if not data.get("annee_scolaire"):
            data.pop("annee_scolaire", None)
        for key, value in data.items():
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
