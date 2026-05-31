import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await requireDbUser();

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const pairs = await prisma.connectedPair.findMany({
      where: {
        OR: [{ user1Id: user.id }, { user2Id: user.id }],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            profile: { select: { city: true, profilePicUrl: true } },
            onboarding: { select: { goal: true } },
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            profile: { select: { city: true, profilePicUrl: true } },
            onboarding: { select: { goal: true } },
          },
        },
        pairStreak: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, content: true },
        },
        checkins: {
          where: {
            userId: user.id,
            date: today,
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = pairs.map((pair) => {
      const partner = pair.user1Id === user.id ? pair.user2 : pair.user1;
      const lastMessage = pair.messages[0];
      const todayCheckin = pair.checkins[0];

      return {
        id: pair.id,
        isProvisional: pair.isProvisional,
        source: pair.source,
        partner: {
          id: partner.id,
          name: partner.name,
          city: partner.profile?.city,
          profilePicUrl: partner.profile?.profilePicUrl,
          goal: partner.onboarding?.goal,
        },
        streak: pair.pairStreak?.currentStreak ?? 0,
        lastActivity: lastMessage?.createdAt ?? pair.createdAt,
        lastMessagePreview: lastMessage?.content,
        pendingCheckin: !todayCheckin,
        createdAt: pair.createdAt,
      };
    });

    formatted.sort(
      (a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    return NextResponse.json({ pairs: formatted });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/pairs error:", error);
    return serverErrorResponse();
  }
}
