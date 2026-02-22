"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "@/components/ui/typing-indicator";

// Scrollable transcript area that auto-scrolls on new messages/streamed tokens.
export function ChatWindow({
  messages,
  isStreaming,
}: {
  messages: ChatMessage[];
  isStreaming: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="flex-1 overflow-auto px-3 py-4 sm:px-4 sm:py-5 space-y-3 bg-muted/20" ref={containerRef}>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isStreaming ? (
        <div className="text-xs text-muted-foreground inline-flex items-center gap-2 pl-1">
          <TypingIndicator /> Assistant is typing...
        </div>
      ) : null}
    </div>
  );
}
