import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SITE_ACCESS_SESSION_COOKIE,
  decodeBasicAuth,
  getSiteAccessCredentials,
  isSiteAccessEnabled,
  verifySessionToken,
  verifySiteAccess,
} from "@/lib/site-access";

// /api/keep-alive は Vercel Cron から叩かれる。サイト認証（ログイン）ではなく
// CRON_SECRET で保護するため、ここでは認証対象外にする。
const PUBLIC_PATHS = ["/login", "/api/site-auth/login", "/api/keep-alive"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function proxy(request: NextRequest) {
  if (!isSiteAccessEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const credentials = getSiteAccessCredentials();

  const session = request.cookies.get(SITE_ACCESS_SESSION_COOKIE)?.value;
  if (session && (await verifySessionToken(session))) {
    return NextResponse.next();
  }

  const auth = decodeBasicAuth(request.headers.get("authorization"));
  if (auth && verifySiteAccess(auth.username, auth.password, credentials)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
