# Music Analyzer Public API

This document defines the public-safe contract between the Music Analyzer frontend and the Bridge backend/BFF.

## Principles

- The browser must never call internal Bridge services directly.
- Public uploads are temporary until a signed-in user explicitly saves the track to Bridge.
- Internal tag, family and category IDs are normalized server-side into human-readable analysis groups.
- The API exposes explicit processing states so the UI never relies on 404 polling semantics.

## 1. Create temporary upload

`POST /tools/music-analyzer/uploads`

### Response

```json
{
  "fileId": "uuid",
  "uploadUrl": "https://...",
  "expiresAt": "2026-08-26T12:00:00Z"
}
```

The frontend uploads the selected audio file to `uploadUrl` using the Bridge-compatible TUS flow.

## 2. Start analysis

`POST /tools/music-analyzer/{fileId}/analysis`

### Response

```json
{
  "fileId": "uuid",
  "status": "queued"
}
```

The BFF delegates to the existing Bridge AI Processor using an Analyzer-specific inference mode.

## 3. Read analysis state/result

`GET /tools/music-analyzer/{fileId}/analysis`

### Processing response

```json
{
  "fileId": "uuid",
  "status": "analyzing"
}
```

### Complete response

```json
{
  "fileId": "uuid",
  "status": "complete",
  "genre": [],
  "mood": [],
  "vocals": {
    "type": [],
    "dynamics": [],
    "language": []
  },
  "instruments": [],
  "movement": [],
  "soundslike": [],
  "fx": [],
  "lyrics": {
    "themes": [],
    "imagery": []
  },
  "musicalFeatures": {
    "bpm": 118,
    "key": "D minor"
  }
}
```

## States

The UI may receive:

- `queued`
- `analyzing`
- `complete`
- `error`

## Errors

Errors should be normalized into stable public codes, for example:

```json
{
  "fileId": "uuid",
  "status": "error",
  "error": {
    "code": "track_too_short",
    "message": "This audio file is too short to analyze."
  }
}
```

Initial codes should map existing AI Processor failures such as malformed track, too short, too long and unknown processing errors.

## Security / abuse controls

The production BFF should enforce file type/size limits, rate limiting, temporary retention, server-side credentials, abuse protection and deletion of anonymous files after expiry.
