"use client";

import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";

export function FeedSidebarRight() {
  const [connections, setConnections] = useState<
    { id: string; name: string | null; goalLabel: string | null; profilePicUrl: string | null; matchScore: number }[]
  >([]);

  useEffect(() => {
    fetch("/api/home/widgets")
      .then((r) => r.json())
      .then((d) => setConnections(d.suggestedConnections ?? []));
  }, []);

  return (
    <Card className="surface-card sticky top-20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Suggested connections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {connections.map((c) => (
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
            Discover more
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
