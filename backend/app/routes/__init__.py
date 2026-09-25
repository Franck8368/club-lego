from .eleves import router as eleves_router
from .lego_sets import router as lego_sets_router
from .sessions import router as sessions_router
from .affectations import router as affectations_router

__all__ = ["eleves_router", "lego_sets_router", "sessions_router", "affectations_router"]