from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Importez TOUS les modèles ici pour les enregistrer
from .eleve import Eleve
from .lego_set import LegoSet
from .session import Session
from .affectation import Affectation

__all__ = ["Base", "Eleve", "LegoSet", "Session", "Affectation"]