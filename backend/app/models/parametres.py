from sqlalchemy import Column, Date, Integer, String

from . import Base  # <-- Utilisez la Base commune


class Parametres(Base):
    """Paramètres de l'application (ligne unique).

    - l'année scolaire courante (libellé + dates de début et de fin) ;
    - les jours de la semaine pendant lesquels se déroulent les séances
      (chaîne d'index séparés par des virgules, 0 = lundi, 6 = dimanche).
    """

    __tablename__ = "parametres"
    id = Column(Integer, primary_key=True, index=True)
    annee_scolaire = Column(String(20), nullable=False)
    date_debut = Column(Date, nullable=False)
    date_fin = Column(Date, nullable=False)
    jours_seances = Column(String(20), nullable=False, default="0,1,2,3,4,5,6")
