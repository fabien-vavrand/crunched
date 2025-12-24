import * as React from "react";
import { useState, useRef, useEffect } from "react";
import {
  makeStyles,
  tokens,
  Input,
  Button,
  Spinner,
  Tooltip,
} from "@fluentui/react-components";
import { Send24Regular, Add24Regular } from "@fluentui/react-icons";
import { v4 as uuidv4 } from "uuid";
import ChatMessage from "./ChatMessage";
import { sendChatMessage, getExcelContext, executeToolCalls } from "../utils/api";

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
}

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logo: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  newChatButton: {
    minWidth: "32px",
    padding: "6px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: tokens.colorNeutralForeground3,
    textAlign: "center",
    padding: "20px",
  },
  emptyStateTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: "8px",
  },
  emptyStateText: {
    fontSize: tokens.fontSizeBase300,
  },
  inputContainer: {
    padding: "16px 20px",
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
  },
  sendButton: {
    minWidth: "40px",
    height: "40px",
  },
});

const ChatInterface: React.FC = () => {
  const styles = useStyles();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [threadId, setThreadId] = useState<string>(uuidv4());
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewConversation = () => {
    setMessages([]);
    setThreadId(uuidv4());
    setInputValue("");
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const excelContext = await getExcelContext();
      let response = await sendChatMessage(
        threadId,
        inputValue,
        excelContext.activeSheet,
        excelContext.selection
      );

      // Handle agent loop: execute tool calls and resume until completed
      while (response.status === "pending_action" && response.tool_calls) {
        console.log("Executing tool calls:", response.tool_calls);
        response = await executeToolCalls(threadId, response.tool_calls);
      }

      // Display the final agent message
      if (response.status === "completed" && response.message) {
        const agentMessage: Message = {
          id: uuidv4(),
          content: response.message,
          sender: "agent",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, agentMessage]);
      } else {
        // Handle unexpected status
        throw new Error("Agent did not complete successfully");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: uuidv4(),
        content: "Sorry, I encountered an error. Please try again.",
        sender: "agent",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <img src="assets/icon-32.png" alt="Logo" className={styles.logo} />
          <h1 className={styles.title}>Crunched Assistant</h1>
        </div>
        <Tooltip content="New conversation" relationship="label">
          <button className={styles.newChatButton} onClick={handleNewConversation}>
            <Add24Regular />
          </button>
        </Tooltip>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateTitle}>Welcome to Crunched Assistant</div>
            <div className={styles.emptyStateText}>
              Ask me anything about your Excel data or request help with formulas and analysis.
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Spinner size="tiny" />
                <span style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase300 }}>
                  Thinking...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className={styles.inputContainer}>
        <Input
          className={styles.input}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
          size="large"
        />
        <Button
          className={styles.sendButton}
          appearance="primary"
          icon={<Send24Regular />}
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          size="large"
        />
      </div>
    </div>
  );
};

export default ChatInterface;

