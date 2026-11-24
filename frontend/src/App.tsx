import { useEffect, useRef, useState } from "react";
import { Loader2, PanelLeftOpen } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Composer from "./components/Composer";
import MessageBubble from "./components/MessageBubble";
import EmptyState from "./components/EmptyState";
import SystemPromptEditor from "./components/SystemPromptEditor";
import { ApiError, getHealth, getSessionMessages, sendChatMessage } from "./api";
import type { ChatMessage, HealthStatus } from "./types";

function generateSessionId() {
  return `s-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

interface SessionSummary {
  id: string;
  title: string;
}

export default function App() {
  const [sessionId, setSessionId] = useState(generateSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pastSessions, setPastSessions] = useState<SessionSummary[]>([]);
  const [input, setInput] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    setSidebarOpen(mql.matches);
    const handleChange = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const h = await getHealth();
        if (!cancelled) {
          setHealth(h);
          setHealthError(false);
        }
      } catch {
        if (!cancelled) setHealthError(true);
      }
    }
    poll();
    const interval = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    setInput("");
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const result = await sendChatMessage(sessionId, text, systemPrompt.trim() || undefined);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.reply,
          metadata: result.metadata,
          createdAt: Date.now(),
        },
      ]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "error", content: message, createdAt: Date.now() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewChat() {
    const firstUserMessage = messages.find((m) => m.role === "user");
    if (firstUserMessage) {
      setPastSessions((prev) => [
        { id: sessionId, title: firstUserMessage.content.slice(0, 42) },
        ...prev.filter((s) => s.id !== sessionId),
      ]);
    }
    setSessionId(generateSessionId());
    setMessages([]);
    setInput("");
  }

  async function handleSelectSession(id: string) {
    if (id === sessionId) return;
    try {
      const data = await getSessionMessages(id);
      const loaded: ChatMessage[] = data.messages.map(
        (m: { role: "user" | "assistant"; content: string; metadata?: ChatMessage["metadata"] }, idx: number) => ({
          id: `${id}-${idx}`,
          role: m.role,
          content: m.content,
          metadata: m.metadata,
          createdAt: Date.now(),
        }),
      );
      setSessionId(id);
      setMessages(loaded);
    } catch {
      // session may be gone server-side; leave the current view untouched
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden text-[color:var(--text)]" style={{ background: "var(--bg)" }}>
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
          <Sidebar
            activeSessionId={sessionId}
            pastSessions={pastSessions}
            onNewChat={handleNewChat}
            onSelectSession={handleSelectSession}
            health={health}
            healthError={healthError}
            onClose={() => setSidebarOpen(false)}
          />
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-14 shrink-0 items-center gap-3 border-b px-4"
          style={{ borderColor: "var(--border)" }}
        >
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              style={{ color: "var(--text-muted)" }}
            >
              <PanelLeftOpen size={18} />
            </button>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium">Conversation</span>
            <span className="text-[11px] font-mono-tech" style={{ color: "var(--text-faint)" }}>
              {sessionId}
            </span>
          </div>
        </header>

        <SystemPromptEditor value={systemPrompt} onChange={setSystemPrompt} />

        <main className="chat-canvas flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <EmptyState onPick={(p) => handleSend(p)} />
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-faint)" }} data-testid="typing-indicator">
                  <Loader2 size={13} className="animate-spin" />
                  Ollie is thinking...
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </main>

        <div className="mx-auto w-full max-w-3xl">
          <Composer value={input} onChange={setInput} onSend={() => handleSend()} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
