export type AnalysisTag = {
  id: string;
  name: string;
  confidence?: number;
};

export type AnalysisStatus =
  | "idle"
  | "uploading"
  | "queued"
  | "analyzing"
  | "complete"
  | "error";

export type MusicAnalysis = {
  fileId: string;
  status: AnalysisStatus;
  track?: {
    title?: string;
    artist?: string;
  };
  genre: AnalysisTag[];
  mood: AnalysisTag[];
  vocals: {
    type?: AnalysisTag[];
    dynamics?: AnalysisTag[];
    language?: string[];
  };
  instruments: AnalysisTag[];
  movement: AnalysisTag[];
  soundslike: AnalysisTag[];
  fx: AnalysisTag[];
  lyrics?: {
    text?: string;
    themes?: AnalysisTag[];
    imagery?: AnalysisTag[];
  };
  musicalFeatures?: {
    bpm?: number;
    key?: string;
  };
  summary?: string;
};
