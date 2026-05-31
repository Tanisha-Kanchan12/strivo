import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { unauthorizedResponse, serverErrorResponse } from "@/lib/auth";
import { syncUserFromClerk } from "@/lib/user";

export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return unauthorizedResponse();
    }

    const user = await syncUserFromClerk({
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

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("POST /api/users/sync error:", error);
    return serverErrorResponse();
  }
}
