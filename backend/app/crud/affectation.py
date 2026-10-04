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
    if lego_set_id is not None:
        active_assignment = db.query(AffectationModel).filter(
            AffectationModel.lego_set_id == lego_set_id,
            AffectationModel.statut != 'complet',
        )
        if exclude_affectation_id is not None:
            active_assignment = active_assignment.filter(AffectationModel.id != exclude_affectation_id)

        existing_assignment = active_assignment.first()
        if existing_assignment is not None:
            if (
                session_id is not None
                and existing_assignment.session_id == session_id
                and eleve_id is not None
                and existing_assignment.eleve_id == eleve_id
            ):
                raise ValueError('Cet élève a déjà ce set affecté pour cette session.')
            raise ValueError('Ce set est en cours et reste indisponible jusqu’à ce qu’il soit complet.')

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

    same_student_session = db.query(AffectationModel).filter(
        AffectationModel.eleve_id == affectation.eleve_id,
        AffectationModel.session_id == affectation.session_id,
        AffectationModel.date_affectation == affectation.date_affectation,
    )

    effective_arrival = affectation.heure_arrivee
    effective_departure = affectation.heure_depart
    if effective_arrival is None or effective_departure is None:
        existing_times = same_student_session.filter(
            (AffectationModel.heure_arrivee.is_not(None)) | (AffectationModel.heure_depart.is_not(None))
        ).order_by(AffectationModel.id).first()
        if existing_times is not None:
            if effective_arrival is None:
                effective_arrival = existing_times.heure_arrivee
            if effective_departure is None:
                effective_departure = existing_times.heure_depart

    if effective_arrival is not None and effective_departure is not None:
        same_student_session.update({
            'heure_arrivee': effective_arrival,
            'heure_depart': effective_departure,
        }, synchronize_session=False)

    db_affectation = AffectationModel(
        eleve_id=affectation.eleve_id,
        lego_set_id=affectation.lego_set_id,
        session_id=affectation.session_id,
        date_affectation=affectation.date_affectation,
        statut=affectation.statut,
        heure_arrivee=effective_arrival,
        heure_depart=effective_departure,
    )
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

        if 'heure_arrivee' in affectation_data or 'heure_depart' in affectation_data:
            new_arrival = affectation_data.get('heure_arrivee', db_affectation.heure_arrivee)
            new_departure = affectation_data.get('heure_depart', db_affectation.heure_depart)

            related_rows = db.query(AffectationModel).filter(
                AffectationModel.eleve_id == db_affectation.eleve_id,
                AffectationModel.session_id == db_affectation.session_id,
                AffectationModel.date_affectation == db_affectation.date_affectation,
            )
            existing_times = related_rows.order_by(AffectationModel.id).first()
            if new_arrival is None and existing_times is not None:
                new_arrival = existing_times.heure_arrivee
            if new_departure is None and existing_times is not None:
                new_departure = existing_times.heure_depart

            if new_arrival is not None and new_departure is not None:
                related_rows.filter(AffectationModel.id != affectation_id).update({
                    'heure_arrivee': new_arrival,
                    'heure_depart': new_departure,
                }, synchronize_session=False)

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