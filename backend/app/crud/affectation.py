from sqlalchemy.orm import Session
from app.models.affectation import Affectation as AffectationModel
from app.schemas.affectation import AffectationCreate

def get_affectation(db: Session, affectation_id: int):
    return db.query(AffectationModel).filter(AffectationModel.id == affectation_id).first()

def get_affectations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(AffectationModel).offset(skip).limit(limit).all()

def get_affectations_by_session(db: Session, session_id: int):
    return db.query(AffectationModel).filter(AffectationModel.session_id == session_id).all()

def create_affectation(db: Session, affectation: AffectationCreate):
    db_affectation = AffectationModel(**affectation.model_dump())
    db.add(db_affectation)
    db.commit()
    db.refresh(db_affectation)
    return db_affectation

def update_affectation(db: Session, affectation_id: int, affectation_data: dict):
    db_affectation = db.query(AffectationModel).filter(AffectationModel.id == affectation_id).first()
    if db_affectation:
        for key, value in affectation_data.items():
            setattr(db_affectation, key, value)
        db.commit()
        db.refresh(db_affectation)
    return db_affectation

def delete_affectation(db: Session, affectation_id: int):
    db_affectation = db.query(AffectationModel).filter(AffectationModel.id == affectation_id).first()
    if db_affectation:
        db.delete(db_affectation)
        db.commit()
    return db_affectation