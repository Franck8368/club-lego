from sqlalchemy.orm import Session
from app.models.eleve import Eleve
from app.schemas.eleve import EleveCreate

def get_eleve(db: Session, eleve_id: int):
    return db.query(Eleve).filter(Eleve.id == eleve_id).first()

def get_eleves(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Eleve).offset(skip).limit(limit).all()

def create_eleve(db: Session, eleve: EleveCreate):
    db_eleve = Eleve(**eleve.model_dump())
    db.add(db_eleve)
    db.commit()
    db.refresh(db_eleve)
    return db_eleve

def update_eleve(db: Session, eleve_id: int, eleve_data: dict):
    db_eleve = db.query(Eleve).filter(Eleve.id == eleve_id).first()
    if db_eleve:
        for key, value in eleve_data.items():
            setattr(db_eleve, key, value)
        db.commit()
        db.refresh(db_eleve)
    return db_eleve

def delete_eleve(db: Session, eleve_id: int):
    db_eleve = db.query(Eleve).filter(Eleve.id == eleve_id).first()
    if db_eleve:
        db.delete(db_eleve)
        db.commit()
    return db_eleve