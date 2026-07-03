"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings, Trash2 } from "lucide-react";
import type { CompetitorChannel } from "@/lib/types";
import type { ChannelSubscriberStats } from "@/lib/market-analysis/subscriber-history";
import { cn } from "@/lib/utils";
import { youtubeChannelUrl } from "@/lib/youtube-channel-url";
import type { ApiErrorCode } from "@/lib/api-error";
import { CompetitorSubscriberStats } from "@/components/CompetitorSubscriberStats";
import { CompetitorChannelAvatar } from "@/components/CompetitorChannelAvatar";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { toUserMessage } from "@/lib/error-message";
import { Button } from "@/components/ui/button";

type UiError = { msg: string; code?: ApiErrorCode; detail?: string } | null;
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CompetitorSettingsDialog() {
  const [open, setOpen] = useState(false);
  const [channels, setChannels] = useState<CompetitorChannel[]>([]);
  const [stats, setStats] = useState<Record<string, ChannelSubscriberStats>>({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  // 削除は誤操作防止の2段階（ゴミ箱 → 「削除する」確認）
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [registerUrl, setRegisterUrl] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<UiError>(null);
  const [loadError, setLoadError] = useState<UiError>(null);
  const [toggleError, setToggleError] = useState<UiError>(null);

  const loadChannels = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/competitors");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setChannels([]);
        setStats({});
        setLoadError({
          msg: toUserMessage(data.error, "競合チャンネルを読み込めませんでした。"),
          code: data.code,
          detail: data.detail,
        });
        return;
      }
      setChannels(data.channels ?? []);
      setStats(data.stats ?? {});
    } catch (error) {
      setChannels([]);
      setStats({});
      setLoadError({
        msg: "通信エラーが発生しました。ネットワークを確認してください。",
        code: "upstream",
        detail: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToggleError(null);
    setConfirmDeleteId(null);
    void loadChannels();
  }, [open, loadChannels]);

  async function handleToggle(channelId: string, enabled: boolean) {
    setSavingId(channelId);
    setToggleError(null);
    setChannels((prev) =>
      prev.map((c) => (c.channelId === channelId ? { ...c, enabled } : c)),
    );
    try {
      const res = await fetch("/api/competitors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: [{ channelId, enabled }] }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setChannels(data.channels ?? []);
      } else {
        setToggleError({
          msg: toUserMessage(data.error, "設定を更新できませんでした。"),
          code: data.code,
          detail: data.detail,
        });
        await loadChannels();
      }
    } catch (error) {
      setToggleError({
        msg: "通信エラーが発生しました",
        code: "upstream",
        detail: error instanceof Error ? error.message : String(error),
      });
      await loadChannels();
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(channelId: string) {
    setDeletingId(channelId);
    setToggleError(null);
    try {
      const res = await fetch("/api/competitors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelIds: [channelId] }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setChannels(data.channels ?? []);
      } else {
        setToggleError({
          msg: toUserMessage(data.error, "チャンネルを削除できませんでした。"),
          code: data.code,
          detail: data.detail,
        });
        await loadChannels();
      }
    } catch (error) {
      setToggleError({
        msg: "通信エラーが発生しました",
        code: "upstream",
        detail: error instanceof Error ? error.message : String(error),
      });
      await loadChannels();
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function handleRegisterByUrl() {
    const url = registerUrl.trim();
    if (!url || registering) return;
    setRegistering(true);
    setRegisterError(null);
    setToggleError(null);
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRegisterError({
          msg: toUserMessage(data.error, "登録に失敗しました。"),
          code: data.code,
          detail: data.detail,
        });
        return;
      }
      setChannels(data.channels ?? []);
      setStats(data.stats ?? {});
      setRegisterUrl("");
    } catch (error) {
      setRegisterError({
        msg: "通信エラーが発生しました",
        code: "upstream",
        detail: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setRegistering(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label="競合チャンネル設定"
      >
        <Settings className="size-5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle>競合チャンネル設定</DialogTitle>
          <DialogDescription>
            オンのチャンネルだけが、次回以降の市場分析に使われます。オフにすると候補生成から除外されます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <label htmlFor="competitor-register-url" className="block text-xs font-medium text-foreground">
              URL から競合チャンネルを登録
            </label>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              YouTube のチャンネル URL を入れると、この一覧に追加できます。
            </p>
            <div className="mt-3 flex gap-2">
              <input
                id="competitor-register-url"
                type="url"
                value={registerUrl}
                onChange={(e) => {
                  setRegisterUrl(e.target.value);
                  setRegisterError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleRegisterByUrl();
                }}
                placeholder="https://www.youtube.com/@..."
                className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              />
              <Button
                type="button"
                size="lg"
                onClick={() => void handleRegisterByUrl()}
                disabled={registering || !registerUrl.trim()}
                className="shrink-0"
              >
                {registering ? "登録中…" : "登録"}
              </Button>
            </div>
            {registerError && (
              <ErrorBox
                className="mt-2"
                error={registerError.msg}
                code={registerError.code}
                detail={registerError.detail}
                onRetry={() => void handleRegisterByUrl()}
                retrying={registering}
                retryDisabled={!registerUrl.trim()}
                retryLabel="再登録"
              />
            )}
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              例: `https://www.youtube.com/channel/UC...` または `https://www.youtube.com/@handle`
            </p>
          </div>

          {loadError ? (
            <ErrorBox
              error={loadError.msg}
              code={loadError.code}
              detail={loadError.detail}
              onRetry={() => void loadChannels()}
              retrying={loading}
            />
          ) : null}

          {toggleError ? (
            <ErrorBox
              error={toggleError.msg}
              code={toggleError.code}
              detail={toggleError.detail}
            />
          ) : null}

          <div className="rounded-xl border border-border bg-card p-2 shadow-sm">
            <div className="max-h-104 space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">読み込み中…</p>
              ) : channels.length === 0 ? (
                <p className="py-6 text-center text-sm leading-relaxed text-muted-foreground">
                  登録済みの競合チャンネルがありません。
                  <br />
                  上の URL 入力欄から追加できます。
                </p>
              ) : (
                channels.map((ch) => {
                  const enabled = ch.enabled !== false;
                  const saving = savingId === ch.channelId;
                  const deleting = deletingId === ch.channelId;
                  const confirmingDelete = confirmDeleteId === ch.channelId;
                  return (
                    <div
                      key={ch.channelId}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-colors",
                        enabled
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-background",
                      )}
                    >
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={`${ch.displayName} を市場分析に${enabled ? "含める" : "含めない"}`}
                        disabled={saving}
                        onClick={() => void handleToggle(ch.channelId, !enabled)}
                        className={cn(
                          "inline-flex h-9 w-20 shrink-0 items-center rounded-full border px-1 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                          enabled
                            ? "justify-end border-primary/40 bg-primary/15 text-primary"
                            : "justify-start border-border bg-secondary text-muted-foreground",
                          saving && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <span className="sr-only">{enabled ? "オン" : "オフ"}</span>
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shadow-sm",
                            enabled
                              ? "bg-background text-primary"
                              : "border border-border bg-background text-muted-foreground",
                          )}
                        >
                          {enabled ? "ON" : "OFF"}
                        </span>
                      </button>

                      <CompetitorChannelAvatar
                        channelId={ch.channelId}
                        displayName={ch.displayName}
                        thumbnailUrl={stats[ch.channelId]?.thumbnailUrl}
                        size={44}
                        interactive={false}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <a
                            href={youtubeChannelUrl(ch.channelId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="line-clamp-2 rounded-sm text-sm font-semibold leading-snug text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                          >
                            {ch.displayName}
                          </a>
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium",
                              enabled
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-border bg-secondary text-muted-foreground",
                            )}
                          >
                            {saving ? "保存中…" : enabled ? "分析対象" : "除外中"}
                          </span>
                        </div>
                        <CompetitorSubscriberStats stats={stats[ch.channelId]} className="mt-1" />
                      </div>

                      {confirmingDelete ? (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => void handleDelete(ch.channelId)}
                            disabled={deleting}
                            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deleting ? "削除中…" : "削除する"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={deleting}
                            className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(ch.channelId)}
                          disabled={saving || deletingId !== null}
                          title="このチャンネルを一覧から削除"
                          aria-label={`${ch.displayName} を削除`}
                          className="shrink-0 rounded-md border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
