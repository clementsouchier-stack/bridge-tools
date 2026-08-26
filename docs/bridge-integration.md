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
4. After TUS succeeds, GraphQL `AddLibraryFile(library_id, upload_id)` claims/finalizes the uploaded object into the Library and returns the Library file ID.

This matters for Bridge Tools: the public flow should preserve these storage primitives instead of treating the returned URL as a generic TUS creation endpoint.

Anonymous users cannot call `AddLibraryFile` because they do not yet have a workspace/library. The BFF therefore needs an equivalent temporary-file claim path.

## Storage primitives confirmed in `account-api`

The `account-api` repository is **not** the GraphQL Library backend, but it confirms that Bridge already exposes the generic storage primitives we need through `bridge/api-client-lib`.

`App\\Api\\StorageApi` wraps `Bridge\\ApiClient\\Storage\\V2\\StorageApiClientV2` and already provides:

```text
initializeUpload(owner, isPublic, type, fileName, size, pathPrefix)
getUpload(uploadId)
claimUpload(owner, uploadId, context, addedBy)
deleteFile(fileId, context)
findById(fileId, context)
```

The profile-picture V2 flow is a concrete production example:

1. `POST /v2/picture/upload`
2. calls `initializeUpload(...)`
3. returns `upload_id + url`
4. browser uploads to the pre-created TUS resource
5. later `claimUpload(...)` converts that upload into a real Bridge file

The account service validates the uploaded object's size and MIME type again after TUS completion and before claiming it. Music Analyzer should preserve that pattern.

## Exact Storage API contract confirmed in `api-client-lib`

`Bridge\\ApiClient\\Storage\\StorageApiClient` confirms the current internal HTTP routes and payloads.

### Initialize upload

```http
POST /api/v1/upload
Content-Type: application/x-www-form-urlencoded
```

Fields:

```text
owner
is_public      // 1 or 0
type
file_name
size
path_prefix    // optional
```

Successful response is expected with HTTP `201` and contains:

```json
{
  "data": {
    "id": "upload-uuid",
    "url": "pre-created-tus-resource-url"
  }
}
```

### Read upload state

```http
GET /api/v1/upload/{uploadId}
```

The client maps the response to:

```text
id
bucket
key
ref_id
size
mime_type
completed_at
```

`completed_at` is therefore available to the BFF as a server-side check that the TUS upload actually completed before claiming it.

### Claim upload into a Bridge file

```http
POST /api/v1/upload/{uploadId}
Content-Type: application/x-www-form-urlencoded
```

Fields:

```text
owner
service_id
workspace_id   // optional
added_by
```

The important discovery is that **`workspace_id` is optional in the shared client**. `account-api` already claims profile-picture uploads without a workspace. This makes a Tools-specific temporary file context technically plausible without creating a fake Library/workspace.

`service_id` is generated as:

```text
{context.serviceName()}::{context.contextName()}
```

For example, an account user's storage context is built from its service name plus `user:{uuid}` context.

For Music Analyzer, the BFF should use a dedicated Tools storage context rather than impersonating an existing user or Library. A conceptual namespace could be:

```text
owner: music-analyzer:{session-id}
service_id: bridge-tools::music-analyzer:{session-id}
workspace_id: null
```

The exact accepted format for `owner`, `service_id` and `added_by` must still be verified in the storage-api server implementation before production.

### Other relevant file routes

The shared client also confirms:

```text
GET    /api/v1/file/{fileId}?service_id=...
DELETE /api/v1/file/{fileId}?service_id=...
POST   /api/v1/file/link-service/{fileId}
PATCH  /api/v1/file/{fileId}
```

These are useful for temporary-file retrieval, cleanup and later conversion/saving flows.

## Upload Gateway behavior confirmed

The `Upload Gateway` repository clarifies the part that was previously ambiguous.

### The gateway is TUS-only

It exposes only a TUS handler under:

```text
/tus/
```

Its custom store explicitly returns `handler.ErrNotImplemented` from `NewUpload(...)`. This proves that TUS resources are **pre-created in Storage API** and the browser uploads only to an already-existing resource URL.

### Upload state comes from Storage API

For every TUS upload, the gateway loads upload metadata through:

```http
GET /api/v1/upload/{uploadId}
```

The response gives it the S3 bucket, multipart upload reference, object key, expected size and `completed_at` state.

### Multipart completion is automatic

When the final TUS chunk completes, `tusd` invokes the gateway store's `FinishUpload(...)` method. The gateway then automatically calls:

```http
PUT /api/v1/upload/{uploadId}
```

on Storage API.

So the browser/BFF does **not** need to call the Storage `PUT` itself after TUS succeeds.

This gives us a clean distinction:

```text
PUT  /api/v1/upload/{id}  = finish the multipart/TUS upload
POST /api/v1/upload/{id}  = claim the completed upload into a Bridge file
```

The public `/tools/music-analyzer/uploads/{uploadId}/complete` endpoint should therefore mean:

1. verify the upload has `completed_at`
2. validate actual MIME type and size
3. claim the upload into a temporary Bridge file
4. return `fileId`

It should not re-run the Storage `PUT`.

### Gateway size limit

The Upload Gateway enforces `UPLOAD_SIZE_LIMIT`, with a code default of 5 GiB. That is only an infrastructure ceiling. Music Analyzer should impose its own much smaller product-level file-size/duration limit before creating an upload.

### Internal Storage connectivity

The gateway receives Storage API through a server-only `STORAGE_API_URL`. Local development points this at `storage-api.bridge.localhost`.

The Go client used by Upload Gateway calls the Storage API directly without any custom auth middleware in this repository. That suggests internal-network/service trust for this path, but it does **not** prove that every Storage API route is unauthenticated. The server implementation remains the source of truth for middleware/access rules.

## Current recommended public flow

```text
Browser
  ↓
POST /tools/music-analyzer/uploads
  ↓
BFF → Storage API POST /api/v1/upload
  ↓
uploadId + pre-created TUS URL
  ↓
Browser uploads audio to the returned TUS resource
  ↓
Upload Gateway → Storage API PUT /api/v1/upload/{uploadId}
  (automatic when final TUS chunk completes)
  ↓
Browser receives TUS success
  ↓
POST /tools/music-analyzer/uploads/{uploadId}/complete
  ↓
BFF → GET /api/v1/upload/{uploadId}
  ↓
validate completed_at + actual size + MIME type
  ↓
BFF → POST /api/v1/upload/{uploadId} (claim)
  ↓
temporary Bridge fileId
  ↓
POST /tools/music-analyzer/{fileId}/analysis
  ↓
BFF → AI Processor POST /api/v1/files/{fileId}/analysis
  ↓
Bridge AI Processor
  ↓
Taxonomy resolution + normalization
  ↓
GET /tools/music-analyzer/{fileId}/analysis
```

## What remains to verify

The upload architecture no longer depends on locating the GraphQL Library backend, and the Upload Gateway lifecycle is now fully understood.

The remaining source-of-truth we still want is the **storage-api server repository**, specifically the handlers for:

```text
POST /api/v1/upload
GET  /api/v1/upload/{uploadId}
PUT  /api/v1/upload/{uploadId}
POST /api/v1/upload/{uploadId}
```

We need it only to confirm:

- allowed `owner` formats
- whether `added_by` may be a service/session identifier rather than a user UUID
- accepted `type` values
- service-context validation
- upload expiration / cleanup behavior
- route middleware / internal access rules

If those rules accept a dedicated Bridge Tools context, no new storage mechanism is required.

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
