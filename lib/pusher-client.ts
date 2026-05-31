"use client";

import PusherClient from "pusher-js";

let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) return null;

  if (!pusherClient) {
    pusherClient = new PusherClient(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
    });
  }

  return pusherClient;
}

export function focusChannelName(pairId: string) {
  return `private-focus-${pairId}`;
}

export function chatChannelName(pairId: string) {
  return `private-chat-${pairId}`;
}

export function notificationsChannelName(userId: string) {
  return `private-notifications-${userId}`;
}

export const LIVE_NOW_CHANNEL = "live-now";
