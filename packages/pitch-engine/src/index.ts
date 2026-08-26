import type { MusicAnalysis } from "@bridge-tools/music-analysis";

export type PitchFormat =
  | "GENERAL"
  | "DSP"
  | "SUPERVISOR"
  | "PRESS"
  | "LIVE"
  | "INFLUENCER"
  | "CRITICAL_REVIEW"
  | "WIKIPEDIA"
  | "HATER";

export type PitchLength = "SHORT" | "STANDARD" | "LONG";

export type PitchFocus =
  | "AUTO"
  | "MOOD"
  | "GENRE"
  | "LYRICS"
  | "IMAGERY"
  | "CONTEXT"
  | "USE_CASE";

export type PitchRequest = {
  analysis: MusicAnalysis;
  format: PitchFormat;
  length: PitchLength;
  focus: PitchFocus[];
  language: string;
  optionalContext?: string;
  maxCharacters?: number;
};

export type PitchVariant = {
  id: string;
  label: string;
  text: string;
};

export type PitchResponse = {
  format: PitchFormat;
  variants: PitchVariant[];
};
