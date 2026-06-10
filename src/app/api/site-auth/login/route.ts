import { NextResponse } from "next/server";
import {
  SITE_ACCESS_SESSION_COOKIE,
  createSessionToken,
  getSiteAccessCredentials,
  isSiteAccessEnabled,
  verifySiteAccess,
} from "@/lib/site-access";

export async function POST(request: Request) {
  if (!isSiteAccessEnabled()) {
    return NextResponse.json({ error: "認証は無効です" }, { status: 404 });
  }

  let body: { username?: string; password?: string };
  try {
    body = (await request.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "入力が不正です" }, { status: 400 });
  }

  // モバイルのIME/全角入力やスマート記号で混入する非ASCII表記を半角ASCIIへ正規化（NFKC）。
  // PC とモバイルで「同じつもりの文字」がバイト不一致になり弾かれる問題を境界で解消する。
  const username = body.username?.normalize("NFKC").trim() ?? "";
  const password = body.password?.normalize("NFKC") ?? "";
  const credentials = getSiteAccessCredentials();

  if (!username || !password || !verifySiteAccess(username, password, credentials)) {
    return NextResponse.json({ error: "ユーザー名またはパスワードが違います" }, { status: 401 });
  }

  const token = await createSessionToken(username);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SITE_ACCESS_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
