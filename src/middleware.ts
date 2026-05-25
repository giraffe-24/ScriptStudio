import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  decodeBasicAuth,
  getSiteAccessCredentials,
  isSiteAccessEnabled,
  verifySiteAccess,
} from "@/lib/site-access";

function unauthorized(): NextResponse {
  return new NextResponse("認証が必要です", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="ScriptStudio", charset="UTF-8"',
    },
  });
}

export function middleware(request: NextRequest) {
  if (!isSiteAccessEnabled()) {
    return NextResponse.next();
  }

  const credentials = getSiteAccessCredentials();
  const auth = decodeBasicAuth(request.headers.get("authorization"));

  if (!auth || !verifySiteAccess(auth.username, auth.password, credentials)) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
