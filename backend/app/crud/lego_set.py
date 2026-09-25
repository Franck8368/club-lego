from sqlalchemy.orm import Session
from app.models.lego_set import LegoSet
from app.schemas.lego_set import LegoSetCreate

def get_lego_set(db: Session, lego_set_id: int):
    return db.query(LegoSet).filter(LegoSet.id == lego_set_id).first()

def get_lego_sets(db: Session, skip: int = 0, limit: int = 100):
    return db.query(LegoSet).offset(skip).limit(limit).all()

def create_lego_set(db: Session, lego_set: LegoSetCreate):
    db_lego_set = LegoSet(**lego_set.model_dump())
    db.add(db_lego_set)
    db.commit()
    db.refresh(db_lego_set)
    return db_lego_set

def update_lego_set(db: Session, lego_set_id: int, lego_set_data: dict):
    db_lego_set = db.query(LegoSet).filter(LegoSet.id == lego_set_id).first()
    if db_lego_set:
        for key, value in lego_set_data.items():
            setattr(db_lego_set, key, value)
        db.commit()
        db.refresh(db_lego_set)
    return db_lego_set

def delete_lego_set(db: Session, lego_set_id: int):
    db_lego_set = db.query(LegoSet).filter(LegoSet.id == lego_set_id).first()
    if db_lego_set:
        db.delete(db_lego_set)
        db.commit()
    return db_lego_set