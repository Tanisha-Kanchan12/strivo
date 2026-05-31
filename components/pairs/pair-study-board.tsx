"use client";

import {
  Calendar,
  Check,
  Loader2,
  MessageCircle,
  Plus,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PairInsightsCard } from "@/components/ai/pair-insights-card";
import { SessionSchedulerSheet } from "@/components/pairs/session-scheduler-sheet";
import { SharedNotesPanel } from "@/components/pairs/shared-notes-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TargetItem {
  id: string;
  userId: string;
  task: string;
  isComplete: boolean;
}

interface CheckinItem {
  userId: string;
  completed: boolean;
}

interface BoardData {
  targets: TargetItem[];
  checkins: CheckinItem[];
  upcomingSession: {
    id: string;
    scheduledAt: string;
    durationMinutes: number;
    platform: string;
    meetLink: string | null;
    location: string | null;
  } | null;
  streak: { currentStreak: number; shieldsRemaining: number } | null;
  streakHistory: { date: string; active: boolean }[];
  weeklyGoals?: {
    userGoals: { id: string; goalText: string; isComplete: boolean }[];
    partnerGoals: { id: string; goalText: string; isComplete: boolean }[];
  } | null;
  partner: { id: string; name: string | null; profilePicUrl: string | null };
  currentUserId: string;
}

interface PairStudyBoardProps {
  pairId: string;
  sameCity?: boolean;
}

