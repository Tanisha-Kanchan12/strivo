import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { syncUserFromClerk } from "@/lib/user";

const userInclude = {
  profile: true,
  onboarding: true,
  settings: true,
  individualStreak: true,
} as const;

export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function requireAuthUserId(): Promise<string> {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function getDbUserFromClerk() {
  const { userId } = await auth();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { clerkId: userId },
    include: userInclude,
  });
}

export async function requireDbUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: userInclude,
  });

  if (!user) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      user = await syncUserFromClerk({
        id: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        emailAddresses: clerkUser.emailAddresses.map((e) => ({
          emailAddress: e.emailAddress,
        })),
        phoneNumbers: clerkUser.phoneNumbers.map((p) => ({
          phoneNumber: p.phoneNumber,
        })),
      });
    } else {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          profile: { create: {} },
          onboarding: { create: {} },
          settings: { create: {} },
          individualStreak: { create: {} },
        },
        include: userInclude,
      });
    }
  }

  const clerkUser = await currentUser();

  return { clerkUser, user };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFoundResponse(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequestResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverErrorResponse(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}
