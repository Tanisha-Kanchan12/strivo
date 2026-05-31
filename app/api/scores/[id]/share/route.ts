import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id } = await params;
    const body = await request.json();

    const log = await prisma.scoreLog.findFirst({
      where: { id, userId: user.id },
    });
    if (!log) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.scoreLog.update({
      where: { id },
      data: { sharedWithPair: Boolean(body.sharedWithPair) },
    });

    return NextResponse.json({ score: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/scores/[id]/share error:", error);
    return serverErrorResponse();
  }
}
