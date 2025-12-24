from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "Mini Crunched"
    API_PREFIX: str = "/api"

    # MODEL
    MODEL_NAME: str = "gpt-4.1-2025-04-14"
    OPENAI_API_KEY: SecretStr = "openai_api_key"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://localhost:3000",
    ]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
