import { NextResponse } from "next/server";
import type { HackathonRole } from "@prisma/client";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { getHackathonPosts } from "@/lib/hackathon";
import { createHackathonPostSchema, hackathonRoleSchema } from "@/lib/validations/hackathon";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireDbUser();
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get("role");

    let role: HackathonRole | null = null;
    if (roleParam) {
      const parsed = hackathonRoleSchema.safeParse(roleParam);
      if (parsed.success) role = parsed.data;
    }

    const posts = await getHackathonPosts(role);
    return NextResponse.json({ posts });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/hackathon/posts error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const parsed = createHackathonPostSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.errors[0]?.message ?? "Invalid post data"
      );
    }

    const deadline = new Date(parsed.data.deadline);
    if (Number.isNaN(deadline.getTime()) || deadline < new Date()) {
      return badRequestResponse("Deadline must be a future date");
    }

    const post = await prisma.hackathonPost.create({
      data: {
        userId: user.id,
        hackathonName: parsed.data.hackathonName.trim(),
        rolesNeeded: parsed.data.rolesNeeded,
        cityPreference: parsed.data.cityPreference?.trim() || null,
        deadline,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/hackathon/posts error:", error);
    return serverErrorResponse();
  }
}
