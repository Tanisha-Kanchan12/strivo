"use client";

import { Flame, TrendingUp, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";

function WidgetSkeleton() {
  return (
    <div className="h-28 animate-pulse rounded-2xl border border-strivo-line bg-white shadow-card" />
  );
}

interface WidgetsData {
  streak: { current: number; longest: number };
  leaderboard: {
    rank: number;
    name: string | null;
    streak: number;
    profilePicUrl: string | null;
  }[];
  suggestedConnections: {
    id: string;
    name: string | null;
    goalLabel: string | null;
    profilePicUrl: string | null;
    matchScore: number;
  }[];
  trendingTopics: { topic: string; goalLabel: string }[];
}

export function HomeWidgetsSidebar() {
  const [data, setData] = useState<WidgetsData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home/widgets")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(true);
        else setData(d);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <aside className="space-y-4">
        <WidgetSkeleton />
        <WidgetSkeleton />
        <WidgetSkeleton />
      </aside>
    );
  }

  if (error || !data) {
    return (
      <Card className="surface-card">
        <CardContent className="p-4 text-sm text-strivo-secondary">
          Could not load sidebar widgets.
        </CardContent>
      </Card>
    );
  }

  return (
    <aside className="space-y-4">
      <Card className="surface-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Flame className="h-4 w-4 text-primary" />
            Your streak
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-3xl font-bold text-primary">{data.streak.current}</p>
          <p className="text-xs text-strivo-secondary">
            Longest: {data.streak.longest} days
          </p>
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Suggested connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {data.suggestedConnections.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                {c.profilePicUrl && <AvatarImage src={c.profilePicUrl} alt="" />}
                <AvatarFallback>{getInitials(c.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name ?? "Student"}</p>
                <p className="text-xs text-strivo-secondary">{c.goalLabel}</p>
              </div>
              <span className="text-xs font-semibold text-primary">{c.matchScore}%</span>
            </div>
          ))}
          <Button size="sm" className="w-full gap-1" asChild>
            <Link href="/home">
              <UserPlus className="h-3.5 w-3.5" />
              See more on Discover
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" />
            Trending in your goal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-0">
          {data.trendingTopics.map((t) => (
            <span
              key={t.topic}
              className="rounded-full bg-strivo-muted px-3 py-1 text-xs font-medium text-strivo-text"
            >
              {t.topic}
            </span>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}
