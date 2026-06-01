"use client";

import {
  differenceInCalendarWeeks,
  startOfDay,
} from "date-fns";
import {
  Calendar,
  Check,
  Loader2,
  Pencil,
  SkipForward,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PlanTask {
  id: string;
  date: string;
  taskText: string;
  subject: string;
  isComplete: boolean;
  skippedAt: string | null;
}

interface PlanData {
  id: string;
  examName: string;
  examDate: string;
  dailyHoursTarget: number;
  daysRemaining: number;
  subjects: string[];
  tasks: PlanTask[];
}

function startOfDayKey(d: Date) {
  return d.toDateString();
}

export function PlannerPageClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [creating, setCreating] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);
  const [actingTaskId, setActingTaskId] = useState<string | null>(null);
  const [savingTaskEdit, setSavingTaskEdit] = useState(false);
  const [form, setForm] = useState({
    examName: "",
    examDate: "",
    dailyHoursTarget: "3",
    subjects: "",
  });
  const [editForm, setEditForm] = useState({
    examName: "",
    examDate: "",
    dailyHoursTarget: "3",
    subjects: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/planner");
      const data = await res.json();
      if (!res.ok) throw new Error();
      setPlan(data.plan);
      if (data.plan) {
        setEditForm({
          examName: data.plan.examName,
          examDate: data.plan.examDate.slice(0, 10),
          dailyHoursTarget: String(data.plan.dailyHoursTarget),
          subjects: (data.plan.subjects as string[]).join(", "),
        });
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const todayKey = startOfDayKey(new Date());

  const planStart = useMemo(() => {
    if (!plan?.tasks.length) return startOfDay(new Date());
    return startOfDay(
      new Date(Math.min(...plan.tasks.map((t) => new Date(t.date).getTime())))
    );
  }, [plan]);

  const tasksByWeek = useMemo(() => {
    if (!plan) return [];
    const weeks = new Map<number, PlanTask[]>();

    for (const task of plan.tasks) {
      if (startOfDayKey(new Date(task.date)) === todayKey) continue;
      const weekNum =
        differenceInCalendarWeeks(
          startOfDay(new Date(task.date)),
          planStart,
          { weekStartsOn: 1 }
        ) + 1;
      const list = weeks.get(weekNum) ?? [];
      list.push(task);
      weeks.set(weekNum, list);
    }

    return Array.from(weeks.entries())
      .sort(([a], [b]) => a - b)
      .map(([weekNum, tasks]) => ({
        weekNum,
        tasks: tasks.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      }));
  }, [plan, planStart]);

  const todayTasks = useMemo(
    () =>
      plan?.tasks.filter(
        (t) => startOfDayKey(new Date(t.date)) === todayKey
      ) ?? [],
    [plan, todayKey]
  );

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examName: form.examName,
          examDate: form.examDate,
          dailyHoursTarget: Number(form.dailyHoursTarget),
          subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Study plan created!");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create plan");
    } finally {
      setCreating(false);
    }
  }

  async function savePlanEdit(e: React.FormEvent) {
    e.preventDefault();
    setSavingPlan(true);
    try {
      const res = await fetch("/api/planner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examName: editForm.examName,
          examDate: editForm.examDate,
          dailyHoursTarget: Number(editForm.dailyHoursTarget),
          subjects: editForm.subjects.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Plan updated and regenerated!");
      setEditOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update plan");
    } finally {
      setSavingPlan(false);
    }
  }

  async function taskAction(id: string, action: "complete" | "skip") {
    if (actingTaskId) return;
    setActingTaskId(id);
    try {
      await fetch(`/api/planner/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      load();
    } finally {
      setActingTaskId(null);
    }
  }

  async function saveTaskEdit() {
    if (!editingTaskId || editTaskText.trim().length < 2 || savingTaskEdit) return;
    setSavingTaskEdit(true);
    try {
      await fetch(`/api/planner/tasks/${editingTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", taskText: editTaskText }),
      });
      setEditingTaskId(null);
      load();
    } finally {
      setSavingTaskEdit(false);
    }
  }

  function TaskRow({ task, highlight }: { task: PlanTask; highlight?: boolean }) {
    return (
      <div
        className={cn(
          "flex items-start justify-between gap-3 rounded-lg border p-3",
          highlight ? "border-[#3B82F6] bg-blue-50/50" : "border-strivo-line",
          task.isComplete && "opacity-60"
        )}
      >
        <div className="min-w-0 flex-1">
          <Badge variant="secondary" className="mb-1 text-xs">
            {task.subject}
          </Badge>
          <p className={cn("text-sm", task.isComplete && "line-through")}>
            {task.taskText}
          </p>
          {!highlight && (
            <p className="mt-0.5 text-xs text-strivo-secondary">
              {new Date(task.date).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {!task.isComplete && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setEditingTaskId(task.id);
                  setEditTaskText(task.taskText);
                }}
                aria-label="Edit task"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => taskAction(task.id, "skip")}
                loading={actingTaskId === task.id}
                aria-label="Skip task"
              >
                <SkipForward className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                onClick={() => taskAction(task.id, "complete")}
                loading={actingTaskId === task.id}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="surface-card">
        <CardContent className="p-8 text-center text-sm text-strivo-secondary">
          Failed to load planner.{" "}
          <button type="button" className="text-primary underline" onClick={load}>
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card className="surface-card max-w-lg">
        <CardHeader>
          <CardTitle>Create your study plan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createPlan} className="space-y-4">
            <div>
              <Label>Exam name</Label>
              <Input
                value={form.examName}
                onChange={(e) => setForm({ ...form, examName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Exam date</Label>
              <Input
                type="date"
                value={form.examDate}
                onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Daily study hours</Label>
              <Input
                type="number"
                min={1}
                max={16}
                value={form.dailyHoursTarget}
                onChange={(e) =>
                  setForm({ ...form, dailyHoursTarget: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Subjects (comma-separated)</Label>
              <Input
                placeholder="Physics, Chemistry, Maths"
                value={form.subjects}
                onChange={(e) => setForm({ ...form, subjects: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Generate 3-month plan"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="surface-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="text-sm text-strivo-secondary">{plan.examName}</p>
            <p className="text-3xl font-bold text-primary">{plan.daysRemaining}</p>
            <p className="text-xs text-strivo-secondary">days remaining</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-strivo-secondary">
              <Calendar className="h-4 w-4" />
              Exam: {new Date(plan.examDate).toLocaleDateString()}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              Edit Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {todayTasks.length > 0 && (
        <Card className="surface-card border-[#3B82F6]/30">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#3B82F6]">
              Today&apos;s tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayTasks.map((t) => (
              <TaskRow key={t.id} task={t} highlight />
            ))}
          </CardContent>
        </Card>
      )}

      {tasksByWeek.map(({ weekNum, tasks }) => (
        <Card key={weekNum} className="surface-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Week {weekNum}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </CardContent>
        </Card>
      ))}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit study plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={savePlanEdit} className="space-y-4">
            <div>
              <Label>Exam name</Label>
              <Input
                value={editForm.examName}
                onChange={(e) =>
                  setEditForm({ ...editForm, examName: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Exam date</Label>
              <Input
                type="date"
                value={editForm.examDate}
                onChange={(e) =>
                  setEditForm({ ...editForm, examDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Daily study hours</Label>
              <Input
                type="number"
                min={1}
                max={16}
                value={editForm.dailyHoursTarget}
                onChange={(e) =>
                  setEditForm({ ...editForm, dailyHoursTarget: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Subjects</Label>
              <Input
                value={editForm.subjects}
                onChange={(e) =>
                  setEditForm({ ...editForm, subjects: e.target.value })
                }
              />
            </div>
            <Button type="submit" disabled={savingPlan} className="w-full">
              {savingPlan ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save and regenerate plan"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingTaskId !== null}
        onOpenChange={(o) => !o && setEditingTaskId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={editTaskText}
              onChange={(e) => setEditTaskText(e.target.value)}
            />
            <Button onClick={saveTaskEdit} className="w-full" loading={savingTaskEdit}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
