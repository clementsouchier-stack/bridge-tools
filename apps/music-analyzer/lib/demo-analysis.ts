import type { MusicAnalysis } from "@bridge-tools/music-analysis";

const tag = (id: string, name: string, confidence: number) => ({ id, name, confidence });

export const demoAnalysis: MusicAnalysis = {
  fileId: "demo-track",
  status: "complete",
  genre: [
    tag("genre-1", "Alternative Pop", 0.93),
    tag("genre-2", "Dream Pop", 0.88),
    tag("genre-3", "Indie Pop", 0.78),
  ],
  mood: [
    tag("mood-1", "Dreamy", 0.91),
    tag("mood-2", "Intimate", 0.87),
    tag("mood-3", "Nostalgic", 0.82),
    tag("mood-4", "Hopeful", 0.73),
    tag("mood-5", "Ethereal", 0.69),
  ],
  vocals: {
    type: [tag("vocal-1", "Lead Vocal", 0.94)],
    dynamics: [
      tag("vocal-2", "Sweet", 0.86),
      tag("vocal-3", "Laid Back", 0.74),
    ],
    language: ["English"],
  },
  instruments: [
    tag("instrument-1", "Synthesizer", 0.9),
    tag("instrument-2", "Electric Guitar", 0.84),
    tag("instrument-3", "Bass", 0.8),
    tag("instrument-4", "Drum Machine", 0.76),
  ],
  movement: [
    tag("movement-1", "Build Up", 0.89),
    tag("movement-2", "Floating", 0.82),
    tag("movement-3", "Linear", 0.7),
  ],
  soundslike: [tag("sound-1", "Sounds 80s", 0.84)],
  fx: [
    tag("fx-1", "Reverb", 0.88),
    tag("fx-2", "Atmospheric", 0.77),
  ],
  lyrics: {
    themes: [
      tag("theme-1", "Love / Romance", 0.86),
      tag("theme-2", "Nostalgia", 0.79),
      tag("theme-3", "Youth", 0.71),
    ],
    imagery: [tag("image-1", "Night", 0.73)],
  },
  musicalFeatures: {
    bpm: 118,
    key: "D minor",
  },
  summary:
    "A dreamy, nostalgic alternative-pop track with intimate vocals, atmospheric synth textures and a gradual cinematic build.",
};
