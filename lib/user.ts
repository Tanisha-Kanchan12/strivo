import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";

export interface RegisterUserInput {
  email: string;
  password: string;
  name?: string | null;
}

export interface OAuthUserInput {
  email: string;
  name?: string | null;
  image?: string | null;
}

async function createUserWithDefaults(data: {
  email: string;
  name?: string | null;
  passwordHash?: string | null;
  profilePicUrl?: string | null;
}) {
  return prisma.user.create({
    data: {
      clerkId: `na_${randomUUID()}`,
      email: data.email,
      name: data.name?.trim() || null,
      passwordHash: data.passwordHash ?? null,
      profile: {
        create: data.profilePicUrl ? { profilePicUrl: data.profilePicUrl } : {},
      },
      onboarding: { create: {} },
      settings: { create: {} },
      individualStreak: { create: {} },
    },
    include: {
      profile: true,
      onboarding: true,
      settings: true,
      individualStreak: true,
    },
  });
}

export async function registerUser(input: RegisterUserInput) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await hash(input.password, 12);

  return createUserWithDefaults({
    email,
    name: input.name,
    passwordHash,
  });
}

export async function findOrCreateOAuthUser(input: OAuthUserInput) {
  const email = input.email.trim().toLowerCase();
  if (!email) {
    throw new Error("Email is required");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (existing) {
    const updates: { name?: string; profile?: { update: { profilePicUrl: string } } } = {};
    if (input.name && !existing.name) {
      updates.name = input.name.trim();
    }
    if (input.image && !existing.profile?.profilePicUrl) {
      updates.profile = { update: { profilePicUrl: input.image } };
    }
    if (Object.keys(updates).length > 0) {
      return prisma.user.update({
        where: { id: existing.id },
        data: updates,
        include: {
          profile: true,
          onboarding: true,
          settings: true,
          individualStreak: true,
        },
      });
    }
    return existing;
  }

  return createUserWithDefaults({
    email,
    name: input.name,
    profilePicUrl: input.image ?? null,
  });
}

export async function deleteUserById(userId: string) {
  await prisma.user.delete({
    where: { id: userId },
  });
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      onboarding: true,
      settings: true,
      individualStreak: true,
    },
  });
}

export function isOnboardingComplete(
  onboarding: { completedAt: Date | null } | null | undefined
): boolean {
  return Boolean(onboarding?.completedAt);
}

export async function getOnboardingStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      onboarding: {
        select: { completedAt: true },
      },
    },
  });

  if (!user) {
    return { exists: false, complete: false };
  }

  return {
    exists: true,
    complete: isOnboardingComplete(user.onboarding),
  };
}
