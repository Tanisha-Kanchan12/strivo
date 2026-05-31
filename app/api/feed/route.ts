import { NextResponse } from "next/server";
import type { FeedPostType } from "@prisma/client";
import {
  badRequestResponse,
  requireDbUser,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/auth";
import { isStudyRelatedContent } from "@/lib/ai/feed-moderation";
import prisma from "@/lib/prisma";
import { formatStudyGoal } from "@/lib/constants/onboarding";

export async function GET() {
  try {
    const { user } = await requireDbUser();
    const userGoal = user.onboarding?.goal;

    const posts = await prisma.feedPost.findMany({
      include: {
        user: {
          include: {
            profile: true,
            onboarding: true,
          },
        },
        likes: { where: { userId: user.id }, select: { id: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const sorted = [...posts].sort((a, b) => {
      const aSame = userGoal && a.goal === userGoal ? 1 : 0;
      const bSame = userGoal && b.goal === userGoal ? 1 : 0;
      if (aSame !== bSame) return bSame - aSame;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return NextResponse.json({
      posts: sorted.map((p) => ({
        id: p.id,
        type: p.type,
        content: p.content,
        goal: p.goal,
        goalLabel: formatStudyGoal(p.goal),
        createdAt: p.createdAt.toISOString(),
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        likedByMe: p.likes.length > 0,
        imageUrl: p.imageUrl,
        pdfUrl: p.pdfUrl,
        pdfFileName: p.pdfFileName,
        author: {
          id: p.user.id,
          name: p.user.name,
          profilePicUrl: p.user.profile?.profilePicUrl ?? null,
        },
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("GET /api/feed error:", error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireDbUser();
    const body = await request.json();
    const type = body.type as FeedPostType;
    const content = String(body.content ?? "").trim();

    if (!["ACHIEVEMENT", "DOUBT", "KNOWLEDGE"].includes(type)) {
      return badRequestResponse("Invalid post type");
    }
    const imageUrl = body.imageUrl ? String(body.imageUrl) : null;
    const pdfUrl = body.pdfUrl ? String(body.pdfUrl) : null;
    const pdfFileName = body.pdfFileName ? String(body.pdfFileName) : null;

    if (content.length < 5 && !imageUrl && !pdfUrl) {
      return badRequestResponse("Add text or attach a file");
    }
    if (content.length > 2000) {
      return badRequestResponse("Post is too long");
    }

    if (content.length >= 5) {
      const studyRelated = await isStudyRelatedContent(content);
      if (!studyRelated) {
        return badRequestResponse("Please keep posts study-related");
      }
    }

    const goal = user.onboarding?.goal;
    if (!goal) {
      return badRequestResponse("Complete onboarding to post");
    }

    const post = await prisma.feedPost.create({
      data: {
        userId: user.id,
        type,
        content: content || (pdfUrl ? "Shared a document" : "Shared an image"),
        goal,
        imageUrl,
        pdfUrl,
        pdfFileName,
      },
    });

    return NextResponse.json({ post: { id: post.id } });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("POST /api/feed error:", error);
    return serverErrorResponse();
  }
}
