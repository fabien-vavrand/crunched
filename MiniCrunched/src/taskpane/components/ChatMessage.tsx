import * as React from "react";
import { makeStyles, tokens, mergeClasses } from "@fluentui/react-components";
import { Bot24Regular, Person24Regular } from "@fluentui/react-icons";

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

const useStyles = makeStyles({
  messageRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  userMessage: {
    flexDirection: "row-reverse",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userAvatar: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  agentAvatar: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
  },
  messageContent: {
    maxWidth: "75%",
    padding: "12px 16px",
    borderRadius: "12px",
    fontSize: tokens.fontSizeBase300,
    lineHeight: "1.5",
    wordWrap: "break-word",
    whiteSpace: "pre-wrap",
  },
  userContent: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    borderBottomRightRadius: "4px",
  },
  agentContent: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    borderBottomLeftRadius: "4px",
  },
  timestamp: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: "4px",
    paddingLeft: "44px",
  },
  userTimestamp: {
    textAlign: "right",
    paddingLeft: 0,
    paddingRight: "44px",
  },
});

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const styles = useStyles();
  const isUser = message.sender === "user";

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div>
      <div className={mergeClasses(styles.messageRow, isUser && styles.userMessage)}>
        <div className={mergeClasses(styles.avatar, isUser ? styles.userAvatar : styles.agentAvatar)}>
          {isUser ? <Person24Regular /> : <Bot24Regular />}
        </div>
        <div className={mergeClasses(styles.messageContent, isUser ? styles.userContent : styles.agentContent)}>
          {message.content}
        </div>
      </div>
      <div className={mergeClasses(styles.timestamp, isUser && styles.userTimestamp)}>
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
};

export default ChatMessage;

