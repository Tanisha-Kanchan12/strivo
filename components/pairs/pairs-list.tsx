"use client";

import { Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatStudyGoal } from "@/lib/constants/onboarding";
import { formatRelativeTime, getInitials } from "@/lib/utils";

interface PairItem {
  id: string;
  isProvisional?: boolean;
  partner: {
    id: string;
    name: string | null;
    city: string | null;
    profilePicUrl: string | null;
    goal: string | null;
  };
  streak: number;
  lastActivity: string;
  lastMessagePreview: string | null;
  pendingCheckin: boolean;
}

export function PairsList() {
  const [pairs, setPairs] = useState<PairItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pairs")
      .then((r) => r.json())
      .then((data) => setPairs(data.pairs ?? []))
      .catch(() => setPairs([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pairs.length === 0) {
    return (
      <Card>
        <CardContent className="py-14 text-center">
          <p className="font-semibold text-strivo-text">No pairs yet</p>
          <p className="mt-1 text-sm text-strivo-secondary">
            Head to Discover and connect with study partners
          </p>
          <Link
            href="/home"
            className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Find matches →
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pairs.map((pair) => (
        <Card key={pair.id} className="surface-card-hover">
          <CardContent className="flex items-center gap-4 p-5">
            <Link
              href={`/pairs/${pair.id}`}
              className="flex min-w-0 flex-1 items-center gap-4"
            >
              <Avatar className="h-12 w-12 ring-2 ring-strivo-teal/25">
                {pair.partner.profilePicUrl && (
                  <AvatarImage
                    src={pair.partner.profilePicUrl}
                    alt={pair.partner.name ?? ""}
                  />
                )}
                <AvatarFallback>{getInitials(pair.partner.name)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-strivo-text">
                    {pair.partner.name ?? "Partner"}
                  </p>
                  {pair.isProvisional && (
                    <Badge variant="teal" className="text-xs">
                      New connection
                    </Badge>
                  )}
                  {pair.pendingCheckin && !pair.isProvisional && (
                    <Badge variant="accent" className="text-xs">
                      Check-in pending
                    </Badge>
                  )}
                </div>
                <p className="truncate text-sm text-strivo-secondary">
                  {pair.lastMessagePreview ??
                    (pair.partner.goal
                      ? formatStudyGoal(pair.partner.goal as never)
                      : "Start studying together")}
                </p>
                <p className="text-xs text-strivo-secondary">
                  {formatRelativeTime(new Date(pair.lastActivity))}
                </p>
              </div>
            </Link>

            {pair.streak > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-strivo-yellow/30 px-3 py-1.5 text-sm font-bold text-primary">
                <span aria-hidden>🔥</span>
                {pair.streak}
              </div>
            )}
            <Link
              href={`/chat/${pair.id}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white transition-colors hover:bg-strivo-teal/10"
            >
              <MessageCircle className="h-4 w-4 text-strivo-teal" />
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
