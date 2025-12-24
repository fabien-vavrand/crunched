from pydantic import BaseModel


class UserRequest(BaseModel):
    thread_id: str
    message: str
    active_sheet: str
    selection: str
