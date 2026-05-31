"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityDay } from "@/lib/activity";
import { cn } from "@/lib/utils";

const LEVEL_COLORS = [
  "bg-strivo-muted",
  "bg-[#98BF64]",
  "bg-[#597D35]",
  "bg-primary",
];

export function ActivityCalendar() {
  const [days, setDays] = useState<ActivityDay[]>([]);

  useEffect(() => {
    fetch("/api/activity/calendar")
      .then((r) => r.json())
      .then((data) => setDays(data.days ?? []))
      .catch(() => setDays([]));
  }, []);

  const weeks: ActivityDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Study activity</CardTitle>
        <p className="text-xs text-strivo-secondary">Last 12 weeks</p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => {
                const dateLabel = new Date(day.date).toLocaleDateString("en-IN", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                return (
                  <div
                    key={day.date}
                    title={`${dateLabel}: ${day.count} activities`}
                    className={cn(
                      "h-3 w-3 rounded-sm",
                      LEVEL_COLORS[day.level]
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-strivo-secondary">
          <span>Less</span>
          {LEVEL_COLORS.map((c, i) => (
            <div key={i} className={cn("h-3 w-3 rounded-sm", c)} />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
