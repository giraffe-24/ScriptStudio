import type { EpisodeStatus } from "./episode-status";
export type { EpisodeStatus } from "./episode-status";
export type ThemePattern = "market" | "user-input";

export interface ChannelConfig {
  brand: string;
  audience: string;
  quality: string;
  planning?: string;
  themeSelection?: string;
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
}

export interface ThemeCandidate {
  title: string;
  hook: string;
  targetPain: string;
  reason: string;
  score: "high" | "medium" | "low";
  searchVolume?: string;
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
