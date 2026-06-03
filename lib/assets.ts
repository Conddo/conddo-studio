// Job assets — /api/jobs/{jobId}/assets/* (Cloudinary-backed, §9).
// Any authenticated staff can upload/list/delete; role gating belongs in the UI.
import { api } from "./api";
import type { JobAsset } from "@/types";

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
};
