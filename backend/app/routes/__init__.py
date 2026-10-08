from .eleves import router as eleves_router
from .lego_sets import router as lego_sets_router
from .sessions import router as sessions_router
from .affectations import router as affectations_router
from .historique_eleve import router as historique_eleve_router
from .historique_lego_set import router as historique_lego_set_router

__all__ = ["eleves_router", "lego_sets_router", "sessions_router", "affectations_router", "historique_eleve_router", "historique_lego_set_router"]