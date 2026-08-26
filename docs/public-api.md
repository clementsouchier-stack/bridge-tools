# Music Analyzer Public API

This document defines the public-safe contract between the Music Analyzer frontend and the Bridge backend/BFF.

## Principles

- The browser must never call internal Bridge services directly.
- Public uploads are temporary until a signed-in user explicitly saves the track to Bridge.
- The upload flow mirrors the existing Bridge webapp TUS lifecycle: initialize → upload to a pre-created TUS resource URL → finalize.
- Internal tag, family and category IDs are normalized server-side into human-readable analysis groups.
- The API exposes explicit processing states so the UI never relies on internal 404 polling semantics.

## 1. Initialize temporary upload

`POST /tools/music-analyzer/uploads`

### Request

```json
{
  "fileName": "track.wav",
  "fileSize": 12345678,
  "mimeType": "audio/wav"
}
```

### Response

```json
{
  "uploadId": "uuid",
  "uploadUrl": "https://...pre-created-tus-resource...",
  "expiresAt": "2026-08-26T12:00:00Z"
}
```

`uploadUrl` is a pre-created TUS resource URL, matching the current Bridge webapp behavior. The frontend assigns this URL to the TUS upload instance and sends `uploadId` as upload metadata.

## 2. Upload audio with TUS

The browser uploads the selected audio directly to the returned pre-created TUS resource.

Important production parity details:

- retry delays should remain conservative
- a 403 should not be retried indefinitely
- the upload fingerprint should be removed after success
- `uploadId` is included in TUS metadata

## 3. Finalize temporary upload

`POST /tools/music-analyzer/uploads/{uploadId}/complete`

This BFF operation finalizes the temporary upload using Bridge storage/file primitives and creates the file record required by AI Processor.

### Response

```json
{
  "fileId": "uuid"
}
```

The exact internal implementation may differ from the existing Library `AddLibraryFile` mutation because anonymous Music Analyzer uploads must not require a workspace or library. The public contract should remain stable.

## 4. Start analysis

`POST /tools/music-analyzer/{fileId}/analysis`

### Response

```json
{
  "fileId": "uuid",
  "status": "queued"
}
```

The BFF delegates to the existing Bridge AI Processor using an Analyzer-specific inference strategy without changing behavior for existing Bridge consumers.

## 5. Read analysis state/result

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
  },
  "summary": "A concise natural-language description of the track."
}
```

`summary` may be produced by the editorial layer rather than AI Processor itself. Its source should remain explicit in backend implementation even though the frontend consumes one normalized object.

## States

The UI may receive:

- `queued`
- `analyzing`
- `complete`
- `error`

Upload progress remains a client-side TUS concern and maps to the UI `uploading` state.

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

Initial codes should map existing AI Processor failures such as:

- `track_too_short`
- `track_too_long`
- `malformed_track`
- `unknown`

## Security / abuse controls

The production BFF should enforce:

- accepted audio types
- file size and duration limits
- anonymous rate limiting
- temporary retention and deletion
- server-side credentials only
- abuse protection / challenge when required
- internal service isolation
- taxonomy resolution
- stable error mapping

No internal Bridge hostname, service token or credential should ever reach the browser.
