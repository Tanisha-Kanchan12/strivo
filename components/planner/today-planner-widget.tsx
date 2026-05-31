"use client";

import { Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function TodayPlannerWidget() {
  const [data, setData] = useState<{ total: number; complete: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/planner/today")
      .then((r) => r.json())
      .then((d) => setData({ total: d.total ?? 0, complete: d.complete ?? 0 }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="surface-card">
        <CardContent className="flex items-center gap-2 p-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-strivo-secondary">Loading plan...</span>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.total === 0) return null;

  return (
    <Link href="/planner">
      <Card className="surface-card-hover">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-strivo-text">
                Today&apos;s Plan: {data.total} tasks
              </p>
              <p className="text-xs text-strivo-secondary">
                {data.complete}/{data.total} done
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-primary">Open planner</span>
        </CardContent>
      </Card>
    </Link>
  );
}
