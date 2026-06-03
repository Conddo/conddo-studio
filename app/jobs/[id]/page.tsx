"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2, CheckCircle2, RotateCcw, X, ShoppingBag } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { StatusBadge, JobTypePill, SlaBadge } from "@/components/ui/Badges";
import { JobLeadActions } from "@/components/app/JobLeadActions";
import { useApiQuery } from "@/hooks/useApiQuery";
import { jobsApi } from "@/lib/jobs";
import { meQuery } from "@/lib/account";
import { fmtDateTime } from "@/lib/format";
import { StudioApiError } from "@/lib/api";
import type { JobDetail, Staff } from "@/types";

const titleCase = (s: string) => s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();

function BriefView({ brief }: { brief: Record<string, unknown> }) {
  const entries = Object.entries(brief).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) return <p className="text-[14px] text-content-secondary">No brief details provided.</p>;
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className={Array.isArray(value) || (typeof value === "object") ? "sm:col-span-2" : ""}>
          <dt className="mb-1 text-[11px] uppercase tracking-[0.05em] text-content-muted">{titleCase(key)}</dt>
          <dd className="text-[14px] text-ink">
            {Array.isArray(value) ? (
              <div className="flex flex-wrap gap-1.5">
                {value.map((v, i) => (
                  <span key={i} className="rounded-md bg-neutral-surface2 px-2 py-0.5 text-[12px] text-content-secondary">
                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </span>
                ))}
              </div>
            ) : typeof value === "object" ? (
              <pre className="overflow-x-auto rounded-md bg-neutral-surface2 p-3 font-mono text-[12px] text-content-secondary">{JSON.stringify(value, null, 2)}</pre>
            ) : (
              String(value)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SubmitModal({ jobId, open, onClose, onSubmitted }: { jobId: string; open: boolean; onClose: () => void; onSubmitted: () => void }) {
  const [studioUrl, setStudioUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await jobsApi.submit(jobId, { studioUrl: studioUrl.trim() || undefined, notes: notes.trim() || undefined });
      onClose();
      onSubmitted();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : "Couldn't submit. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-border bg-neutral-surface p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-[17px] font-medium text-ink">Submit for QA</h2>
            <p className="mt-0.5 text-[13px] text-content-secondary">A reviewer will check it against the standard.</p>
          </div>
          <button onClick={() => !saving && onClose()} className="rounded-md p-1 text-content-muted hover:text-ink"><X size={18} /></button>
        </div>
        {error && <p className="mb-4 rounded-lg border border-danger/20 bg-danger-bg px-3 py-2 text-[13px] text-danger">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-content-secondary">Studio / preview URL</label>
            <input value={studioUrl} onChange={(e) => setStudioUrl(e.target.value)} placeholder="https://…" className="h-11 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3.5 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-content-secondary">Notes for QA</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything the reviewer should know." className="w-full rounded-md border border-neutral-strong bg-neutral-bg p-3 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => !saving && onClose()} className="rounded-md border border-neutral-border px-4 py-2 text-[14px] text-content-secondary hover:bg-neutral-surface2">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}{saving ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Detail({ job, onChanged }: { job: JobDetail; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const { data: me } = useApiQuery<Staff>(meQuery);
  const isLead = me?.role === "TEAM_LEAD" || me?.role === "ADMIN";

  async function act(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    try { await fn(); onChanged(); } finally { setBusy(null); }
  }

  const canClaim = job.status === "AVAILABLE";
  const canStart = job.status === "ASSIGNED";
  const canBuild = ["ASSIGNED", "IN_PROGRESS", "REVISION"].includes(job.status);
  const canSubmit = ["IN_PROGRESS", "REVISION"].includes(job.status);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(0,320px)]">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] text-content-muted">{job.jobNumber}</span>
            <JobTypePill type={job.jobType} />
            <StatusBadge status={job.status} />
            {job.revisionCount > 0 && <span className="rounded-md bg-danger-bg px-2 py-0.5 text-[11px] font-medium text-danger">Revision {job.revisionCount}</span>}
          </div>
          <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">{job.title}</h2>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-neutral-border pt-4 text-[13px]">
            <SlaBadge tone={job.slaTone} deadline={job.slaDeadline} />
            {job.assignedToName && <span className="text-content-secondary">Assigned to <span className="text-ink">{job.assignedToName}</span></span>}
            {job.studioUrl && (
              <a href={job.studioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary-light hover:underline">
                <ExternalLink size={14} /> Preview
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            {canClaim && (
              <button onClick={() => act("claim", () => jobsApi.claim(job.id))} disabled={busy !== null}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover disabled:opacity-50">
                {busy === "claim" ? <Loader2 size={16} className="animate-spin" /> : null} Claim job
              </button>
            )}
            {canStart && (
              <button onClick={() => act("start", () => jobsApi.start(job.id))} disabled={busy !== null}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover disabled:opacity-50">
                {busy === "start" ? <Loader2 size={16} className="animate-spin" /> : null} Start work
              </button>
            )}
            {canBuild && (
              <Link href={`/jobs/${job.id}/build`} className="inline-flex items-center gap-2 rounded-md border border-neutral-strong px-4 py-2 text-[14px] font-medium text-ink hover:bg-neutral-surface2">
                Open builder
              </Link>
            )}
            {canSubmit && (
              <button onClick={() => setSubmitOpen(true)} disabled={busy !== null}
                className="inline-flex items-center gap-2 rounded-md bg-success px-4 py-2 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-50">
                <CheckCircle2 size={16} /> Submit for QA
              </button>
            )}
          </div>
        </div>

        {/* Brief */}
        <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
          <h3 className="mb-4 text-[15px] font-medium text-ink">Business brief</h3>
          <BriefView brief={job.brief} />
        </div>

        {/* QA history */}
        {job.qaReviews.length > 0 && (
          <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
            <h3 className="mb-4 text-[15px] font-medium text-ink">QA history</h3>
            <div className="space-y-4">
              {job.qaReviews.map((r) => (
                <div key={r.id} className="rounded-lg border border-neutral-border p-4">
                  <div className="mb-2 flex items-center gap-2">
                    {r.outcome === "APPROVED"
                      ? <span className="inline-flex items-center gap-1 text-[13px] font-medium text-success"><CheckCircle2 size={15} /> Approved</span>
                      : <span className="inline-flex items-center gap-1 text-[13px] font-medium text-danger"><RotateCcw size={15} /> Revision</span>}
                    <span className="text-[12px] text-content-muted">Review {r.reviewNumber} · {fmtDateTime(r.at)}</span>
                  </div>
                  {r.reviewerNotes && <p className="text-[13px] text-content-secondary">{r.reviewerNotes}</p>}
                  {r.positiveNotes && <p className="mt-1 text-[13px] text-success">Good: {r.positiveNotes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {isLead && <JobLeadActions jobId={job.id} currentAssignee={job.assignedTo} onChanged={onChanged} />}

        {/* Activity */}
        <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
          <h3 className="mb-4 text-[15px] font-medium text-ink">Activity</h3>
          {job.activity.length > 0 ? (
            <ol className="space-y-4">
              {job.activity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-[13px] text-ink">{titleCase(a.action.toLowerCase())}</p>
                    {a.detail && <p className="text-[12px] text-content-secondary">{a.detail}</p>}
                    <p className="font-mono text-[11px] text-content-muted">{fmtDateTime(a.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[13px] text-content-secondary">No activity yet.</p>
          )}
        </div>
      </div>

      <SubmitModal jobId={job.id} open={submitOpen} onClose={() => setSubmitOpen(false)} onSubmitted={onChanged} />
    </div>
  );
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { data, loading, error, refetch } = useApiQuery(() => jobsApi.get(params.id), [params.id]);

  return (
    <StudioShell title={data?.jobNumber ?? "Job"} subtitle="Job detail">
      <Link href="/jobs/my-jobs" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-content-secondary hover:text-ink">
        <ArrowLeft size={15} /> Back to jobs
      </Link>
      {loading ? <LoadingState label="Loading job…" />
        : error ? <ErrorState error={error} onRetry={refetch} />
        : !data ? <EmptyState icon={ShoppingBag} title="Job not found" />
        : <Detail job={data} onChanged={refetch} />}
    </StudioShell>
  );
}
