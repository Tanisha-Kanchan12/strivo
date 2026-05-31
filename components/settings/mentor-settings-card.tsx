"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function MentorSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [achievementBadge, setAchievementBadge] = useState("");

  useEffect(() => {
    fetch("/api/mentors/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.mentorProfile) {
          setIsMentor(d.mentorProfile.isMentor);
          setAchievementBadge(d.mentorProfile.achievementBadge ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/mentors/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMentor, achievementBadge }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Mentor profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mentor mode</CardTitle>
        <CardDescription>
          Help other students with your experience. Shown on Discover under Mentors.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="settings-mentor">I want to be a Mentor</Label>
          <Switch
            id="settings-mentor"
            checked={isMentor}
            onCheckedChange={setIsMentor}
          />
        </div>
        {isMentor && (
          <div className="space-y-2">
            <Label htmlFor="settings-badge">Achievement badge</Label>
            <Input
              id="settings-badge"
              value={achievementBadge}
              onChange={(e) => setAchievementBadge(e.target.value)}
              placeholder='e.g. "Cleared CAT 99 percentile"'
            />
          </div>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save mentor settings"}
        </button>
      </CardContent>
    </Card>
  );
}
