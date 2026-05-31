"use client";

import { Loader2, Send, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAiStore } from "@/store/ai-store";
import type { AiChatMessage } from "@/types/ai";

const SUGGESTED_PROMPTS = [
  { label: "PM Case", message: "Help me practice a PM case interview question with a framework." },
  { label: "Guesstimate", message: "Walk me through a consulting guesstimate step by step." },
  { label: "Study Plan", message: "Create a focused study plan for the next 7 days based on my goal." },
  { label: "Explain Concept", message: "Explain a tough concept simply. I'll tell you the topic next." },
  { label: "Mock Interview", message: "Give me one mock interview question and evaluate my answer after I reply." },
];

export function AiStudyBuddyModal() {
  const { isOpen, close } = useAiStore();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [claudeAvailable, setClaudeAvailable] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsLoading(true);

    fetch("/api/ai/chat")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          if (Array.isArray(data.messages)) setMessages(data.messages);
          setClaudeAvailable(data.claudeAvailable !== false);
        }
      })
      .catch(() => toast.error("Could not load AI chat"))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessage: AiChatMessage = {
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/ai/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("text/event-stream") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        let assistantAdded = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const payload = JSON.parse(line.slice(6)) as {
                text?: string;
                done?: boolean;
              };
              if (payload.text) {
                accumulated += payload.text;
                setStreamingText(accumulated);
              }
              if (payload.done) {
                const finalText = accumulated.trim();
                if (finalText) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "assistant",
                      content: finalText,
                      createdAt: new Date().toISOString(),
                    },
                  ]);
                  assistantAdded = true;
                }
                setStreamingText("");
              }
            } catch {
              // ignore malformed SSE chunks
            }
          }
        }

        const finalText = accumulated.trim();
        if (finalText && !assistantAdded) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: finalText,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
        setStreamingText("");
      } else if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          typeof err.error === "string" ? err.error : "Request failed"
        );
      } else {
        const data = await res.json();
        if (data.message?.content) {
          setMessages((prev) => [...prev, data.message as AiChatMessage]);
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error("No response");
        }
      }
    } catch {
      toast.error("AI Study Buddy is unavailable right now");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSending(false);
      setStreamingText("");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-strivo-secondary" />
            AI Study Buddy
          </DialogTitle>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          style={{ maxHeight: "50vh" }}
        >
          {!claudeAvailable && !isLoading && (
            <div className="rounded-lg bg-strivo-yellow/30 px-3 py-2 text-xs font-medium text-primary">
              Running in smart local mode. Add{" "}
              <code className="rounded bg-white px-1">ANTHROPIC_API_KEY</code> to{" "}
              <code className="rounded bg-white px-1">.env.local</code> for full
              Claude chatbot replies.
            </div>
          )}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-strivo-secondary" />
            </div>
          ) : messages.length === 0 && !streamingText ? (
            <div className="rounded-xl bg-strivo-muted p-4 text-center text-sm text-strivo-secondary">
              Ask doubts, prep for cases, or get a study plan. I&apos;m here to help.
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={`${msg.createdAt}-${i}`}
                className={cn(
                  "max-w-[90%] rounded-2xl px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "ml-auto bg-primary text-white"
                    : "mr-auto bg-strivo-muted text-strivo-text"
                )}
              >
                {msg.label && (
                  <p className="mb-1 text-xs font-medium text-strivo-secondary">
                    {msg.label}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))
          )}

          {streamingText && (
            <div className="mr-auto max-w-[90%] rounded-2xl bg-strivo-muted px-3 py-2 text-sm text-strivo-text">
              <p className="whitespace-pre-wrap">{streamingText}</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((chip) => (
              <Button
                key={chip.label}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={isSending}
                onClick={() => sendMessage(chip.message)}
              >
                {chip.label}
              </Button>
            ))}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              disabled={isSending}
              maxLength={2000}
            />
            <Button type="submit" size="icon" disabled={isSending || !input.trim()}>
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
