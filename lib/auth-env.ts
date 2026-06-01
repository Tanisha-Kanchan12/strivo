import type { NextRequest } from "next/server";

/**
 * Canonical app origin for OAuth (not hardcoded).
 * Prefer AUTH_URL (Auth.js v5), then NEXTAUTH_URL, then NEXT_PUBLIC_APP_URL.
 */
export function getCanonicalAppUrl(): string | undefined {
  const raw =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!raw) {
    return undefined;
  }

  try {
    return new URL(raw).origin;
  } catch {
    return undefined;
  }
}

export function getAuthSecret(): string | undefined {
  const secret =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  return secret || undefined;
}

export function isCanonicalAuthPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/signup"
  );
}

/** Preview / alternate Vercel hosts must use the canonical URL for OAuth cookies. */
export function shouldRedirectToCanonicalAuth(req: NextRequest): boolean {
  const canonical = getCanonicalAppUrl();
  if (!canonical || !isCanonicalAuthPath(req.nextUrl.pathname)) {
    return false;
  }

  const canonicalHost = new URL(canonical).host;
  return req.nextUrl.host !== canonicalHost;
}

export function toCanonicalAuthRedirect(req: NextRequest): string {
  const canonical = getCanonicalAppUrl()!;
  const target = new URL(
    `${req.nextUrl.pathname}${req.nextUrl.search}`,
    canonical
  );
  return target.toString();
}
