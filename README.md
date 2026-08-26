# Bridge Tools

Product-led acquisition tools powered by Bridge.audio.

Bridge Tools lets people experience focused parts of Bridge before creating an account. The principle is simple: **deliver value first, convert second**.

## Phase 1 — Music Analyzer

Upload a track and let Bridge analyze what it sounds and feels like: genre, mood, vocals, language, instruments, movement, Soundslike / era, effects, lyrics/themes, BPM and key when available.

The first analysis should be useful without an account. A Bridge account unlocks continuation actions such as generating a contextual pitch, saving to Bridge and analyzing more tracks.

## Product principles

- Powered by real Bridge technology, never fake demos.
- One clear job per tool.
- Bridge-native, with a leaner public expression of the design system.
- Swiss structure, Apple-like restraint, Gen Z immediacy.
- Built for international SEO, SEA and AI search.
- Signup should unlock continuation, not block the first moment of value.

## Target structure

```text
bridge-tools/
├── apps/
│   └── music-analyzer/
├── packages/
│   ├── bridge-ui/
│   ├── music-analysis/
│   └── pitch-engine/
├── docs/
└── README.md
```

## Music Analyzer architecture

```text
Public visitor
      ↓
Music Analyzer UI
      ↓
Public Tools API / BFF
      ↓
Temporary Bridge Storage
      ↓
Bridge AI Processor
      ↓
Normalized MusicAnalysis
      ↓
Full result
      ↓
Pitch / Save / Analyze more
```

The browser must never call private Bridge services directly.

## Security

Never commit production credentials, API secrets, private keys, access tokens or production `.env` files. Anonymous audio should remain temporary unless the user explicitly saves it to Bridge.

## Status

Current work lives on `feat/music-analyzer` before migration into the main Bridge GitLab infrastructure.
