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
  /** あらきりらしさメモ（推敲差分から学習した文体データ。style-learnings.ts） */
  voiceLearnings?: string;
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
  enabled?: boolean;
}

export interface CompetitorSuggestion {
  channelId: string;
  displayName: string;
  videoCount: number;
  source: "dynamic" | "approved";
}

/** 方向性確認フェーズ：設計思想の軸（柱） */
export interface DirectionAxis {
  title: string; // 日本語タイトル（例：安全な操作から危険な操作へ）
  subtitle: string; // 英語サブタイトル（例：Safety-First Progression）
  description: string; // 軸の説明
}

/** 方向性確認フェーズの成果物（大枠概要 + 設計思想の6本柱） */
export interface PlanDirection {
  overview: string; // 大枠概要（企画書の方向性）
  axes: DirectionAxis[]; // 設計思想の6本柱
}

/** plan.json / 企画書 API の共通型 */
export interface EpisodePlan {
  episodeTitle: string;
  targetViewer: string;
  pain: string;
  promise: string;
  keyPoints: string[];
  outline: { section: string; content: string }[];
  competitorAnalysis: string;
  estimatedLength: string;
  youtubeGoal?: string;
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
