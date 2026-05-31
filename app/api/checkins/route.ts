import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { verifyPairMembership } from "@/lib/chat";
import { startOfDayUTC } from "@/lib/streak";
import { onQualifyingActivity } from "@/lib/streak";
import prisma from "@/lib/prisma";
import { checkinSchema } from "@/lib/validations/sessions";

export async function GET(request: Request) {
  try {
    const { user } = await requireDbUser();
    const pairId = new URL(request.url).searchParams.get("pairId");
    if (!pairId) return badRequestResponse("pairId required");

    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) return unauthorizedResponse();

    const today = startOfDayUTC();
    const checkins = await prisma.checkin.findMany({
      where: { pairId, date: today },
    });

    return NextResponse.json({ checkins });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/checkins error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = checkinSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse("Invalid check-in");

    const { pairId, completed } = parsed.data;
    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) return unauthorizedResponse();

    const today = startOfDayUTC();
    const checkin = await prisma.checkin.upsert({
      where: {
        pairId_userId_date: { pairId, userId: user.id, date: today },
      },
      create: { pairId, userId: user.id, date: today, completed },
      update: { completed },
    });

    if (completed) {
      await onQualifyingActivity(pairId, user.id, "CHECKIN");
    }

    return NextResponse.json({ checkin });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/checkins error:", error);
    return serverErrorResponse();
  }
}
