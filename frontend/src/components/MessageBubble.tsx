import { AlertTriangle, Bot, User } from "lucide-react";
import type { ChatMessage } from "../types";
import MetadataStrip from "./MetadataStrip";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "error") {
    return (
      <div
        data-testid="chat-error"
        className="flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm"
        style={{ borderColor: "var(--danger)", background: "var(--danger-dim)", color: "var(--danger)" }}
      >
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>{message.content}</span>
      </div>
    );
  }

  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border"
        style={{
          borderColor: "var(--border)",
          background: isUser ? "var(--bg-elevated)" : "var(--accent-dim)",
        }}
      >
        {isUser ? <User size={14} style={{ color: "var(--text-muted)" }} /> : <Bot size={14} style={{ color: "var(--accent)" }} />}
      </div>

      <div className={`flex max-w-[75%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          data-testid={isUser ? "user-message" : "assistant-message"}
          className="rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            borderColor: "var(--border)",
            background: isUser ? "var(--bg-elevated)" : "var(--bg-inset)",
            color: "var(--text)",
          }}
        >
          {message.content}
        </div>
        <span className="mt-1 px-1 text-[10px] font-mono-tech" style={{ color: "var(--text-faint)" }}>
          {formatTime(message.createdAt)}
        </span>
        {!isUser && message.metadata && <MetadataStrip metadata={message.metadata} />}
      </div>
    </div>
  );
}
