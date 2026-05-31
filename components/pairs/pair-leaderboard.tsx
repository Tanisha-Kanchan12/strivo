"use client";

import { Loader2, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";

interface LeaderEntry {
  rank: number;
  userId: string;
  name: string | null;
  profilePicUrl: string | null;
  sessionsThisWeek: number;
  streak: number;
}

export function PairLeaderboard() {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pairs/leaderboard")
      .then((r) => r.json())
      .then((data) => setEntries(data.leaderboard ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-strivo-secondary" />
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Trophy className="h-4 w-4 text-strivo-yellow" />
          This Week (your pairs)
        </CardTitle>
        <p className="text-xs text-strivo-secondary">
          Private leaderboard. Only people you are connected with.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.userId}
            className="flex items-center gap-3 rounded-xl bg-strivo-muted/60 px-3 py-2"
          >
            <span className="w-6 text-center text-sm font-bold text-primary">
              #{entry.rank}
            </span>
            <Avatar className="h-8 w-8">
              {entry.profilePicUrl && (
                <AvatarImage src={entry.profilePicUrl} alt={entry.name ?? ""} />
              )}
              <AvatarFallback className="text-xs">
                {getInitials(entry.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-strivo-text">
                {entry.name ?? "Partner"}
              </p>
              <p className="text-xs text-strivo-secondary">
                {entry.sessionsThisWeek} sessions · {entry.streak} day streak
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
