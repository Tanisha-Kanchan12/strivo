import type { LiveNowTopic, PairSource } from "@prisma/client";
import prisma from "@/lib/prisma";
import { LIVE_NOW_DURATION_MS } from "@/lib/constants/live-now";
import { triggerLiveNowPoolEvent } from "@/lib/pusher-server";
import { createConnectedPair } from "@/lib/matching";

export async function getActiveLiveSession(userId: string) {
  return prisma.liveNowSession.findFirst({
    where: {
      userId,
      isActive: true,
      autoExpiresAt: { gt: new Date() },
    },
  });
}

export async function startLiveNowSession(userId: string, topic: LiveNowTopic) {
  await prisma.liveNowSession.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });

  const autoExpiresAt = new Date(Date.now() + LIVE_NOW_DURATION_MS);

  const session = await prisma.liveNowSession.create({
    data: {
      userId,
      topic,
      autoExpiresAt,
      isActive: true,
    },
  });

  await triggerLiveNowPoolEvent("pool-updated", { userId, action: "joined" });
  return session;
}

export async function stopLiveNowSession(userId: string) {
  await prisma.liveNowSession.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });
  await triggerLiveNowPoolEvent("pool-updated", { userId, action: "left" });
}

export async function expireLiveNowSessions() {
  const expired = await prisma.liveNowSession.findMany({
    where: {
      isActive: true,
      autoExpiresAt: { lt: new Date() },
    },
    select: { userId: true },
  });

  if (expired.length === 0) return 0;

  await prisma.liveNowSession.updateMany({
    where: {
      isActive: true,
      autoExpiresAt: { lt: new Date() },
    },
    data: { isActive: false },
  });

  await triggerLiveNowPoolEvent("pool-updated", { action: "expired" });
  return expired.length;
}

export async function getLiveNowPool(
  viewerId: string,
  topic?: LiveNowTopic | null
) {
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: viewerId }, { blockedId: viewerId }],
    },
    select: { blockerId: true, blockedId: true },
  });

  const blockedIds = new Set<string>();
  blocks.forEach((b) => {
    if (b.blockerId === viewerId) blockedIds.add(b.blockedId);
    else blockedIds.add(b.blockerId);
  });

  const sessions = await prisma.liveNowSession.findMany({
    where: {
      isActive: true,
      autoExpiresAt: { gt: new Date() },
      userId: { not: viewerId, notIn: Array.from(blockedIds) },
      ...(topic ? { topic } : {}),
      user: {
        onboarding: { completedAt: { not: null } },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profile: {
            select: {
              city: true,
              college: true,
              stream: true,
              profilePicUrl: true,
            },
          },
          onboarding: { select: { goal: true, field: true } },
        },
      },
    },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  return sessions.map((s) => ({
    sessionId: s.id,
    userId: s.user.id,
    name: s.user.name,
    topic: s.topic,
    city: s.user.profile?.city ?? null,
    college: s.user.profile?.college ?? null,
    stream: s.user.profile?.stream ?? s.user.onboarding?.field ?? null,
    profilePicUrl: s.user.profile?.profilePicUrl ?? null,
    goal: s.user.onboarding?.goal ?? null,
    startedAt: s.startedAt.toISOString(),
    expiresAt: s.autoExpiresAt.toISOString(),
  }));
}

async function findExistingPair(user1Id: string, user2Id: string) {
  const [sorted1, sorted2] = [user1Id, user2Id].sort();
  return prisma.connectedPair.findFirst({
    where: {
      OR: [
        { user1Id: sorted1, user2Id: sorted2 },
        { user1Id: sorted2, user2Id: sorted1 },
      ],
    },
  });
}

export async function startLiveNowChat(initiatorId: string, targetUserId: string) {
  if (initiatorId === targetUserId) {
    throw new Error("Cannot chat with yourself");
  }

  const targetSession = await prisma.liveNowSession.findFirst({
    where: {
      userId: targetUserId,
      isActive: true,
      autoExpiresAt: { gt: new Date() },
    },
  });

  if (!targetSession) {
    throw new Error("User is no longer live");
  }

  const existing = await findExistingPair(initiatorId, targetUserId);
  if (existing) {
    return { pairId: existing.id, isProvisional: existing.isProvisional };
  }

  const pair = await createConnectedPair(initiatorId, targetUserId, {
    source: "LIVE_NOW" as PairSource,
    isProvisional: true,
    withStreak: false,
  });

  return { pairId: pair.id, isProvisional: true };
}

export async function makePairPermanent(pairId: string, userId: string) {
  const pair = await prisma.connectedPair.findUnique({ where: { id: pairId } });
  if (!pair || (pair.user1Id !== userId && pair.user2Id !== userId)) {
    throw new Error("Pair not found");
  }

  if (!pair.isProvisional) return pair;

  const updated = await prisma.connectedPair.update({
    where: { id: pairId },
    data: { isProvisional: false },
  });

  const streak = await prisma.pairStreak.findUnique({ where: { pairId } });
  if (!streak) {
    await prisma.pairStreak.create({
      data: { pairId, shieldsRemaining: 2 },
    });
  }

  return updated;
}

export async function dismissProvisionalPair(pairId: string, userId: string) {
  const pair = await prisma.connectedPair.findUnique({ where: { id: pairId } });
  if (!pair || (pair.user1Id !== userId && pair.user2Id !== userId)) {
    throw new Error("Pair not found");
  }
  if (!pair.isProvisional) return;

  await prisma.connectedPair.delete({ where: { id: pairId } });
}
