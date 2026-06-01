import { NextResponse } from "next/server";
import { getDbUser, serverErrorResponse, unauthorizedResponse } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getDbUser();
    if (!user) {
      return unauthorizedResponse();
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("POST /api/users/sync error:", error);
    return serverErrorResponse();
  }
}
