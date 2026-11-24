from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    llm_model: str = "gemini/gemini-2.0-flash"
    llm_api_keys: str = ""
    database_url: str = "sqlite:///./data/app.db"
    enable_failure_simulation: bool = False
    allowed_origins: str = "http://localhost:3000"
    cache_enabled: bool = True
    default_system_prompt: str = "You are a helpful assistant."

    @property
    def api_keys(self) -> list[str]:
        return [k.strip() for k in self.llm_api_keys.split(",") if k.strip()]

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def db_path(self) -> str:
        return self.database_url.replace("sqlite:///", "", 1)


settings = Settings()
