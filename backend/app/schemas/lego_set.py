from pydantic import BaseModel, ConfigDict
from typing import Optional

class LegoSetBase(BaseModel):
    numero: str
    nom: str
    theme: Optional[str] = None
    nombre_pieces: Optional[int] = None

class LegoSetCreate(LegoSetBase):
    disponible: bool = True

class LegoSet(LegoSetBase):
    id: int
    disponible: bool

    model_config = ConfigDict(from_attributes=True)

class LegoSetResponse(LegoSet):
    pass