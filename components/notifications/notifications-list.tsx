"use client";

import type { NotificationType } from "@prisma/client";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import { useNotificationsStore } from "@/store/notifications-store";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: NotificationType;
  content: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_LABELS: Partial<Record<NotificationType, string>> = {
  STREAK_UPDATE: "Streak",
  SESSION_REMINDER: "Session",
  NEW_MATCH: "Connect",
  CONNECT_ACCEPTED: "Connected",
  CONNECT_EXPIRED: "Expired",
  SHIELD_USED: "Shield",
  NEW_MESSAGE: "Message",
  STUDYING_NOW_PROMPT: "Study check",
  INDIVIDUAL_STREAK_MILESTONE: "Milestone",
  AI_NUDGE: "Nudge",
};

export function NotificationsList() {
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    if (res.ok) {
      setNotifications(data.notifications);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        await fetch("/api/notifications", { method: "PATCH" });
        setUnreadCount(0);
        await loadNotifications();
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [loadNotifications, setUnreadCount]);

  function getNotificationLink(n: NotificationItem): string | null {
    const data = n.data ?? {};
    if (n.type === "NEW_MESSAGE" && data.pairId) {
      return `/chat/${data.pairId as string}`;
    }
    if (n.type === "CONNECT_ACCEPTED" && data.pairId) {
      return `/pairs/${data.pairId as string}`;
    }
    if (n.type === "NEW_MATCH" && data.senderId) {
      return `/home`;
    }
    return null;
  }

  async function handleStudyingNowRespond(
    notification: NotificationItem,
    response: boolean
  ) {
    const data = notification.data ?? {};
    const pairId = data.pairId as string | undefined;
    if (!pairId) return;

    setRespondingId(notification.id);
    try {
      const res = await fetch("/api/studying-now/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationId: notification.id,
          pairId,
          response,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
      toast.success(response ? "Marked as studying!" : "Got it");
    } catch {
      toast.error("Could not save response");
    } finally {
      setRespondingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-strivo-secondary" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-strivo-secondary">
          No notifications yet
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => {
        const link = getNotificationLink(n);
        const isStudyingNow = n.type === "STUDYING_NOW_PROMPT" && !n.isRead;

        return (
          <Card
            key={n.id}
            className={cn(
              "transition-colors",
              !n.isRead && "bg-strivo-muted shadow-soft"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-strivo-secondary">
                      {TYPE_LABELS[n.type] ?? n.type}
                    </span>
                    <span className="text-xs text-strivo-secondary">
                      {formatRelativeTime(new Date(n.createdAt))}
                    </span>
                  </div>
                  {link ? (
                    <Link
                      href={link}
                      className="mt-1 block text-sm hover:text-strivo-secondary"
                    >
                      {n.content}
                    </Link>
                  ) : (
                    <p className="mt-1 text-sm">{n.content}</p>
                  )}
                </div>
              </div>

              {isStudyingNow && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={respondingId === n.id}
                    onClick={() => handleStudyingNowRespond(n, false)}
                  >
                    No
                  </Button>
                  <Button
                    size="sm"
                    disabled={respondingId === n.id}
                    onClick={() => handleStudyingNowRespond(n, true)}
                  >
                    {respondingId === n.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Yes, studying!"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
