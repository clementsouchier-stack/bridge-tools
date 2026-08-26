# Bridge Tools

**Product-led acquisition tools powered by Bridge.audio.**

Bridge Tools is a collection of lightweight public music utilities designed to let users experience core Bridge.audio capabilities before creating an account.

The goal is simple:

**Deliver value first. Convert second.**

Each tool should feel fast, focused and immediately useful while remaining deeply connected to the Bridge.audio product ecosystem.

## Product principles

Bridge Tools should be:

- **Useful before signup** — users must experience real product value before being asked to create an account.
- **Powered by real Bridge technology** — no fake demos or parallel analysis engines.
- **Extremely focused** — one clear job per tool.
- **Bridge-native** — built from the Bridge design system, expressed in a leaner, more editorial way.
- **Minimal by design** — Swiss structure, Apple-like restraint, Gen Z immediacy.
- **International** — designed for global SEO, SEA and AI search from day one.
- **Conversion-oriented** — account creation should naturally unlock continuation, saving, collaboration or deeper functionality.
- **Reusable** — shared UI, analysis and API layers should support multiple acquisition tools.

## Planned tools

### Music Analyzer

Upload a track and let Bridge analyze what it sounds and feels like.

Potential output includes:

Genre and subgenres, mood and emotional characteristics, vocals, language, vocal dynamics, instruments and textures, movement, effects, Soundslike / era, lyrics and themes, BPM and key.

The first full analysis should be available without an account.

A Bridge account then unlocks continuation actions such as:

**Generate a contextual pitch · Save to Bridge · Analyze more tracks**

### Find

Find music either by describing what you need or by providing a reference track.

### Share

Create beautiful, persistent music-sharing experiences built for professional workflows.

### Music + Video

A deliberately simple music-first tool to place an audio track on a video, adjust timing and fades, preview the result and export.

## Music Analyzer flow

```text
Public visitor
      ↓
Upload audio
      ↓
Temporary Bridge file
      ↓
Bridge AI Processor
      ↓
Normalized music analysis
      ↓
Full result
      ↓
Continue with Bridge
      ↓
Pitch / Save / Analyze more
```

## Music Analyzer architecture

The public frontend should never expose Bridge internal infrastructure directly.

```text
Bridge Tools
     ↓
Public Tools API / BFF
     ↓
Bridge Storage
     ↓
AI Processor
     ↓
Normalized Analysis
     ↓
Bridge Tools UI
```

The Tools API is responsible for public-safe upload handling, temporary files, rate limiting, analysis status, error handling, taxonomy resolution and normalization.

## Music analysis

The Music Analyzer must reuse the existing Bridge.audio analysis pipeline.

The frontend should consume a normalized analysis object instead of working directly with internal tag, family and category IDs.

Conceptually:

```ts
type MusicAnalysis = {
  fileId: string;

  track?: {
    title?: string;
    artist?: string;
  };

  genre: Tag[];
  mood: Tag[];

  vocals: {
    type?: Tag[];
    dynamics?: Tag[];
    language?: string[];
  };

  instruments: Tag[];
  movement: Tag[];
  soundslike: Tag[];
  fx: Tag[];

  lyrics?: {
    text?: string;
    themes?: Tag[];
    imagery?: Tag[];
  };

  musicalFeatures?: {
    bpm?: number;
    key?: string;
  };
};

type Tag = {
  id: string;
  name: string;
  confidence?: number;
};
```

## Pitch Engine

The Pitch Engine converts Bridge music analysis into audience-specific editorial writing.

Initial Music Analyzer formats:

```text
GENERAL
DSP
SUPERVISOR
```

In the UI, `SUPERVISOR` is presented as **Sync**.

The underlying engine is designed to support additional formats including Press, Live, Influencer, Critical Review, Wikipedia-style neutral writing and Hater mode.

Pitch generation should use Bridge analysis as evidence rather than simply converting tags into sentences.

## Design direction

Bridge Tools uses the existing Bridge.audio design system as its foundation.

The Tools expression should be even leaner than the main application:

**Bridge underneath. Less UI on the surface.**

Direction:

**Swiss structure**  
**Apple-like restraint**  
**Gen Z immediacy**  
**Bridge product credibility**

Whitespace, typography, hierarchy and interaction should create the visual impact. Decorative UI should be kept to a minimum.

The user's music is the hero.

## Repository structure

Target structure:

```text
bridge-tools/
├── apps/
│   └── music-analyzer/
│
├── packages/
│   ├── bridge-ui/
│   ├── music-analysis/
│   └── pitch-engine/
│
├── docs/
│
└── README.md
```

Future tools can be added under `apps/` while sharing the same foundations.

## Security

This repository must not contain production credentials, private keys, access tokens, API secrets or production `.env` files.

Internal Bridge services must be accessed through server-side adapters or a dedicated public Tools API.

User-uploaded audio should be treated as temporary unless the user explicitly chooses to save it to Bridge.

## Status

**Phase 1 — Music Analyzer**

Current priorities:

1. Establish the public Tools architecture.
2. Connect temporary audio upload to the existing Bridge pipeline.
3. Normalize AI Processor results.
4. Build the Music Analyzer public experience.
5. Add Bridge signup / login continuation.
6. Integrate the Bridge Pitch Engine.
7. Prepare SEO, SEA and AI-search landing structure.
8. Validate before migration into the main Bridge GitLab infrastructure.

---

**Bridge.audio**

*Simplify. Amplify.*