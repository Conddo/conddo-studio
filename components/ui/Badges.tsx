import type { JobStatus, SlaTone } from "@/types";
import { statusStyle, slaTone as slaToneMap, jobTypeLabel, slaRemaining } from "@/lib/format";

export function StatusBadge({ status }: { status: JobStatus }) {
  const s = statusStyle[status] ?? statusStyle.QUEUED;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${s.text} ${s.bg}`}>{s.label}</span>;
}

// Job-type pill colours per the Studio spec (§16).
const TYPE_PILL: Record<string, string> = {
  WEBSITE_BUILD: "bg-primary/15 text-primary-light border-primary/30",
  WEBSITE_REVISION: "bg-primary-light/15 text-primary-light border-primary-light/30",
  GRAPHIC_DESIGN: "bg-warning/15 text-warning border-warning/30",
  AD_CREATIVE: "bg-danger/15 text-danger border-danger/30",
  BRAND_KIT: "bg-success/15 text-success border-success/30",
  CONTENT_WRITING: "bg-info/15 text-info border-info/30",
};

export function JobTypePill({ type }: { type: string }) {
  const cls = TYPE_PILL[type] ?? "bg-neutral-surface2 text-content-secondary border-neutral-border";
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{jobTypeLabel(type)}</span>;
}

/** SLA countdown — Geist Mono, colour-coded by the backend's slaTone. */
export function SlaBadge({ tone, deadline }: { tone: SlaTone; deadline: string }) {
  const t = slaToneMap[tone] ?? slaToneMap.GREEN;
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[12px] ${t.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {slaRemaining(deadline)}
    </span>
  );
}
