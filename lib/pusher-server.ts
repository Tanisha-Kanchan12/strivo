import Pusher from "pusher";

let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (pusherServer) return pusherServer;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    return null;
  }

  pusherServer = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusherServer;
}

export async function triggerChatEvent(
  pairId: string,
  event: string,
  data: Record<string, unknown>
) {
  const pusher = getPusherServer();
  if (!pusher) return;
  await pusher.trigger(`private-chat-${pairId}`, event, data);
}

export async function triggerNotificationEvent(
  userId: string,
  data: Record<string, unknown>
) {
  const pusher = getPusherServer();
  if (!pusher) return;
  await pusher.trigger(`private-notifications-${userId}`, "new-notification", data);
}

export async function triggerFocusEvent(
  pairId: string,
  event: string,
  data: Record<string, unknown>
) {
  const pusher = getPusherServer();
  if (!pusher) return;
  await pusher.trigger(`private-focus-${pairId}`, event, data);
}

export function chatChannelName(pairId: string) {
  return `private-chat-${pairId}`;
}

export function focusChannelName(pairId: string) {
  return `private-focus-${pairId}`;
}

export function notificationsChannelName(userId: string) {
  return `private-notifications-${userId}`;
}

export const LIVE_NOW_CHANNEL = "live-now";

export async function triggerLiveNowPoolEvent(
  event: string,
  data: Record<string, unknown>
) {
  const pusher = getPusherServer();
  if (!pusher) return;
  await pusher.trigger(LIVE_NOW_CHANNEL, event, data);
}
