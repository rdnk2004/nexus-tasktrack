import os
from typing import List, Optional
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Database Configuration
    DATABASE_TYPE: str = os.getenv("DATABASE_TYPE", "postgresql")  # "sqlite" or "postgresql"
    SQLITE_DB_PATH: str = os.getenv("SQLITE_DB_PATH", "./nexus.db")
    DB_ECHO: bool = os.getenv("DB_ECHO", "false").lower() == "true"
    
    # PostgreSQL Configuration (for local / containerized development)
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "nexus_user")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "nexus123")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "nexus_db")
    
    # JWT Authentication
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", os.getenv("SECRET_KEY", "nexus-super-secret-key-change-in-production"))
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", os.getenv("ALGORITHM", "HS256"))
    JWT_EXPIRATION_MINUTES: int = int(os.getenv("JWT_EXPIRATION_MINUTES", os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 8))))
    
    # Application Defaults & Flags
    DEFAULT_PASSWORD: str = os.getenv("DEFAULT_PASSWORD", "password123")
    ALLOW_MASTER_PASSWORD_LOGIN: bool = os.getenv("ALLOW_MASTER_PASSWORD_LOGIN", "true").lower() == "true"
    CORS_ORIGINS: List[str] = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()]

    @property
    def DATABASE_URL(self) -> str:
        """Returns normalized database URL based on environment or constructed credentials"""
        # For Render/Railway/Neon/Supabase deployment - use DATABASE_URL directly if provided
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            # SQLAlchemy 1.4+ and 2.0+ require 'postgresql://' instead of deprecated 'postgres://'
            if database_url.startswith("postgres://"):
                return database_url.replace("postgres://", "postgresql://", 1)
            return database_url
        
        # Otherwise construct from individual env vars
        if self.DATABASE_TYPE == "postgresql":
            user = quote_plus(self.POSTGRES_USER)
            password = quote_plus(self.POSTGRES_PASSWORD)
            return f"postgresql://{user}:{password}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
        return f"sqlite:///{self.SQLITE_DB_PATH}"

settings = Settings()