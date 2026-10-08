from pydantic import BaseModel, ConfigDict
from datetime import date, time
from typing import Optional, List

class EleveHistorique(BaseModel):
    id: int
    nom: str
    prenom: str
    classe: str
    sexe: str

    model_config = ConfigDict(from_attributes=True)

class SessionHistorique(BaseModel):
    id: int
    date: date
    creneau: str
    ouvert: bool

    model_config = ConfigDict(from_attributes=True)

class AffectationSetHistorique(BaseModel):
    id: int
    date_affectation: date
    statut: str
    heure_arrivee: Optional[time] = None
    heure_depart: Optional[time] = None
    eleve: EleveHistorique
    session: SessionHistorique

    model_config = ConfigDict(from_attributes=True)

class LegoSetHistoriqueResponse(BaseModel):
    id: int
    marque: str
    numero: str
    nom: str
    theme: Optional[str] = None
    nombre_pieces: Optional[int] = None
    disponible: bool
    affectations: List[AffectationSetHistorique]

    model_config = ConfigDict(from_attributes=True)
