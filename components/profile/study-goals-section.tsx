"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface Goal {
  id: string;
  title: string;
  targetNumber: number;
  currentProgress: number;
  deadline: string | null;
}

export function StudyGoalsSection() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("100");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/goals");
    const data = await res.json();
    setGoals(data.goals ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          targetNumber: parseInt(target, 10),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setTitle("");
      setTarget("100");
      await load();
    } catch {
      toast.error("Could not add goal");
    } finally {
      setAdding(false);
    }
  }

  async function updateProgress(id: string, currentProgress: number) {
    await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentProgress }),
    });
    await load();
  }

  async function deleteGoal(id: string) {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">My Goals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Loader2 className="mx-auto animate-spin text-strivo-secondary" />
        ) : (
          goals.map((goal) => {
            const pct = Math.min(
              100,
              Math.round((goal.currentProgress / goal.targetNumber) * 100)
            );
            return (
              <div key={goal.id} className="space-y-2 rounded-xl bg-strivo-muted p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-strivo-text">{goal.title}</p>
                  <button
                    type="button"
                    onClick={() => deleteGoal(goal.id)}
                    className="text-strivo-secondary hover:text-strivo-coral"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Progress value={pct} className="h-2" />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={goal.targetNumber}
                    value={goal.currentProgress}
                    onChange={(e) =>
                      updateProgress(goal.id, parseInt(e.target.value, 10) || 0)
                    }
                    className="h-8 w-20"
                  />
                  <span className="text-sm text-strivo-secondary">
                    / {goal.targetNumber}
                  </span>
                </div>
              </div>
            );
          })
        )}

        <form onSubmit={handleAdd} className="space-y-3 border-t border-strivo-muted pt-4">
          <div className="space-y-2">
            <Label>New goal</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Complete 100 DSA problems"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Target</Label>
            <Input
              type="number"
              min={1}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={adding} className="w-full gap-2">
            {adding ? <Loader2 className="animate-spin" /> : <Plus className="h-4 w-4" />}
            Add goal
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
