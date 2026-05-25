import { loadChannelConfig, buildSystemPrompt } from "@/lib/config-loader";
import {
  formatVideoSummary,
  searchGoogleWeb,
  searchXPosts,
  THEME_SEARCH_RULES,
} from "@/lib/theme-search";
import type { EnrichedCandidate } from "@/lib/types";
import { collectAdaptiveWeb } from "./collectors/adaptive-web";
import { collectCompetitorVideos } from "./collectors/competitors";
import { collectOwnChannelHistory } from "./collectors/own-channel";
import { collectYouTubeWithRescue, competitorVideosToYouTube, ensureEnrichedCandidates } from "./guaranteed-search";
import { loadMarketAnalysisRubric } from "./prompts";
import { createProgressLog, markStep } from "./progress";
import {
  planPrimaryQuery,
  planSearchQueries,
  themeModeFit,
  themeModeLabel,
} from "./query-planner";
import { runAngleClusterStage } from "./pipeline/angle-cluster";
import { runCandidateGenerateStage } from "./pipeline/candidate-generate";
import { applyOverlapPostProcessing } from "./pipeline/overlap";
import type { CollectedData, MarketAnalysisInput, MarketAnalysisResult } from "./types";

function formatGoogleSummary(results: { title: string; snippet: string; link: string }[]): string {
  if (results.length === 0) return "=== Google 検索（補助） ===\n（結果なし）";
  return `=== Google 検索（補助） ===\n${results
    .slice(0, 10)
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   ${r.link}`)
    .join("\n")}`;
}

function formatXSummary(
  posts: { text: string; author?: string; url?: string; createdAt?: string }[],
): string {
  if (posts.length === 0) return "=== X（SNS）検索（補助） ===\n（結果なし）";
  return `=== X（SNS）検索（補助） ===\n${posts
    .slice(0, 10)
    .map((p, i) => {
      const meta = [p.author ? `@${p.author}` : null, p.createdAt?.slice(0, 10), p.url]
        .filter(Boolean)
        .join(", ");
      return `${i + 1}. ${p.text}${meta ? `\n   (${meta})` : ""}`;
    })
    .join("\n")}`;
}

function formatOfficialSummary(results: { title: string; snippet: string; link: string }[]): string {
  if (results.length === 0) return "=== 公式情報（補助） ===\n（結果なし）";
  return `=== 公式情報（補助） ===\n${results
    .slice(0, 8)
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   ${r.link}`)
    .join("\n")}`;
}

function formatCompetitorSummary(
  videos: CollectedData["competitorVideos"],
): string {
  if (videos.length === 0) return "=== 競合チャンネル直近動画 ===\n（結果なし）";
  return `=== 競合チャンネル直近動画 ===\n${videos
    .slice(0, 20)
    .map(
      (v, i) =>
        `${i + 1}. [${v.channelTitle}] 「${v.title}」${v.viewCount ? ` (${Number(v.viewCount).toLocaleString()}回)` : ""}${v.url ? ` ${v.url}` : ""}`,
    )
    .join("\n")}`;
}

function formatOwnChannelSummary(entries: CollectedData["ownChannelTitles"]): string {
  if (entries.length === 0) return "=== 自チャンネル履歴 ===\n（結果なし）";
  return `=== 自チャンネル履歴 ===\n${entries
    .slice(0, 40)
    .map(
      (e, i) =>
        `${i + 1}. 「${e.title}」(${e.source}${e.status ? `, ${e.status}` : ""}${e.number ? `, #${e.number}` : ""})`,
    )
    .join("\n")}`;
}

function normalizeCandidate(c: EnrichedCandidate, defaultFit: ReturnType<typeof themeModeFit>): EnrichedCandidate {
  return {
    ...c,
    referencedVideos: c.referencedVideos ?? [],
    differentiationAngle: c.differentiationAngle ?? "",
    competitionDensity: c.competitionDensity ?? "medium",
    ownChannelRelation: c.ownChannelRelation ?? "new",
    themeModeFit: c.themeModeFit ?? defaultFit,
  };
}

