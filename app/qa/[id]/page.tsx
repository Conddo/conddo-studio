"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ExternalLink, Loader2, CheckCircle2, RotateCcw, ShoppingBag, MessageSquarePlus, AlertTriangle,
} from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { StatusBadge, JobTypePill, SlaBadge } from "@/components/ui/Badges";
import { useApiQuery } from "@/hooks/useApiQuery";
import { jobsApi } from "@/lib/jobs";
import { qaApi, type ChecklistResult } from "@/lib/qa";
import { CHECKLISTS, groupChecklist, type ChecklistItem } from "@/lib/checklists";
import { fmtDateTime } from "@/lib/format";
import { StudioApiError } from "@/lib/api";
import type { JobDetail } from "@/types";

const titleCase = (s: string) =>
  s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();

type ItemState = { passed?: boolean; note: string };

function CompactBrief({ brief }: { brief: Record<string, unknown> }) {
  const keys = ["businessName", "vertical", "plan", "description", "services"];
  const entries = keys
    .map((k) => [k, brief[k]] as const)
    .filter(([, v]) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0));
  if (entries.length === 0) return null;
  return (
    <dl className="space-y-3">
      {entries.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[11px] uppercase tracking-[0.05em] text-content-muted">{titleCase(k)}</dt>
          <dd className="mt-0.5 text-[13px] text-ink">
            {Array.isArray(v) ? v.join(" · ") : typeof v === "object" ? JSON.stringify(v) : String(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Review({ job, onChanged }: { job: JobDetail; onChanged: () => void }) {
  const items = useMemo<ChecklistItem[]>(() => CHECKLISTS[job.jobType] ?? [], [job.jobType]);
  const grouped = useMemo(() => groupChecklist(items), [items]);

  const [state, setState] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(items.map((i) => [i.id, { note: "" }])),
  );
  const [positiveNotes, setPositiveNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState<"start" | "approve" | "return" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNote, setShowNote] = useState<Record<string, boolean>>({});

  const requiredIds = items.filter((i) => i.required).map((i) => i.id);
  const allRequiredPassed = requiredIds.every((id) => state[id]?.passed === true);
  const someFailed = items.some((i) => state[i.id]?.passed === false);
  const canApprove = job.status === "IN_REVIEW" && allRequiredPassed && busy === null;
  const canReturn = job.status === "IN_REVIEW" && feedback.trim().length > 0 && busy === null;

  function toggle(itemId: string, passed: boolean | undefined) {
    setState((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] ?? { note: "" }), passed } }));
  }
  function setNote(itemId: string, note: string) {
    setState((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] ?? { note: "" }), note } }));
  }

  function buildResult(): ChecklistResult {
    const out: ChecklistResult = {};
    for (const item of items) {
      const s = state[item.id];
      if (s?.passed !== undefined) {
        out[item.id] = { passed: s.passed, note: s.note.trim() || null };
      }
    }
    return out;
  }

  async function act(kind: "start" | "approve" | "return") {
    setBusy(kind);
    setError(null);
    try {
      if (kind === "start") await qaApi.start(job.id);
      else if (kind === "approve") await qaApi.approve(job.id, { checklist: buildResult(), positiveNotes: positiveNotes.trim() || undefined });
      else await qaApi.returnForRevision(job.id, { checklist: buildResult(), feedback: feedback.trim() });
      onChanged();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : "Couldn't complete that action. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  // Outcome state (already reviewed)
  const latest = job.qaReviews[0];
  const isOutcome = ["APPROVED", "DELIVERED", "REVISION"].includes(job.status);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
      {/* LEFT — job summary */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] text-content-muted">{job.jobNumber}</span>
            <JobTypePill type={job.jobType} />
            <StatusBadge status={job.status} />
            {job.revisionCount > 0 && (
              <span className="rounded-md bg-danger-bg px-2 py-0.5 text-[11px] font-medium text-danger">Revision {job.revisionCount}</span>
            )}
          </div>
          <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">{job.title}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            <SlaBadge tone={job.slaTone} deadline={job.slaDeadline} />
            {job.assignedToName && <span className="text-content-secondary">Built by <span className="text-ink">{job.assignedToName}</span></span>}
            {job.studioUrl && (
              <a href={job.studioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary-light hover:underline">
                <ExternalLink size={14} /> Open submission
              </a>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
          <h3 className="mb-4 text-[15px] font-medium text-ink">Brief</h3>
          <CompactBrief brief={job.brief} />
        </div>

        {job.qaReviews.length > 0 && (
          <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
            <h3 className="mb-4 text-[15px] font-medium text-ink">Previous reviews</h3>
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

      {/* RIGHT — review panel */}
      <div className="space-y-6">
        {/* Status-driven action */}
        {job.status === "SUBMITTED" && (
          <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
            <h3 className="text-[15px] font-medium text-ink">Ready to review</h3>
            <p className="mt-1 text-[13px] text-content-secondary">Start the review to claim this submission and unlock the checklist.</p>
            <button
              onClick={() => act("start")}
              disabled={busy !== null}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {busy === "start" ? <Loader2 size={16} className="animate-spin" /> : null} Start review
            </button>
          </div>
        )}

        {isOutcome && latest && (
          <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
            <h3 className="mb-2 flex items-center gap-2 text-[15px] font-medium">
              {latest.outcome === "APPROVED"
                ? <span className="inline-flex items-center gap-1.5 text-success"><CheckCircle2 size={17} /> Approved</span>
                : <span className="inline-flex items-center gap-1.5 text-danger"><RotateCcw size={17} /> Returned for revision</span>}
            </h3>
            {latest.reviewerNotes && <p className="text-[13px] text-content-secondary">{latest.reviewerNotes}</p>}
            {latest.positiveNotes && <p className="mt-2 text-[13px] text-success">Good: {latest.positiveNotes}</p>}
            <p className="mt-3 font-mono text-[11px] text-content-muted">{fmtDateTime(latest.at)}</p>
          </div>
        )}

        {job.status === "IN_REVIEW" && (
          <>
            {/* Checklist */}
            <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[15px] font-medium text-ink">Checklist</h3>
                {!allRequiredPassed && (
                  <span className="inline-flex items-center gap-1 text-[12px] text-warning">
                    <AlertTriangle size={13} /> Pass all required to approve
                  </span>
                )}
              </div>
              {items.length === 0 ? (
                <p className="text-[13px] text-content-secondary">No checklist defined for this job type.</p>
              ) : (
                <div className="space-y-5">
                  {grouped.map(({ section, items: secItems }) => (
                    <section key={section}>
                      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.05em] text-content-muted">{section}</p>
                      <ul className="divide-y divide-neutral-border rounded-lg border border-neutral-border">
                        {secItems.map((item) => {
                          const s = state[item.id];
                          const expand = showNote[item.id];
                          return (
                            <li key={item.id} className="px-3 py-2.5">
                              <div className="flex items-start gap-3">
                                <label className="mt-0.5 inline-flex shrink-0 items-center gap-1.5">
                                  <input
                                    type="checkbox"
                                    checked={s?.passed === true}
                                    onChange={(e) => toggle(item.id, e.target.checked ? true : undefined)}
                                    className="h-4 w-4 rounded border-neutral-strong bg-neutral-surface accent-success"
                                  />
                                </label>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[13px] text-ink">
                                    {item.label}
                                    {!item.required && <span className="ml-2 text-[11px] text-content-muted">optional</span>}
                                  </p>
                                  {expand && (
                                    <textarea
                                      value={s?.note ?? ""}
                                      onChange={(e) => setNote(item.id, e.target.value)}
                                      rows={2}
                                      placeholder="Note (optional)"
                                      className="mt-2 w-full rounded-md border border-neutral-strong bg-neutral-bg px-2.5 py-1.5 text-[12px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                                    />
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggle(item.id, s?.passed === false ? undefined : false)}
                                  className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                                    s?.passed === false ? "bg-danger-bg text-danger" : "text-content-muted hover:text-danger"
                                  }`}
                                  title="Mark failed"
                                >
                                  Fail
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowNote((p) => ({ ...p, [item.id]: !p[item.id] }))}
                                  aria-label="Add note"
                                  className="shrink-0 rounded-md p-1 text-content-muted hover:bg-neutral-surface2 hover:text-ink"
                                >
                                  <MessageSquarePlus size={14} />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
              {error && <p className="mb-4 rounded-lg border border-danger/20 bg-danger-bg px-3 py-2 text-[13px] text-danger">{error}</p>}

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-content-secondary">What was done well (optional)</label>
                  <textarea
                    value={positiveNotes}
                    onChange={(e) => setPositiveNotes(e.target.value)}
                    rows={2}
                    placeholder="Encouragement shown to the developer."
                    className="w-full rounded-md border border-neutral-strong bg-neutral-bg p-3 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-content-secondary">
                    Feedback for revision <span className="text-danger">*</span> <span className="text-content-muted">(required to return)</span>
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    placeholder="Specific, actionable changes."
                    className="w-full rounded-md border border-neutral-strong bg-neutral-bg p-3 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => act("approve")}
                    disabled={!canApprove}
                    title={!allRequiredPassed ? "Pass every required item to approve" : "Approve this submission"}
                    className="inline-flex items-center gap-2 rounded-md bg-success px-4 py-2 text-[14px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy === "approve" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Approve
                  </button>
                  <button
                    onClick={() => act("return")}
                    disabled={!canReturn}
                    title={feedback.trim() ? "Send back for revision" : "Add feedback first"}
                    className="inline-flex items-center gap-2 rounded-md border border-danger bg-neutral-surface px-4 py-2 text-[14px] font-medium text-danger hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy === "return" ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />} Return for revision
                  </button>
                </div>
                {someFailed && !canReturn && (
                  <p className="text-[12px] text-content-muted">You marked failures — add feedback above to return.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function QaReviewPage({ params }: { params: { id: string } }) {
  const { data, loading, error, refetch } = useApiQuery(() => jobsApi.get(params.id), [params.id]);

  return (
    <StudioShell title={data?.jobNumber ?? "Review"} subtitle="QA review">
      <Link href="/qa" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-content-secondary hover:text-ink">
        <ArrowLeft size={15} /> Back to QA queue
      </Link>
      {loading ? <LoadingState label="Loading job…" />
        : error ? <ErrorState error={error} onRetry={refetch} />
        : !data ? <EmptyState icon={ShoppingBag} title="Job not found" />
        : <Review job={data} onChanged={refetch} />}
    </StudioShell>
  );
}
