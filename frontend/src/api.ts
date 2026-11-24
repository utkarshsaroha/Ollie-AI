import type { ChatMetadata, HealthStatus } from "./types";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function readErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join("; ");
    }
  } catch {
    // ignore - fall through to generic message
  }
  if (res.status === 422) return "Request was invalid. Please check your input.";
  if (res.status === 503) return "All providers are currently unavailable. Please try again shortly.";
  return `Request failed (HTTP ${res.status}).`;
}

export interface ChatResult {
  reply: string;
  metadata: ChatMetadata;
}

export async function sendChatMessage(
  sessionId: string,
  message: string,
  systemPrompt?: string,
  simulateFailure?: string,
): Promise<ChatResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(simulateFailure ? { "X-Simulate-Failure": simulateFailure } : {}),
      },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        ...(systemPrompt ? { system_prompt: systemPrompt } : {}),
      }),
    });
  } catch {
    throw new ApiError(0, "Could not reach the backend. Check your connection and try again.");
  }

  if (!res.ok) {
    throw new ApiError(res.status, await readErrorDetail(res));
  }
  const body = await res.json();
  return { reply: body.reply, metadata: body.metadata };
}

export async function getSessionMessages(sessionId: string) {
  const res = await fetch(`${API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}/messages`);
  if (!res.ok) throw new ApiError(res.status, await readErrorDetail(res));
  return res.json();
}

export async function getHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE_URL}/health`);
  const body = await res.json();
  if (!res.ok) throw new ApiError(res.status, body.detail ?? "backend unhealthy");
  return body;
}
