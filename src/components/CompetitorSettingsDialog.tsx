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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        className="rounded-xl border border-slate-300 bg-slate-100 p-2 text-slate-500 shadow-sm transition-colors hover:border-sky-300 hover:bg-white hover:text-sky-600 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:bg-slate-600 dark:hover:text-sky-200"
        aria-label="設定"
      >
        <Settings className="w-3.5 h-3.5" />
      </DialogTrigger>
      <DialogContent className="border border-slate-200 bg-slate-50 text-slate-900 shadow-2xl sm:max-w-2xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50">
        <DialogHeader className="space-y-1">
          <DialogTitle>競合チャンネル設定</DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-300">
            オンのチャンネルだけが、次回以降の市場分析に使われます。オフにすると候補生成から除外されます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-700/80">
            <label className="block text-xs font-medium text-slate-800 dark:text-slate-100">
              URL から競合チャンネルを登録
            </label>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
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
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
              />
              <button
                type="button"
                onClick={() => void handleRegisterByUrl()}
                disabled={registering || !registerUrl.trim()}
                className="shrink-0 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:bg-sky-500 dark:hover:bg-sky-400 dark:disabled:bg-slate-600 dark:disabled:text-slate-300"
              >
                {registering ? "登録中…" : "登録"}
              </button>
            </div>
            {registerError && (
              <p className="mt-2 text-xs leading-relaxed text-rose-600 dark:text-rose-300">{registerError}</p>
            )}
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              例: `https://www.youtube.com/channel/UC...` または `https://www.youtube.com/@handle`
            </p>
          </div>

          {loadError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {loadError}
            </p>
          ) : null}

          {toggleError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {toggleError}
            </p>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-white/90 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-700/50">
            <div className="max-h-104 space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">読み込み中…</p>
              ) : channels.length === 0 ? (
                <p className="py-6 text-center text-sm leading-relaxed text-slate-500 dark:text-slate-300">
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
                        "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-colors",
                        enabled
                          ? "border-sky-200 bg-sky-50"
                          : "border-slate-200 bg-white",
                        enabled
                          ? "dark:border-sky-400/30 dark:bg-slate-700"
                          : "dark:border-slate-600 dark:bg-slate-700/70",
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
                          "inline-flex h-9 w-20 shrink-0 items-center rounded-full border px-1 transition shadow-inner",
                          enabled
                            ? "justify-end border-sky-300 bg-sky-100 text-sky-700"
                            : "justify-start border-slate-300 bg-slate-100 text-slate-500",
                          enabled
                            ? "dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-200"
                            : "dark:border-slate-500 dark:bg-slate-600 dark:text-slate-200",
                          saving && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <span className="sr-only">{enabled ? "オン" : "オフ"}</span>
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold shadow-sm",
                            enabled
                              ? "bg-white text-sky-700"
                              : "border border-slate-300 bg-white text-slate-500",
                            enabled
                              ? "dark:bg-slate-100 dark:text-sky-700"
                              : "dark:border-slate-500 dark:bg-slate-200 dark:text-slate-700",
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
                            className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 hover:text-sky-700 hover:underline dark:text-slate-50 dark:hover:text-sky-200"
                          >
                            {ch.displayName}
                          </a>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
                              enabled
                                ? "border border-sky-200 bg-sky-100 text-sky-700"
                                : "border border-slate-200 bg-slate-100 text-slate-500",
                              enabled
                                ? "dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-200"
                                : "dark:border-slate-500 dark:bg-slate-600 dark:text-slate-200",
                            )}
                          >
                            {saving ? "保存中…" : enabled ? "分析対象" : "除外中"}
                          </span>
                        </div>
                        <CompetitorSubscriberStats stats={stats[ch.channelId]} className="mt-1" />
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
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