async function collectAllData(
  category: string | undefined,
  themeMode: MarketAnalysisInput["themeMode"],
): Promise<CollectedData> {
  const queries = planSearchQueries(category, themeMode);
  const primaryQuery = planPrimaryQuery(queries);

  let youtube = await collectYouTubeWithRescue(queries);

  const [google, x, officialWeb, ownChannelTitles] = await Promise.all([
    searchGoogleWeb(primaryQuery),
    searchXPosts(primaryQuery),
    collectAdaptiveWeb(category, themeMode),
    collectOwnChannelHistory(),
  ]);

  const { competitorVideos, suggestions } = await collectCompetitorVideos(youtube);

  if (youtube.length === 0 && competitorVideos.length > 0) {
    youtube = competitorVideosToYouTube(competitorVideos);
  }

  return {
    queries,
    youtube,
    google,
    x,
    officialWeb,
    competitorVideos,
    ownChannelTitles,
    competitorSuggestions: suggestions,
  };
}

export async function runMarketAnalysis(
  input: MarketAnalysisInput,
): Promise<MarketAnalysisResult> {
  const { category, themeMode, onProgress } = input;
  let progressLog = createProgressLog();

  const emit = (id: Parameters<typeof markStep>[1], status: "running" | "done") => {
    progressLog = markStep(progressLog, id, status);
    const step = progressLog.find((s) => s.id === id);
    if (step && onProgress) onProgress(step);
  };

  emit("search", "running");
  const data = await collectAllData(category, themeMode);
  emit("search", "done");

  const modeLabel = themeModeLabel(themeMode);
  const modeFit = themeModeFit(themeMode);

  emit("competitors", "running");
  emit("competitors", "done");

  emit("own_channel", "running");
  emit("own_channel", "done");

  const config = await loadChannelConfig();
  const systemPrompt = buildSystemPrompt(config);
  const rubric = `${THEME_SEARCH_RULES}\n${await loadMarketAnalysisRubric()}`;

  const youtubeSummary = `=== 【第一指標】YouTube 検索結果 ===\n${formatVideoSummary(data.youtube)}`;
  const googleSummary = formatGoogleSummary(data.google);
  const xSummary = formatXSummary(data.x);
  const officialSummary = formatOfficialSummary(data.officialWeb);
  const competitorSummary = formatCompetitorSummary(data.competitorVideos);
  const ownChannelSummary = formatOwnChannelSummary(data.ownChannelTitles);

  let angleAnalysis = "";
  try {
    emit("angle_cluster", "running");
    angleAnalysis = await runAngleClusterStage(systemPrompt, {
      queries: data.queries,
      youtubeSummary,
      googleSummary,
      xSummary,
      officialSummary,
      competitorSummary,
      ownChannelSummary,
      themeModeLabel: modeLabel,
      rubric,
    });
  } catch (err) {
    console.warn("[market-analysis] angle_cluster fallback:", err);
  }
  emit("angle_cluster", "done");

  emit("candidates", "running");
  let candidates: EnrichedCandidate[] = [];
  try {
    candidates = await runCandidateGenerateStage(systemPrompt, {
      angleAnalysis,
      youtubeSummary,
      googleSummary,
      xSummary,
      officialSummary,
      competitorSummary,
      ownChannelSummary,
      themeModeLabel: modeLabel,
      themeModeFit: modeFit,
      rubric,
    });
  } catch (err) {
    console.warn("[market-analysis] candidates fallback:", err);
  }
  emit("candidates", "done");

  emit("overlap", "running");
  candidates = applyOverlapPostProcessing(
    ensureEnrichedCandidates(candidates, data.youtube, { themeMode, category }).map((c) =>
      normalizeCandidate(c, modeFit),
    ),
    data.ownChannelTitles,
  );
  if (candidates.length < 6) {
    const toppedUp = ensureEnrichedCandidates(candidates, data.youtube, {
      themeMode,
      category,
    }).map((c) => normalizeCandidate(c, modeFit));
    const existingTitles = new Set(candidates.map((c) => c.title));
    const extras = toppedUp.filter((c) => !existingTitles.has(c.title));
    if (extras.length > 0) {
      candidates = [
        ...candidates,
        ...applyOverlapPostProcessing(extras, data.ownChannelTitles),
      ];
    }
  }
  emit("overlap", "done");

  const dynamicSuggestions = data.competitorSuggestions.filter((s) => s.source === "dynamic");

  return {
    candidates,
    searchSources: {
      youtube: data.youtube.length > 0,
      google: data.google.length > 0,
      x: data.x.length > 0,
    },
    competitorSuggestions: dynamicSuggestions,
    progressLog,
    angleAnalysis,
  };
}

export { appendCompetitorsConfig, readCompetitorsConfig } from "./competitors-config";
