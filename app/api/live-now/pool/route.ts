import { NextResponse } from "next/server";
import type { LiveNowTopic } from "@prisma/client";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { getLiveNowPool } from "@/lib/live-now";
import { liveNowTopicSchema } from "@/lib/validations/live-now";

export async function GET(request: Request) {
  try {
    const { user } = await requireDbUser();
    const { searchParams } = new URL(request.url);
    const topicParam = searchParams.get("topic");

    let topic: LiveNowTopic | null = null;
    if (topicParam) {
      const parsed = liveNowTopicSchema.safeParse(topicParam);
      if (parsed.success) topic = parsed.data;
    }

    const pool = await getLiveNowPool(user.id, topic);
    return NextResponse.json({ pool });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/live-now/pool error:", error);
    return serverErrorResponse();
  }
}
