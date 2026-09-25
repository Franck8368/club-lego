from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional

class EleveBase(BaseModel):
    nom: str
    prenom: str
    classe: str
    sexe: str

class EleveCreate(EleveBase):
    date_inscription: date = date.today()

class Eleve(EleveBase):
    id: int
    date_inscription: date

    model_config = ConfigDict(from_attributes=True)

class EleveResponse(Eleve):
    pass