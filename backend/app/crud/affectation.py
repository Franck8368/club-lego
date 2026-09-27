from datetime import date
from sqlalchemy import exc as sqlalchemy_exc
from sqlalchemy.orm import Session
from app.models.affectation import Affectation as AffectationModel
from app.schemas.affectation import AffectationCreate


def validate_lego_set_availability(
    db: Session,
    lego_set_id: int,
    session_id: int | None = None,
    date_affectation: date | None = None,
    eleve_id: int | None = None,
    exclude_affectation_id: int | None = None,
):
    if lego_set_id is not None and session_id is not None:
        set_used_in_session = db.query(AffectationModel).filter(
            AffectationModel.lego_set_id == lego_set_id,
            AffectationModel.session_id == session_id,
        )
        if exclude_affectation_id is not None:
            set_used_in_session = set_used_in_session.filter(AffectationModel.id != exclude_affectation_id)

        existing_assignment = set_used_in_session.first()
        if existing_assignment is not None:
            if eleve_id is not None and existing_assignment.eleve_id == eleve_id:
                raise ValueError('Cet élève a déjà ce set affecté pour cette session.')
            raise ValueError('Ce set est déjà affecté pour cette session.')

    return True


def get_affectation(db: Session, affectation_id: int):
    return db.query(AffectationModel).filter(AffectationModel.id == affectation_id).first()


def get_affectations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(AffectationModel).offset(skip).limit(limit).all()


def get_affectations_by_session(db: Session, session_id: int):
    return db.query(AffectationModel).filter(AffectationModel.session_id == session_id).all()


def create_affectation(db: Session, affectation: AffectationCreate):
    validate_lego_set_availability(
        db,
        lego_set_id=affectation.lego_set_id,
        session_id=affectation.session_id,
        date_affectation=affectation.date_affectation,
        eleve_id=affectation.eleve_id,
    )
    db_affectation = AffectationModel(**affectation.model_dump())
    db.add(db_affectation)
    try:
        db.commit()
    except sqlalchemy_exc.IntegrityError as exc:
        db.rollback()
        raise ValueError('Ce set est déjà affecté pour cette session.') from exc
    db.refresh(db_affectation)
    return db_affectation


def update_affectation(db: Session, affectation_id: int, affectation_data: dict):
    db_affectation = db.query(AffectationModel).filter(AffectationModel.id == affectation_id).first()
    if db_affectation:
        validate_lego_set_availability(
            db,
            lego_set_id=affectation_data.get('lego_set_id', db_affectation.lego_set_id),
            session_id=affectation_data.get('session_id', db_affectation.session_id),
            date_affectation=affectation_data.get('date_affectation', db_affectation.date_affectation),
            eleve_id=affectation_data.get('eleve_id', db_affectation.eleve_id),
            exclude_affectation_id=affectation_id,
        )
        for key, value in affectation_data.items():
            setattr(db_affectation, key, value)
        try:
            db.commit()
        except sqlalchemy_exc.IntegrityError as exc:
            db.rollback()
            raise ValueError('Ce set est déjà affecté pour cette session.') from exc
        db.refresh(db_affectation)
    return db_affectation


def delete_affectation(db: Session, affectation_id: int):
    db_affectation = db.query(AffectationModel).filter(AffectationModel.id == affectation_id).first()
    if db_affectation:
        db.delete(db_affectation)
        db.commit()
    return db_affectation