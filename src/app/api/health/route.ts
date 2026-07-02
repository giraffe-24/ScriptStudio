import { NextResponse } from "next/server";
import {
  isSupabaseConfigured,
  getSupabaseConfigHint,
  getSupabaseServer,
} from "@/lib/supabase-server";
import {
  isProductionRuntime,
  shouldUsePersistedRuntimeStore,
} from "@/lib/runtime-persistence";
import { isGitMirrorConfigured } from "@/lib/git-mirror";

/**
 * 保存先（永続化バックエンド）の健全性診断。
 *
 * 目的: 「保存に失敗（通信に失敗）」がユーザーの回線問題なのか、
 * サーバー側の保存先（Supabase / GitHub ミラー）が死んでいるのかを、
 * 推測でなく事実で切り分ける。秘密情報（キー・完全なURL）は返さない。
 *
 * 例: 本番で {"supabase":{"configured":true,"reachable":false,...}} が返れば、
 *     設定はあるのにホストに繋がらない = プロジェクトが死んでいる/停止中、と確定できる。
 */

// episode-files-store.ts の EPISODES_BUCKET と一致させること。
const EPISODES_BUCKET = "scriptstudio-episodes";
const REACHABILITY_TIMEOUT_MS = 8000;

/** SUPABASE_URL から秘密でないプロジェクト参照（サブドメイン）だけ取り出す。 */
function supabaseProjectRef(): string | null {
  const url = process.env.SUPABASE_URL?.trim();
  if (!url) return null;
  try {
    const host = new URL(url).hostname; // e.g. abcdxyz.supabase.co
    return host.split(".")[0] || host;
  } catch {
    return null;
  }
}

/** 生エラーを「到達不能 / タイムアウト / 応答あり(設定・権限)」に分類する。 */
function classifyError(error: unknown): {
  reachable: boolean;
  reason: "unreachable" | "timeout" | "responded_with_error";
  detail: string;
} {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (/fetch failed|failed to fetch|enotfound|econnrefused|econnreset|dns|getaddrinfo|network/i.test(message)) {
    return { reachable: false, reason: "unreachable", detail: message };
  }
  if (/timeout|timed out|abort/i.test(message)) {
    return { reachable: false, reason: "timeout", detail: message };
  }
  // ホストは応答したが、認証・権限・設定など別要因で失敗している
  return { reachable: true, reason: "responded_with_error", detail: message };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("health check timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export async function GET() {
  const runtime = isProductionRuntime() ? "production" : "local";
  const persistenceRequired = shouldUsePersistedRuntimeStore();
  const configured = isSupabaseConfigured();

  const supabase: Record<string, unknown> = {
    projectRef: supabaseProjectRef(),
    configured,
    hint: getSupabaseConfigHint(),
  };

  // 本番かつ設定済みのときだけ、実際にホストへ 1 回だけ到達確認する。
  if (persistenceRequired && configured) {
    try {
      const client = getSupabaseServer();
      const { data, error } = await withTimeout(
        client.storage.listBuckets(),
        REACHABILITY_TIMEOUT_MS,
      );
      if (error) {
        const c = classifyError(error);
        supabase.reachable = c.reachable;
        supabase.reason = c.reason;
        supabase.detail = c.detail;
      } else {
        supabase.reachable = true;
        supabase.reason = "ok";
        supabase.bucketPresent = Boolean(
          data?.some((bucket) => bucket.name === EPISODES_BUCKET),
        );
      }
    } catch (error) {
      const c = classifyError(error);
      supabase.reachable = c.reachable;
      supabase.reason = c.reason;
      supabase.detail = c.detail;
    }
  } else {
    supabase.reachable = null;
    supabase.reason = persistenceRequired ? "not_configured" : "not_required";
  }

  const healthy = persistenceRequired
    ? configured && supabase.reachable === true
    : true;

  return NextResponse.json(
    {
      ok: healthy,
      runtime,
      persistence: {
        backend: "supabase-storage",
        required: persistenceRequired,
      },
      supabase,
      mirror: { configured: isGitMirrorConfigured() },
    },
    { status: healthy ? 200 : 503 },
  );
}
