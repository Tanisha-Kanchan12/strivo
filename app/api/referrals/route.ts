import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const count = await prisma.referral.count({
      where: { referrerId: user.id, completedOnboarding: true },
    });
    return NextResponse.json({ count });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/referrals error:", error);
    return serverErrorResponse();
  }
}
