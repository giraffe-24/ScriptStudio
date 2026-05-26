"use client";

import { youtubeChannelUrl } from "@/lib/youtube-channel-url";

interface Props {
  channelId: string;
  displayName: string;
  thumbnailUrl?: string | null;
  size?: number;
}

export function CompetitorChannelAvatar({
  channelId,
  displayName,
  thumbnailUrl,
  size = 36,
}: Props) {
  return (
    <a
      href={youtubeChannelUrl(channelId)}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border"
      style={{ width: size, height: size }}
      aria-label={`${displayName} の YouTube チャンネル`}
    >
      {thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground"
          aria-hidden
        >
          YT
        </span>
      )}
    </a>
  );
}
