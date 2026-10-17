from datetime import date

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

ALLOWED_JOURS = set(range(7))


def normalize_jours_seances(value) -> str:
    """Accepte « 2,3 » ou [2, 3] et renvoie une chaîne triée unique « 2,3 »."""
    if value is None or value == "":
        return ""
    if isinstance(value, str):
        parts = [part.strip() for part in value.split(",") if part.strip() != ""]
    else:
        parts = list(value)

    jours = sorted({int(part) for part in parts})
    for jour in jours:
        if jour not in ALLOWED_JOURS:
            raise ValueError(
                "Les jours de séances doivent être des entiers entre 0 (lundi) et 6 (dimanche)."
            )
    return ",".join(str(jour) for jour in jours)


class ParametresBase(BaseModel):
    annee_scolaire: str = ""
    date_debut: date
    date_fin: date
    jours_seances: str = "0,1,2,3,4,5,6"

    @field_validator("jours_seances", mode="before")
    @classmethod
    def validate_jours_seances(cls, value):
        return normalize_jours_seances(value)

    @model_validator(mode="after")
    def validate_coherence(self):
        if self.date_fin <= self.date_debut:
            raise ValueError("La date de fin doit être postérieure à la date de début.")
        if not self.jours_seances:
            raise ValueError("Sélectionnez au moins un jour de séance.")
        return self


class ParametresUpdate(ParametresBase):
    pass


class ParametresResponse(ParametresBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
