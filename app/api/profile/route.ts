import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { calculateProfileCompletion } from "@/lib/profile";
import prisma from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validations/profile";

export async function GET() {
  try {
    const { user } = await requireDbUser();

    const subjects = await prisma.subject.findMany({
      where: { userId: user.id },
      orderBy: { subjectName: "asc" },
    });

    const completion = calculateProfileCompletion({
      profile: user.profile,
      subjectsCount: subjects.length,
    });

    return NextResponse.json({
      profile: user.profile,
      subjects: subjects.map((s) => s.subjectName),
      completion,
      name: user.name,
      onboarding: user.onboarding,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/profile error:", error);
    return serverErrorResponse();
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.errors[0]?.message ?? "Invalid profile data"
      );
    }

    const { subjects, profilePicUrl, bio, city, college, stream } = parsed.data;

    await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        bio: bio?.trim() || null,
        city: city?.trim() || null,
        college: college?.trim() || null,
        stream: stream?.trim() || null,
        profilePicUrl: profilePicUrl || null,
      },
      update: {
        ...(bio !== undefined && { bio: bio.trim() || null }),
        ...(city !== undefined && { city: city.trim() || null }),
        ...(college !== undefined && { college: college.trim() || null }),
        ...(stream !== undefined && { stream: stream.trim() || null }),
        ...(profilePicUrl !== undefined && {
          profilePicUrl: profilePicUrl || null,
        }),
      },
    });

    if (subjects !== undefined) {
      await prisma.subject.deleteMany({ where: { userId: user.id } });
      if (subjects.length > 0) {
        await prisma.subject.createMany({
          data: subjects.map((subjectName) => ({
            userId: user.id,
            subjectName: subjectName.trim(),
          })),
        });
      }
    }

    const updatedSubjects = await prisma.subject.findMany({
      where: { userId: user.id },
    });
    const updatedProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    const completion = calculateProfileCompletion({
      profile: updatedProfile,
      subjectsCount: updatedSubjects.length,
    });

    return NextResponse.json({
      success: true,
      completion,
      profile: updatedProfile,
      subjects: updatedSubjects.map((s) => s.subjectName),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("PATCH /api/profile error:", error);
    return serverErrorResponse();
  }
}
