import { NextRequest, NextResponse } from "next/server";
import { isSiteAccessEnabled } from "@/lib/site-access";
import { getSessionUsernameFromRequest } from "@/lib/studio-session";
import { getStudioUserName } from "@/lib/studio-user";

export async function GET(request: NextRequest) {
  const authEnabled = isSiteAccessEnabled();
  if (!authEnabled) {
    return NextResponse.json({
      authEnabled: false,
      username: getStudioUserName(),
    });
  }

  const username = await getSessionUsernameFromRequest(request);
  return NextResponse.json({
    authEnabled: true,
    username,
  });
}
