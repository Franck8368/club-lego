from sqlalchemy import Column, Integer, String, Date
from . import Base  # <-- Utilisez la Base commune

class Eleve(Base):
    __tablename__ = "eleves"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(50), nullable=False)
    prenom = Column(String(50), nullable=False)
    classe = Column(String(20), nullable=False)
    sexe = Column(String(10), nullable=False)
    date_inscription = Column(Date, nullable=False)