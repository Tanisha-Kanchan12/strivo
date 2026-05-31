import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { verifyPairMembership } from "@/lib/chat";
import { triggerFocusEvent } from "@/lib/pusher-server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const startSchema = z.object({
  pairId: z.string().min(1),
  durationMinutes: z.union([z.literal(25), z.literal(45), z.literal(60)]),
});

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse("Invalid session");

    const { pairId, durationMinutes } = parsed.data;
    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) return unauthorizedResponse();

    const active = await prisma.focusSession.findFirst({
      where: {
        pairId,
        endedAt: null,
      },
    });

    if (active) {
      return NextResponse.json({ session: active, existing: true });
    }

    const session = await prisma.focusSession.create({
      data: {
        pairId,
        user1Id: membership.pair.user1Id,
        user2Id: membership.pair.user2Id,
      },
    });

    return NextResponse.json({
      session,
      durationMinutes,
      durationSeconds: durationMinutes * 60,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/sessions/focus/start error:", error);
    return serverErrorResponse();
  }
}
