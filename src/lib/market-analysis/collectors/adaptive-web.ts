import type { GoogleWebResult } from "@/lib/theme-search";
import { searchGoogleWeb } from "@/lib/theme-search";
import type { ThemeMode } from "../types";

const OFFICIAL_SITES = [
  "site:blog.google.com",
  "site:support.google.com",
  "site:android.com",
];

export async function collectAdaptiveWeb(
  category: string | undefined,
  themeMode: ThemeMode,
): Promise<GoogleWebResult[]> {
  if (themeMode === "A") return [];

  const topic = category?.trim() || "Google スマホ";
  const queries = OFFICIAL_SITES.map((site) => `${topic} ${site}`);

  const batches = await Promise.all(queries.map((q) => searchGoogleWeb(q)));
  const seen = new Set<string>();
  const merged: GoogleWebResult[] = [];

  for (const batch of batches) {
    for (const item of batch) {
      if (seen.has(item.link)) continue;
      seen.add(item.link);
      merged.push(item);
    }
  }

  return merged.slice(0, 15);
}
