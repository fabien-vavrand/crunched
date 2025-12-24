/* global Excel, console, fetch */

const API_BASE_URL = "http://localhost:8000/api";

interface ToolCall {
  name: string;
  args: {
    range_address?: string;
    values?: any[][];
    [key: string]: any;
  };
  id: string;
  type: string;
}

interface AgentResponse {
  thread_id: string;
  status: "completed" | "pending_action";
  message?: string;
  tool_calls?: ToolCall[];
}

interface ActionResult {
  tool_call_id: string;
  name: string;
  content: string;
}

interface ActionResults {
  thread_id: string;
  results: ActionResult[];
}

interface ExcelContext {
  activeSheet: string;
  selection: string;
}

export async function sendChatMessage(
  threadId: string,
  message: string,
  activeSheet: string,
  selection: string
): Promise<AgentResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        thread_id: threadId,
        message: message,
        active_sheet: activeSheet,
        selection: selection,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling chat API:", error);
    throw error;
  }
}

export async function resumeWithActionResults(actionResults: ActionResults): Promise<AgentResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/resume`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(actionResults),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling resume API:", error);
    throw error;
  }
}

export async function readSpreadsheet(rangeAddress: string): Promise<any[][]> {
  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = sheet.getRange(rangeAddress);

      range.load("values");
      await context.sync();

      return range.values;
    });
  } catch (error) {
    console.error("Error reading spreadsheet:", error);
    throw error;
  }
}

export async function writeSpreadsheet(rangeAddress: string, values: any[][]): Promise<string> {
  try {
    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = sheet.getRange(rangeAddress);

      range.values = values;

      await context.sync();
    });
    return "success";
  } catch (error) {
    console.error("Error writing to spreadsheet:", error);
    throw error;
  }
}

export async function executeToolCall(toolCall: ToolCall): Promise<ActionResult> {
  try {
    let content: string;

    switch (toolCall.name) {
      case "read_spreadsheet":
        if (!toolCall.args.range_address) {
          throw new Error("range_address is required for read_spreadsheet");
        }
        const values = await readSpreadsheet(toolCall.args.range_address);
        content = JSON.stringify(values);
        break;

      case "write_spreadsheet":
        if (!toolCall.args.range_address || !toolCall.args.values) {
          throw new Error("range_address and values are required for write_spreadsheet");
        }
        const status = await writeSpreadsheet(toolCall.args.range_address, toolCall.args.values);
        content = status;
        break;

      default:
        throw new Error(`Unknown tool: ${toolCall.name}`);
    }

    return {
      tool_call_id: toolCall.id,
      name: toolCall.name,
      content: content,
    };
  } catch (error) {
    console.error(`Error executing tool call ${toolCall.name}:`, error);
    return {
      tool_call_id: toolCall.id,
      name: toolCall.name,
      content: `Error: ${error.message}`,
    };
  }
}

export async function executeToolCalls(threadId: string, toolCalls: ToolCall[]): Promise<AgentResponse> {
  const results: ActionResult[] = [];

  for (const toolCall of toolCalls) {
    const result = await executeToolCall(toolCall);
    results.push(result);
  }

  const actionResults: ActionResults = {
    thread_id: threadId,
    results: results,
  };

  return await resumeWithActionResults(actionResults);
}

export async function getExcelContext(): Promise<ExcelContext> {
  try {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();
      const range = context.workbook.getSelectedRange();

      sheet.load("name");
      range.load("address");

      await context.sync();

      return {
        activeSheet: sheet.name,
        selection: range.address,
      };
    });
  } catch (error) {
    console.error("Error getting Excel context:", error);
    return {
      activeSheet: "Unknown",
      selection: "Unknown",
    };
  }
}

export async function insertTextBelowSelection(text: string): Promise<void> {
  try {
    await Excel.run(async (context) => {
      const selectedRange = context.workbook.getSelectedRange();

      // Load the address to get row and column information
      selectedRange.load(["rowIndex", "columnIndex", "rowCount"]);
      await context.sync();

      // Get the cell directly below the selection
      const rowBelowIndex = selectedRange.rowIndex + selectedRange.rowCount;
      const columnIndex = selectedRange.columnIndex;

      // Get the cell below
      const cellBelow = context.workbook.worksheets.getActiveWorksheet()
        .getRangeByIndexes(rowBelowIndex, columnIndex, 1, 1);

      // Set the value
      cellBelow.values = [[text]];

      // Optional: Format the cell
      cellBelow.format.autofitColumns();

      await context.sync();
    });
  } catch (error) {
    console.error("Error inserting text below selection:", error);
    throw error;
  }
}

