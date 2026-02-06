import os
from typing import Optional
from urllib.parse import quote_plus

class Settings:
    # Database Configuration
    DATABASE_TYPE: str = os.getenv("DATABASE_TYPE", "postgresql")  # sqlite or postgresql
    
    
    # PostgreSQL (for production)
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "nutmeg_user")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "nutmeg123")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "nutmeg_db")
    
    @property
    def DATABASE_URL(self) -> str:
        """Returns appropriate database URL based on DATABASE_TYPE"""
        if self.DATABASE_TYPE == "postgresql":
            # URL encode user and password to handle special characters like '@'
            user = quote_plus(self.POSTGRES_USER)
            password = quote_plus(self.POSTGRES_PASSWORD)
            return f"postgresql://{user}:{password}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        return self.SQLITE_DATABASE_URL

settings = Settings()