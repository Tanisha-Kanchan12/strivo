import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";

export interface RegisterUserInput {
  email: string;
  password: string;
  name?: string | null;
}

export async function registerUser(input: RegisterUserInput) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      clerkId: `na_${randomUUID()}`,
      email,
      name: input.name?.trim() || null,
      passwordHash,
      profile: { create: {} },
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

  return user;
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
