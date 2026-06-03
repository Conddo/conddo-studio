"use client";

import { Activity, Briefcase, Clock } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { JobList } from "@/components/app/JobList";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useStudioEvent } from "@/hooks/useStudioEvent";
import { adminApi } from "@/lib/admin";
import { statusStyle, slaTone as slaToneMap } from "@/lib/format";
import type { JobStatus, SlaTone } from "@/types";

const SLA_LABEL: Record<SlaTone, string> = { GREEN: "On track", AMBER: "At risk", RED: "Critical" };

// The statuses most relevant to operations attention, in the order leadership scans them.
const STATUS_ORDER: JobStatus[] = [
  "AVAILABLE", "ASSIGNED", "IN_PROGRESS", "SUBMITTED", "IN_REVIEW", "REVISION", "ESCALATED", "APPROVED", "DELIVERED",
];

export default function OperationsDashboardPage() {
  const { data, loading, error, refetch } = useApiQuery(adminApi.dashboard);
  const jobs = data?.jobs ?? [];
  const byStatus = data?.byStatus ?? {};
  const bySla = data?.bySla ?? {};

  const totalActive = jobs.filter((j) => !["APPROVED", "DELIVERED", "CANCELLED"].includes(j.status)).length;

  // Live: every job lifecycle event can shift the dashboard's counts, so refetch
  // the snapshot. sla.tick also lands here every 5 min while AMBER/RED jobs exist —
  // we refetch on it too so the tone counts update without waiting for the next page load.
  useStudioEvent("job.created", refetch);
  useStudioEvent("job.claimed", refetch);
  useStudioEvent("job.started", refetch);
  useStudioEvent("job.submitted", refetch);
  useStudioEvent("job.approved", refetch);
  useStudioEvent("job.revision_requested", refetch);
  useStudioEvent("job.reassigned", refetch);
  useStudioEvent("job.escalated", refetch);
  useStudioEvent("job.sla_extended", refetch);
  useStudioEvent("sla.tick", refetch);

  return (
    <StudioShell title="Operations" subtitle="Real-time view of every job across the floor.">
      {/* SLA tone counts */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(["GREEN", "AMBER", "RED"] as SlaTone[]).map((t) => {
          const tone = slaToneMap[t];
          return (
            <div key={t} className={`rounded-xl border border-neutral-border bg-neutral-surface p-5`}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] text-content-secondary">{SLA_LABEL[t]}</p>
                <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
              </div>
              <p className={`font-mono text-[28px] font-semibold leading-none ${tone.text}`}>{bySla[t] ?? 0}</p>
            </div>
          );
        })}
      </div>

      {/* Status counts */}
      <div className="mb-8 rounded-xl border border-neutral-border bg-neutral-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink"><Activity size={17} /> Status breakdown</h2>
          <p className="font-mono text-[12px] text-content-muted">{totalActive} active</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.filter((s) => byStatus[s]).map((s) => {
            const meta = statusStyle[s];
            return (
              <span key={s} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium ${meta.text} ${meta.bg}`}>
                {meta.label}
                <span className="font-mono text-[11px] opacity-80">{byStatus[s]}</span>
              </span>
            );
          })}
          {Object.keys(byStatus).length === 0 && <p className="text-[13px] text-content-secondary">No jobs on the board yet.</p>}
        </div>
      </div>

      {/* All jobs */}
      <h2 className="mb-4 flex items-center gap-2 text-[15px] font-medium text-ink"><Briefcase size={17} /> All jobs</h2>
      <JobList
        jobs={jobs}
        loading={loading}
        error={error}
        onRetry={refetch}
        loadingLabel="Loading the board…"
        emptyIcon={Clock}
        emptyTitle="Quiet board"
        emptyDescription="When jobs are created they'll show up here."
      />
    </StudioShell>
  );
}
