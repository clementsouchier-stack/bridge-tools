import { Upload } from "tus-js-client";
import type { AnalysisStatus, MusicAnalysis } from "@bridge-tools/music-analysis";
import { demoAnalysis } from "./demo-analysis";

const API_BASE = process.env.NEXT_PUBLIC_MUSIC_ANALYZER_API_BASE_URL?.replace(/\/$/, "");

export const isLiveAnalysisConfigured = Boolean(API_BASE);

type UploadSession = {
  fileId: string;
  uploadUrl: string;
  expiresAt?: string;
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

function uploadWithTus(file: File, endpoint: string, onProgress?: (progress: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint,
      retryDelays: [0, 1000, 3000, 5000],
      metadata: {
        filename: file.name,
        filetype: file.type || "application/octet-stream",
      },
      onError: reject,
      onProgress: (uploaded, total) => {
        onProgress?.(total > 0 ? uploaded / total : 0);
      },
      onSuccess: () => resolve(),
    });

    upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    });
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
  await uploadWithTus(file, session.uploadUrl, options?.onUploadProgress);
  options?.onStatus?.("queued");
  await startAnalysis(session.fileId);

  return pollAnalysis(session.fileId, options?.onStatus);
}
