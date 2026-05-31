import { NextResponse } from "next/server";
import {
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

    const topic = await prisma.syllabusTopic.findFirst({
      where: { id, userId: user.id },
    });
    if (!topic) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.syllabusTopic.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("DELETE /api/syllabus/[id] error:", error);
    return serverErrorResponse();
  }
}
