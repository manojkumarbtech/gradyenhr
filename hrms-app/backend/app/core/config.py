import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./hrms.db"
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "hrms-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.environ.get("TOKEN_EXPIRE_MINUTES", "480"))  # 8 hours default
    DEBUG: bool = os.environ.get("DEBUG", "false").lower() == "true"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()