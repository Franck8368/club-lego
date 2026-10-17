from sqlalchemy.orm import Session

from app.models.parametres import Parametres
from app.school_year import annee_scolaire_from_date, default_parametres_values


def get_parametres(db: Session) -> Parametres:
    """Renvoie les paramètres uniques, en les créant si nécessaire."""
    parametres = db.query(Parametres).order_by(Parametres.id).first()
    if parametres is None:
        parametres = Parametres(**default_parametres_values())
        db.add(parametres)
        db.commit()
        db.refresh(parametres)
    return parametres


def get_annee_scolaire(db: Session) -> str:
    """Année scolaire courante, utilisée pour taguer les nouveaux enregistrements."""
    return get_parametres(db).annee_scolaire


def update_parametres(db: Session, data: dict) -> Parametres:
    parametres = get_parametres(db)

    data = dict(data)
    if not data.get("annee_scolaire"):
        date_debut = data.get("date_debut") or parametres.date_debut
        data["annee_scolaire"] = annee_scolaire_from_date(date_debut)

    for key, value in data.items():
        setattr(parametres, key, value)
    db.commit()
    db.refresh(parametres)
    return parametres
