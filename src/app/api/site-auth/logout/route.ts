import { NextResponse } from "next/server";
import { SITE_ACCESS_SESSION_COOKIE } from "@/lib/site-access";

export async function POST() {
  // セッション cookie を即時失効させる。次の遷移で proxy.ts が /login へ送り返す。
  //
  // 注意: proxy.ts / studio-session.ts は Basic 認証ヘッダも受理する。Basic で
  // 入ったブラウザは Authorization ヘッダを送り続けるため、cookie 失効だけでは
  // ログアウトできない（クライアント側で Basic 資格情報を確実に消す標準手段は無い）。
  // 想定する主経路はログインフォーム → cookie のため、ここでは cookie 失効で十分。
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SITE_ACCESS_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
