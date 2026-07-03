import { NextRequest, NextResponse } from "next/server";
import { isReviewerUsername, isSiteAccessEnabled } from "@/lib/site-access";
import { getSessionUsernameFromRequest } from "@/lib/studio-session";
import { getStudioUserName } from "@/lib/studio-user";

export async function GET(request: NextRequest) {
  const authEnabled = isSiteAccessEnabled();
  if (!authEnabled) {
    return NextResponse.json({
      authEnabled: false,
      username: getStudioUserName(),
      readOnly: false,
    });
  }

  const username = await getSessionUsernameFromRequest(request);
  return NextResponse.json({
    authEnabled: true,
    username,
    // 閲覧専用（レビュアー）ロール。UI は保存系の導線を無効化してよい
    readOnly: isReviewerUsername(username),
  });
}
