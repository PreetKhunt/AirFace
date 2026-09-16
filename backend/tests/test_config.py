from app.config import settings
from app.core.enums import DataMode

def test_settings_initialization():
    assert settings.SERVICE_NAME == "airfare-index-api"
    assert settings.VERSION == "1.0.0"
    assert settings.DATA_MODE in [DataMode.LIVE, DataMode.HISTORICAL, DataMode.SYNTHETIC]
    assert isinstance(settings.CORS_ORIGINS, list)
