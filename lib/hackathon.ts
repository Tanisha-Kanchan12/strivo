import type { HackathonRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { createConnectedPair } from "@/lib/matching";
import { asHackathonRoles } from "@/lib/prisma-json";

export async function getHackathonPosts(roleFilter?: HackathonRole | null) {
  const posts = await prisma.hackathonPost.findMany({
    where: {
      isOpen: true,
      deadline: { gte: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profile: {
            select: { city: true, college: true, profilePicUrl: true },
          },
        },
      },
      applications: {
        select: { id: true, applicantId: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (!roleFilter) return posts;

  return posts.filter((post) =>
    asHackathonRoles(post.rolesNeeded).includes(roleFilter)
  );
}

export async function applyToHackathonPost(postId: string, applicantId: string) {
  const post = await prisma.hackathonPost.findUnique({
    where: { id: postId },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!post || !post.isOpen) {
    throw new Error("Post not found or closed");
  }

  if (post.userId === applicantId) {
    throw new Error("Cannot apply to your own post");
  }

  const existingApp = await prisma.hackathonApplication.findUnique({
    where: {
      postId_applicantId: { postId, applicantId },
    },
  });

  if (existingApp) {
    const pair = await prisma.connectedPair.findFirst({
      where: {
        OR: [
          { user1Id: post.userId, user2Id: applicantId },
          { user1Id: applicantId, user2Id: post.userId },
        ],
      },
    });
    return {
      application: existingApp,
      pairId: pair?.id ?? null,
    };
  }

  const application = await prisma.hackathonApplication.create({
    data: { postId, applicantId },
  });

  const [sorted1, sorted2] = [post.userId, applicantId].sort();
  let pair = await prisma.connectedPair.findFirst({
    where: {
      OR: [
        { user1Id: sorted1, user2Id: sorted2 },
        { user1Id: sorted2, user2Id: sorted1 },
      ],
    },
  });

  if (!pair) {
    pair = await createConnectedPair(post.userId, applicantId, {
      source: "HACKATHON",
      isProvisional: true,
      withStreak: false,
    });
  }

  await createNotification({
    userId: post.userId,
    type: "HACKATHON_APPLICATION",
    content: `New application for ${post.hackathonName}`,
    data: { postId, applicantId, pairId: pair.id },
  });

  return { application, pairId: pair.id };
}

export const HACKATHON_ROLE_LABELS: Record<HackathonRole, string> = {
  DEVELOPER: "Developer",
  DESIGNER: "Designer",
  PM: "PM",
  OTHER: "Other",
};
