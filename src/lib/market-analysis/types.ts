import type {
  CompetitorSuggestion,
  EnrichedCandidate,
  ThemeMode,
} from "@/lib/types";
import type { ThemeSearchSources } from "@/lib/theme-search";

export type { ThemeMode, EnrichedCandidate, CompetitorSuggestion };

export type ProgressStepId =
  | "search"
  | "competitors"
  | "own_channel"
  | "angle_cluster"
  | "candidates"
  | "overlap";

export interface ProgressStep {
  id: ProgressStepId;
  label: string;
  status: "pending" | "running" | "done";
}

export interface MarketAnalysisInput {
  category?: string;
  themeMode: ThemeMode;
  onProgress?: (step: ProgressStep) => void;
}

export interface MarketAnalysisResult {
  candidates: EnrichedCandidate[];
  searchSources: ThemeSearchSources;
  competitorSuggestions: CompetitorSuggestion[];
  progressLog: ProgressStep[];
  angleAnalysis?: string;
}

export interface CollectedData {
  queries: string[];
  youtube: import("@/lib/theme-search").YouTubeVideo[];
  google: import("@/lib/theme-search").GoogleWebResult[];
  x: import("@/lib/theme-search").XPostResult[];
  officialWeb: import("@/lib/theme-search").GoogleWebResult[];
  competitorVideos: CompetitorVideo[];
  ownChannelTitles: OwnChannelEntry[];
  competitorSuggestions: CompetitorSuggestion[];
}

export interface CompetitorVideo {
  channelId: string;
  channelTitle: string;
  title: string;
  url: string;
  viewCount?: string;
  publishedAt?: string;
  source: "fixed" | "dynamic";
}

export interface OwnChannelEntry {
  title: string;
  source: "outputs" | "youtube";
  status?: string;
  number?: number;
}
