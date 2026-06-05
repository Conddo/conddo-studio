// Job assets — /api/jobs/{jobId}/assets/* (Cloudinary-backed, §9).
// Any authenticated staff can upload/list/delete; role gating belongs in the UI.
import { api, StudioApiError } from "./api";
import { getAccessToken } from "./auth";
import type { JobAsset } from "@/types";

const ROOT = process.env.NEXT_PUBLIC_STUDIO_API_URL ?? "";

export const assetsApi = {
  list: (jobId: string) => api.get<JobAsset[]>(`/${jobId}/assets`),

  /** Multipart upload — accepts a File from an <input type="file"> directly. */
  upload: (jobId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.upload<JobAsset>(`/${jobId}/assets`, form);
  },

  remove: (jobId: string, assetId: string) =>
    api.del<void>(`/${jobId}/assets/${assetId}`),

  /** Download the job's full asset bundle as a ZIP (GET /api/jobs/{id}/export).
   *  The browser saves it via a blob URL — same flow as a regular link click.
   *  Filename comes from the server's Content-Disposition; we fall back to
   *  job-{id}.zip if it's missing. We hand back the parsed checksum too so
   *  the caller can show it (Studio adds X-Bundle-Checksum). */
  downloadBundle: async (jobId: string): Promise<{ filename: string; checksum: string | null }> => {
    if (!ROOT) {
      throw new StudioApiError("api_not_configured", "Studio API URL is not configured.");
    }
    const token = getAccessToken();
    const res = await fetch(`${ROOT}/api/jobs/${jobId}/export`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      // Best-effort error parsing — body is usually JSON {success,error}, not
      // a zip, on the failure path.
      let message = res.statusText || "Couldn't build the bundle.";
      try {
        const json = await res.json();
        message = json?.error?.message ?? message;
      } catch {
        /* binary or empty body */
      }
      throw new StudioApiError("request_failed", message, res.status);
    }
    const cd = res.headers.get("content-disposition") ?? "";
    const match = /filename="?([^";]+)"?/i.exec(cd);
    const filename = match?.[1]?.trim() || `job-${jobId}.zip`;
    const checksum = res.headers.get("x-bundle-checksum");
    const blob = await res.blob();
    // Trigger browser save without leaving the page.
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      URL.revokeObjectURL(url);
    }
    return { filename, checksum };
  },
};
