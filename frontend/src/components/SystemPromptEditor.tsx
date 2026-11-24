import { RotateCcw, SlidersHorizontal } from "lucide-react";

interface SystemPromptEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SystemPromptEditor({ value, onChange }: SystemPromptEditorProps) {
  const isActive = value.trim().length > 0;

  return (
    <div className="flex items-center gap-2 border-b px-4 py-2" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
      <SlidersHorizontal size={13} style={{ color: isActive ? "var(--accent)" : "var(--text-faint)" }} className="shrink-0" />
      <input
        data-testid="system-prompt-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Custom system prompt (optional) — overrides the default for this session"
        className="flex-1 bg-transparent text-xs outline-none placeholder:text-[color:var(--text-faint)]"
        style={{ color: "var(--text)" }}
      />
      {isActive && (
        <span className="rounded px-1.5 py-0.5 text-[10px] font-mono-tech" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
          custom active
        </span>
      )}
      {isActive && (
        <button
          onClick={() => onChange("")}
          aria-label="Reset to default system prompt"
          className="flex items-center gap-1 text-[10px] font-mono-tech hover:text-[color:var(--text)]"
          style={{ color: "var(--text-faint)" }}
        >
          <RotateCcw size={11} />
          reset
        </button>
      )}
    </div>
  );
}
