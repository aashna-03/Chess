from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    DATABASE_URL: str = ""
    REDIS_URL: str = ""

    class Config:
        env_file = ".env"

settings = Settings()