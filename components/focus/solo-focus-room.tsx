"use client";

import { ArrowLeft, Pause, Play, Square } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FocusTimerRing } from "@/components/focus/focus-timer-ring";
import { Button } from "@/components/ui/button";
import { SelectableChip } from "@/components/ui/selectable-chip";

type TimerStatus = "selecting" | "idle" | "running" | "paused" | "ended";

const DURATIONS = [
  { label: "25 min", value: 25 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
];

export function SoloFocusRoom() {
  const router = useRouter();
  const [status, setStatus] = useState<TimerStatus>("selecting");
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [sessionId, setSessionId] = useState<string | null>(null);
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
      setRemainingSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
  }, [clearTimer]);

  useEffect(() => {
    if (remainingSeconds === 0 && status === "running" && sessionId) {
      handleEnd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, status]);

  async function handleCreateSession() {
    const res = await fetch("/api/sessions/focus/solo/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMinutes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to start");
    setSessionId(data.session.id);
    const secs = durationMinutes * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setStatus("idle");
  }

  async function handleStart() {
    if (!sessionId) await handleCreateSession();
    const secs = durationMinutes * 60;
    setRemainingSeconds(secs);
    setStatus("running");
    startLocalTimer();
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
    toast.success(data.streakMessage);
    setTimeout(() => router.push("/focus"), 2500);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-strivo-focus text-white">
      <div className="flex items-center justify-between px-4 py-4">
        <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/10">
          <Link href="/focus">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <p className="text-sm font-medium">Solo Focus</p>
        <div className="w-10" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pb-8">
        {status === "selecting" ? (
          <div className="w-full max-w-sm space-y-6 text-center">
            <h2 className="text-xl font-semibold">Study alone, stay tracked</h2>
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
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                handleCreateSession().catch(() => toast.error("Could not start"));
              }}
            >
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
                      onClick={() => {
                        setStatus("paused");
                        clearTimer();
                      }}
                      className="gap-2 border-white/20 bg-transparent text-white"
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                    <Button size="lg" variant="destructive" onClick={handleEnd} className="gap-2">
                      <Square className="h-4 w-4" />
                      End
                    </Button>
                  </>
                )}
                {status === "paused" && (
                  <>
                    <Button
                      size="lg"
                      onClick={() => {
                        setStatus("running");
                        startLocalTimer();
                      }}
                      className="gap-2"
                    >
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
    </div>
  );
}
