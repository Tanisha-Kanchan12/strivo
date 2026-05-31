import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { verifyPairMembership } from "@/lib/chat";
import { generateMeetLink } from "@/lib/meet";
import { createNotification } from "@/lib/notifications";
import { awardBadgeIfMissing } from "@/lib/badges";
import prisma from "@/lib/prisma";
import { scheduleSessionSchema } from "@/lib/validations/sessions";
import { BadgeType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { user } = await requireDbUser();
    const pairId = new URL(request.url).searchParams.get("pairId");
    if (!pairId) return badRequestResponse("pairId required");

    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) return unauthorizedResponse();

    const upcoming = await prisma.sessionSchedule.findFirst({
      where: {
        pairId,
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({ session: upcoming });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/sessions/schedule error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = scheduleSessionSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.errors[0]?.message ?? "Invalid");
    }

    const { pairId, scheduledAt, durationMinutes, platform, location } = parsed.data;
    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) return unauthorizedResponse();

    let meetLink: string | null = null;
    if (platform === "GOOGLE_MEET") {
      meetLink = generateMeetLink();
    }

    if (platform === "IN_PERSON") {
      const userCity = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { city: true },
      });
      const partnerCity = await prisma.profile.findUnique({
        where: { userId: membership.partner.id },
        select: { city: true },
      });
      if (
        !userCity?.city ||
        !partnerCity?.city ||
        userCity.city.toLowerCase() !== partnerCity.city.toLowerCase()
      ) {
        return badRequestResponse(
          "In-person sessions require both users to be in the same city"
        );
      }
    }

    const session = await prisma.sessionSchedule.create({
      data: {
        pairId,
        scheduledAt: new Date(scheduledAt),
        durationMinutes,
        platform,
        meetLink,
        location: platform === "IN_PERSON" ? location?.trim() || null : null,
      },
    });

    const scheduleCount = await prisma.sessionSchedule.count({
      where: { pairId },
    });
    if (scheduleCount >= 10) {
      await awardBadgeIfMissing(user.id, BadgeType.PLANNER);
    }

    const when = new Date(scheduledAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const meetText = meetLink ? ` Join here: ${meetLink}` : "";
    const chatMessage = `📅 Session scheduled for ${when}.${meetText}`;

    await prisma.message.create({
      data: {
        pairId,
        senderId: user.id,
        receiverId: membership.partner.id,
        content: chatMessage,
      },
    });

    for (const uid of [user.id, membership.partner.id]) {
      await createNotification({
        userId: uid,
        type: "SESSION_REMINDER",
        content: `Study session scheduled for ${when}${meetText}`,
        data: {
          pairId,
          sessionId: session.id,
          scheduledAt,
          meetLink,
        },
      });
    }

    return NextResponse.json({
      session,
      icsUrl: `/api/sessions/schedule/${session.id}/ics`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/sessions/schedule error:", error);
    return serverErrorResponse();
  }
}
