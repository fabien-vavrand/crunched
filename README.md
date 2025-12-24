# Crunched - AI-Powered Excel Add-In

An intelligent Excel Add-In that leverages LangGraph and OpenAI to enable natural language interaction with spreadsheets. This project demonstrates an architecture for coordinating AI agents with frontend actions through interrupt-based state management.

### Architecture Highlights

The core architectural challenge is enabling the **backend agent to request actions that only the frontend can perform** (reading cells, writing data, formatting, etc.). This is solved through:

- **LangGraph Interrupts**: The agent workflow pauses when frontend actions are needed
- **In-Memory State Management**: A simple state saver allows the process to resume after the frontend updates the state with action results
- **Clean Action Modeling**: Actions are precisely defined so the agent knows what it can request and the frontend knows how to execute them

### Current Implementation

The agent follows a simple executor pattern:
- **Executor Node**: Performs reasoning and requests actions
- **Frontend Interrupt**: Pauses for Excel operations
- **Response Generation**: Submits final results to the user

Future enhancements could include:
- A planner node for complex multi-step operations
- A reviewer node to validate results and catch errors
- Additional Excel capabilities (formulas, formatting, styling, charts, etc.)

## Tech Stack

**Backend**:
- Python 3.12
- FastAPI (REST API)
- LangGraph (agent orchestration)
- LangChain + OpenAI (LLM integration)
- Pydantic (data validation)

**Frontend**:
- TypeScript + React
- Office.js (Excel integration)
- Fluent UI (Microsoft design system)

## Prerequisites

1. **OpenAI API Key**: Create a `.env` file with your API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

2. **Configuration Path**: Update `OPENAI_CONFIG_PATH` in `backend/app/main.py` to point to your `.env` file location (default: `~/.config/.env`)

## Getting Started

### Start the Backend Server

```bash
cd backend
python app/main.py
```

The FastAPI server will start on `http://localhost:8000` with auto-reload enabled.

### Start the Excel Add-In

```bash
cd MiniCrunched
npm install
npm start
```

This will sideload the add-in into Excel for development and testing.

## Project Structure

```
crunched/
├── backend/
│   ├── app/
│   │   ├── core/           # Agent implementation
│   │   │   ├── agent.py    # LangGraph workflow
│   │   │   ├── tools.py    # Available Excel actions
│   │   │   └── agent_state.py
│   │   ├── routers/        # API endpoints
│   │   ├── schemas/        # Pydantic models for endpoints inputs and outputs
│   │   └── prompts/        # Agent system prompts
│   └── requirements.txt
└── MiniCrunched/           # Excel Add-In (TypeScript/React)
    └── src/
        └── taskpane/       # Main UI components
```
