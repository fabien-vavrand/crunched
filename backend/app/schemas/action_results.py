from pydantic import BaseModel

class ActionResult(BaseModel):
    tool_call_id: str
    name: str
    content: str


class ActionResults(BaseModel):
    thread_id: str
    results: list[ActionResult]