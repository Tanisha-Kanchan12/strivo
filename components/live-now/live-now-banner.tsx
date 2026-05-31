"use client";

import { Loader2, Radio } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LIVE_NOW_TOPICS, formatLiveNowTopic } from "@/lib/constants/live-now";
import type { LiveNowTopic } from "@prisma/client";
import { cn } from "@/lib/utils";

interface LiveSession {
  id: string;
  topic: LiveNowTopic;
  autoExpiresAt: string;
}

export function LiveNowBanner() {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<LiveNowTopic | null>(null);
  const [showTopicPicker, setShowTopicPicker] = useState(false);

  const loadSession = useCallback(async () => {
    const res = await fetch("/api/live-now/session");
    const data = await res.json();
    if (res.ok && data.session) {
      setSession(data.session);
      setSelectedTopic(data.session.topic);
      setShowTopicPicker(false);
    } else {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    loadSession().finally(() => setIsLoading(false));
  }, [loadSession]);

  async function handleToggleOn() {
    if (!selectedTopic) {
      setShowTopicPicker(true);
      return;
    }
    setIsToggling(true);
    try {
      const res = await fetch("/api/live-now/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: selectedTopic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSession(data.session);
      setShowTopicPicker(false);
      toast.success(`You're live: ${formatLiveNowTopic(selectedTopic)}`);
    } catch {
      toast.error("Could not go live");
    } finally {
      setIsToggling(false);
    }
  }

  async function handleToggleOff() {
    setIsToggling(true);
    try {
      await fetch("/api/live-now/session", { method: "DELETE" });
      setSession(null);
      toast.success("You're no longer live");
    } catch {
      toast.error("Could not turn off Live Now");
    } finally {
      setIsToggling(false);
    }
  }

  const isLive = Boolean(session);

  if (isLoading) {
    return (
      <div className="surface-card flex items-center justify-center p-6">
        <Loader2 className="h-5 w-5 animate-spin text-strivo-secondary" />
      </div>
    );
  }

  return (
    <div className="surface-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-strivo-muted shadow-soft">
            {isLive ? (
              <span className="live-pulse" />
            ) : (
              <Radio className="h-5 w-5 text-strivo-teal" />
            )}
          </div>
          <div>
            <p className="font-semibold text-strivo-text">Live Now</p>
            <p className="text-sm text-strivo-secondary">
              {isLive
                ? `${formatLiveNowTopic(session!.topic)} · auto-off in 30 min`
                : "Match instantly with students studying right now"}
            </p>
          </div>
        </div>
        <Switch
          checked={isLive}
          disabled={isToggling}
          onCheckedChange={(checked) => {
            if (checked) {
              if (selectedTopic) handleToggleOn();
              else setShowTopicPicker(true);
            } else {
              handleToggleOff();
            }
          }}
        />
      </div>

      {(showTopicPicker || (!isLive && !selectedTopic)) && !isLive && (
        <div className="mt-5 space-y-4 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-strivo-secondary">
            Pick a topic
          </p>
          <div className="flex flex-wrap gap-2">
            {LIVE_NOW_TOPICS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setSelectedTopic(t.value)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold transition-all",
                  selectedTopic === t.value ? "chip-active" : "chip-inactive"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {selectedTopic && (
            <Button size="sm" onClick={handleToggleOn} disabled={isToggling}>
              {isToggling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go Live"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
