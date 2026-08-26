import { Upload } from "tus-js-client";
import type { AnalysisStatus, MusicAnalysis } from "@bridge-tools/music-analysis";
import { demoAnalysis } from "./demo-analysis";

const API_BASE = process.env.NEXT_PUBLIC_MUSIC_ANALYZER_API_BASE_URL?.replace(/\/$/, "");

export const isLiveAnalysisConfigured = Boolean(API_BASE);

type UploadSession = {
  uploadId: string;
  uploadUrl: string;
  expiresAt?: string;
};

type FinalizedUpload = {
  fileId: string;
};

type AnalysisStateResponse =
  | Pick<MusicAnalysis, "fileId" | "status">
  | MusicAnalysis;

const wait = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) throw new Error("Music Analyzer API is not configured.");

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error?.message || payload?.message || `Request failed (${response.status}).`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function createTemporaryUpload(file: File): Promise<UploadSession> {
  return request<UploadSession>("/tools/music-analyzer/uploads", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
    }),
  });
}

function uploadWithTus(
  file: File,
  session: UploadSession,
  onProgress?: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      retryDelays: [0, 5000],
      removeFingerprintOnSuccess: true,
      fingerprint: async () => ["bridge-tools", file.name, file.type, file.size].join("-"),
      metadata: {
        id: session.uploadId,
        filename: file.name,
        filetype: file.type || "application/octet-stream",
      },
      onError: reject,
      onShouldRetry: (error) => {
        const status = error?.originalResponse?.getStatus() || 0;
        return status !== 403;
      },
      onProgress: (uploaded, total) => {
        onProgress?.(total > 0 ? uploaded / total : 0);
      },
      onSuccess: () => resolve(),
    });

    // Bridge's current webapp upload flow receives a pre-created TUS resource URL
    // and resumes directly against that resource rather than POSTing to a TUS endpoint.
    upload.url = session.uploadUrl;
    upload.start();
  });
}

async function finalizeTemporaryUpload(uploadId: string): Promise<FinalizedUpload> {
  return request<FinalizedUpload>(`/tools/music-analyzer/uploads/${uploadId}/complete`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

async function startAnalysis(fileId: string) {
  return request<Pick<MusicAnalysis, "fileId" | "status">>(
    `/tools/music-analyzer/${fileId}/analysis`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

async function pollAnalysis(fileId: string, onStatus?: (status: AnalysisStatus) => void) {
  const startedAt = Date.now();
  const timeoutMs = 120_000;

  while (Date.now() - startedAt < timeoutMs) {
    const state = await request<AnalysisStateResponse>(`/tools/music-analyzer/${fileId}/analysis`, {
      cache: "no-store",
    });

    onStatus?.(state.status);

    if (state.status === "complete") return state as MusicAnalysis;
    if (state.status === "error") throw new Error("Bridge could not analyze this track.");

    await wait(1200);
  }

  throw new Error("The analysis is taking longer than expected. Please try again.");
}

export async function analyzeMusicFile(
  file: File,
  options?: {
    onStatus?: (status: AnalysisStatus) => void;
    onUploadProgress?: (progress: number) => void;
  },
): Promise<MusicAnalysis> {
  if (!API_BASE) {
    options?.onStatus?.("uploading");
    options?.onUploadProgress?.(0.25);
    await wait(350);
    options?.onUploadProgress?.(0.7);
    await wait(300);
    options?.onUploadProgress?.(1);
    options?.onStatus?.("queued");
    await wait(300);
    options?.onStatus?.("analyzing");
    await wait(1500);

    return {
      ...demoAnalysis,
      fileId: `mock-${Date.now()}`,
      track: { title: file.name.replace(/\.[^/.]+$/, "") },
    };
  }

  options?.onStatus?.("uploading");
  const session = await createTemporaryUpload(file);
  await uploadWithTus(file, session, options?.onUploadProgress);

  options?.onStatus?.("queued");
  const { fileId } = await finalizeTemporaryUpload(session.uploadId);
  await startAnalysis(fileId);

  return pollAnalysis(fileId, options?.onStatus);
}
