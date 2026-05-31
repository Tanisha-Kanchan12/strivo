"use client";

import { Check, ChevronDown, Loader2, Plus, Share2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Topic {
  id: string;
  subject: string;
  topicName: string;
  isComplete: boolean;
}

interface SubjectProgress {
  subject: string;
  total: number;
  complete: number;
  percent: number;
}

export function SyllabusPageClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [overallPercent, setOverallPercent] = useState(0);
  const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [openSubjects, setOpenSubjects] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [newTopicBySubject, setNewTopicBySubject] = useState<Record<string, string>>({});
  const [addingSubject, setAddingSubject] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/syllabus");
      const data = await res.json();
      if (!res.ok) throw new Error();
      setOverallPercent(data.overallPercent ?? 0);
      setSubjects(data.subjects ?? []);
      setTopics(data.topics ?? []);
      setOpenSubjects(
        new Set((data.subjects ?? []).map((s: SubjectProgress) => s.subject))
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleTopic(id: string) {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/syllabus/${id}/complete`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      toast.error("Could not update topic");
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteTopic(id: string) {
    try {
      const res = await fetch(`/api/syllabus/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      toast.error("Could not delete topic");
    }
  }

  async function addTopic(subject: string) {
    const topicName = (newTopicBySubject[subject] ?? "").trim();
    if (topicName.length < 2) {
      toast.error("Enter a topic name");
      return;
    }
    setAddingSubject(subject);
    try {
      const res = await fetch("/api/syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topicName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setNewTopicBySubject((prev) => ({ ...prev, [subject]: "" }));
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add topic");
    } finally {
      setAddingSubject(null);
    }
  }

  async function shareProgress() {
    setSharing(true);
    try {
      const res = await fetch("/api/syllabus/share", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error();
      toast.success(`Shared ${data.overallPercent}% progress with your pairs!`);
    } catch {
      toast.error("Could not share progress");
    } finally {
      setSharing(false);
    }
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
          Failed to load syllabus.{" "}
          <button type="button" className="text-primary underline" onClick={load}>
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  const topicsBySubject = topics.reduce<Record<string, Topic[]>>((acc, t) => {
    (acc[t.subject] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card className="surface-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="text-sm text-strivo-secondary">Overall completion</p>
            <p className="text-4xl font-bold text-primary">{overallPercent}%</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {subjects.map((s) => (
              <div key={s.subject} className="text-center">
                <div
                  className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/20"
                  style={{
                    background: `conic-gradient(var(--primary) ${s.percent * 3.6}deg, #e8f0e4 0deg)`,
                  }}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xs font-bold">
                    {s.percent}%
                  </span>
                </div>
                <p className="mt-1 max-w-[80px] truncate text-xs font-medium">{s.subject}</p>
              </div>
            ))}
          </div>
          <Button onClick={shareProgress} disabled={sharing} className="gap-2">
            {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            Share with pairs
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {subjects.map((s) => {
          const open = openSubjects.has(s.subject);
          const subjectTopics = topicsBySubject[s.subject] ?? [];
          return (
            <Card key={s.subject} className="surface-card overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between p-4 text-left"
                onClick={() =>
                  setOpenSubjects((prev) => {
                    const next = new Set(prev);
                    if (next.has(s.subject)) next.delete(s.subject);
                    else next.add(s.subject);
                    return next;
                  })
                }
              >
                <div>
                  <p className="font-semibold text-strivo-text">{s.subject}</p>
                  <p className="text-xs text-strivo-secondary">
                    {s.complete}/{s.total} topics
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={s.percent} className="h-2 w-24" />
                  <ChevronDown
                    className={cn("h-5 w-5 transition-transform", open && "rotate-180")}
                  />
                </div>
              </button>
              {open && (
                <CardContent className="space-y-2 border-t border-strivo-border p-3 pt-2">
                  {subjectTopics.length === 0 && (
                    <p className="px-2 py-2 text-sm text-strivo-secondary">
                      No topics yet. Add your own below.
                    </p>
                  )}
                  {subjectTopics.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-strivo-muted"
                    >
                      <button
                        type="button"
                        disabled={togglingId === t.id}
                        onClick={() => toggleTopic(t.id)}
                        className="flex flex-1 items-center gap-3 text-left text-sm"
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                            t.isComplete
                              ? "border-primary bg-primary text-white"
                              : "border-strivo-border"
                          )}
                        >
                          {t.isComplete && <Check className="h-3 w-3" />}
                        </span>
                        <span
                          className={cn(
                            t.isComplete && "text-strivo-secondary line-through"
                          )}
                        >
                          {t.topicName}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTopic(t.id)}
                        className="rounded p-1.5 text-strivo-secondary hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete topic"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 px-2 pt-2">
                    <Input
                      placeholder="Topic name..."
                      value={newTopicBySubject[s.subject] ?? ""}
                      onChange={(e) =>
                        setNewTopicBySubject((prev) => ({
                          ...prev,
                          [s.subject]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTopic(s.subject);
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="gap-1 shrink-0"
                      disabled={addingSubject === s.subject}
                      onClick={() => addTopic(s.subject)}
                    >
                      {addingSubject === s.subject ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Add Topic
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
