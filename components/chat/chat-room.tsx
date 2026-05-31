"use client";

import { ArrowLeft, Loader2, Target, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MakePermanentSheet } from "@/components/live-now/make-permanent-sheet";
import { toast } from "sonner";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageBubble, type ChatMessage } from "@/components/chat/message-bubble";
import { SessionSchedulerSheet } from "@/components/pairs/session-scheduler-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  chatChannelName,
  getPusherClient,
} from "@/lib/pusher-client";
import { getInitials } from "@/lib/utils";

interface ChatRoomProps {
  pairId: string;
  currentUserId: string;
  partner: {
    id: string;
    name: string | null;
    profilePicUrl: string | null;
  };
  isProvisional?: boolean;
  backHref?: string;
}

export function ChatRoom({
  pairId,
  currentUserId,
  partner,
  isProvisional = false,
  backHref = `/pairs/${pairId}`,
}: ChatRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [iceBreaker, setIceBreaker] = useState<string | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [permanentOpen, setPermanentOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(
    async (cursor?: string) => {
      const url = cursor
        ? `/api/messages?pairId=${pairId}&cursor=${cursor}`
        : `/api/messages?pairId=${pairId}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load messages");

      if (cursor) {
        setMessages((prev) => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages);
      }
      setHasMore(data.hasMore);
      return data.messages as ChatMessage[];
    },
    [pairId]
  );

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        await loadMessages();
        await fetch("/api/messages", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pairId }),
        });

        const iceRes = await fetch(`/api/chat/${pairId}/ice-breaker`);
        const iceData = await iceRes.json();
        if (iceData.iceBreaker) setIceBreaker(iceData.iceBreaker);
      } catch {
        toast.error("Failed to load chat");
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [pairId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, partnerTyping]);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(chatChannelName(pairId));

    channel.bind("new-message", (data: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      if (data.senderId !== currentUserId) {
        fetch("/api/messages", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pairId }),
        });
      }
      if (data.senderId !== currentUserId) {
        setIceBreaker(null);
      }
    });

    channel.bind(
      "typing-start",
      (data: { userId: string }) => {
        if (data.userId !== currentUserId) setPartnerTyping(true);
      }
    );

    channel.bind(
      "typing-stop",
      (data: { userId: string }) => {
        if (data.userId !== currentUserId) setPartnerTyping(false);
      }
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(chatChannelName(pairId));
    };
  }, [pairId, currentUserId]);

  async function handleSend(content: string) {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairId, content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to send");

    setMessages((prev) => {
      if (prev.some((m) => m.id === data.message.id)) return prev;
      return [...prev, data.message];
    });
    setIceBreaker(null);
  }

  async function handleTyping(isTyping: boolean) {
    fetch("/api/messages/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairId, isTyping }),
    }).catch(() => {});
  }

  async function handleLoadMore() {
    if (!hasMore || isLoadingMore || messages.length === 0) return;
    setIsLoadingMore(true);
    try {
      await loadMessages(messages[0].id);
    } finally {
      setIsLoadingMore(false);
    }
  }

  function useIceBreaker() {
    if (iceBreaker) handleSend(iceBreaker);
  }

  const showSafetyBanner = messages.length < 3;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      <div className="flex items-center gap-3 bg-white px-4 py-3 shadow-soft">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (isProvisional) setPermanentOpen(true);
            else router.push(backHref);
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9">
          {partner.profilePicUrl && (
            <AvatarImage src={partner.profilePicUrl} alt={partner.name ?? ""} />
          )}
          <AvatarFallback>{getInitials(partner.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{partner.name ?? "Partner"}</p>
          {partnerTyping && (
            <p className="text-xs text-strivo-secondary">typing...</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto bg-strivo-page px-4 py-2">
        <button type="button" onClick={() => setSchedulerOpen(true)}>
          <Badge variant="secondary" className="shrink-0 cursor-pointer">
            Schedule Session
          </Badge>
        </button>
        <Link href={`/focus/${pairId}`}>
          <Badge variant="secondary" className="shrink-0 cursor-pointer gap-1">
            <Zap className="h-3 w-3" />
            Focus Room
          </Badge>
        </Link>
        <Link href={`/pairs/${pairId}`}>
          <Badge variant="outline" className="shrink-0 cursor-pointer gap-1">
            <Target className="h-3 w-3" />
            See Targets
          </Badge>
        </Link>
      </div>

      {showSafetyBanner && (
        <div className="mx-4 mt-3 rounded-2xl bg-strivo-muted px-3 py-2 text-xs text-strivo-secondary">
          Share contact details only when you feel comfortable. Strivo chat is
          a safe space to start.
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {hasMore && (
          <div className="mb-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Load earlier messages"
              )}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-strivo-secondary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="py-8 text-center text-sm text-strivo-secondary">
            No messages yet. Say hi!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUserId}
              />
            ))}
          </div>
        )}

        {partnerTyping && (
          <p className="mt-2 text-xs text-strivo-secondary">
            {partner.name?.split(" ")[0] ?? "Partner"} is typing...
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {iceBreaker && messages.length === 0 && (
        <div className="mx-4 mb-2 rounded-2xl bg-strivo-muted p-3">
          <p className="text-xs font-medium text-strivo-secondary">Suggested opener</p>
          <p className="mt-1 text-sm text-strivo-secondary">{iceBreaker}</p>
          <Button size="sm" className="mt-2" onClick={useIceBreaker}>
            Use
          </Button>
        </div>
      )}

      <ChatInput onSend={handleSend} onTyping={handleTyping} />

      <SessionSchedulerSheet
        pairId={pairId}
        open={schedulerOpen}
        onOpenChange={setSchedulerOpen}
      />

      {isProvisional && (
        <MakePermanentSheet
          pairId={pairId}
          partnerName={partner.name}
          open={permanentOpen}
          onOpenChange={setPermanentOpen}
        />
      )}
    </div>
  );
}
