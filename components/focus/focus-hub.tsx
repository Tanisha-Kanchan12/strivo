"use client";

import { Loader2, User, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";

interface PairOption {
  id: string;
  partner: {
    id: string;
    name: string | null;
    profilePicUrl: string | null;
  };
}

export function FocusHub() {
  const [pairs, setPairs] = useState<PairOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pairs")
      .then((r) => r.json())
      .then((data) => setPairs(data.pairs ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-strivo-text">
          Focus Room
        </h1>
        <p className="mt-1 text-sm text-strivo-secondary">
          Deep work with a partner or on your own
        </p>
      </div>

      <Card className="surface-card-hover">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-strivo-muted">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-strivo-text">Solo Focus</h2>
              <p className="text-sm text-strivo-secondary">
                Study alone. Sessions count toward your streak.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/focus/solo">Start Solo</Link>
          </Button>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-strivo-text">
          <Users className="h-5 w-5 text-primary" />
          Study with Partner
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-strivo-secondary" />
          </div>
        ) : pairs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-strivo-secondary">
              Connect with a study partner first from Discover.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {pairs.map((pair) => (
              <Card key={pair.id} className="surface-card-hover">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {pair.partner.profilePicUrl && (
                        <AvatarImage
                          src={pair.partner.profilePicUrl}
                          alt={pair.partner.name ?? ""}
                        />
                      )}
                      <AvatarFallback>
                        {getInitials(pair.partner.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-strivo-text">
                      {pair.partner.name ?? "Partner"}
                    </span>
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/focus/${pair.id}`}>Enter</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
