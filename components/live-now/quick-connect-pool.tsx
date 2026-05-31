"use client";

import { Loader2, MessageCircle, Radio } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LIVE_NOW_TOPICS, formatLiveNowTopic } from "@/lib/constants/live-now";
import { formatStudyGoal } from "@/lib/constants/onboarding";
import type { LiveNowTopic, StudyGoal } from "@prisma/client";
import { getPusherClient, LIVE_NOW_CHANNEL } from "@/lib/pusher-client";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PoolUser {
  sessionId: string;
  userId: string;
  name: string | null;
  topic: LiveNowTopic;
  city: string | null;
  college: string | null;
  profilePicUrl: string | null;
  goal: StudyGoal | null;
}

interface QuickConnectPoolProps {
  topicFilter: LiveNowTopic | null;
  onTopicFilterChange: (topic: LiveNowTopic | null) => void;
}

export function QuickConnectPool({
  topicFilter,
  onTopicFilterChange,
}: QuickConnectPoolProps) {
  const router = useRouter();
  const [pool, setPool] = useState<PoolUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const fetchPool = useCallback(async () => {
    const params = topicFilter ? `?topic=${topicFilter}` : "";
    const res = await fetch(`/api/live-now/pool${params}`);
    const data = await res.json();
    if (res.ok) setPool(data.pool);
  }, [topicFilter]);

  useEffect(() => {
    setIsLoading(true);
    fetchPool().finally(() => setIsLoading(false));
  }, [fetchPool]);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(LIVE_NOW_CHANNEL);
    channel.bind("pool-updated", () => {
      fetchPool();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(LIVE_NOW_CHANNEL);
    };
  }, [fetchPool]);

  async function handleConnect(targetUserId: string) {
    setConnectingId(targetUserId);
    try {
      const res = await fetch("/api/live-now/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push(`/chat/live/${data.pairId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not start chat"
      );
    } finally {
      setConnectingId(null);
    }
  }

  return (
    <div className="surface-card space-y-4 p-6">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold text-primary">
          <span className="live-pulse" aria-hidden />
          Quick Connect
        </p>
        <p className="text-xs text-strivo-secondary">
          Students live right now. Tap to chat instantly.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onTopicFilterChange(null)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
            !topicFilter ? "chip-active" : "chip-inactive"
          )}
        >
          All
        </button>
        {LIVE_NOW_TOPICS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onTopicFilterChange(t.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
              topicFilter === t.value ? "chip-active" : "chip-inactive"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-strivo-secondary" />
        </div>
      ) : pool.length === 0 ? (
        <p className="rounded-2xl bg-strivo-muted py-8 text-center text-xs text-strivo-secondary">
          No one live with this topic right now. Check back soon!
        </p>
      ) : (
        <ul className="space-y-2">
          {pool.map((user) => (
            <li
              key={user.sessionId}
              className="flex items-center gap-3 rounded-2xl bg-strivo-muted p-4 transition-colors hover:brightness-[0.98]"
            >
              <Avatar className="h-9 w-9">
                {user.profilePicUrl && (
                  <AvatarImage src={user.profilePicUrl} alt={user.name ?? ""} />
                )}
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-primary">
                  {user.name ?? "Student"}
                </p>
                <p className="flex items-center gap-1 text-xs text-strivo-secondary">
                  <Radio className="h-3 w-3 text-strivo-teal" />
                  {formatLiveNowTopic(user.topic)}
                  {user.goal && ` · ${formatStudyGoal(user.goal)}`}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={connectingId === user.userId}
                onClick={() => handleConnect(user.userId)}
              >
                {connectingId === user.userId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat
                  </>
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
