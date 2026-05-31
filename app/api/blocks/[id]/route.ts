import { NextResponse } from "next/server";
import {
  notFoundResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id } = await params;

    const block = await prisma.block.findFirst({
      where: { id, blockerId: user.id },
    });

    if (!block) {
      return notFoundResponse("Block not found");
    }

    await prisma.block.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("DELETE /api/blocks/[id] error:", error);
    return serverErrorResponse();
  }
}
