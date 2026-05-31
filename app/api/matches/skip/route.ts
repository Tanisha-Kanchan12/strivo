import { NextResponse } from "next/server";
import { z } from "zod";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

const skipSchema = z.object({
  matchedUserId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = skipSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse("Invalid request");
    }

    const { matchedUserId } = parsed.data;

    if (matchedUserId === user.id) {
      return badRequestResponse("Cannot skip yourself");
    }

    await prisma.match.upsert({
      where: {
        userId_matchedUserId: { userId: user.id, matchedUserId },
      },
      create: {
        userId: user.id,
        matchedUserId,
        matchScore: 0,
        status: "SKIPPED",
      },
      update: { status: "SKIPPED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/matches/skip error:", error);
    return serverErrorResponse();
  }
}
