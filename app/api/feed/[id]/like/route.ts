import { NextResponse } from "next/server";
import {
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id: postId } = await params;

    const post = await prisma.feedPost.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existing = await prisma.feedPostLike.findUnique({
      where: { postId_userId: { postId, userId: user.id } },
    });

    if (existing) {
      await prisma.feedPostLike.delete({ where: { id: existing.id } });
      const count = await prisma.feedPostLike.count({ where: { postId } });
      return NextResponse.json({ liked: false, likeCount: count });
    }

    await prisma.feedPostLike.create({ data: { postId, userId: user.id } });
    const count = await prisma.feedPostLike.count({ where: { postId } });
    return NextResponse.json({ liked: true, likeCount: count });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/feed/[id]/like error:", error);
    return serverErrorResponse();
  }
}
