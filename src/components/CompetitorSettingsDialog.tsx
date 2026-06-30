"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import type { CompetitorChannel } from "@/lib/types";
import type { ChannelSubscriberStats } from "@/lib/market-analysis/subscriber-history";
import { cn } from "@/lib/utils";
import { youtubeChannelUrl } from "@/lib/youtube-channel-url";
import { CompetitorSubscriberStats } from "@/components/CompetitorSubscriberStats";
import { CompetitorChannelAvatar } from "@/components/CompetitorChannelAvatar";
import { Button } from "@/components/ui/button";
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
              <p className="mt-2 text-xs leading-relaxed text-destructive">{registerError}</p>
            )}
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              例: `https://www.youtube.com/channel/UC...` または `https://www.youtube.com/@handle`
            </p>
          </div>

          {loadError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
              {loadError}
            </p>
          ) : null}

          {toggleError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
              {toggleError}
            </p>
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
