from app.core.agent import Agent
from app.core.agent_initializer import get_agent
from app.core.agent_state import AgentState
from app.schemas.action_results import ActionResults
from app.schemas.agent_response import AgentResponse
from app.schemas.user_request import UserRequest
from fastapi import APIRouter, Depends
from langchain_core.messages import HumanMessage, ToolMessage
from langchain_core.runnables import RunnableConfig

router = APIRouter()


@router.post("/", response_model=AgentResponse)
async def chat(request: UserRequest, agent: Agent = Depends(get_agent)):
    state = AgentState(
        messages=[HumanMessage(content=request.message)],
        active_sheet=request.active_sheet,
        selection=request.selection,
    )
    return _get_agent_response(agent, state, request.thread_id)


@router.post("/resume")
async def resume(action_results: ActionResults, agent: Agent = Depends(get_agent)):
    tool_messages = [
        ToolMessage(tool_call_id=result.tool_call_id, name=result.name, content=result.content)
        for result in action_results.results
    ]
    config = RunnableConfig(configurable={"thread_id": action_results.thread_id})
    agent.update_action_results(tool_messages, config)
    return _get_agent_response(agent, None, action_results.thread_id)


def _get_agent_response(agent: Agent, state: AgentState | None, thread_id: str) -> AgentResponse:
    config = RunnableConfig(configurable={"thread_id": thread_id})
    for event in agent.stream(state, config):
        if "__interrupt__" in event:
            return AgentResponse(
                thread_id=thread_id,
                status="pending_action",
                tool_calls=agent.get_tool_calls(config),
            )

    return AgentResponse(
        thread_id=thread_id,
        status="completed",
        message=agent.get_last_message_content(config),
    )
