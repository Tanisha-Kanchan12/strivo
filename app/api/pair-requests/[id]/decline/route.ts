import { NextResponse } from "next/server";
import {
  badRequestResponse,
  notFoundResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id } = await params;

    const pairRequest = await prisma.pairRequest.findUnique({ where: { id } });

    if (!pairRequest) return notFoundResponse("Request not found");
    if (pairRequest.receiverId !== user.id) return unauthorizedResponse();
    if (pairRequest.status !== "PENDING") {
      return badRequestResponse("Request is no longer pending");
    }

    await prisma.pairRequest.update({
      where: { id },
      data: { status: "DECLINED" },
    });

    return NextResponse.json({ success: true, status: "declined" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/pair-requests/[id]/decline error:", error);
    return serverErrorResponse();
  }
}