export function PairStudyBoard({ pairId, sameCity }: PairStudyBoardProps) {
  const [data, setData] = useState<BoardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [boardTab, setBoardTab] = useState("board");

  const loadBoard = useCallback(async () => {
    const res = await fetch(`/api/pairs/${pairId}/board`);
    const json = await res.json();
    if (res.ok) setData(json);
  }, [pairId]);

  useEffect(() => {
    loadBoard().finally(() => setIsLoading(false));
  }, [loadBoard]);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setAddingTask(true);
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairId, task: newTask.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setNewTask("");
      await loadBoard();
    } catch {
      toast.error("Could not add task");
    } finally {
      setAddingTask(false);
    }
  }

  async function handleCompleteTarget(id: string) {
    const res = await fetch(`/api/targets/${id}/complete`, { method: "PATCH" });
    if (!res.ok) {
      toast.error("Could not complete task");
      return;
    }
    await loadBoard();
  }

  async function handleCheckin(completed: boolean) {
    const res = await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairId, completed }),
    });
    if (!res.ok) {
      toast.error("Could not save check-in");
      return;
    }
    toast.success(completed ? "Great work today!" : "Tomorrow is a new day");
    await loadBoard();
  }

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-strivo-secondary" />
      </div>
    );
  }

  const myTargets = data.targets.filter((t) => t.userId === data.currentUserId);
  const partnerTargets = data.targets.filter((t) => t.userId !== data.currentUserId);
  const myCheckin = data.checkins.find((c) => c.userId === data.currentUserId);
  const partnerCheckin = data.checkins.find((c) => c.userId !== data.currentUserId);
  const streak = data.streak?.currentStreak ?? 0;
  const shields = data.streak?.shieldsRemaining ?? 2;

  return (
    <div className="space-y-6">
      <Tabs value={boardTab} onValueChange={setBoardTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="board">Study Board</TabsTrigger>
          <TabsTrigger value="notes">Shared Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <SharedNotesPanel pairId={pairId} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="board" className="mt-4 space-y-6">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {data.partner.profilePicUrl && (
            <AvatarImage src={data.partner.profilePicUrl} alt={data.partner.name ?? ""} />
          )}
          <AvatarFallback>{getInitials(data.partner.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-primary">{data.partner.name ?? "Partner"}</h1>
          <p className="text-sm text-strivo-secondary">Pair Study Board</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-strivo-yellow/25 px-3 py-1.5 text-sm font-bold text-strivo-text">
            <span aria-hidden>🔥</span>
            {streak}
          </div>
        )}
      </div>

      <div className="focus-cta-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-strivo-yellow/25 px-2.5 py-0.5 text-xs font-bold text-primary">
              <Zap className="h-3.5 w-3.5" />
              Focus Room
            </p>
            <h2 className="mt-2 text-lg font-bold text-primary">Study together, in sync</h2>
            <p className="mt-1 max-w-sm text-sm text-strivo-secondary">
              Shared timer with your partner: 25, 45, or 60 minutes. Dark mode inside.
            </p>
          </div>
          <Button size="lg" asChild className="shrink-0">
            <Link href={`/focus/${pairId}`}>
              <Zap className="h-4 w-4" />
              Enter Focus Room
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-strivo-secondary" />
            Daily Targets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-strivo-secondary">You</p>
              {myTargets.map((t) => (
                <label
                  key={t.id}
                  className="flex items-start gap-2 rounded-2xl bg-strivo-muted p-2.5"
                >
                  <Checkbox
                    checked={t.isComplete}
                    onCheckedChange={() => !t.isComplete && handleCompleteTarget(t.id)}
                    disabled={t.isComplete}
                  />
                  <span className={cn("text-sm text-primary", t.isComplete && "line-through text-strivo-secondary")}>
                    {t.task}
                  </span>
                </label>
              ))}
              <form onSubmit={handleAddTask} className="flex gap-2">
                <Input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a task..."
                  className="text-sm"
                />
                <Button type="submit" size="icon" variant="outline" disabled={addingTask}>
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-strivo-secondary">
                {data.partner.name?.split(" ")[0] ?? "Partner"}
              </p>
              {partnerTargets.length === 0 ? (
                <p className="text-sm text-strivo-secondary">No tasks yet today</p>
              ) : (
                partnerTargets.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-2 rounded-2xl bg-strivo-page p-2.5"
                  >
                    <Check className={cn("mt-0.5 h-4 w-4", t.isComplete ? "text-strivo-secondary" : "text-strivo-secondary/30")} />
                    <span className={cn("text-sm text-primary", t.isComplete && "line-through text-strivo-secondary")}>
                      {t.task}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-strivo-muted p-4">
            <p className="text-sm font-semibold text-primary">Did you complete today&apos;s targets?</p>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant={myCheckin?.completed === true ? "default" : "outline"}
                onClick={() => handleCheckin(true)}
              >
                Yes
              </Button>
              <Button
                size="sm"
                variant={myCheckin?.completed === false ? "default" : "outline"}
                onClick={() => handleCheckin(false)}
              >
                No
              </Button>
            </div>
            {partnerCheckin ? (
              <p className="mt-2 text-xs text-strivo-secondary">
                Partner: {partnerCheckin.completed ? "✓ Completed" : "Not yet"}
              </p>
            ) : (
              <p className="mt-2 text-xs text-strivo-secondary">
                Partner hasn&apos;t checked in yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {data.weeklyGoals && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-strivo-secondary mb-2">You</p>
                {data.weeklyGoals.userGoals.length === 0 ? (
                  <p className="text-sm text-strivo-secondary">
                    <Link href="/goals" className="text-primary underline">
                      Set weekly goals
                    </Link>
                  </p>
                ) : (
                  data.weeklyGoals.userGoals.map((g) => (
                    <p
                      key={g.id}
                      className={cn(
                        "text-sm py-1",
                        g.isComplete && "line-through text-strivo-secondary"
                      )}
                    >
                      {g.goalText}
                    </p>
                  ))
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-strivo-secondary mb-2">
                  {data.partner.name?.split(" ")[0] ?? "Partner"}
                </p>
                {data.weeklyGoals.partnerGoals.length === 0 ? (
                  <p className="text-sm text-strivo-secondary">No goals set yet</p>
                ) : (
                  data.weeklyGoals.partnerGoals.map((g) => (
                    <p
                      key={g.id}
                      className={cn(
                        "text-sm py-1",
                        g.isComplete && "line-through text-strivo-secondary"
                      )}
                    >
                      {g.goalText}
                    </p>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {data.upcomingSession && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-strivo-secondary" />
              Next Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-primary">
              {new Date(data.upcomingSession.scheduledAt).toLocaleString("en-IN", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" · "}
              {data.upcomingSession.durationMinutes} min ·{" "}
              {data.upcomingSession.platform === "GOOGLE_MEET" ? "Google Meet" : "In Person"}
            </p>
            <div className="flex flex-wrap gap-2">
              {data.upcomingSession.meetLink && (
                <Button size="sm" asChild>
                  <a
                    href={data.upcomingSession.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Meet
                  </a>
                </Button>
              )}
              <Button size="sm" variant="outline" asChild>
                <a
                  href={`/api/sessions/schedule/${data.upcomingSession.id}/ics`}
                  download
                >
                  Add to calendar (.ics)
                </a>
              </Button>
            </div>
            {data.upcomingSession.location && (
              <p className="text-sm text-strivo-secondary">{data.upcomingSession.location}</p>
            )}
            <Button size="sm" variant="outline" onClick={() => setSchedulerOpen(true)}>
              Reschedule
            </Button>
          </CardContent>
        </Card>
      )}

      <PairInsightsCard pairId={pairId} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Streak History</CardTitle>
          <p className="text-xs text-strivo-secondary">
            {shields} streak shield{shields !== 1 ? "s" : ""} left this month
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {data.streakHistory.map((day, i) => (
              <div
                key={i}
                title={new Date(day.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                className={cn(
                  "h-3 w-3 rounded-full",
                  day.active ? "bg-strivo-light" : "bg-[#E2E8F0]"
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href={`/chat/${pairId}`}>
            <MessageCircle className="h-4 w-4" />
            Chat
          </Link>
        </Button>
        <Button variant="outline" onClick={() => setSchedulerOpen(true)}>
          <Calendar className="h-4 w-4" />
          Schedule Session
        </Button>
        <Button asChild>
          <Link href={`/focus/${pairId}`}>
            <Zap className="h-4 w-4" />
            Start Focus Room
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/profile/${data.partner.id}`}>View profile</Link>
        </Button>
      </div>

      <SessionSchedulerSheet
        pairId={pairId}
        open={schedulerOpen}
        onOpenChange={setSchedulerOpen}
        sameCity={sameCity}
        onScheduled={loadBoard}
      />
        </TabsContent>
      </Tabs>
    </div>
  );
}
