"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import type { CompetitorChannel } from "@/lib/types";
import type { ChannelSubscriberStats } from "@/lib/market-analysis/subscriber-history";
import { cn } from "@/lib/utils";
import { youtubeChannelUrl } from "@/lib/youtube-channel-url";
import { CompetitorSubscriberStats } from "@/components/CompetitorSubscriberStats";
import { CompetitorChannelAvatar } from "@/components/CompetitorChannelAvatar";
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
  const [registerUrl, setRegisterUrl] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/competitors");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "競合チャンネルを読み込めませんでした");
      }
      setChannels(data.channels ?? []);
      setStats(data.stats ?? {});
    } catch (error) {
      setChannels([]);
      setStats({});
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setToggleError(null);
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
        setToggleError(data.error ?? "設定を更新できませんでした");
        await loadChannels();
      }
    } catch (error) {
      setToggleError(error instanceof Error ? error.message : "通信エラーが発生しました");
      await loadChannels();
    } finally {
      setSavingId(null);
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
      const data = await res.json();
      if (!res.ok) {
        setRegisterError(data.error ?? "登録に失敗しました");
        return;
      }
      setChannels(data.channels ?? []);
      setStats(data.stats ?? {});
      setRegisterUrl("");
    } catch {
      setRegisterError("通信エラーが発生しました");
    } finally {
      setRegistering(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="rounded-md border border-border bg-background/70 p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        aria-label="設定"
      >
        <Settings className="w-3.5 h-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle>競合チャンネル設定</DialogTitle>
          <DialogDescription>
            オンのチャンネルだけが、次回以降の市場分析に使われます。オフにすると候補生成から除外されます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <label className="block text-xs font-medium text-foreground">
              URL から競合チャンネルを登録
            </label>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              YouTube のチャンネル URL を入れると、この一覧に追加できます。
            </p>
            <div className="mt-3 flex gap-2">
              <input
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
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => void handleRegisterByUrl()}
                disabled={registering || !registerUrl.trim()}
                className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {registering ? "登録中…" : "登録"}
              </button>
            </div>
            {registerError && (
              <p className="mt-2 text-xs leading-relaxed text-red-500">{registerError}</p>
            )}
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              例: `https://www.youtube.com/channel/UC...` または `https://www.youtube.com/@handle`
            </p>
          </div>

          {loadError ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-400">
              {loadError}
            </p>
          ) : null}

          {toggleError ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-400">
              {toggleError}
            </p>
          ) : null}

          <div className="rounded-xl border border-border bg-background/60 p-2">
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
                  return (
                    <div
                      key={ch.channelId}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                        enabled
                          ? "border-emerald-500/25 bg-emerald-500/5"
                          : "border-border bg-muted/15",
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
                          "inline-flex h-9 w-20 shrink-0 items-center rounded-full border px-1 transition",
                          enabled
                            ? "justify-end border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                            : "justify-start border-border bg-muted text-muted-foreground",
                          saving && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <span className="sr-only">{enabled ? "オン" : "オフ"}</span>
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold shadow-sm",
                            enabled
                              ? "bg-white text-slate-900"
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
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <a
                            href={youtubeChannelUrl(ch.channelId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="line-clamp-2 text-sm font-semibold leading-snug text-foreground hover:text-primary hover:underline"
                          >
                            {ch.displayName}
                          </a>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
                              enabled
                                ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                                : "border border-border bg-muted text-muted-foreground",
                            )}
                          >
                            {saving ? "保存中…" : enabled ? "分析対象" : "除外中"}
                          </span>
                        </div>
                        <CompetitorSubscriberStats stats={stats[ch.channelId]} className="mt-1" />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {enabled
                            ? "次回の市場分析に含めます。"
                            : "次回の市場分析では除外します。"}
                        </p>
                      </div>
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
