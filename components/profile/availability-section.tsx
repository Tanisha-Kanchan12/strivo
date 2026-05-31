"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "🟢 Available to study now", emoji: "🟢" },
  { value: "STUDYING_ALONE", label: "🟡 Studying alone (do not disturb)", emoji: "🟡" },
  { value: "NOT_AVAILABLE", label: "🔴 Not available today", emoji: "🔴" },
  { value: "AVAILABLE_AT", label: "📅 Will be available at", emoji: "📅" },
] as const;

export function AvailabilitySection() {
  const [status, setStatus] = useState<string>("AVAILABLE");
  const [availableAt, setAvailableAt] = useState("");

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.availability?.status ?? "AVAILABLE");
        if (data.availability?.availableAt) {
          const d = new Date(data.availability.availableAt);
          setAvailableAt(d.toISOString().slice(0, 16));
        }
      })
      .catch(() => undefined);
  }, []);

  async function save(
    nextStatus: string,
    nextAvailableAt?: string
  ) {
    try {
      const res = await fetch("/api/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          availableAt:
            nextStatus === "AVAILABLE_AT" && nextAvailableAt
              ? new Date(nextAvailableAt).toISOString()
              : null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Status updated");
    } catch {
      toast.error("Could not update status");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Availability</CardTitle>
        <p className="text-xs text-strivo-secondary">
          Visible to your study pairs only. Resets at midnight.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setStatus(opt.value);
              if (opt.value !== "AVAILABLE_AT") {
                save(opt.value);
              }
            }}
            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
              status === opt.value ? "chip-active" : "chip-inactive"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {status === "AVAILABLE_AT" && (
          <div className="space-y-2 pt-2">
            <Label>Available at</Label>
            <Input
              type="datetime-local"
              value={availableAt}
              onChange={(e) => setAvailableAt(e.target.value)}
            />
            <button
              type="button"
              className="text-sm font-medium text-primary"
              onClick={() => save("AVAILABLE_AT", availableAt)}
            >
              Save time
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
