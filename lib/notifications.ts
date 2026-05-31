import { Prisma, type NotificationType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { triggerNotificationEvent } from "@/lib/pusher-server";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  content: string;
  data?: Record<string, unknown>;
}

const SETTING_KEY_MAP: Partial<Record<NotificationType, keyof {
  notifyStreakUpdates: boolean;
  notifySessionReminders: boolean;
  notifyNewMatches: boolean;
  notifyConnectAccepted: boolean;
  notifyConnectExpired: boolean;
  notifyShieldUsed: boolean;
  notifyNewMessages: boolean;
  notifyStudyingNow: boolean;
  notifyStreakMilestones: boolean;
  notifyAiNudge: boolean;
}>> = {
  STREAK_UPDATE: "notifyStreakUpdates",
  SESSION_REMINDER: "notifySessionReminders",
  NEW_MATCH: "notifyNewMatches",
  CONNECT_ACCEPTED: "notifyConnectAccepted",
  CONNECT_EXPIRED: "notifyConnectExpired",
  SHIELD_USED: "notifyShieldUsed",
  NEW_MESSAGE: "notifyNewMessages",
  STUDYING_NOW_PROMPT: "notifyStudyingNow",
  INDIVIDUAL_STREAK_MILESTONE: "notifyStreakMilestones",
  AI_NUDGE: "notifyAiNudge",
};

async function shouldNotify(userId: string, type: NotificationType) {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) return true;

  const key = SETTING_KEY_MAP[type];
  if (!key) return true;

  return settings[key];
}

export async function createNotification(input: CreateNotificationInput) {
  const allowed = await shouldNotify(input.userId, input.type);
  if (!allowed) return null;

  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      content: input.content,
      ...(input.data != null
        ? { data: input.data as Prisma.InputJsonValue }
        : {}),
    },
  });

  await triggerNotificationEvent(input.userId, {
    id: notification.id,
    type: notification.type,
    content: notification.content,
    data: notification.data,
    createdAt: notification.createdAt.toISOString(),
  });

  return notification;
}

export async function createNotifications(inputs: CreateNotificationInput[]) {
  const results = [];
  for (const input of inputs) {
    const result = await createNotification(input);
    if (result) results.push(result);
  }
  return results;
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}
