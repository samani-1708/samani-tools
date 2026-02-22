"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useWebSocketChat } from "./hooks/use-websocket-chat";
import type { ChatMessage, ConnectionStatus } from "./types";

type ChatSessionContextValue = {
  messages: ChatMessage[];
  status: ConnectionStatus;
  lastError: string | null;
  isStreaming: boolean;
  isContextSyncing: boolean;
  sessionContext: Record<string, unknown>;
  setSessionContext: (next: Record<string, unknown>) => void;
  sendUserMessage: (text: string, extraContext?: Record<string, unknown>) => void;
  addLocalAssistantMessage: (text: string) => void;
  addLocalUserMessage: (text: string) => void;
  clearMessages: () => void;
  reconnect: () => void;
};

const ChatSessionContext = createContext<ChatSessionContextValue | null>(null);

type ChatSessionProviderProps = {
  endpoint: string;
  children: React.ReactNode;
};

// Provider keeps all conversation state in one place so UI components/pages can share it.
export function ChatSessionProvider({ endpoint, children }: ChatSessionProviderProps) {
  const [sessionContext, setSessionContextState] = useState<Record<string, unknown>>({});

  const ws = useWebSocketChat({
    endpoint,
    reconnect: true,
    maxReconnectAttempts: 10,
    reconnectBaseDelayMs: 800,
    storageKey: "chat-pdf:messages:v1",
  });

  const setSessionContext = useCallback((next: Record<string, unknown>) => {
    setSessionContextState((prev) => {
      const merged = {
        ...prev,
        ...next,
      };
      ws.sendContextUpdate(merged);
      return merged;
    });
  }, [ws]);

  const sendUserMessage = useCallback(
    (text: string, extraContext?: Record<string, unknown>) => {
      const mergedContext = {
        ...sessionContext,
        ...(extraContext || {}),
      };
      ws.sendUserMessage(text, mergedContext);
    },
    [sessionContext, ws],
  );

  const value = useMemo<ChatSessionContextValue>(
    () => ({
      messages: ws.messages,
      status: ws.status,
      lastError: ws.lastError,
      isStreaming: ws.isStreaming,
      isContextSyncing: ws.isContextSyncing,
      sessionContext,
      setSessionContext,
      sendUserMessage,
      addLocalAssistantMessage: ws.addLocalAssistantMessage,
      addLocalUserMessage: ws.addLocalUserMessage,
      clearMessages: ws.clearMessages,
      reconnect: ws.connect,
    }),
    [
      sessionContext,
      sendUserMessage,
      setSessionContext,
      ws.addLocalAssistantMessage,
      ws.addLocalUserMessage,
      ws.clearMessages,
      ws.connect,
      ws.lastError,
      ws.isStreaming,
      ws.isContextSyncing,
      ws.messages,
      ws.status,
    ],
  );

  return (
    <ChatSessionContext.Provider value={value}>
      {children}
    </ChatSessionContext.Provider>
  );
}

export function useChatSession() {
  const value = useContext(ChatSessionContext);
  if (!value) {
    throw new Error("useChatSession must be used within <ChatSessionProvider>");
  }
  return value;
}
