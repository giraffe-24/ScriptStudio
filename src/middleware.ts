import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SITE_ACCESS_SESSION_COOKIE,
  decodeBasicAuth,
  getSiteAccessCredentials,
  isReviewerUsername,
  isSiteAccessEnabled,
  verifySessionToken,
  verifySiteAccess,
} from "@/lib/site-access";

// /api/keep-alive は Vercel Cron から叩かれる。サイト認証（ログイン）ではなく
// CRON_SECRET で保護するため、ここでは認証対象外にする。
const PUBLIC_PATHS = ["/login", "/api/site-auth/login", "/api/keep-alive"];

// 閲覧専用（レビュアー）でも許可する変更系パス。
// - ログアウト
// - 競合チャンネル管理（追加・切替・削除）と統計取得（POST だが参照系）
const REVIEWER_WRITE_ALLOWED_PATHS = new Set([
  "/api/site-auth/logout",
  "/api/competitors",
  "/api/competitors/stats",
]);

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function middleware(request: NextRequest) {
  if (!isSiteAccessEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const credentials = getSiteAccessCredentials();

  let username: string | null = null;
  const session = request.cookies.get(SITE_ACCESS_SESSION_COOKIE)?.value;
  if (session) {
    username = await verifySessionToken(session);
  }
  if (!username) {
    const auth = decodeBasicAuth(request.headers.get("authorization"));
    if (auth && verifySiteAccess(auth.username, auth.password, credentials)) {
      username = auth.username;
    }
  }

  if (username) {
    // 閲覧専用（レビュアー）は参照系メソッドのみ。保存・削除・AI生成をここで一括遮断する
    const method = request.method.toUpperCase();
    const isReadMethod = method === "GET" || method === "HEAD" || method === "OPTIONS";
    if (
      isReviewerUsername(username) &&
      !isReadMethod &&
      !REVIEWER_WRITE_ALLOWED_PATHS.has(pathname)
    ) {
      return NextResponse.json(
        { error: "閲覧専用アカウントのため、保存・生成はできません" },
        { status: 403 },
      );
    }
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
