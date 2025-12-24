import logging
from enum import Enum
from pathlib import Path
from typing import Any, Iterator

from app.core.agent_state import AgentState, StateManager
from app.core.tools import get_spreadsheets, read_spreadsheet, write_spreadsheet
from langchain_core.language_models.chat_models import BaseChatModel, LanguageModelInput
from langchain_core.messages import AIMessage, SystemMessage, ToolMessage
from langchain_core.messages.tool import ToolCall
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import Runnable, RunnableConfig
from langchain_core.tools.base import BaseTool
from langgraph.graph import END, StateGraph
from langgraph.graph.state import CompiledStateGraph
from langgraph.types import Checkpointer

logger = logging.getLogger(__name__)


class NodeType(str, Enum):
    EXECUTOR = "executor"
    FRONTEND = "frontend"


class Agent(Runnable[AgentState, AgentState]):

    EXECUTOR_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "executor_prompt.md"

    MAX_LOOP_COUNT = 2

    _tools: dict[str, BaseTool]
    _model: Runnable[LanguageModelInput, AIMessage]
    _graph: CompiledStateGraph[AgentState]

    def __init__(self, model: BaseChatModel, checkpointer: Checkpointer | None = None) -> None:
        tools = self._init_tools()
        self._model = model
        self._model_with_tools = model.bind_tools(tools)
        self._graph = self._build_graph().compile(
            checkpointer=checkpointer,
            interrupt_before=[NodeType.FRONTEND],
        )
        self._executor_prompt = PromptTemplate.from_file(self.EXECUTOR_PROMPT_PATH)

    def _init_tools(self) -> list[BaseTool]:
        tools = [read_spreadsheet, write_spreadsheet, get_spreadsheets]
        self._tools = {tool.name: tool for tool in tools}
        return tools

    def _build_graph(self) -> StateGraph[AgentState]:
        return (
            StateGraph(AgentState)
            .add_node(NodeType.EXECUTOR, self._executor)
            .add_node(NodeType.FRONTEND, self._frontend_action)
            .add_conditional_edges(
                NodeType.EXECUTOR,
                self._has_tool_calls,
                {True: NodeType.FRONTEND, False: END},
            )
            .add_edge(NodeType.FRONTEND, NodeType.EXECUTOR)
            .set_entry_point(NodeType.EXECUTOR)
        )

    def _executor(self, state: AgentState) -> dict[str, list[AIMessage]]:
        logger.info("Invoking Executor")
        messages = state["messages"]
        prompt = self._executor_prompt.format(active_sheet=state["active_sheet"], selection=state["selection"])
        messages = [SystemMessage(content=prompt)] + messages
        message = self._model_with_tools.invoke(messages)
        if message.content:
            logger.info(f"LLM response: {message.content}")
        return {"messages": [message]}

    @staticmethod
    def _has_tool_calls(state: AgentState) -> bool:
        return StateManager(state).has_tool_calls()

    @staticmethod
    def _frontend_action(state: AgentState):
        """This node is a placeholder. The 'actual' execution happened in Excel.
        We just return the state to move back to the 'agent' node for analysis.
        """
        # We could add logic here to verify that all tool calls have results
        return state

    def invoke(self, state: AgentState, config: RunnableConfig | None = None, **kwargs: Any) -> AgentState:
        return AgentState(**self._graph.invoke(state, config, **kwargs))

    def stream(self, state: AgentState, config: RunnableConfig | None = None, **kwargs: Any) -> Iterator[AgentState]:
        yield from self._graph.stream(state, config, **kwargs)

    def get_tool_calls(self, config: RunnableConfig) -> list[ToolCall]:
        state = self._graph.get_state(config).values
        return StateManager(state).get_tool_calls()

    def get_last_message_content(self, config: RunnableConfig) -> str:
        state = self._graph.get_state(config).values
        return StateManager(state).get_last_message_content()

    def update_action_results(self, tool_messages: list[ToolMessage], config: RunnableConfig) -> None:
        self._graph.update_state(config, {"messages": tool_messages}, as_node=NodeType.FRONTEND)
