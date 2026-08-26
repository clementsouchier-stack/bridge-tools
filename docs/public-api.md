# Music Analyzer Public API

This document defines the public-safe contract between the Music Analyzer frontend and the Bridge backend/BFF.

## Principles

- The browser must never call internal Bridge services directly.
- Public uploads are temporary until a signed-in user explicitly saves the track to Bridge.
- The upload flow mirrors the existing Bridge webapp TUS lifecycle: initialize → upload to a pre-created TUS resource URL → verify completion → claim into a Bridge file.
- The Upload Gateway itself finishes the underlying multipart upload when the final TUS chunk is received.
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

Internally, the BFF creates this upload through the existing Storage API `POST /api/v1/upload` primitive.

## 2. Upload audio with TUS

The browser uploads the selected audio directly to the returned pre-created TUS resource.

The Bridge Upload Gateway exposes TUS under `/tus/`. Its custom TUS store deliberately does **not** implement `NewUpload`: upload resources must already exist in Storage API before the browser starts uploading.

When the final TUS chunk is received, the Upload Gateway automatically calls:

```http
PUT /api/v1/upload/{uploadId}
```

on Storage API. This finishes the underlying multipart upload. The browser/BFF must not perform that Storage finalization a second time.

Important production parity details:

- retry delays should remain conservative
- a 403 should not be retried indefinitely
- the upload fingerprint should be removed after success
- `uploadId` is included in TUS metadata

## 3. Complete public upload / claim Bridge file

`POST /tools/music-analyzer/uploads/{uploadId}/complete`

The public endpoint name remains `complete`, but its internal responsibility is now precise:

1. `GET /api/v1/upload/{uploadId}`
2. verify `completed_at` is present
3. validate actual size and MIME type against the public-tool rules
4. claim the completed upload through `POST /api/v1/upload/{uploadId}`
5. return the resulting Bridge `fileId`

The underlying multipart/TUS upload has already been finished by Upload Gateway before this endpoint is called.

### Response

```json
{
  "fileId": "uuid"
}
```

The claim uses a dedicated server-side Bridge Tools storage context and must not require the visitor to already have a workspace/library.

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

The Upload Gateway currently enforces a configurable TUS maximum size (`UPLOAD_SIZE_LIMIT`; 5 GiB default in its code), but Music Analyzer should enforce a much smaller product-specific limit before initializing an upload.

No internal Bridge hostname, service token or credential should ever reach the browser.
