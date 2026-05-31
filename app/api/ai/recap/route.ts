import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { getLatestMonthlyRecap } from "@/lib/ai/monthly-recap";

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const recap = await getLatestMonthlyRecap(user.id);
    return NextResponse.json({ recap });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/ai/recap error:", error);
    return serverErrorResponse();
  }
}
