from pydantic import BaseModel, ConfigDict
from datetime import date

class SessionBase(BaseModel):
    date: date
    creneau: str

class SessionCreate(SessionBase):
    ouvert: bool = True

class Session(SessionBase):
    id: int
    ouvert: bool

    model_config = ConfigDict(from_attributes=True)

class SessionResponse(Session):
    pass