import { NextResponse } from "next/server";
import {
  notFoundResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { onQualifyingActivity } from "@/lib/streak";
import prisma from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id } = await params;

    const target = await prisma.dailyTarget.findUnique({ where: { id } });
    if (!target) return notFoundResponse("Target not found");
    if (target.userId !== user.id) return unauthorizedResponse();

    const updated = await prisma.dailyTarget.update({
      where: { id },
      data: { isComplete: true },
    });

    await onQualifyingActivity(target.pairId, user.id, "DAILY_TARGET");

    return NextResponse.json({ target: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/targets/[id]/complete error:", error);
    return serverErrorResponse();
  }
}
