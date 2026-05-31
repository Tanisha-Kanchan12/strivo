"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MonthlyRecapCardProps {
  month: number;
  year: number;
  sessionsCount: number;
  longestStreak: number;
  connectionsCount: number;
  topSubject: string | null;
  summaryText: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthlyRecapCard({
  month,
  year,
  sessionsCount,
  longestStreak,
  connectionsCount,
  topSubject,
  summaryText,
}: MonthlyRecapCardProps) {
  const monthLabel = MONTH_NAMES[month - 1] ?? `Month ${month}`;

  async function handleShare() {
    const text = `Strivo ${monthLabel} ${year} Recap\n${sessionsCount} focus sessions · ${longestStreak}-day streak · ${connectionsCount} new partners\n${summaryText}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "My Strivo Recap", text });
        return;
      } catch {
        // user cancelled or share failed
      }
    }

    await navigator.clipboard.writeText(text);
    toast.success("Recap copied to clipboard");
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-primary">{monthLabel} {year}</CardTitle>
        <p className="text-sm text-strivo-secondary">Your study month in review</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-white p-3">
            <p className="text-2xl font-bold text-primary">{sessionsCount}</p>
            <p className="text-xs font-semibold text-strivo-secondary">Sessions</p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-2xl font-bold text-primary">
              {longestStreak > 0 && <span aria-hidden>🔥 </span>}
              {longestStreak}
            </p>
            <p className="text-xs font-semibold text-strivo-secondary">Best streak</p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-2xl font-bold text-primary">{connectionsCount}</p>
            <p className="text-xs font-semibold text-strivo-secondary">New pairs</p>
          </div>
        </div>

        {topSubject && (
          <p className="text-sm text-strivo-secondary">
            Top focus: <span className="font-bold capitalize text-primary">{topSubject}</span>
          </p>
        )}

        <p className="text-sm leading-relaxed text-primary">{summaryText}</p>

        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
          Share recap
        </Button>
      </CardContent>
    </Card>
  );
}
