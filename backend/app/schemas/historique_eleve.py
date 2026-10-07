from pydantic import BaseModel, ConfigDict
from datetime import date, time
from typing import Optional, List

class EleveHistoriqueBase(BaseModel):
    pass

class SessionHistorique(BaseModel):
    id: int
    date: date
    creneau: str
    ouvert: bool

    model_config = ConfigDict(from_attributes=True)

class LegoSetHistorique(BaseModel):
    id: int
    marque: str
    numero: str
    nom: str
    theme: Optional[str] = None
    nombre_pieces: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class AffectationHistorique(BaseModel):
    id: int
    date_affectation: date
    statut: str
    heure_arrivee: Optional[time] = None
    heure_depart: Optional[time] = None
    session: SessionHistorique
    lego_set: LegoSetHistorique

    model_config = ConfigDict(from_attributes=True)

class EleveHistorique(EleveHistoriqueBase):
    id: int
    nom: str
    prenom: str
    classe: str
    sexe: str
    date_inscription: date
    affectations: List[AffectationHistorique]

    model_config = ConfigDict(from_attributes=True)

class EleveHistoriqueResponse(EleveHistorique):
    pass