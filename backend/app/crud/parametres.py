from sqlalchemy.orm import Session

from app.models.parametres import Parametres
from app.school_year import add_one_year, annee_scolaire_from_date, default_parametres_values


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


def prepare_next_school_year(db: Session) -> Parametres:
    """Prépare l'année scolaire suivante sans changer l'année courante.

    Aucune donnée (élève, session, affectation) n'est touchée : on calcule
    simplement les dates de l'année suivante et on les mémorise en attente
    d'activation.
    """
    parametres = get_parametres(db)

    date_debut_suivante = add_one_year(parametres.date_debut)
    date_fin_suivante = add_one_year(parametres.date_fin)

    parametres.annee_suivante = annee_scolaire_from_date(date_debut_suivante)
    parametres.date_debut_suivante = date_debut_suivante
    parametres.date_fin_suivante = date_fin_suivante
    db.commit()
    db.refresh(parametres)
    return parametres


def cancel_next_school_year(db: Session) -> Parametres:
    """Annule la préparation de l'année suivante."""
    parametres = get_parametres(db)
    parametres.annee_suivante = None
    parametres.date_debut_suivante = None
    parametres.date_fin_suivante = None
    db.commit()
    db.refresh(parametres)
    return parametres


def activate_next_school_year(db: Session) -> Parametres:
    """Active l'année scolaire préparée comme année courante.

    Les données des années précédentes sont conservées telles quelles : seuls
    les paramètres changent. Les nouvelles saisies seront désormais rattachées
    à la nouvelle année.
    """
    parametres = get_parametres(db)

    if not (
        parametres.annee_suivante
        and parametres.date_debut_suivante
        and parametres.date_fin_suivante
    ):
        raise ValueError("Aucune année scolaire suivante n'a été préparée.")

    parametres.annee_scolaire = parametres.annee_suivante
    parametres.date_debut = parametres.date_debut_suivante
    parametres.date_fin = parametres.date_fin_suivante
    parametres.annee_suivante = None
    parametres.date_debut_suivante = None
    parametres.date_fin_suivante = None
    db.commit()
    db.refresh(parametres)
    return parametres
