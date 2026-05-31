"use client";

import { Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatStudyGoal } from "@/lib/constants/onboarding";
import { getInitials } from "@/lib/utils";

interface PairSummary {
  id: string;
  partner: {
    id: string;
    name: string | null;
    profilePicUrl: string | null;
    goal: string | null;
  };
  streak: number;
}

export function MyPairsWidget() {
  const [pairs, setPairs] = useState<PairSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pairs")
      .then((r) => r.json())
      .then((data) => setPairs((data.pairs ?? []).slice(0, 4)))
      .catch(() => setPairs([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold text-strivo-text">My Pairs</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/pairs">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-strivo-secondary" />
          </div>
        ) : pairs.length === 0 ? (
          <div className="py-6 text-center">
            <Users className="mx-auto h-8 w-8 text-strivo-secondary" />
            <p className="mt-2 text-sm text-strivo-secondary">
              No pairs yet. Connect with someone!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {pairs.map((pair) => (
              <Link
                key={pair.id}
                href={`/pairs/${pair.id}`}
                className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-strivo-muted"
              >
                <Avatar className="h-9 w-9">
                  {pair.partner.profilePicUrl && (
                    <AvatarImage
                      src={pair.partner.profilePicUrl}
                      alt={pair.partner.name ?? ""}
                    />
                  )}
                  <AvatarFallback className="text-xs">
                    {getInitials(pair.partner.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-strivo-text">
                    {pair.partner.name ?? "Partner"}
                  </p>
                  {pair.partner.goal && (
                    <p className="truncate text-xs text-strivo-secondary">
                      {formatStudyGoal(pair.partner.goal as never)}
                    </p>
                  )}
                </div>
                {pair.streak > 0 && (
                  <div className="flex items-center gap-0.5 text-xs font-bold text-strivo-text">
                    <span aria-hidden>🔥</span>
                    {pair.streak}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
