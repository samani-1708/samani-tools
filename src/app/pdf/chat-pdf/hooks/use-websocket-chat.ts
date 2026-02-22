"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ChatMessage,
  ClientMessagePayload,
  ConnectionStatus,
  ServerMessagePayload,
} from "../types";

type UseWebSocketChatOptions = {
  endpoint: string;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectBaseDelayMs?: number;
  storageKey?: string;
};

function makeId(prefix = "msg") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function computeContextSignature(context: Record<string, unknown>) {
  const chunks = Array.isArray(context?.chunks)
    ? (context.chunks as Array<Record<string, unknown>>)
    : [];
  const files = Array.isArray(context?.files)
    ? (context.files as Array<Record<string, unknown>>)
    : [];
  const stats = (context?.stats || {}) as Record<string, unknown>;
  const extraction = (context?.extraction || {}) as Record<string, unknown>;
  const llm = (context?.llm || {}) as Record<string, unknown>;

  const chunkSig = chunks
    .map((chunk) => `${String(chunk?.id || "")}:${String(chunk?.text || "").length}:${Number(chunk?.pageStart || 0)}-${Number(chunk?.pageEnd || 0)}`)
    .join("|");
  const fileSig = files
    .map((file) => `${String(file?.id || "")}:${String(file?.name || "")}`)
    .join("|");

  return JSON.stringify({
    chunkCount: chunks.length,
    chunkSig,
    fileCount: files.length,
    fileSig,
    stats,
    extraction,
    llm,
  });
}

