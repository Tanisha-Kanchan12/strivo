import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id } = await params;
    const body = await request.json();
    const status = body.status as "ACCEPTED" | "DECLINED";

    if (!["ACCEPTED", "DECLINED"].includes(status)) {
      return badRequestResponse("Invalid status");
    }

    const existing = await prisma.mentorSessionRequest.findUnique({
      where: { id },
    });
    if (!existing || existing.mentorId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.status !== "PENDING") {
      return badRequestResponse("Request already handled");
    }

    const updated = await prisma.mentorSessionRequest.update({
      where: { id },
      data: { status },
    });

    await createNotification({
      userId: existing.studentId,
      type: "MENTOR_REQUEST_RESPONSE",
      content:
        status === "ACCEPTED"
          ? "Your mentor session request was accepted!"
          : "Your mentor session request was declined.",
      data: { requestId: id, status },
    });

    return NextResponse.json({ request: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/mentors/requests/[id] error:", error);
    return serverErrorResponse();
  }
}
