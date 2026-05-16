"""
Configuration settings using pydantic-settings.
Loads from .env file automatically.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # API Keys
    virustotal_api_key: str = ""
    abuseipdb_api_key: str = ""
    otx_api_key: str = ""

    # App Config
    app_env: str = "development"
    log_level: str = "INFO"
    reports_dir: str = "app/reports"

    # Rate limiting
    api_request_delay: float = 0.5  # seconds between requests
    max_retries: int = 3

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance - only loads .env once."""
    return Settings()
settings = get_settings()
