from sqlalchemy import Boolean, Column, Date, Integer, String

from . import Base  # <-- Utilisez la Base commune


class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    creneau = Column(String(50), nullable=False)
    ouvert = Column(Boolean, default=True)
    # Année scolaire à laquelle la séance est rattachée (ex. « 2026-2027 »)
    annee_scolaire = Column(String(20), nullable=True, index=True)
