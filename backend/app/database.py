from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

# Chemin relatif simple
SQLALCHEMY_DATABASE_URL = "sqlite:///./lego_club.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def ensure_affectation_columns():
    inspector = inspect(engine)
    if not inspector.has_table("affectations"):
        return

    existing_columns = {column["name"] for column in inspector.get_columns("affectations")}
    with engine.begin() as connection:
        if "statut" not in existing_columns:
            connection.execute(text("ALTER TABLE affectations ADD COLUMN statut VARCHAR(20) NOT NULL DEFAULT 'en_cours'"))
        if "heure_arrivee" not in existing_columns:
            connection.execute(text("ALTER TABLE affectations ADD COLUMN heure_arrivee TIME"))
        if "heure_depart" not in existing_columns:
            connection.execute(text("ALTER TABLE affectations ADD COLUMN heure_depart TIME"))

        legacy_indexes = connection.execute(
            text("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='affectations' AND name NOT LIKE 'sqlite_%'")
        ).fetchall()
        for (index_name,) in legacy_indexes:
            if index_name in {"uq_affectation_eleve_set_session", "uq_affectation_set_session", "uq_affectation_set_session_active"}:
                connection.execute(text(f"DROP INDEX IF EXISTS {index_name}"))
            elif "affectation" in index_name.lower() and ("session" in index_name.lower() or "set" in index_name.lower()):
                connection.execute(text(f"DROP INDEX IF EXISTS {index_name}"))

        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_affectation_eleve_set_session ON affectations (eleve_id, lego_set_id, session_id)"))
        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_affectation_set_session_active ON affectations (lego_set_id, session_id) WHERE statut != 'complet'"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()