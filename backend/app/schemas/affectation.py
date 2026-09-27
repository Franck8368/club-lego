from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from datetime import date, time

class AffectationBase(BaseModel):
    eleve_id: int
    lego_set_id: int
    session_id: int
    statut: str = 'en_cours'
    heure_arrivee: time | None = None
    heure_depart: time | None = None

    @field_validator('statut')
    @classmethod
    def validate_statut(cls, value):
        allowed = {'en_cours', 'complet', 'non_fini'}
        if value not in allowed:
            raise ValueError('Le statut doit être : en_cours, complet ou non_fini.')
        return value

    @field_validator('heure_arrivee', 'heure_depart', mode='before')
    @classmethod
    def normalize_optional_times(cls, value):
        if value == '':
            return None
        return value

    @model_validator(mode='after')
    def validate_times(self):
        if self.heure_arrivee and self.heure_depart and self.heure_depart < self.heure_arrivee:
            raise ValueError('Période invalide : l\'heure de départ ne peut pas être avant l\'heure d\'arrivée.')
        return self

class AffectationCreate(AffectationBase):
    date_affectation: date = date.today()

class Affectation(AffectationBase):
    id: int
    date_affectation: date

    model_config = ConfigDict(from_attributes=True)

class AffectationResponse(Affectation):
    pass