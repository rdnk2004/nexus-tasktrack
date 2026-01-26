from sqlmodel import create_engine, Session
from app.config import settings

# Create engine based on configuration
engine = create_engine(
    settings.DATABASE_URL,
    echo=True,
    # Remove SQLite-specific settings for PostgreSQL
    connect_args={"check_same_thread": False} if settings.DATABASE_TYPE == "sqlite" else {}
)

def get_session():
    with Session(engine) as session:
        yield session