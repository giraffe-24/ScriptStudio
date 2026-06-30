"use client";

import { useState } from "react";
import { youtubeChannelUrl } from "@/lib/youtube-channel-url";

interface Props {
  channelId: string;
  displayName: string;
  thumbnailUrl?: string | null;
  size?: number;
  /**
   * 同じチャンネルへのリンクが隣接する場合に false を渡すと、
   * このアバターをキーボードフォーカス・支援技術から除外して
   * アクセシブルなリンクを 1 つに集約する（クリックは引き続き可能）。
   */
  interactive?: boolean;
}

export function CompetitorChannelAvatar({
  channelId,
  displayName,
  thumbnailUrl,
  size = 36,
  interactive = true,
}: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const [lastUrl, setLastUrl] = useState(thumbnailUrl);

  // サムネ URL が変わったら失敗フラグをリセット（render 中に調整）
  if (thumbnailUrl !== lastUrl) {
    setLastUrl(thumbnailUrl);
    setImgFailed(false);
  }

  const showImage = Boolean(thumbnailUrl) && !imgFailed;

  return (
    <a
      href={youtubeChannelUrl(channelId)}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border"
      style={{ width: size, height: size }}
      {...(interactive
        ? { "aria-label": `${displayName} の YouTube チャンネル` }
        : { tabIndex: -1, "aria-hidden": true })}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl ?? undefined}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground"
          aria-hidden
        >
          YT
        </span>
      )}
    </a>
  );
}
