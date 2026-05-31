"use client";

import { ArrowLeft, Pause, Play, Square, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FocusTimerRing } from "@/components/focus/focus-timer-ring";
import { SessionRatingDialog } from "@/components/focus/session-rating-dialog";
import { Button } from "@/components/ui/button";
import { SelectableChip } from "@/components/ui/selectable-chip";
import {
  focusChannelName,
  getPusherClient,
} from "@/lib/pusher-client";

type TimerStatus = "selecting" | "idle" | "running" | "paused" | "ended";

interface FocusRoomProps {
  pairId: string;
  currentUserId: string;
  partner: { id: string; name: string | null };
}

const DURATIONS = [
  { label: "25 min", value: 25 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
];

export function FocusRoom({ pairId, currentUserId, partner }: FocusRoomProps) {
  const router = useRouter();
  const [status, setStatus] = useState<TimerStatus>("selecting");
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [endMessage, setEndMessage] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startLocalTimer = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(focusChannelName(pairId));

    channel.bind("timer-sync", (data: {
      action: string;
      remainingSeconds: number;
      triggeredBy: string;
    }) => {
      if (data.triggeredBy === currentUserId) return;
      setRemainingSeconds(data.remainingSeconds);
      if (data.action === "start" || data.action === "resume") {
        setStatus("running");
        startLocalTimer();
      } else if (data.action === "pause") {
        setStatus("paused");
        clearTimer();
      }
    });

    channel.bind("session-ended", () => {
      setStatus("ended");
      clearTimer();
      setPartnerOnline(true);
    });

    channel.bind("pusher:subscription_succeeded", () => {
      setPartnerOnline(true);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(focusChannelName(pairId));
      clearTimer();
    };
  }, [pairId, currentUserId, startLocalTimer, clearTimer]);

  useEffect(() => {
    if (remainingSeconds === 0 && status === "running" && sessionId) {
      handleEnd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, status]);

  async function handleCreateSession(): Promise<string> {
    const res = await fetch("/api/sessions/focus/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairId, durationMinutes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to start");

    setSessionId(data.session.id);
    const secs = durationMinutes * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setStatus("idle");
    return data.session.id as string;
  }

  async function syncControl(action: "start" | "pause" | "resume") {
    if (!sessionId) return;
    await fetch(`/api/sessions/focus/${sessionId}/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, remainingSeconds }),
    });
  }

  async function handleStart() {
    let sid = sessionId;
    if (!sid) {
      sid = await handleCreateSession();
    }
    const secs = durationMinutes * 60;
    setRemainingSeconds(secs);
    setStatus("running");
    startLocalTimer();
    if (sid) {
      await fetch(`/api/sessions/focus/${sid}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", remainingSeconds: secs }),
      });
    }
  }

  async function handlePause() {
    setStatus("paused");
    clearTimer();
    await syncControl("pause");
  }

  async function handleResume() {
    setStatus("running");
    startLocalTimer();
    await syncControl("resume");
  }

  async function handleEnd() {
    if (!sessionId) return;
    clearTimer();
    setStatus("ended");

    const res = await fetch(`/api/sessions/focus/${sessionId}/end`, {
      method: "PATCH",
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to end session");
      return;
    }

    setEndMessage(data.streakMessage);
    if (data.needsRating) {
      setShowRating(true);
    } else {
      toast.info(data.streakMessage);
      setTimeout(() => router.push(`/pairs/${pairId}`), 2000);
    }
  }

  async function handleRating(stars: number) {
    if (!sessionId) return;
    await fetch(`/api/sessions/focus/${sessionId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars }),
    });
    toast.success("Thanks for the feedback!");
    router.push(`/pairs/${pairId}`);
  }

  const partnerFirst = partner.name?.split(" ")[0] ?? "Partner";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-strivo-focus text-white">
      <div className="flex items-center justify-between px-4 py-4">
        <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/10">
          <Link href={`/pairs/${pairId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="text-center">
          <p className="text-sm font-medium">Focus Room</p>
          <p className="text-xs text-white/50">with {partnerFirst}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <User className="h-3.5 w-3.5" />
          {partnerOnline ? "Partner connected" : "Waiting..."}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pb-8">
        {status === "selecting" ? (
          <div className="w-full max-w-sm space-y-6 text-center">
            <h2 className="text-xl font-semibold">Choose duration</h2>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map((d) => (
                <SelectableChip
                  key={d.value}
                  label={d.label}
                  selected={durationMinutes === d.value}
                  onClick={() => setDurationMinutes(d.value)}
                  tone="dark"
                />
              ))}
            </div>
            <Button size="lg" className="w-full" onClick={() => { handleCreateSession().then(() => setStatus("idle")); }}>
              Continue
            </Button>
          </div>
        ) : (
          <>
            <FocusTimerRing
              remainingSeconds={remainingSeconds}
              totalSeconds={totalSeconds}
            />

            {endMessage && (
              <p className="max-w-sm text-center text-sm text-white/70">{endMessage}</p>
            )}

            {status !== "ended" && (
              <div className="flex gap-3">
                {status === "idle" && (
                  <Button size="lg" onClick={handleStart} className="gap-2 px-8">
                    <Play className="h-4 w-4" />
                    Start
                  </Button>
                )}
                {status === "running" && (
                  <>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handlePause}
                      className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10"
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={handleEnd}
                      className="gap-2"
                    >
                      <Square className="h-4 w-4" />
                      End
                    </Button>
                  </>
                )}
                {status === "paused" && (
                  <>
                    <Button size="lg" onClick={handleResume} className="gap-2">
                      <Play className="h-4 w-4" />
                      Resume
                    </Button>
                    <Button size="lg" variant="destructive" onClick={handleEnd} className="gap-2">
                      <Square className="h-4 w-4" />
                      End
                    </Button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <SessionRatingDialog
        open={showRating}
        onOpenChange={setShowRating}
        onSubmit={handleRating}
        partnerName={partnerFirst}
      />
    </div>
  );
}
