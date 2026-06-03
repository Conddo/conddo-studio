"use client";

import { BarChart3, CheckCircle2, RotateCcw, Target } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { useApiQuery } from "@/hooks/useApiQuery";
import { performanceApi } from "@/lib/performance";

/** Backend stores firstPassQaRate as 0..1. Show as a clean percent. */
const pct = (rate: number) => `${Math.round(rate * 100)}%`;

/** Tone the QA rate into the existing success/warning/danger palette.
 *  Cutoffs match how leads talk about quality: 90+ great, 70+ acceptable. */
function qaTone(rate: number): { text: string; ring: string } {
  if (rate >= 0.9) return { text: "text-success", ring: "ring-success/30" };
  if (rate >= 0.7) return { text: "text-warning", ring: "ring-warning/30" };
  return { text: "text-danger", ring: "ring-danger/30" };
}

export default function PerformancePage() {
  const { data, loading, error, refetch } = useApiQuery(performanceApi.me);

  return (
    <StudioShell title="Performance" subtitle="Your output this period.">
      {loading && !data ? (
        <LoadingState label="Loading your performance…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data ? (
        <p className="text-[14px] text-content-secondary">No performance data yet.</p>
      ) : (
        <PerformanceView p={data} />
      )}
    </StudioShell>
  );
}

function PerformanceView({ p }: { p: { jobsCompleted: number; jobsTarget: number; firstPassQaRate: number; revisionsReceived: number } }) {
  const qa = qaTone(p.firstPassQaRate);
  const targetPct = p.jobsTarget > 0 ? Math.min(100, Math.round((p.jobsCompleted / p.jobsTarget) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label="Jobs completed"
          value={p.jobsCompleted.toString()}
          hint={p.jobsTarget > 0 ? `Target ${p.jobsTarget}` : undefined}
        />
        <StatCard
          icon={Target}
          label="Target progress"
          value={p.jobsTarget > 0 ? `${targetPct}%` : "—"}
          hint={p.jobsTarget > 0 ? `${p.jobsCompleted} of ${p.jobsTarget}` : "No target set"}
        />
        <StatCard
          icon={BarChart3}
          label="First-pass QA"
          value={pct(p.firstPassQaRate)}
          valueClass={qa.text}
          ringClass={qa.ring}
          hint="Approved without revision"
        />
        <StatCard
          icon={RotateCcw}
          label="Revisions received"
          value={p.revisionsReceived.toString()}
          hint="Returned by QA"
        />
      </div>

      {p.jobsTarget > 0 && (
        <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[12px] uppercase tracking-[0.06em] text-content-muted">Target</p>
              <p className="text-[15px] font-medium text-ink">{p.jobsCompleted} of {p.jobsTarget} jobs</p>
            </div>
            <p className="font-mono text-[13px] text-content-secondary">{targetPct}%</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-surface2">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${targetPct}%` }} />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
        <h3 className="mb-2 text-[15px] font-medium text-ink">How this is calculated</h3>
        <ul className="space-y-1.5 text-[13px] text-content-secondary">
          <li>· <strong className="text-ink">First-pass QA</strong> — share of submissions approved without a revision round.</li>
          <li>· <strong className="text-ink">Revisions received</strong> — total times QA returned your work for changes.</li>
          <li>· <strong className="text-ink">Target</strong> — set by your team lead. Speak to them to adjust.</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, hint, valueClass, ringClass,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
  ringClass?: string;
}) {
  return (
    <div className={`rounded-xl border border-neutral-border bg-neutral-surface p-5 ${ringClass ? `ring-1 ${ringClass}` : ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] text-content-secondary">{label}</p>
        <Icon size={18} className="text-content-muted" />
      </div>
      <p className={`font-mono text-[28px] font-semibold leading-none ${valueClass ?? "text-ink"}`}>{value}</p>
      {hint && <p className="mt-2 text-[12px] text-content-muted">{hint}</p>}
    </div>
  );
}
