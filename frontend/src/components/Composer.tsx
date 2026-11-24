import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { Send } from "lucide-react";

const MAX_LENGTH = 4000;

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export default function Composer({ value, onChange, onSend, disabled }: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmedLength = value.trim().length;
  const canSend = !disabled && trimmedLength > 0 && value.length <= MAX_LENGTH;
  const nearLimit = value.length > MAX_LENGTH * 0.9;

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  }

  return (
    <div className="border-t px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
      <div
        className="flex items-end gap-2 rounded-lg border px-3 py-2 focus-within:border-[var(--accent)]"
        style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
      >
        <textarea
          ref={textareaRef}
          data-testid="chat-input"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Ollie... (Enter to send, Shift+Enter for a new line)"
          className="max-h-40 min-h-6 flex-1 resize-none overflow-y-auto bg-transparent text-sm leading-6 outline-none placeholder:text-[color:var(--text-faint)] disabled:opacity-50"
          style={{ color: "var(--text)" }}
        />
        <button
          data-testid="send-button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-opacity disabled:opacity-30"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          <Send size={15} strokeWidth={2.5} />
        </button>
      </div>
      <div className="mt-1.5 flex justify-end px-1 text-[10px] font-mono-tech" style={{ color: nearLimit ? "var(--danger)" : "var(--text-faint)" }}>
        {value.length}/{MAX_LENGTH}
      </div>
    </div>
  );
}
