# Bridge Music Analyzer integration map

This document records the current integration points discovered in the existing Bridge codebase. It exists to keep the prototype aligned with production behavior and to simplify the later GitLab migration.

## Existing AI Processor endpoints

The current `ai-processor` exposes:

- `POST /api/v1/files/{fileID}/analysis` — schedule analysis
- `GET /api/v1/files/{fileID}/analysis` — read analysis result
- `GET /api/v1/files/{fileID}/inference/{mode}` — read inference for a specific mode

The current analysis response contains:

- tag IDs (`tag_id`, `family_id`, `category_id`)
- confidence
- BPM
- key

The public Music Analyzer frontend must **not** consume those internal IDs directly. The Tools BFF resolves them to Bridge taxonomy names and returns the normalized `MusicAnalysis` contract from `@bridge-tools/music-analysis`.

## Inference modes

The current `/analysis` GET resolves `InferenceModeExtended`.

Current behavior found in `TagInferrerFactory`:

| Capability | Extended | Full |
| --- | --- | --- |
| Main audio tagging | Yes | Yes |
| Vocal/language inference | Yes | Yes |
| Lyrics from metadata | Yes | Yes |
| Opportunistic lyrics extraction | No | Yes |
| Theme extraction | No | Yes |
| Explicit lyrics detection | No | Yes |

For the public Music Analyzer, do not silently change the behavior of the existing `/analysis` route because other Bridge consumers may rely on Extended mode.

Preferred production option: add an Analyzer-specific inference mode or BFF orchestration that returns the fields promised by the public tool without changing existing consumers.

## Processing semantics

The existing AI endpoint queues work asynchronously. While inference is unavailable, the current GET may resolve as not found.

The public BFF must normalize this into explicit states:

- `queued`
- `analyzing`
- `complete`
- `error`

This keeps internal 404 polling semantics out of the public experience.

## Existing rejection reasons

The AI Processor currently defines stable rejection reasons including:

- `track_too_short`
- `track_too_long`
- `malformed_track`
- `unknown`

The Tools BFF should map these to useful public-safe copy.

## Existing webapp upload flow

The current Bridge webapp audio upload flow is:

1. GraphQL `LibraryInitializeTrackUpload` receives library ID, file name, size and MIME type.
2. It returns `upload_id` and a pre-created TUS `url`.
3. The browser creates `new tus.Upload(file, ...)`, assigns `upload.url = url`, adds the upload ID as metadata and starts the upload.
4. After TUS succeeds, GraphQL `AddLibraryFile(library_id, upload_id)` finalizes the upload and returns the Library file ID.

This matters for Bridge Tools: the public flow should preserve these storage primitives instead of treating the returned URL as a generic TUS creation endpoint.

Anonymous users cannot call `AddLibraryFile` because they do not yet have a workspace/library. The BFF therefore needs an equivalent temporary-file finalization path.

Target public flow:

```text
Browser
  ↓
POST /tools/music-analyzer/uploads
  ↓
uploadId + pre-created TUS URL
  ↓
TUS upload using upload.url = returned URL
  ↓
POST /tools/music-analyzer/uploads/{uploadId}/complete
  ↓
temporary fileId
  ↓
POST /tools/music-analyzer/{fileId}/analysis
  ↓
Bridge AI Processor
  ↓
Taxonomy resolution + normalization
  ↓
GET /tools/music-analyzer/{fileId}/analysis
```

## Public safety requirements

The BFF is also the security boundary for:

- file type and size limits
- anonymous rate limiting
- temporary retention/deletion
- abuse protection
- server-side Bridge credentials
- internal service discovery
- taxonomy resolution
- stable error mapping

No internal Bridge hostnames or credentials should be exposed to the browser.
