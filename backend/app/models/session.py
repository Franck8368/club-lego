from sqlalchemy import Column, Integer, String, Date, Boolean
from . import Base  # <-- Utilisez la Base commune

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    creneau = Column(String(50), nullable=False)
    ouvert = Column(Boolean, default=True)