"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BotIcon, UserIcon } from "lucide-react";
import type { ChatMessage } from "../types";

// Single message rendering unit for user/assistant messages.
export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <Avatar className="mt-1 h-8 w-8 border border-border bg-secondary text-primary">
          <AvatarFallback>
            <BotIcon className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      ) : null}

      <div
        className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card text-card-foreground border border-border rounded-bl-md"
        }`}
      >
        {message.content}
      </div>

      {isUser ? (
        <Avatar className="mt-1 h-8 w-8 border border-border bg-muted text-primary">
          <AvatarFallback>
            <UserIcon className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      ) : null}
    </div>
  );
}
