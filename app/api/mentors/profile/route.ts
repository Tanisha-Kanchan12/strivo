import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const profile = await prisma.mentorProfile.findUnique({
      where: { userId: user.id },
    });
    return NextResponse.json({ mentorProfile: profile });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/mentors/profile error:", error);
    return serverErrorResponse();
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const isMentor = Boolean(body.isMentor);
    const achievementBadge = body.achievementBadge
      ? String(body.achievementBadge).trim().slice(0, 120)
      : null;

    if (isMentor && !achievementBadge) {
      return badRequestResponse("Add an achievement badge to become a mentor");
    }

    const profile = await prisma.mentorProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        isMentor,
        achievementBadge: isMentor ? achievementBadge : null,
      },
      update: {
        isMentor,
        achievementBadge: isMentor ? achievementBadge : null,
      },
    });

    return NextResponse.json({ mentorProfile: profile });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/mentors/profile error:", error);
    return serverErrorResponse();
  }
}
