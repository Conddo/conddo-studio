"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Trash2, Loader2, FileText, Image as ImageIcon, ExternalLink, Download } from "lucide-react";
import { assetsApi } from "@/lib/assets";
import { StudioApiError } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import type { JobAsset } from "@/types";

/** File attachments on a job (Cloudinary-backed, §9). Any signed-in staff
 *  member can upload, list, and delete. The parent screen decides whether
 *  to render this (e.g. only on jobs the user can edit).
 *
 *  Devs working on a job download the FULL job bundle (assets + manifest +
 *  brief) via the "Download bundle" button, which hits
 *  GET /api/jobs/{id}/export. That's the canonical handoff — they build the
 *  website locally from the bundle's contents. The per-file links here are
 *  just for quickly grabbing one asset without the full ZIP. */
export function JobAssets({ jobId }: { jobId: string }) {
  const [assets, setAssets] = useState<JobAsset[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bundling, setBundling] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await assetsApi.list(jobId);
      setAssets(r.data ?? []);
    } catch (e) {
      setError(e instanceof StudioApiError ? e.message : "Couldn't load files.");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const r = await assetsApi.upload(jobId, file);
      setAssets((prev) => (prev ? [r.data, ...prev] : [r.data]));
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : "Couldn't upload that file.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(a: JobAsset) {
    if (busyId) return;
    if (!confirm(`Delete ${a.filename}?`)) return;
    setBusyId(a.id);
    try {
      await assetsApi.remove(jobId, a.id);
      setAssets((prev) => prev?.filter((x) => x.id !== a.id) ?? null);
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : "Couldn't delete that file.");
    } finally {
      setBusyId(null);
    }
  }

  async function downloadBundle() {
    setBundling(true);
    setError(null);
    try {
      await assetsApi.downloadBundle(jobId);
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : "Couldn't build the bundle.");
    } finally {
      setBundling(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-medium text-ink">Files</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadBundle}
            disabled={bundling}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            title="Download brief + all files as a ZIP for local build"
          >
            {bundling ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>{bundling ? "Building…" : "Download bundle"}</span>
          </button>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-neutral-strong px-3 py-1.5 text-[12px] font-medium text-content-secondary transition-colors hover:bg-neutral-surface2 hover:text-ink">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            <span>{uploading ? "Uploading…" : "Upload file"}</span>
            <input ref={fileRef} type="file" className="hidden" onChange={onPick} disabled={uploading} />
          </label>
        </div>
      </div>

      {error && <p className="mb-3 rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-[12px] text-danger">{error}</p>}

      {loading ? (
        <p className="text-[13px] text-content-secondary">Loading files…</p>
      ) : !assets || assets.length === 0 ? (
        <p className="text-[13px] text-content-secondary">No files yet. Upload drafts, screenshots, or deliverables here.</p>
      ) : (
        <ul className="space-y-2">
          {assets.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-lg border border-neutral-border bg-neutral-surface2 px-3 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-bg text-primary-light">
                {(a.contentType ?? "").startsWith("image/") ? <ImageIcon size={15} /> : <FileText size={15} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-ink">{a.filename}</p>
                <p className="font-mono text-[11px] text-content-muted">
                  {a.bytes ? humanBytes(a.bytes) : "—"}
                  {a.uploadedByName ? ` · ${a.uploadedByName}` : ""}
                  {a.uploadedAt ? ` · ${fmtDateTime(a.uploadedAt)}` : ""}
                </p>
              </div>
              <a href={a.url} target="_blank" rel="noreferrer" aria-label="Open file" title="Open file"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-content-secondary hover:bg-neutral-surface hover:text-ink">
                <ExternalLink size={15} />
              </a>
              <button
                onClick={() => remove(a)} disabled={busyId === a.id}
                aria-label="Delete file" title="Delete file"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-content-secondary hover:bg-danger-bg hover:text-danger disabled:opacity-50"
              >
                {busyId === a.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
