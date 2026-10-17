"""Calculs liés à l'année scolaire.

Ce module ne dépend d'aucun autre module de l'application afin de pouvoir être
utilisé aussi bien par la base de données (migrations légères) que par la couche
CRUD, sans risque d'import circulaire.
"""
from __future__ import annotations

import datetime

# Jours de séances par défaut : tous les jours (index 0 = lundi, 6 = dimanche)
DEFAULT_JOURS_SEANCES = "0,1,2,3,4,5,6"

# À partir de ce mois (août), la nouvelle année scolaire a commencé
SCHOOL_YEAR_START_MONTH = 8


def school_year_start_year(reference: datetime.date | None = None) -> int:
    """Renvoie l'année de début de l'année scolaire contenant ``reference``.

    Une année scolaire va de septembre à août : une date de janvier 2027
    appartient donc à l'année scolaire débutée en 2026.
    """
    reference = reference or datetime.date.today()
    return reference.year if reference.month >= SCHOOL_YEAR_START_MONTH else reference.year - 1


def annee_scolaire_from_date(date_debut: datetime.date) -> str:
    """Construit le libellé « 2026-2027 » à partir de la date de début."""
    start_year = school_year_start_year(date_debut)
    return f"{start_year}-{start_year + 1}"


def default_parametres_values(reference: datetime.date | None = None) -> dict:
    """Valeurs par défaut des paramètres pour une nouvelle installation."""
    start_year = school_year_start_year(reference)
    return {
        "annee_scolaire": f"{start_year}-{start_year + 1}",
        "date_debut": datetime.date(start_year, 9, 1),
        "date_fin": datetime.date(start_year + 1, 8, 31),
        "jours_seances": DEFAULT_JOURS_SEANCES,
    }
