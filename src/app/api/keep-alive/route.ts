import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";

/**
 * Supabase 無料枠のスリープ（約7日間、DBアクティビティが無いと自動一時停止）を防ぐための
 * キープアライブ。Vercel Cron から 1 日 1 回叩かれ、Supabase へ「本物のDBクエリ」を送って
 * プロジェクトを起こしておく。
 *
 * 重要:
 * - Supabase が測るのは *データベース* のアクティビティ（ユーザークエリ）。単なる HTTP では
 *   なく DB を触る必要があるため、専用テーブル `public.keepalive` への upsert を第一の信号にする。
 *   （初回セットアップの SQL は docs/keep-alive-setup.md 参照。未作成でも Storage 呼び出しで代替する）
 * - これは *予防* 策。すでに一時停止/削除された（今回の NXDOMAIN の）プロジェクトは復活しない。
 *   ダッシュボードから復元（一時停止から90日以内）または新規作成した上で有効になる。
 * - 恒久的に止めない保証が要るなら Pro プランのみ（無料枠は本質的に一時停止対象）。
 *
 * 認証: Vercel Cron は CRON_SECRET を設定すると `Authorization: Bearer <CRON_SECRET>` を自動付与する。
 * このルートは proxy.ts のサイト認証からは除外（PUBLIC_PATHS）し、代わりに CRON_SECRET で保護する。
 */

const KEEPALIVE_TABLE = "keepalive";

// このルートは supabase-js（Node 依存）を使うため Edge ではなく Node ランタイムで動かす。
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  // CRON_SECRET 未設定なら誰でも叩ける（実行内容は無害な keepalive クエリのみ）。本番では設定推奨。
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, reason: "not_configured" },
      { status: 200 },
    );
  }

  const signals: { db: boolean; storage: boolean } = { db: false, storage: false };
  const details: Record<string, string> = {};

  const supabase = getSupabaseServer();

  // (1) 第一の信号: 専用テーブルへの upsert = 明確な「ユーザーのDBクエリ」。
  //     service_role キーなので RLS はバイパスされる。テーブル未作成なら握りつぶして代替へ。
  try {
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from(KEEPALIVE_TABLE)
      .upsert({ id: 1, last_ping: nowIso }, { onConflict: "id" });
    if (error) {
      details.db = error.message;
    } else {
      signals.db = true;
    }
  } catch (error) {
    details.db = error instanceof Error ? error.message : String(error);
  }

  // (2) 代替/併用: Storage のメタデータ（Postgres の storage スキーマ）を読む = DB クエリ。
  //     アプリ本体が依存している経路そのものなので、これが通れば本番の保存も生きている。
  try {
    const { error } = await supabase.storage.listBuckets();
    if (error) {
      details.storage = error.message;
    } else {
      signals.storage = true;
    }
  } catch (error) {
    details.storage = error instanceof Error ? error.message : String(error);
  }

  const ok = signals.db || signals.storage;
  return NextResponse.json(
    {
      ok,
      pingedAt: new Date().toISOString(),
      signals,
      ...(ok ? {} : { details }),
    },
    { status: ok ? 200 : 503 },
  );
}
