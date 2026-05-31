"use client";

import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatStudyGoal } from "@/lib/constants/onboarding";
import { getInitials } from "@/lib/utils";

interface IncomingRequest {
  id: string;
  sender: {
    id: string;
    name: string | null;
    profile: { city: string | null; college: string | null; profilePicUrl: string | null } | null;
    onboarding: { goal: string | null } | null;
  };
  expiresAt: string;
}

export function IncomingRequestsBanner() {
  const router = useRouter();
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pair-requests")
      .then((r) => r.json())
      .then((data) => setRequests(data.incoming ?? []))
      .catch(() => {});
  }, []);

  if (requests.length === 0) return null;

  async function handleAccept(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/pair-requests/${id}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast.success("You're connected!");
      router.push(`/pairs/${data.pairId}`);
      router.refresh();
    } catch {
      toast.error("Could not accept request");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDecline(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/pair-requests/${id}/decline`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Could not decline request");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Card className="bg-strivo-coral/10 shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {requests.length} connect request{requests.length > 1 ? "s" : ""} waiting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.slice(0, 3).map((req) => (
          <div
            key={req.id}
            className="flex items-center gap-3 rounded-2xl bg-strivo-muted p-3"
          >
            <Avatar className="h-10 w-10">
              {req.sender.profile?.profilePicUrl && (
                <AvatarImage
                  src={req.sender.profile.profilePicUrl}
                  alt={req.sender.name ?? ""}
                />
              )}
              <AvatarFallback>{getInitials(req.sender.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {req.sender.name ?? "Student"}
              </p>
              <p className="text-xs text-strivo-secondary">
                {req.sender.onboarding?.goal
                  ? formatStudyGoal(req.sender.onboarding.goal as never)
                  : "Wants to study with you"}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => handleDecline(req.id)}
                disabled={loadingId === req.id}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8"
                onClick={() => handleAccept(req.id)}
                disabled={loadingId === req.id}
              >
                {loadingId === req.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
