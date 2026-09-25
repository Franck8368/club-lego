from pydantic import BaseModel, ConfigDict
from datetime import date

class AffectationBase(BaseModel):
    eleve_id: int
    lego_set_id: int
    session_id: int

class AffectationCreate(AffectationBase):
    date_affectation: date = date.today()

class Affectation(AffectationBase):
    id: int
    date_affectation: date

    model_config = ConfigDict(from_attributes=True)

class AffectationResponse(Affectation):
    pass