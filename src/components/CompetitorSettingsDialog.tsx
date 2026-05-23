"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import type { CompetitorChannel } from "@/lib/types";
import type { ChannelSubscriberStats } from "@/lib/market-analysis/subscriber-history";
import { youtubeChannelUrl } from "@/lib/youtube-channel-url";
import { CompetitorSubscriberStats } from "@/components/CompetitorSubscriberStats";
import { CompetitorChannelAvatar } from "@/components/CompetitorChannelAvatar";
import { Switch } from "@/components/ui/switch";
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

  const loadChannels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/competitors");
      const data = await res.json();
      setChannels(data.channels ?? []);
      setStats(data.stats ?? {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void loadChannels();
  }, [open, loadChannels]);

  async function handleToggle(channelId: string, enabled: boolean) {
    setSavingId(channelId);
    setChannels((prev) =>
      prev.map((c) => (c.channelId === channelId ? { ...c, enabled } : c)),
    );
    try {
      const res = await fetch("/api/competitors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: [{ channelId, enabled }] }),
      });
      const data = await res.json();
      if (res.ok) {
        setChannels(data.channels ?? []);
      } else {
        await loadChannels();
      }
    } catch {
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
        className="text-gray-400 hover:text-blue-500 border border-gray-200 hover:border-blue-300 p-1.5 rounded-md transition-colors"
        aria-label="設定"
      >
        <Settings className="w-3.5 h-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
          <DialogDescription>
            競合チャンネルをオン・オフできます。オフにした ch は次回以降の市場分析に含まれません。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="block text-[11px] font-medium text-gray-600">
            URL から競合 ch を登録
          </label>
          <div className="flex gap-2">
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
              className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              type="button"
              onClick={() => void handleRegisterByUrl()}
              disabled={registering || !registerUrl.trim()}
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registering ? "登録中…" : "登録"}
            </button>
          </div>
          {registerError && (
            <p className="text-[11px] text-red-500 leading-relaxed">{registerError}</p>
          )}
          <p className="text-[10px] text-gray-400 leading-relaxed">
            例: https://www.youtube.com/channel/UC… または https://www.youtube.com/@handle
          </p>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2">
          {loading ? (
            <p className="text-xs text-gray-400 py-4 text-center">読み込み中…</p>
          ) : channels.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center leading-relaxed">
              登録済みの競合チャンネルがありません。
              <br />
              上の URL 入力欄から追加できます。
            </p>
          ) : (
            channels.map((ch) => (
              <div
                key={ch.channelId}
                className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5"
              >
                <Switch
                  checked={ch.enabled !== false}
                  disabled={savingId === ch.channelId}
                  onCheckedChange={(checked) => handleToggle(ch.channelId, checked)}
                />
                <CompetitorChannelAvatar
                  channelId={ch.channelId}
                  displayName={ch.displayName}
                  thumbnailUrl={stats[ch.channelId]?.thumbnailUrl}
                />
                <div className="min-w-0 flex-1">
                  <a
                    href={youtubeChannelUrl(ch.channelId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-600 hover:underline leading-snug line-clamp-2"
                  >
                    {ch.displayName}
                  </a>
                  <CompetitorSubscriberStats stats={stats[ch.channelId]} className="mt-0.5" />
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
