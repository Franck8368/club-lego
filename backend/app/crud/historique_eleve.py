from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.models.eleve import Eleve
from app.models.affectation import Affectation
from app.models.session import Session as SessionModel
from app.models.lego_set import LegoSet


def get_eleve_historique(db: Session, eleve_id: int) -> Optional[Eleve]:
    """
    Recupere l'historique complet d'un eleve : ses informations + toutes ses affectations
    avec les sessions et sets LEGO associes.
    """
    eleve_with_historique = db.query(Eleve).filter(Eleve.id == eleve_id).options(
        joinedload(Eleve.affectations).joinedload(Affectation.session),
        joinedload(Eleve.affectations).joinedload(Affectation.lego_set)
    ).first()
    
    return eleve_with_historique


def get_affectations_by_eleve(db: Session, eleve_id: int):
    """
    Recupere toutes les affectations d'un eleve avec les informations complettes
    sur les sessions et sets LEGO.
    """
    affectations = db.query(Affectation).filter(Affectation.eleve_id == eleve_id).options(
        joinedload(Affectation.session),
        joinedload(Affectation.lego_set)
    ).all()
    
    return affectations