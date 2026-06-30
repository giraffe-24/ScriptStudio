import { NextResponse } from "next/server";
import { SITE_ACCESS_SESSION_COOKIE } from "@/lib/site-access";

export async function POST() {
  // セッション cookie を即時失効させる。次の遷移で proxy.ts が /login へ送り返す。
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
