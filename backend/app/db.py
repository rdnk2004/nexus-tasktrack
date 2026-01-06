from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./nutmeg_v2.db"

engine = create_engine(
    DATABASE_URL,
    echo=True,  # logs SQL (great for learning)
    connect_args={"check_same_thread": False}
)

def get_session():
    with Session(engine) as session:
        yield session
