"use client";

import { useEffect } from "react";
import {
  getPusherClient,
  notificationsChannelName,
} from "@/lib/pusher-client";
import { useNotificationsStore } from "@/store/notifications-store";

export function useNotificationsSubscription(userId: string | undefined) {
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);
  const incrementUnread = useNotificationsStore((s) => s.incrementUnread);

  useEffect(() => {
    if (!userId) return;

    fetch("/api/notifications/unread-count")
      .then((r) => r.json())
      .then((data) => setUnreadCount(data.count ?? 0))
      .catch(() => {});

    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(notificationsChannelName(userId));

    channel.bind("new-notification", () => {
      incrementUnread();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(notificationsChannelName(userId));
    };
  }, [userId, setUnreadCount, incrementUnread]);
}
