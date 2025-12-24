from typing import Annotated, TypedDict

from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.messages.tool import ToolCall
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    active_sheet: str
    selection: str


class StateManager:

    def __init__(self, agent_state: AgentState):
        self.agent_state = agent_state
        self.messages = self.agent_state["messages"]

    def get_last_message_content(self) -> str | None:
        if not self.messages:
            return None
        return self.messages[-1].content

    def get_tool_calls(self) -> list[ToolCall]:
        if not self.messages:
            return []
        last_message = self.messages[-1]
        if not isinstance(last_message, AIMessage):
            return []
        return last_message.tool_calls

    def has_tool_calls(self) -> bool:
        return len(self.get_tool_calls()) > 0
