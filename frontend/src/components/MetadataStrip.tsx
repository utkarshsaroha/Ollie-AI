import { Database, Key, RotateCcw, Timer, Zap } from "lucide-react";
import type { ChatMetadata } from "../types";

export default function MetadataStrip({ metadata }: { metadata: ChatMetadata }) {
  const isCache = metadata.resolution_source === "LLM_CACHE";

  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border px-3 py-2 text-[11px] font-mono-tech"
      style={{ borderColor: "var(--border-soft)", background: "var(--bg-inset)", color: "var(--text-muted)" }}
    >
      <span
        data-testid="meta-source"
        className="flex items-center gap-1 font-medium"
        style={{ color: isCache ? "var(--accent)" : "var(--text)" }}
      >
        {isCache ? <Database size={12} /> : <Zap size={12} />}
        {metadata.resolution_source}
      </span>

      <span data-testid="meta-model" title="Model">
        {metadata.model}
      </span>

      <span data-testid="meta-latency" className="flex items-center gap-1" title="Latency">
        <Timer size={12} />
        {metadata.latency_ms}ms
      </span>

      <span data-testid="meta-input-tokens" title="Input tokens">
        in:{metadata.input_tokens}
      </span>

      <span data-testid="meta-output-tokens" title="Output tokens">
        out:{metadata.output_tokens}
      </span>

      {metadata.key_id && (
        <span className="flex items-center gap-1" title="Key used">
          <Key size={12} />
          {metadata.key_id}
        </span>
      )}

      {metadata.fallback_attempts > 0 && (
        <span className="flex items-center gap-1" style={{ color: "var(--danger)" }} title="Fallback attempts">
          <RotateCcw size={12} />
          {metadata.fallback_attempts} fallback{metadata.fallback_attempts > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
