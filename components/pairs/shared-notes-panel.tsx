"use client";

import { formatDistanceToNow } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SharedNotesPanelProps {
  pairId: string;
}

export function SharedNotesPanel({ pairId }: SharedNotesPanelProps) {
  const [content, setContent] = useState("");
  const [lastEditedBy, setLastEditedBy] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/pairs/${pairId}/notes`);
    const data = await res.json();
    if (res.ok) {
      setContent(data.note?.content ?? "");
      setLastEditedBy(data.note?.lastEditedBy?.name ?? null);
      setUpdatedAt(data.note?.updatedAt ?? null);
    }
    setLoading(false);
  }, [pairId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveNotes() {
    try {
      const res = await fetch(`/api/pairs/${pairId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setLastEditedBy(data.note?.lastEditedBy?.name ?? null);
      setUpdatedAt(data.note?.updatedAt ?? null);
    } catch {
      toast.error("Could not save notes");
    }
  }

  if (loading) {
    return <p className="text-sm text-strivo-secondary">Loading notes...</p>;
  }

  return (
    <div className="space-y-3">
      <Label>Shared notes</Label>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={saveNotes}
        placeholder="Write study notes, links, or reminders for you and your partner..."
        rows={8}
        className="min-h-[160px]"
      />
      {lastEditedBy && updatedAt && (
        <p className="text-xs text-strivo-secondary">
          Last edited by {lastEditedBy}{" "}
          {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
        </p>
      )}
    </div>
  );
}
