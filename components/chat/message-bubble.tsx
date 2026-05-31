"use client";

import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-soft",
          isOwn
            ? "rounded-br-md bg-primary text-white"
            : "rounded-bl-md bg-strivo-muted text-strivo-text"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            "mt-1 text-[10px]",
            isOwn ? "text-white/70" : "text-strivo-secondary"
          )}
        >
          {formatRelativeTime(new Date(message.createdAt))}
        </p>
      </div>
    </div>
  );
}
