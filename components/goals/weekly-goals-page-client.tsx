"use client";

import { Check, Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function WeeklyGoalsPageClient() {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<
    { id: string; goalText: string; isComplete: boolean }[]
  >([]);
  const [newGoal, setNewGoal] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/weekly-goals");
      const data = await res.json();
      setGoals(data.goals ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addGoal() {
    if (!newGoal.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/weekly-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalText: newGoal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewGoal("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add goal");
    } finally {
      setAdding(false);
    }
  }

  async function toggleGoal(id: string) {
    await fetch(`/api/weekly-goals/${id}`, { method: "PATCH" });
    load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const complete = goals.filter((g) => g.isComplete).length;

  return (
    <div className="space-y-6 max-w-lg">
      <Card className="surface-card">
        <CardContent className="p-6">
          <p className="text-sm text-strivo-secondary">This week</p>
          <p className="text-3xl font-bold text-primary">
            {complete}/{goals.length}
          </p>
          <p className="text-xs text-strivo-secondary">
            Visible to your pairs for accountability
          </p>
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Weekly goals (max 5)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {goals.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => toggleGoal(g.id)}
              className="flex w-full items-center gap-3 rounded-lg border border-strivo-border p-3 text-left text-sm"
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                  g.isComplete ? "border-primary bg-primary text-white" : "border-strivo-border"
                )}
              >
                {g.isComplete && <Check className="h-3 w-3" />}
              </span>
              <span className={g.isComplete ? "line-through text-strivo-secondary" : ""}>
                {g.goalText}
              </span>
            </button>
          ))}
          {goals.length < 5 && (
            <div className="flex gap-2">
              <Input
                placeholder="Add a goal for this week..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
              />
              <Button onClick={addGoal} disabled={adding}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
