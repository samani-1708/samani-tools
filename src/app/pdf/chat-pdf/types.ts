export type ChatRole = "user" | "assistant";

// Canonical message shape used across hook/provider/UI.
export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
};

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "open"
  | "reconnecting"
  | "closed"
  | "error";

// Outbound payload sent from frontend to WebSocket backend.
export type ClientMessagePayload =
  | {
      type: "user_message";
      id: string;
      content: string;
      timestamp: number;
      context?: Record<string, unknown>;
    }
  | {
      type: "context_update";
      contextId: string;
      context: Record<string, unknown>;
      timestamp: number;
    };

// Inbound events expected from WebSocket backend.
export type ServerMessagePayload =
  | { type: "assistant_start"; id?: string; timestamp?: number }
  | { type: "assistant_token"; id?: string; token: string }
  | { type: "assistant_message"; id?: string; content: string; timestamp?: number }
  | { type: "assistant_end"; id?: string; timestamp?: number }
  | { type: "context_ack"; contextId: string; chunks?: number }
  | { type: "error"; message: string }
  | { type: "pong"; ts?: number };