export function useWebSocketChat(options: UseWebSocketChatOptions) {
  const {
    endpoint,
    reconnect = true,
    maxReconnectAttempts = 8,
    reconnectBaseDelayMs = 600,
    storageKey = "chat-pdf:messages:v1",
  } = options;

  const socketRef = useRef<WebSocket | null>(null);
  const pendingPayloadsRef = useRef<ClientMessagePayload[]>([]);
  const pendingContextIdsRef = useRef<Set<string>>(new Set());
  const contextTimeoutsRef = useRef<Map<string, number>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const activeAssistantMessageIdRef = useRef<string | null>(null);
  const lastContextSignatureRef = useRef<string>("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isContextSyncing, setIsContextSyncing] = useState(false);

  // Restore conversation from session storage so the timeline survives route changes/reloads.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ChatMessage[];
      if (Array.isArray(parsed)) setMessages(parsed);
    } catch {
      // Ignore invalid storage values.
    }
  }, [storageKey]);

  // Persist conversation snapshot.
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // Ignore storage write failures.
    }
  }, [messages, storageKey]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateMessageContent = useCallback((id: string, updater: (previous: string) => string) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, content: updater(message.content) } : message,
      ),
    );
  }, []);

  const connect = useCallback(() => {
    clearReconnectTimer();

    const previous = socketRef.current;
    if (previous && (previous.readyState === WebSocket.OPEN || previous.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStatus(reconnectAttemptsRef.current > 0 ? "reconnecting" : "connecting");

    const ws = new WebSocket(endpoint);
    socketRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setStatus("open");
      setLastError(null);
      if (pendingPayloadsRef.current.length > 0) {
        for (const payload of pendingPayloadsRef.current) {
          ws.send(JSON.stringify(payload));
        }
        pendingPayloadsRef.current = [];
      }
    };

    ws.onmessage = (event) => {
      let payload: ServerMessagePayload | null = null;
      try {
        payload = JSON.parse(String(event.data)) as ServerMessagePayload;
      } catch {
        // Treat raw text payload as token stream fallback.
        const fallbackId = activeAssistantMessageIdRef.current || makeId("assistant");
        if (!activeAssistantMessageIdRef.current) {
          activeAssistantMessageIdRef.current = fallbackId;
          appendMessage({
            id: fallbackId,
            role: "assistant",
            content: "",
            timestamp: Date.now(),
          });
        }
        updateMessageContent(fallbackId, (previousText) => previousText + String(event.data));
        return;
      }

      if (!payload) return;

      if (payload.type === "assistant_start") {
        const id = payload.id || makeId("assistant");
        activeAssistantMessageIdRef.current = id;
        setIsStreaming(true);
        appendMessage({
          id,
          role: "assistant",
          content: "",
          timestamp: payload.timestamp || Date.now(),
        });
        return;
      }

      if (payload.type === "assistant_token") {
        const id = payload.id || activeAssistantMessageIdRef.current || makeId("assistant");
        if (!activeAssistantMessageIdRef.current) {
          activeAssistantMessageIdRef.current = id;
          appendMessage({
            id,
            role: "assistant",
            content: "",
            timestamp: Date.now(),
          });
        }
        updateMessageContent(id, (previousText) => previousText + payload.token);
        return;
      }

      if (payload.type === "assistant_message") {
        const id = payload.id || makeId("assistant");
        appendMessage({
          id,
          role: "assistant",
          content: payload.content,
          timestamp: payload.timestamp || Date.now(),
        });
        // Backward compatibility with servers that do not emit context_ack.
        if (typeof payload.content === "string" && payload.content.startsWith("Context updated:")) {
          for (const contextId of pendingContextIdsRef.current) {
            pendingContextIdsRef.current.delete(contextId);
            const timeout = contextTimeoutsRef.current.get(contextId);
            if (timeout !== undefined) {
              window.clearTimeout(timeout);
              contextTimeoutsRef.current.delete(contextId);
            }
          }
          setIsContextSyncing(false);
        }
        activeAssistantMessageIdRef.current = null;
        return;
      }

      if (payload.type === "assistant_end") {
        activeAssistantMessageIdRef.current = null;
        setIsStreaming(false);
        return;
      }

      if (payload.type === "context_ack") {
        pendingContextIdsRef.current.delete(payload.contextId);
        const timeout = contextTimeoutsRef.current.get(payload.contextId);
        if (timeout !== undefined) {
          window.clearTimeout(timeout);
          contextTimeoutsRef.current.delete(payload.contextId);
        }
        setIsContextSyncing(pendingContextIdsRef.current.size > 0);
        return;
      }

      if (payload.type === "error") {
        setLastError(payload.message);
      }
    };

    ws.onerror = () => {
      setStatus("error");
      setLastError("WebSocket error");
    };

    ws.onclose = () => {
      setStatus("closed");
      activeAssistantMessageIdRef.current = null;
      setIsStreaming(false);

      if (!reconnect) return;
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) return;

      reconnectAttemptsRef.current += 1;
      const delay = reconnectBaseDelayMs * reconnectAttemptsRef.current;

      reconnectTimerRef.current = window.setTimeout(() => {
        connect();
      }, delay);
    };
  }, [appendMessage, clearReconnectTimer, endpoint, maxReconnectAttempts, reconnect, reconnectBaseDelayMs, updateMessageContent]);

  const disconnect = useCallback(() => {
    clearReconnectTimer();
    const ws = socketRef.current;
    socketRef.current = null;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
    setStatus("closed");
  }, [clearReconnectTimer]);

  const sendPayload = useCallback((payload: ClientMessagePayload) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      pendingPayloadsRef.current.push(payload);
      setLastError("WebSocket disconnected. Queued message and retrying connection.");
      connect();
      return false;
    }

    ws.send(JSON.stringify(payload));
    return true;
  }, [connect]);

  const sendUserMessage = useCallback(
    (content: string, context?: Record<string, unknown>) => {
      const trimmed = content.trim();
      if (!trimmed) return null;

      const userMessage: ChatMessage = {
        id: makeId("user"),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      appendMessage(userMessage);

      const payload: ClientMessagePayload = {
        type: "user_message",
        id: userMessage.id,
        content: userMessage.content,
        timestamp: userMessage.timestamp,
        context,
      };
      sendPayload(payload);
      return userMessage;
    },
    [appendMessage, sendPayload],
  );

  const addLocalAssistantMessage = useCallback((content: string) => {
    appendMessage({
      id: makeId("assistant"),
      role: "assistant",
      content,
      timestamp: Date.now(),
    });
  }, [appendMessage]);

  const addLocalUserMessage = useCallback((content: string) => {
    appendMessage({
      id: makeId("user"),
      role: "user",
      content,
      timestamp: Date.now(),
    });
  }, [appendMessage]);

  const sendContextUpdate = useCallback((context: Record<string, unknown>) => {
    const signature = computeContextSignature(context);
    if (signature === lastContextSignatureRef.current) {
      return null;
    }
    lastContextSignatureRef.current = signature;

    const contextId = makeId("ctx");
    pendingContextIdsRef.current.add(contextId);
    setIsContextSyncing(true);
    const payload: ClientMessagePayload = {
      type: "context_update",
      contextId,
      context,
      timestamp: Date.now(),
    };
    sendPayload(payload);
    const timeout = window.setTimeout(() => {
      pendingContextIdsRef.current.delete(contextId);
      contextTimeoutsRef.current.delete(contextId);
      setIsContextSyncing(pendingContextIdsRef.current.size > 0);
      setLastError((previous) => previous || "Context sync timed out; continuing with current context.");
    }, 10000);
    contextTimeoutsRef.current.set(contextId, timeout);
    return contextId;
  }, [sendPayload]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore storage failures.
    }
  }, [storageKey]);

  useEffect(() => {
    connect();
    return () => {
      for (const timeout of contextTimeoutsRef.current.values()) {
        window.clearTimeout(timeout);
      }
      contextTimeoutsRef.current.clear();
      disconnect();
    };
  }, [connect, disconnect]);

  return useMemo(
    () => ({
      messages,
      status,
      lastError,
      isStreaming,
      isContextSyncing,
      connect,
      disconnect,
      sendUserMessage,
      sendContextUpdate,
      clearMessages,
      addLocalAssistantMessage,
      addLocalUserMessage,
      setMessages,
    }),
    [
      addLocalAssistantMessage,
      addLocalUserMessage,
      clearMessages,
      connect,
      disconnect,
      lastError,
      isStreaming,
      isContextSyncing,
      messages,
      sendUserMessage,
      sendContextUpdate,
      setMessages,
      status,
    ],
  );
}
