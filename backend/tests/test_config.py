from app.config import Settings, settings
from app.core.enums import DataMode

def test_settings_initialization():
    assert settings.SERVICE_NAME == "airfare-index-api"
    assert settings.VERSION == "1.0.0"
    assert settings.DATA_MODE in [DataMode.LIVE, DataMode.HISTORICAL, DataMode.SYNTHETIC]
    assert isinstance(settings.CORS_ORIGINS, list)


def test_postgres_url_uses_installed_driver():
    assert Settings(DATABASE_URL="postgresql://user:pass@db.example/app").DATABASE_URL == \
        "postgresql+psycopg2://user:pass@db.example/app"
    assert Settings(DATABASE_URL="postgres://user:pass@db.example/app").DATABASE_URL == \
        "postgresql+psycopg2://user:pass@db.example/app"
    assert Settings(DATABASE_URL="sqlite:///./app.db").DATABASE_URL == "sqlite:///./app.db"
