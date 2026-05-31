import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { awardVerifiedStudentBadge } from "@/lib/badges";
import prisma from "@/lib/prisma";
import {
  settingsUpdateSchema,
  verifyStudentSchema,
} from "@/lib/validations/settings";

export async function GET() {
  try {
    const { user } = await requireDbUser();

    return NextResponse.json({
      settings: user.settings,
      profile: { visibility: user.profile?.visibility ?? "OPEN" },
      onboarding: { goal: user.onboarding?.goal ?? null },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/settings error:", error);
    return serverErrorResponse();
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();

    if (body.action === "verify-student") {
      const parsed = verifyStudentSchema.safeParse(body);
      if (!parsed.success) {
        return badRequestResponse(
          parsed.error.errors[0]?.message ?? "Invalid document"
        );
      }

      await prisma.profile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, isVerified: true },
        update: { isVerified: true },
      });

      await awardVerifiedStudentBadge(user.id);

      return NextResponse.json({ success: true, isVerified: true });
    }

    const parsed = settingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.errors[0]?.message ?? "Invalid settings data"
      );
    }

    const { goal, visibility, ...settingsFields } = parsed.data;

    const updates: Promise<unknown>[] = [];

    if (Object.keys(settingsFields).length > 0) {
      updates.push(
        prisma.userSettings.update({
          where: { userId: user.id },
          data: settingsFields,
        })
      );
    }

    if (visibility !== undefined) {
      updates.push(
        prisma.profile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, visibility },
          update: { visibility },
        })
      );
    }

    if (goal !== undefined) {
      updates.push(
        prisma.onboarding.update({
          where: { userId: user.id },
          data: { goal },
        })
      );
    }

    await Promise.all(updates);

    const [settings, profile, onboarding] = await Promise.all([
      prisma.userSettings.findUnique({ where: { userId: user.id } }),
      prisma.profile.findUnique({
        where: { userId: user.id },
        select: { visibility: true },
      }),
      prisma.onboarding.findUnique({
        where: { userId: user.id },
        select: { goal: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      settings,
      profile,
      onboarding,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/settings error:", error);
    return serverErrorResponse();
  }
}
