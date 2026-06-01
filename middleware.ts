import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import {
  shouldRedirectToCanonicalAuth,
  toCanonicalAuthRedirect,
} from "@/lib/auth-env";

const PUBLIC_PATHS = ["/login", "/signup", "/join"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isAuthExemptApi(pathname: string) {
  return (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/webhooks")
  );
}

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (shouldRedirectToCanonicalAuth(req)) {
    return NextResponse.redirect(toCanonicalAuthRedirect(req));
  }

  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user?.id;

  if (isAuthExemptApi(pathname)) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
