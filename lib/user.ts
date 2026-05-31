import prisma from "@/lib/prisma";

export interface ClerkUserPayload {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  emailAddresses?: Array<{ emailAddress: string }>;
  phoneNumbers?: Array<{ phoneNumber: string }>;
}

function buildName(payload: ClerkUserPayload): string | null {
  const parts = [payload.firstName, payload.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return null;
}

function getPrimaryEmail(payload: ClerkUserPayload): string | null {
  return payload.emailAddresses?.[0]?.emailAddress ?? null;
}

function getPrimaryPhone(payload: ClerkUserPayload): string | null {
  return payload.phoneNumbers?.[0]?.phoneNumber ?? null;
}

export async function syncUserFromClerk(payload: ClerkUserPayload) {
  const name = buildName(payload);
  const email = getPrimaryEmail(payload);
  const phone = getPrimaryPhone(payload);

  const user = await prisma.user.upsert({
    where: { clerkId: payload.id },
    create: {
      clerkId: payload.id,
      name,
      email,
      phone,
      profile: { create: {} },
      onboarding: { create: {} },
      settings: { create: {} },
      individualStreak: { create: {} },
    },
    update: {
      name: name ?? undefined,
      email: email ?? undefined,
      phone: phone ?? undefined,
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

export async function deleteUserByClerkId(clerkId: string) {
  await prisma.user.delete({
    where: { clerkId },
  });
}

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
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

export async function getOnboardingStatus(clerkId: string) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
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
