"""
FinBank Shared - Configuration
"""
from pydantic_settings import BaseSettings
from typing import List


class SharedSettings(BaseSettings):
    MONGODB_URL: str = "mongodb://mongo:27017"
    MONGODB_DB_NAME: str = "finbank"
    JWT_SECRET: str = "change-this-to-a-very-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    RESEND_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = SharedSettings()
