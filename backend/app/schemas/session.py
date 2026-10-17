from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional

class SessionBase(BaseModel):
    date: date
    creneau: str
    annee_scolaire: Optional[str] = None

class SessionCreate(SessionBase):
    ouvert: bool = True

class Session(SessionBase):
    id: int
    ouvert: bool

    model_config = ConfigDict(from_attributes=True)

class SessionResponse(Session):
    pass
