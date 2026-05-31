"use client";

import { Flame, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";

export function FeedSidebarLeft() {
  const [leaderboard, setLeaderboard] = useState<
    { rank: number; name: string | null; streak: number; profilePicUrl: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home/widgets")
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="surface-card sticky top-20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Flame className="h-4 w-4 text-primary" />
          Study streak leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {loading && <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />}
        {!loading &&
          leaderboard.map((entry) => (
            <div key={entry.rank} className="flex items-center gap-2">
              <span className="w-5 text-xs font-bold text-strivo-secondary">
                #{entry.rank}
              </span>
              <Avatar className="h-7 w-7">
                {entry.profilePicUrl && <AvatarImage src={entry.profilePicUrl} alt="" />}
                <AvatarFallback className="text-[10px]">
                  {getInitials(entry.name)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-sm">{entry.name ?? "Student"}</span>
              <span className="text-xs font-semibold text-primary">{entry.streak}d</span>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
