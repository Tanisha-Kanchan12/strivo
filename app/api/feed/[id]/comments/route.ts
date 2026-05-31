import { NextResponse } from "next/server";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireDbUser();
    const { id: postId } = await params;

    const comments = await prisma.feedPostComment.findMany({
      where: { postId },
      include: {
        user: { include: { profile: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        author: {
          id: c.user.id,
          name: c.user.name,
          profilePicUrl: c.user.profile?.profilePicUrl ?? null,
        },
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/feed/[id]/comments error:", error);
    return serverErrorResponse();
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireDbUser();
    const { id: postId } = await params;
    const body = await request.json();
    const content = String(body.content ?? "").trim();

    if (content.length < 1) {
      return badRequestResponse("Comment cannot be empty");
    }

    const post = await prisma.feedPost.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comment = await prisma.feedPostComment.create({
      data: { postId, userId: user.id, content },
      include: { user: { include: { profile: true } } },
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        author: {
          id: comment.user.id,
          name: comment.user.name,
          profilePicUrl: comment.user.profile?.profilePicUrl ?? null,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/feed/[id]/comments error:", error);
    return serverErrorResponse();
  }
}
