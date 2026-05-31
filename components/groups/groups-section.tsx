"use client";

import { Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { STUDY_GOAL_OPTIONS } from "@/lib/constants/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GroupsSection() {
  const [groups, setGroups] = useState<
    { id: string; name: string; subject: string; memberCount: number; maxMembers: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "", goal: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      setGroups(data.groups ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Group created!");
      setShowForm(false);
      setForm({ name: "", subject: "", goal: "" });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create group");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Card className="surface-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Users className="h-5 w-5 text-primary" />
          Study Groups
        </CardTitle>
        <Button size="sm" variant="secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Create group"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={createGroup} className="grid gap-3 sm:grid-cols-2 border-t border-strivo-border pt-4">
            <div>
              <Label>Group name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <Label>Goal</Label>
              <select
                className="w-full rounded-lg border border-strivo-border px-3 py-2 text-sm"
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                required
              >
                <option value="">Select goal</option>
                {STUDY_GOAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={creating} className="sm:col-span-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create (max 5 members)"}
            </Button>
          </form>
        )}
        {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        {!loading && groups.length === 0 && (
          <p className="text-sm text-strivo-secondary">No groups yet. Create one to study together!</p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/groups/${g.id}`}
              className="rounded-xl border border-strivo-border p-4 hover:border-primary/40 transition-colors"
            >
              <p className="font-medium text-strivo-text">{g.name}</p>
              <p className="text-xs text-strivo-secondary mt-1">
                {g.subject} · {g.memberCount}/{g.maxMembers} members
              </p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
