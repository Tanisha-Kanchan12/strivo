import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await requireDbUser();

    const [sent, received] = await Promise.all([
      prisma.mentorSessionRequest.findMany({
        where: { studentId: user.id },
        include: {
          mentor: { include: { profile: true, mentorProfile: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.mentorSessionRequest.findMany({
        where: { mentorId: user.id },
        include: {
          student: { include: { profile: true, onboarding: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ sent, received });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/mentors/requests error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const mentorId = String(body.mentorId ?? "");
    const message = body.message ? String(body.message).trim().slice(0, 500) : null;

    if (!mentorId) return badRequestResponse("Mentor is required");
    if (mentorId === user.id) return badRequestResponse("Cannot request yourself");

    const mentor = await prisma.mentorProfile.findFirst({
      where: { userId: mentorId, isMentor: true },
      include: { user: true },
    });
    if (!mentor) {
      return badRequestResponse("User is not a mentor");
    }

    const existing = await prisma.mentorSessionRequest.findFirst({
      where: {
        studentId: user.id,
        mentorId,
        status: "PENDING",
      },
    });
    if (existing) {
      return badRequestResponse("Request already pending");
    }

    const req = await prisma.mentorSessionRequest.create({
      data: { studentId: user.id, mentorId, message },
    });

    await createNotification({
      userId: mentorId,
      type: "MENTOR_REQUEST",
      content: `${user.name ?? "A student"} sent you a mentor session request`,
      data: { requestId: req.id, studentId: user.id },
    });

    return NextResponse.json({ request: { id: req.id } });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/mentors/requests error:", error);
    return serverErrorResponse();
  }
}
