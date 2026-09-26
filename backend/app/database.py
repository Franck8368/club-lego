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
        if "heure_arrivee" not in existing_columns:
            connection.execute(text("ALTER TABLE affectations ADD COLUMN heure_arrivee TIME"))
        if "heure_depart" not in existing_columns:
            connection.execute(text("ALTER TABLE affectations ADD COLUMN heure_depart TIME"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()