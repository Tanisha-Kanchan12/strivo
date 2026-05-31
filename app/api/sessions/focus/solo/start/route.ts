import { NextResponse } from "next/server";
import { z } from "zod";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

const startSchema = z.object({
  durationMinutes: z.union([z.literal(25), z.literal(45), z.literal(60)]),
});

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = startSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse("Invalid session");

    const active = await prisma.focusSession.findFirst({
      where: {
        user1Id: user.id,
        user2Id: null,
        endedAt: null,
      },
    });

    if (active) {
      return NextResponse.json({ session: active, existing: true });
    }

    const session = await prisma.focusSession.create({
      data: {
        pairId: null,
        user1Id: user.id,
        user2Id: null,
      },
    });

    const { durationMinutes } = parsed.data;
    return NextResponse.json({
      session,
      durationMinutes,
      durationSeconds: durationMinutes * 60,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/sessions/focus/solo/start error:", error);
    return serverErrorResponse();
  }
}
