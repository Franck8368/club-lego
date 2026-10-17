from sqlalchemy.orm import Session
from app.crud.parametres import get_annee_scolaire
from app.models.eleve import Eleve
from app.schemas.eleve import EleveCreate

def get_eleve(db: Session, eleve_id: int):
    return db.query(Eleve).filter(Eleve.id == eleve_id).first()

def get_eleves(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Eleve).offset(skip).limit(limit).all()

def create_eleve(db: Session, eleve: EleveCreate):
    data = eleve.model_dump()
    if not data.get("annee_scolaire"):
        data["annee_scolaire"] = get_annee_scolaire(db)
    db_eleve = Eleve(**data)
    db.add(db_eleve)
    db.commit()
    db.refresh(db_eleve)
    return db_eleve

def update_eleve(db: Session, eleve_id: int, eleve_data: dict):
    db_eleve = db.query(Eleve).filter(Eleve.id == eleve_id).first()
    if db_eleve:
        data = dict(eleve_data)
        # Ne jamais écraser l'année scolaire existante si elle n'est pas fournie
        if not data.get("annee_scolaire"):
            data.pop("annee_scolaire", None)
        for key, value in data.items():
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
