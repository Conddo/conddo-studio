// AI assistant — Claude-backed copy, palettes, and image ranking (§8).
//
// Each call is fail-safe on the backend: if Claude is unconfigured / down /
// returns unparseable output, the response carries `available: false` and
// empty content rather than an error. UIs should treat that as "assist is
// off" (hide the suggestion) rather than a failure.
import { api } from "./api";
import type { AiCopyResult, AiPaletteResult, AiRankResult } from "@/types";

export type CopySection = "HERO" | "SERVICES" | "ABOUT" | string;

export const aiApi = {
  /** Generate copy for one section of a job's website and store it on the job. */
  suggest: (jobId: string, section: CopySection) =>
    api.post<AiCopyResult>(`/${jobId}/ai-suggest`, { section }),

  /** Generate an accessible (WCAG-AA) palette from a primary hex. No job needed. */
  palette: (primaryHex: string) =>
    api.post<AiPaletteResult>(`/ai/palette`, { primaryHex }),

  /** Rank candidate images for a section using Claude vision. Returns sorted desc. */
  rankImages: (jobId: string, imageUrls: string[], sectionType?: string) =>
    api.post<AiRankResult>(`/${jobId}/rank-images`, { imageUrls, sectionType }),
};
