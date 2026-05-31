import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ref = url.searchParams.get("ref");
  const response = NextResponse.redirect(new URL("/signup", request.url));

  if (ref) {
    response.cookies.set("strivo_ref", ref, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return response;
}
