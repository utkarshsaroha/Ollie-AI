import { MessageSquare, PanelLeftClose, Plus, Terminal } from "lucide-react";
import type { HealthStatus } from "../types";

interface SessionSummary {
  id: string;
  title: string;
}

interface SidebarProps {
  activeSessionId: string;
  pastSessions: SessionSummary[];
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  health: HealthStatus | null;
  healthError: boolean;
  onClose: () => void;
}

export default function Sidebar({
  activeSessionId,
  pastSessions,
  onNewChat,
  onSelectSession,
  health,
  healthError,
  onClose,
}: SidebarProps) {
  const backendOk = !healthError && health?.status === "ok";

  return (
    <aside
      className="fixed md:static inset-y-0 left-0 z-30 flex h-full w-64 shrink-0 flex-col border-r"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between px-4 h-14 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded"
            style={{ background: "var(--accent)" }}
          >
            <Terminal size={14} color="var(--accent-text)" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold tracking-wide">LYFTR AI</span>
        </div>
        <button
          onClick={onClose}
          className="inline-flex text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      <div className="p-3">
        <button
          data-testid="new-chat-button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          <Plus size={15} strokeWidth={2.5} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="px-1 pb-1 text-[10px] font-mono-tech uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
          Conversations
        </div>
        <button
          onClick={() => onSelectSession(activeSessionId)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm mb-0.5"
          style={{ background: "var(--accent-dim)", color: "var(--text)" }}
        >
          <MessageSquare size={14} style={{ color: "var(--accent)" }} />
          <span className="truncate flex-1">Current session</span>
        </button>
        {pastSessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelectSession(s.id)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
          >
            <MessageSquare size={14} />
            <span className="truncate flex-1">{s.title}</span>
          </button>
        ))}
      </div>

      <div className="border-t p-3 space-y-2 text-xs font-mono-tech" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between">
          <span style={{ color: "var(--text-faint)" }}>SESSION</span>
          <span style={{ color: "var(--text-muted)" }} className="truncate max-w-[120px]">
            {activeSessionId}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: "var(--text-faint)" }}>BACKEND</span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: backendOk ? "var(--accent)" : "var(--danger)" }}
            />
            <span style={{ color: backendOk ? "var(--text)" : "var(--danger)" }}>
              {backendOk ? "online" : "offline"}
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: "var(--text-faint)" }}>KEYS</span>
          <span style={{ color: "var(--text-muted)" }}>{health?.keys_configured ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: "var(--text-faint)" }}>CACHE</span>
          <span style={{ color: "var(--text-muted)" }}>{health?.cache_enabled ? "enabled" : "disabled"}</span>
        </div>
      </div>
    </aside>
  );
}
