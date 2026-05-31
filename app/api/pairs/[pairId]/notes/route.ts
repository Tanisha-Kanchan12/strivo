import { NextResponse } from "next/server";
import { z } from "zod";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { verifyPairMembership } from "@/lib/chat";
import prisma from "@/lib/prisma";

const notesSchema = z.object({
  content: z.string().max(50000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pairId: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { pairId } = await params;
    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) return unauthorizedResponse();

    const note = await prisma.pairNote.findUnique({
      where: { pairId },
      include: {
        lastEditedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      note: note ?? {
        content: "",
        lastEditedBy: null,
        updatedAt: null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/pairs/[pairId]/notes error:", error);
    return serverErrorResponse();
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pairId: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { pairId } = await params;
    const membership = await verifyPairMembership(user.id, pairId);
    if (!membership) return unauthorizedResponse();

    const body = await request.json();
    const parsed = notesSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse("Invalid notes");

    const note = await prisma.pairNote.upsert({
      where: { pairId },
      create: {
        pairId,
        content: parsed.data.content,
        lastEditedById: user.id,
      },
      update: {
        content: parsed.data.content,
        lastEditedById: user.id,
      },
      include: {
        lastEditedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/pairs/[pairId]/notes error:", error);
    return serverErrorResponse();
  }
}
