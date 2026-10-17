import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from app.school_year import default_parametres_values

# Chemin relatif simple
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lego_club.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def ensure_lego_set_columns(database_engine=engine):
    inspector = inspect(database_engine)
    if not inspector.has_table("lego_sets"):
        return

    existing_columns = {column["name"] for column in inspector.get_columns("lego_sets")}
    if "marque" not in existing_columns:
        with database_engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE lego_sets ADD COLUMN marque VARCHAR(50) NOT NULL DEFAULT ''")
            )


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


def ensure_annee_scolaire_columns(database_engine=engine):
    """Ajoute la colonne « annee_scolaire » aux tables concernées.

    Les enregistrements déjà présents sont rattachés à l'année scolaire
    courante (celle des paramètres si elle existe, sinon la valeur par défaut).
    """
    inspector = inspect(database_engine)
    tables = [
        table
        for table in ("eleves", "sessions", "affectations")
        if inspector.has_table(table)
    ]
    if not tables:
        return

    for table in tables:
        existing_columns = {column["name"] for column in inspector.get_columns(table)}
        if "annee_scolaire" not in existing_columns:
            with database_engine.begin() as connection:
                connection.execute(
                    text(f"ALTER TABLE {table} ADD COLUMN annee_scolaire VARCHAR(20)")
                )

    annee_scolaire = default_parametres_values()["annee_scolaire"]
    if inspector.has_table("parametres"):
        with database_engine.connect() as connection:
            row = connection.execute(
                text("SELECT annee_scolaire FROM parametres ORDER BY id LIMIT 1")
            ).fetchone()
            if row and row[0]:
                annee_scolaire = row[0]

    with database_engine.begin() as connection:
        for table in tables:
            connection.execute(
                text(
                    f"UPDATE {table} SET annee_scolaire = :annee "
                    "WHERE annee_scolaire IS NULL OR annee_scolaire = ''"
                ),
                {"annee": annee_scolaire},
            )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()