from sqlalchemy import Column, Integer, ForeignKey, Date
from sqlalchemy.orm import relationship
from . import Base  # <-- Utilisez la Base commune

class Affectation(Base):
    __tablename__ = "affectations"
    id = Column(Integer, primary_key=True, index=True)
    eleve_id = Column(Integer, ForeignKey("eleves.id"), nullable=False)
    lego_set_id = Column(Integer, ForeignKey("lego_sets.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    date_affectation = Column(Date, nullable=False)

    eleve = relationship("Eleve", backref="affectations")
    lego_set = relationship("LegoSet", backref="affectations")
    session = relationship("Session", backref="affectations")