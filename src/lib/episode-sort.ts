import type { Episode } from "./types";

/** 番号の大きい順（新しい順）。#58 が上、#54 が下 */
export function sortEpisodesByNumberDesc(episodes: Episode[]): Episode[] {
  return [...episodes].sort((a, b) => b.number - a.number);
}
