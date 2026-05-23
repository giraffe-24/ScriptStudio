import type { EpisodeStatus } from "./episode-status";
export type { EpisodeStatus } from "./episode-status";
export type ThemePattern = "market" | "user-input";

export interface ChannelConfig {
  brand: string;
  audience: string;
  quality: string;
  planning?: string;
  themeSelection?: string;
  marketAnalysisRubric?: string;
}

export interface Episode {
  id: string;
  number: number;
  slug: string;
  title: string;
  status: EpisodeStatus;
  themePattern?: ThemePattern;
  createdAt: string;
  hook?: string;
  targetPain?: string;
  reason?: string;
  hasScriptDraft?: boolean;
  hasRevision?: boolean;
}

export interface ThemeCandidate {
  title: string;
  hook: string;
  targetPain: string;
  reason: string;
  score: "high" | "medium" | "low";
  searchVolume?: string;
}

export type ThemeMode = "A" | "B" | "C";

export interface ReferencedVideo {
  title: string;
  url: string;
  channel: string;
  viewCount?: string;
}

export interface EnrichedCandidate extends ThemeCandidate {
  differentiationAngle: string;
  competitionDensity: "low" | "medium" | "high";
  ownChannelRelation: "new" | "series" | "near_duplicate";
  seriesPotential?: string;
  titleAlternatives?: string[];
  referencedVideos: ReferencedVideo[];
  competitorNotes?: string;
  overlapWarning?: string;
  themeModeFit: "evergreen" | "trendy" | "balanced";
}

export interface CompetitorChannel {
  channelId: string;
  displayName: string;
  addedAt: string;
}

export interface CompetitorSuggestion {
  channelId: string;
  displayName: string;
  videoCount: number;
  source: "dynamic" | "approved";
}

export interface PlanSection {
  id: string;
  label: string;
  content: string;
  editable: boolean;
}

export interface PlanningDoc {
  episodeTitle: string;
  theme: string;
  sections: PlanSection[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ScriptParagraph {
  id: string;
  content: string;
  sectionLabel?: string;
}
