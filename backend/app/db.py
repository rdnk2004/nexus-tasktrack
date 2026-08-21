from typing import Generator
from sqlmodel import create_engine, Session
from app.config import settings

# Determine database driver dialect
db_url = settings.DATABASE_URL
is_sqlite = db_url.startswith("sqlite")

engine_kwargs = {
    "echo": settings.DB_ECHO,
}

if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production-ready PostgreSQL connection pooling
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 10,
        "max_overflow": 20,
    })

# Create SQLModel / SQLAlchemy engine
engine = create_engine(db_url, **engine_kwargs)

def get_session() -> Generator[Session, None, None]:
    """Dependency provider for database session with automatic cleanup"""
    with Session(engine) as session:
        yield session