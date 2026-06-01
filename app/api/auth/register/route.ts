import { NextResponse } from "next/server";
import { badRequestResponse, serverErrorResponse } from "@/lib/auth";
import { registerUser } from "@/lib/user";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = body.name ? String(body.name).trim() : null;

    if (!email || !password) {
      return badRequestResponse("Email and password are required");
    }
    if (password.length < 8) {
      return badRequestResponse("Password must be at least 8 characters");
    }

    const user = await registerUser({ email, password, name });
    return NextResponse.json({ userId: user.id });
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      return badRequestResponse(error.message);
    }
    console.error("POST /api/auth/register error:", error);
    return serverErrorResponse();
  }
}
