import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from app.core.enums import DataMode

class Settings(BaseSettings):
    """
    Application Settings loaded from Environment Variables or .env file.
    """
    SERVICE_NAME: str = "airfare-index-api"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # Database Settings
    DATABASE_URL: str = "postgresql://mospi_admin:mospi_secure_password_2026@localhost:5432/sih_airfare"
    
    # Redis & Celery Settings
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # API & CORS Settings
    API_BASE_URL: str = "http://localhost:8000"
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    @field_validator("CORS_ORIGINS")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            return [i.strip() for i in v.split(",")]
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_postgres_driver(cls, v: str) -> str:
        """Use the PostgreSQL driver installed by backend/requirements.txt."""
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg2://", 1)
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v
    
    # Operational Data Mode & Scraping Flags
    SCRAPER_ENABLED: bool = True
    DATA_MODE: DataMode = DataMode.HISTORICAL
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
