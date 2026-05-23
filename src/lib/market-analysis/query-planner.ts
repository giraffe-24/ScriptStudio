import type { ThemeMode } from "./types";

const BASE_FALLBACK = "スマホ 便利 使い方 設定 無料 Google 効率化";

function withCategory(category: string | undefined, suffix: string): string {
  const base = category?.trim() || BASE_FALLBACK;
  if (!category?.trim()) return suffix.includes("スマホ") ? suffix : `${base} ${suffix}`.trim();
  return `${category.trim()} ${suffix}`.trim();
}

const EVERGREEN_SUFFIXES = [
  "使い方 設定 初心者",
  "便利 機能 まとめ",
  "ズボラ 簡単 コツ",
];

const TRENDY_SUFFIXES = [
  "新機能 2025 2026",
  "アップデート やり方",
  "最新 話題 変更点",
];

export function planSearchQueries(category: string | undefined, themeMode: ThemeMode): string[] {
  const evergreen = EVERGREEN_SUFFIXES.map((s) => withCategory(category, s));
  const trendy = TRENDY_SUFFIXES.map((s) => withCategory(category, s));

  switch (themeMode) {
    case "A":
      return evergreen;
    case "B":
      return trendy;
    case "C":
      return [...evergreen.slice(0, 2), ...trendy.slice(0, 2)];
    default:
      return evergreen;
  }
}

export function planPrimaryQuery(queries: string[]): string {
  return queries[0] ?? BASE_FALLBACK;
}

export function themeModeLabel(mode: ThemeMode): string {
  switch (mode) {
    case "A":
      return "定番・エバーグリーン";
    case "B":
      return "旬・ニュース";
    case "C":
      return "半々（バランス）";
  }
}

export function themeModeFit(mode: ThemeMode): "evergreen" | "trendy" | "balanced" {
  switch (mode) {
    case "A":
      return "evergreen";
    case "B":
      return "trendy";
    case "C":
      return "balanced";
  }
}
