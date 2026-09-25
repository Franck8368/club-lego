from sqlalchemy import Column, Integer, String, Boolean
from . import Base  # <-- Utilisez la Base commune

class LegoSet(Base):
    __tablename__ = "lego_sets"
    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String(20), unique=True, nullable=False)
    nom = Column(String(100), nullable=False)
    theme = Column(String(50))
    nombre_pieces = Column(Integer)
    disponible = Column(Boolean, default=True)