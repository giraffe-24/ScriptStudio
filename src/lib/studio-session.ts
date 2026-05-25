import type { NextRequest } from "next/server";
import {
  SITE_ACCESS_SESSION_COOKIE,
  decodeBasicAuth,
  getSiteAccessCredentials,
  isSiteAccessEnabled,
  verifySessionToken,
  verifySiteAccess,
} from "@/lib/site-access";

/** リクエストからログイン中のユーザー名を取得（未ログイン時は null） */
export async function getSessionUsernameFromRequest(
  request: NextRequest,
): Promise<string | null> {
  if (!isSiteAccessEnabled()) return null;

  const session = request.cookies.get(SITE_ACCESS_SESSION_COOKIE)?.value;
  if (session) {
    const username = await verifySessionToken(session);
    if (username) return username;
  }

  const auth = decodeBasicAuth(request.headers.get("authorization"));
  const credentials = getSiteAccessCredentials();
  if (auth && verifySiteAccess(auth.username, auth.password, credentials)) {
    return auth.username;
  }

  return null;
}
