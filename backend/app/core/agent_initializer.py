from functools import lru_cache

from app.config import get_settings
from app.core.agent import Agent
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver


@lru_cache
def get_agent() -> Agent:
    settings = get_settings()
    model = ChatOpenAI(model=settings.MODEL_NAME)
    checkpointer = InMemorySaver()
    return Agent(model, checkpointer)
