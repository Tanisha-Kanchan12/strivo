import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { generateAndSaveGoalCoachPlan } from "@/lib/ai/goal-coach";
import { completeReferralForUser } from "@/lib/referrals";
import { seedSyllabusForUser } from "@/lib/syllabus";
import prisma from "@/lib/prisma";
import { asStudyTimes } from "@/lib/prisma-json";
import { onboardingPatchSchema } from "@/lib/validations/onboarding";

export async function GET() {
  try {
    const { user } = await requireDbUser();

    return NextResponse.json({
      onboarding: user.onboarding,
      name: user.name,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/onboarding error:", error);
    return serverErrorResponse();
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = onboardingPatchSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.errors[0]?.message ?? "Invalid onboarding data"
      );
    }

    const { step, data } = parsed.data;

    if (step === 1) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { name: data.name.trim() },
        }),
        prisma.onboarding.update({
          where: { userId: user.id },
          data: { status: data.status },
        }),
      ]);

      return NextResponse.json({ success: true, nextStep: 2 });
    }

    if (step === 2) {
      await prisma.onboarding.update({
        where: { userId: user.id },
        data: {
          goal: data.goal,
          field: data.field?.trim() || null,
        },
      });

      return NextResponse.json({ success: true, nextStep: 3 });
    }

    if (step === 3) {
      const onboarding = await prisma.onboarding.update({
        where: { userId: user.id },
        data: {
          studyTimes: data.studyTimes,
          partnerType: data.partnerType,
          completedAt: new Date(),
        },
      });

      if (data.isMentor && data.achievementBadge?.trim()) {
        await prisma.mentorProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            isMentor: true,
            achievementBadge: data.achievementBadge.trim(),
          },
          update: {
            isMentor: true,
            achievementBadge: data.achievementBadge.trim(),
          },
        });
      }

      if (onboarding.goal) {
        seedSyllabusForUser(user.id, onboarding.goal).catch((err) =>
          console.error("Syllabus seed error:", err)
        );
      }

      generateAndSaveGoalCoachPlan({
        userId: user.id,
        name: user.name,
        goal: onboarding.goal,
        status: onboarding.status,
        field: onboarding.field,
        studyTimes: asStudyTimes(onboarding.studyTimes),
      }).catch((err) => console.error("Goal coach plan error:", err));

      completeReferralForUser(user.id).catch((err) =>
        console.error("Referral completion error:", err)
      );

      return NextResponse.json({ success: true, complete: true });
    }

    return badRequestResponse("Invalid step");
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/onboarding error:", error);
    return serverErrorResponse();
  }
}
