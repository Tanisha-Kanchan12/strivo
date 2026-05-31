"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectableChip } from "@/components/ui/selectable-chip";

interface SessionSchedulerSheetProps {
  pairId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sameCity?: boolean;
  onScheduled?: () => void;
}

const DURATION_OPTIONS = [25, 45, 60];

export function SessionSchedulerSheet({
  pairId,
  open,
  onOpenChange,
  sameCity = false,
  onScheduled,
}: SessionSchedulerSheetProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(45);
  const [customDuration, setCustomDuration] = useState("");
  const [platform, setPlatform] = useState<"GOOGLE_MEET" | "IN_PERSON">("GOOGLE_MEET");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) {
      toast.error("Please select date and time");
      return;
    }

    const durationMinutes = customDuration
      ? parseInt(customDuration, 10)
      : duration;

    if (isNaN(durationMinutes) || durationMinutes < 5) {
      toast.error("Invalid duration");
      return;
    }

    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/sessions/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairId,
          scheduledAt,
          durationMinutes,
          platform,
          location: platform === "IN_PERSON" ? location : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule");

      toast.success("Session scheduled!");
      if (data.icsUrl) {
        toast.message("Add to your calendar", {
          action: {
            label: "Download .ics",
            onClick: () => window.open(data.icsUrl, "_blank"),
          },
        });
      }
      onOpenChange(false);
      onScheduled?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule a session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((d) => (
                <SelectableChip
                  key={d}
                  label={d === 60 ? "1 hour" : `${d} min`}
                  selected={!customDuration && duration === d}
                  onClick={() => {
                    setDuration(d);
                    setCustomDuration("");
                  }}
                />
              ))}
            </div>
            <Input
              type="number"
              placeholder="Custom minutes"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              min={5}
              max={480}
            />
          </div>

          <div className="space-y-2">
            <Label>Platform</Label>
            <div className="grid grid-cols-2 gap-2">
              <SelectableChip
                label="Google Meet"
                description="Auto-generates link"
                selected={platform === "GOOGLE_MEET"}
                onClick={() => setPlatform("GOOGLE_MEET")}
              />
              <SelectableChip
                label="In Person"
                description={sameCity ? "Same city" : "Requires same city"}
                selected={platform === "IN_PERSON"}
                onClick={() => setPlatform("IN_PERSON")}
              />
            </div>
          </div>

          {platform === "IN_PERSON" && (
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Library, cafe, campus..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Schedule session"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
