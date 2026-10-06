from datetime import date, timedelta
from sqlalchemy import exc as sqlalchemy_exc, or_, and_
from sqlalchemy.orm import Session
from app.models.affectation import Affectation as AffectationModel
from app.models.session import Session as SessionModel
from app.schemas.affectation import AffectationCreate


def get_previous_session(db: Session, current_session_id: int) -> SessionModel | None:
    """Trouve la session la plus récente avant la session actuelle."""
    current_session = db.query(SessionModel).filter(SessionModel.id == current_session_id).first()
    if not current_session:
        return None
    
    # Trouver la session avec la date la plus proche avant la date de la session actuelle
    previous_session = db.query(SessionModel).filter(
        SessionModel.date < current_session.date
    ).order_by(SessionModel.date.desc()).first()
    
    return previous_session


def get_eleve_incomplete_affectation(db: Session, eleve_id: int, exclude_session_id: int | None = None) -> AffectationModel | None:
    """Trouve l'affectation en cours (non complète) de l'élève dans n'importe quelle session sauf celle exclue."""
    query = db.query(AffectationModel).filter(
        AffectationModel.eleve_id == eleve_id,
        AffectationModel.statut != 'complet'
    )
    
    if exclude_session_id:
        query = query.filter(AffectationModel.session_id != exclude_session_id)
    
    # Prendre la plus récente par date de session
    incomplete_affectation = query.join(SessionModel).order_by(SessionModel.date.desc()).first()
    
    return incomplete_affectation


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
            if existing_assignment.statut != 'complet':
                raise ValueError('Ce set est déjà affecté pour cette session.')

    return True


def validate_eleve_set_continuity(db: Session, eleve_id: int, lego_set_id: int, session_id: int) -> bool:
    """
    Valide que l'élève reprend son set LEGO en cours de la session précédente.
    Si l'élève a un set en cours dans une session précédente, il doit reprendre ce même set,
    sauf s'il a déjà complété un set dans la session actuelle.
    """
    # Vérifier si l'élève a déjà complété un set dans la session actuelle
    completed_in_session = db.query(AffectationModel).filter(
        AffectationModel.eleve_id == eleve_id,
        AffectationModel.session_id == session_id,
        AffectationModel.statut == 'complet'
    ).first()
    
    if completed_in_session is not None:
        # L'élève a déjà complété un set dans cette session, il peut choisir un nouveau set
        return True
    
    # Vérifier si l'élève a une affectation en cours dans une session précédente
    incomplete_affectation = get_eleve_incomplete_affectation(db, eleve_id, session_id)
    
    if incomplete_affectation is not None:
        # L'élève a un set en cours dans une session précédente
        if incomplete_affectation.lego_set_id != lego_set_id:
            raise ValueError(f'L\'élève doit reprendre son set LEGO en cours (ID: {incomplete_affectation.lego_set_id}) de la session précédente.')
        
        # Vérifier qu'il n'a pas déjà une affectation pour ce set dans la session actuelle
        existing_in_session = db.query(AffectationModel).filter(
            AffectationModel.eleve_id == eleve_id,
            AffectationModel.lego_set_id == lego_set_id,
            AffectationModel.session_id == session_id
        ).first()
        
        if existing_in_session is not None:
            raise ValueError('Cet élève a déjà une affectation pour ce set dans cette session.')
    
    return True


def get_affectation(db: Session, affectation_id: int):
    return db.query(AffectationModel).filter(AffectationModel.id == affectation_id).first()


def get_affectations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(AffectationModel).offset(skip).limit(limit).all()


def get_affectations_by_session(db: Session, session_id: int):
    return db.query(AffectationModel).filter(AffectationModel.session_id == session_id).all()


def create_affectation(db: Session, affectation: AffectationCreate):
    # Validation de la continuité du set LEGO pour l'élève
    validate_eleve_set_continuity(db, affectation.eleve_id, affectation.lego_set_id, affectation.session_id)
    
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
        # Si on change l'élève ou le set, valider la continuité
        new_eleve_id = affectation_data.get('eleve_id', db_affectation.eleve_id)
        new_lego_set_id = affectation_data.get('lego_set_id', db_affectation.lego_set_id)
        new_session_id = affectation_data.get('session_id', db_affectation.session_id)
        
        if new_eleve_id != db_affectation.eleve_id or new_lego_set_id != db_affectation.lego_set_id or new_session_id != db_affectation.session_id:
            validate_eleve_set_continuity(db, new_eleve_id, new_lego_set_id, new_session_id)
        
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