from sqlalchemy import Column, Integer, ForeignKey, Date, Time, UniqueConstraint, String
from sqlalchemy.orm import relationship
from . import Base  # <-- Utilisez la Base commune

class Affectation(Base):
    __tablename__ = "affectations"
    __table_args__ = (
        UniqueConstraint("eleve_id", "lego_set_id", "session_id", name="uq_affectation_eleve_set_session"),
        UniqueConstraint("lego_set_id", "session_id", name="uq_affectation_set_session"),
    )

    id = Column(Integer, primary_key=True, index=True)
    eleve_id = Column(Integer, ForeignKey("eleves.id"), nullable=False)
    lego_set_id = Column(Integer, ForeignKey("lego_sets.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    date_affectation = Column(Date, nullable=False)
    statut = Column(String(20), nullable=False, default="en_cours")
    heure_arrivee = Column(Time, nullable=True)
    heure_depart = Column(Time, nullable=True)

    eleve = relationship("Eleve", backref="affectations")
    lego_set = relationship("LegoSet", backref="affectations")
    session = relationship("Session", backref="affectations")