import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getDbUser,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { recordReferral } from "@/lib/referrals";

export async function GET() {
  try {
    let user = await getDbUser();

    if (!user) {
      return unauthorizedResponse();
    }

    const cookieStore = await cookies();
    const ref = cookieStore.get("strivo_ref")?.value;
    if (ref) {
      await recordReferral(ref, user.id).catch(() => undefined);
      cookieStore.delete("strivo_ref");
    }

    return NextResponse.json({
      user: {
        id: user.id,
        clerkId: user.clerkId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profile: user.profile,
        onboarding: user.onboarding,
        settings: user.settings,
        individualStreak: user.individualStreak,
        onboardingComplete: Boolean(user.onboarding?.completedAt),
      },
    });
  } catch (error) {
    console.error("GET /api/users/me error:", error);
    return serverErrorResponse();
  }
}

export async function DELETE() {
  try {
    const { user } = await requireDbUser();

    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("DELETE /api/users/me error:", error);
    return serverErrorResponse();
  }
}
