# Backend dependency — public Music Analyzer BFF

## Goal

Expose a public-safe Bridge Tools boundary that lets an anonymous visitor upload one temporary audio file, receive a Bridge file ID, run Bridge AI analysis, and consume a normalized result without exposing internal infrastructure.

## Existing production primitives to locate

The Bridge webapp calls GraphQL at:

`https://api.bridge.audio/graphql`

The backend implementation we need to locate owns these existing operations:

- `LibraryInitializeTrackUpload`
- `AddLibraryFile`

Current signed-in Library behavior:

```text
LibraryInitializeTrackUpload
  ↓
upload_id + pre-created TUS URL
  ↓
Browser TUS upload
  ↓
AddLibraryFile(library_id, upload_id)
  ↓
Library file ID
```

The public Music Analyzer needs the same storage primitives without requiring `library_id` or an authenticated workspace.

## Target public behavior

```text
POST /tools/music-analyzer/uploads
  ↓
uploadId + pre-created TUS URL
  ↓
Browser TUS upload
  ↓
POST /tools/music-analyzer/uploads/{uploadId}/complete
  ↓
temporary fileId
  ↓
POST /tools/music-analyzer/{fileId}/analysis
  ↓
AI Processor
  ↓
GET normalized result
```

## Backend implementation requirements

### Temporary upload initialization

Reuse the storage primitive behind `LibraryInitializeTrackUpload`.

Inputs:
- file name
- file size
- MIME type
- anonymous/request fingerprint context

Returns:
- temporary `uploadId`
- pre-created TUS resource URL
- expiry when available

### Temporary finalization

Reuse the file/storage primitive behind `AddLibraryFile`, but create a temporary Analyzer-owned file record rather than a Library-owned file.

Returns:
- `fileId` compatible with AI Processor `/api/v1/files/{fileID}/analysis`

### AI orchestration

- schedule analysis through existing AI Processor
- preserve existing consumers of `InferenceModeExtended`
- add Analyzer-specific inference orchestration when lyrics/themes require richer processing
- translate internal pending/not-found semantics into `queued` / `analyzing`

### Taxonomy normalization

Resolve AI Processor IDs server-side:

- `tag_id`
- `family_id`
- `category_id`

Return human-readable `MusicAnalysis` groups instead of leaking taxonomy implementation details to the browser.

### Lifecycle / security

Anonymous files must have:

- strict audio MIME/type rules
- size/duration limits
- rate limiting
- short retention
- automatic deletion
- abuse protection
- no Hub publication
- no Library persistence unless the user later signs in and explicitly saves

No internal Bridge service URL, token, or credential may be exposed to the browser.

## Definition of done

The frontend can set:

`NEXT_PUBLIC_MUSIC_ANALYZER_API_BASE_URL=<public tools BFF>`

and the current `apps/music-analyzer` experience works against real Bridge analysis without frontend code changes.
