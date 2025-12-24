from pathlib import Path

from app.config import Settings, get_settings
from app.routers import chat
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn import Config, Server


def create_app(settings: Settings) -> FastAPI:
    app = FastAPI(title=settings.APP_NAME)

    # Set up CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API router
    api_router = APIRouter()
    api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
    app.include_router(api_router, prefix=settings.API_PREFIX)

    return app


if __name__ == "__main__":
    OPENAI_CONFIG_PATH = Path().home() / ".config" / ".env"
    load_dotenv(OPENAI_CONFIG_PATH)

    # Load application settings
    settings = get_settings()
    app = create_app(settings)

    # Start the server
    Server(Config(app=app, reload=True)).run()
