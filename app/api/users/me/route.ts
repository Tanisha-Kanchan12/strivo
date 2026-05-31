import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getDbUserFromClerk,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { recordReferral } from "@/lib/referrals";
import { syncUserFromClerk } from "@/lib/user";

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return unauthorizedResponse();
    }

    let user = await getDbUserFromClerk();

    if (!user) {
      user = await syncUserFromClerk({
        id: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        emailAddresses: clerkUser.emailAddresses.map((e) => ({
          emailAddress: e.emailAddress,
        })),
        phoneNumbers: clerkUser.phoneNumbers.map((p) => ({
          phoneNumber: p.phoneNumber,
        })),
      });

      const cookieStore = await cookies();
      const ref = cookieStore.get("strivo_ref")?.value;
      if (ref) {
        await recordReferral(ref, user.id).catch(() => undefined);
        cookieStore.delete("strivo_ref");
      }
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

export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return unauthorizedResponse();
    }

    const user = await syncUserFromClerk({
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      emailAddresses: clerkUser.emailAddresses.map((e) => ({
        emailAddress: e.emailAddress,
      })),
      phoneNumbers: clerkUser.phoneNumbers.map((p) => ({
        phoneNumber: p.phoneNumber,
      })),
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("POST /api/users/sync error:", error);
    return serverErrorResponse();
  }
}

export async function DELETE() {
  try {
    const { clerkUser, user } = await requireDbUser();

    await prisma.user.delete({ where: { id: user.id } });

    const client = await clerkClient();
    const clerkId = clerkUser?.id ?? user.clerkId;
    await client.users.deleteUser(clerkId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("DELETE /api/users/me error:", error);
    return serverErrorResponse();
  }
}
