"use client";

import { AlertCircle, Loader2, Share2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ScoresPageClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scores, setScores] = useState<
    { id: string; testName: string; date: string; percent: number; subject: string; sharedWithPair: boolean }[]
  >([]);
  const [subjectAverages, setSubjectAverages] = useState<
    { subject: string; averagePercent: number }[]
  >([]);
  const [weakSubject, setWeakSubject] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    testName: "",
    date: new Date().toISOString().slice(0, 10),
    score: "",
    maxScore: "",
    subject: "",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/scores");
      const data = await res.json();
      if (!res.ok) throw new Error();
      setScores(data.scores ?? []);
      setSubjectAverages(data.subjectAverages ?? []);
      setWeakSubject(data.weakSubject ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          score: Number(form.score),
          maxScore: Number(form.maxScore),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Score logged!");
      setForm({ testName: "", date: new Date().toISOString().slice(0, 10), score: "", maxScore: "", subject: "", notes: "" });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleShare(id: string, current: boolean) {
    await fetch(`/api/scores/${id}/share`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sharedWithPair: !current }),
    });
    load();
  }

  const chartData = scores.map((s) => ({
    name: s.testName.slice(0, 12),
    percent: s.percent,
    date: new Date(s.date).toLocaleDateString(),
  }));

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
          Failed to load scores.{" "}
          <button type="button" className="text-primary underline" onClick={load}>
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {subjectAverages.map((s) => (
          <Card key={s.subject} className="surface-card">
            <CardContent className="p-4">
              <p className="text-xs text-strivo-secondary">{s.subject}</p>
              <p className="text-2xl font-bold text-strivo-text">{s.averagePercent}%</p>
              {weakSubject === s.subject && (
                <Badge variant="secondary" className="mt-2 gap-1 text-amber-700">
                  <AlertCircle className="h-3 w-3" />
                  Needs attention
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {chartData.length > 0 && (
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Score trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e4" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="percent" stroke="#2d6a4f" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Log a mock test</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Test name</Label>
              <Input value={form.testName} onChange={(e) => setForm({ ...form, testName: e.target.value })} required />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <Label>Score</Label>
              <Input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} required />
            </div>
            <div>
              <Label>Max score</Label>
              <Input type="number" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <Label>Subject</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save score"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Your scores (private by default)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {scores.length === 0 && (
            <p className="text-sm text-strivo-secondary">No scores logged yet.</p>
          )}
          {scores.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-strivo-line p-3">
              <div>
                <p className="font-medium text-sm">{s.testName}</p>
                <p className="text-xs text-strivo-secondary">
                  {s.subject} · {s.percent}% · {new Date(s.date).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1"
                onClick={() => toggleShare(s.id, s.sharedWithPair)}
              >
                <Share2 className="h-3.5 w-3.5" />
                {s.sharedWithPair ? "Shared" : "Share with pair"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
