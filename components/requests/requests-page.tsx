"use client";

import { formatDistanceToNow } from "date-fns";
import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatStudyGoal } from "@/lib/constants/onboarding";
import type { StudyGoal } from "@prisma/client";
import { getInitials } from "@/lib/utils";

interface RequestUser {
  id: string;
  name: string | null;
  profile: {
    city: string | null;
    college: string | null;
    profilePicUrl: string | null;
  } | null;
  onboarding: { goal: StudyGoal | null; field: string | null } | null;
}

interface PairRequestRow {
  id: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  sender?: RequestUser;
  receiver?: RequestUser;
}

function statusBadge(status: string) {
  const map: Record<string, "default" | "secondary" | "outline" | "teal"> = {
    PENDING: "teal",
    ACCEPTED: "default",
    DECLINED: "secondary",
    EXPIRED: "outline",
  };
  return (
    <Badge variant={map[status] ?? "outline"} className="capitalize">
      {status.toLowerCase()}
    </Badge>
  );
}

export function RequestsPage() {
  const router = useRouter();
  const [sent, setSent] = useState<PairRequestRow[]>([]);
  const [received, setReceived] = useState<PairRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sentRes, receivedRes] = await Promise.all([
        fetch("/api/pair-requests?tab=sent"),
        fetch("/api/pair-requests?tab=received"),
      ]);
      const sentData = await sentRes.json();
      const receivedData = await receivedRes.json();
      setSent(sentData.sent ?? []);
      setReceived(receivedData.received ?? []);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAccept(id: string) {
    setActingId(id);
    try {
      const res = await fetch(`/api/pair-requests/${id}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Connected!");
      router.push(`/chat/${data.pairId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to accept");
    } finally {
      setActingId(null);
    }
  }

  async function handleDecline(id: string) {
    setActingId(id);
    try {
      const res = await fetch(`/api/pair-requests/${id}/decline`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      await load();
    } catch {
      toast.error("Failed to decline");
    } finally {
      setActingId(null);
    }
  }

  function renderUser(user: RequestUser) {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {user.profile?.profilePicUrl && (
            <AvatarImage src={user.profile.profilePicUrl} alt={user.name ?? ""} />
          )}
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-strivo-text">{user.name ?? "Student"}</p>
          <p className="text-xs text-strivo-secondary">
            {user.onboarding?.goal
              ? formatStudyGoal(user.onboarding.goal)
              : user.profile?.college ?? user.profile?.city ?? ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-strivo-text">
          Requests
        </h1>
        <p className="mt-1 text-sm text-strivo-secondary">
          Track connection requests you sent and received
        </p>
      </div>

      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-strivo-secondary" />
          </div>
        ) : (
          <>
            <TabsContent value="sent" className="space-y-3">
              {sent.length === 0 ? (
                <p className="py-8 text-center text-sm text-strivo-secondary">
                  No sent requests yet.
                </p>
              ) : (
                sent.map((req) => {
                  const user = req.receiver!;
                  const expiresIn =
                    req.status === "PENDING"
                      ? formatDistanceToNow(new Date(req.expiresAt), {
                          addSuffix: true,
                        })
                      : null;
                  return (
                    <Card key={req.id}>
                      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        {renderUser(user)}
                        <div className="flex flex-col items-end gap-1">
                          {statusBadge(req.status)}
                          {expiresIn && (
                            <span className="text-xs text-strivo-secondary">
                              Expires {expiresIn}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="received" className="space-y-3">
              {received.length === 0 ? (
                <p className="py-8 text-center text-sm text-strivo-secondary">
                  No received requests.
                </p>
              ) : (
                received.map((req) => {
                  const user = req.sender!;
                  const isPending = req.status === "PENDING";
                  return (
                    <Card key={req.id}>
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-center justify-between gap-3">
                          {renderUser(user)}
                          {statusBadge(req.status)}
                        </div>
                        {isPending && (
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              onClick={() => handleAccept(req.id)}
                              disabled={actingId === req.id}
                            >
                              {actingId === req.id ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <>
                                  <Check className="mr-1 h-4 w-4" />
                                  Accept
                                </>
                              )}
                            </Button>
                            <Button
                              variant="secondary"
                              className="flex-1"
                              onClick={() => handleDecline(req.id)}
                              disabled={actingId === req.id}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
