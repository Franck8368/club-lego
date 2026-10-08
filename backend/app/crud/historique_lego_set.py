from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.models.lego_set import LegoSet
from app.models.affectation import Affectation
from app.models.eleve import Eleve
from app.models.session import Session as SessionModel


def get_lego_set_historique(db: Session, lego_set_id: int) -> Optional[LegoSet]:
    """
    Recupere l'historique complet d'un set LEGO : ses informations + toutes ses affectations
    avec les eleves et sessions associes.
    """
    lego_set_with_historique = db.query(LegoSet).filter(LegoSet.id == lego_set_id).options(
        joinedload(LegoSet.affectations).joinedload(Affectation.eleve),
        joinedload(LegoSet.affectations).joinedload(Affectation.session)
    ).first()
    
    return lego_set_with_historique


def get_affectations_by_lego_set(db: Session, lego_set_id: int):
    """
    Recupere toutes les affectations d'un set LEGO avec les informations complettes
    sur les eleves et sessions.
    """
    affectations = db.query(Affectation).filter(Affectation.lego_set_id == lego_set_id).options(
        joinedload(Affectation.eleve),
        joinedload(Affectation.session)
    ).all()
    
    return affectations
