from typing import Any, Literal

from pydantic import BaseModel


class AgentResponse(BaseModel):
    thread_id: str
    status: Literal["completed", "pending_action"]
    message: str | None = None
    tool_calls: list[dict[str, Any]] | None = None
