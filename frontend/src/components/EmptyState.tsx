import { ArrowUpRight } from "lucide-react";
import OllieMark from "./OllieMark";

const SUGGESTED_PROMPTS = [
  "What is the capital of France?",
  "Explain the CAP theorem in two sentences.",
  "Write a haiku about distributed systems.",
  "Summarize the benefits of response caching for LLM APIs.",
];

export default function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-5 flex h-14 w-14 items-center justify-center">
        <span className="ollie-ring absolute inset-0 rounded-full" style={{ border: "1px solid var(--accent-dim)" }} />
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "var(--accent-dim)" }}
        >
          <OllieMark size={20} color="var(--accent)" pulse />
        </span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
        Intelligence, without interruption.
      </h1>
      <p className="mt-2 max-w-md text-sm" style={{ color: "var(--text-muted)" }}>
        An AI conversation engine designed for reliability, continuity, and speed.
      </p>

      <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPick(prompt)}
            className="group flex items-start justify-between gap-2 rounded-md border px-3.5 py-3 text-left text-sm transition-colors hover:border-[var(--accent)]"
            style={{ borderColor: "var(--border)", background: "var(--bg-elevated)", color: "var(--text-muted)" }}
          >
            <span className="group-hover:text-[color:var(--text)]">{prompt}</span>
            <ArrowUpRight size={14} className="mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--accent)" }} />
          </button>
        ))}
      </div>
    </div>
  );
}
