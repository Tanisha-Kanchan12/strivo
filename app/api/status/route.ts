import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { availabilityStatusSchema } from "@/lib/validations/status";

function startOfTodayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  try {
    const { user } = await requireDbUser();
    let availability = await prisma.userAvailability.findUnique({
      where: { userId: user.id },
    });

    const todayStart = startOfTodayUTC();
    if (availability && availability.updatedAt < todayStart) {
      availability = await prisma.userAvailability.update({
        where: { userId: user.id },
        data: { status: "AVAILABLE", availableAt: null },
      });
    }

    return NextResponse.json({
      availability: availability ?? {
        status: "AVAILABLE",
        availableAt: null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/status error:", error);
    return serverErrorResponse();
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = availabilityStatusSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(parsed.error.errors[0]?.message ?? "Invalid status");
    }

    if (parsed.data.status === "AVAILABLE_AT" && !parsed.data.availableAt) {
      return badRequestResponse("availableAt required for AVAILABLE_AT status");
    }

    const availability = await prisma.userAvailability.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: parsed.data.status,
        availableAt: parsed.data.availableAt
          ? new Date(parsed.data.availableAt)
          : null,
      },
      update: {
        status: parsed.data.status,
        availableAt: parsed.data.availableAt
          ? new Date(parsed.data.availableAt)
          : null,
      },
    });

    return NextResponse.json({ availability });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/status error:", error);
    return serverErrorResponse();
  }
}
