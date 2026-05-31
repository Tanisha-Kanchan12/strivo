import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { verifyPairMembership } from "@/lib/chat";
import { startOfDayUTC } from "@/lib/streak";
import prisma from "@/lib/prisma";
import { createTargetSchema } from "@/lib/validations/sessions";

export async function GET(request: Request) {
  try {
    const { user } = await requireDbUser();
    const pairId = new URL(request.url).searchParams.get("pairId");
    if (!pairId) return badRequestResponse("pairId required");

    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) return unauthorizedResponse();

    const today = startOfDayUTC();
    const targets = await prisma.dailyTarget.findMany({
      where: { pairId, date: today },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ targets, today: today.toISOString() });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/targets error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = createTargetSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.errors[0]?.message ?? "Invalid");
    }

    const { pairId, task } = parsed.data;
    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) return unauthorizedResponse();

    const target = await prisma.dailyTarget.create({
      data: {
        pairId,
        userId: user.id,
        task: task.trim(),
        date: startOfDayUTC(),
      },
    });

    return NextResponse.json({ target });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/targets error:", error);
    return serverErrorResponse();
  }
}
