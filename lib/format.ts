import type { JobStatus, Role, SlaTone } from "@/types";

export const fmtDateTime = (t: string | null) => {
  if (!t) return "—";
  const d = new Date(t);
  return isNaN(d.getTime()) ? t : d.toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

/** Human SLA remaining from a deadline ISO string, e.g. "in 5h 12m" / "overdue 2h". */
export function slaRemaining(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now();
  if (isNaN(ms)) return "—";
  const overdue = ms < 0;
  const mins = Math.floor(Math.abs(ms) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const label = h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  return overdue ? `overdue ${label}` : `in ${label}`;
}

type Tone = { text: string; bg: string; dot: string };
export const slaTone: Record<SlaTone, Tone> = {
  GREEN: { text: "text-success", bg: "bg-success-bg", dot: "bg-success" },
  AMBER: { text: "text-warning", bg: "bg-warning-bg", dot: "bg-warning" },
  RED: { text: "text-danger", bg: "bg-danger-bg", dot: "bg-danger" },
};

// Job status → chip styling (dark).
export const statusStyle: Record<JobStatus, { label: string; text: string; bg: string }> = {
  QUEUED: { label: "Queued", text: "text-content-secondary", bg: "bg-neutral-surface2" },
  AVAILABLE: { label: "Available", text: "text-info", bg: "bg-info-bg" },
  ASSIGNED: { label: "Assigned", text: "text-primary-light", bg: "bg-primary-bg" },
  IN_PROGRESS: { label: "In progress", text: "text-warning", bg: "bg-warning-bg" },
  SUBMITTED: { label: "Submitted", text: "text-info", bg: "bg-info-bg" },
  IN_REVIEW: { label: "In review", text: "text-info", bg: "bg-info-bg" },
  REVISION: { label: "Revision", text: "text-danger", bg: "bg-danger-bg" },
  APPROVED: { label: "Approved", text: "text-success", bg: "bg-success-bg" },
  DELIVERED: { label: "Delivered", text: "text-success", bg: "bg-success-bg" },
  ESCALATED: { label: "Escalated", text: "text-danger", bg: "bg-danger-bg" },
  CANCELLED: { label: "Cancelled", text: "text-content-muted", bg: "bg-neutral-surface2" },
};

const JOB_TYPE_LABELS: Record<string, string> = {
  WEBSITE_BUILD: "Website Build",
  WEBSITE_REVISION: "Website Revision",
  GRAPHIC_DESIGN: "Graphic Design",
  AD_CREATIVE: "Ad Creative",
  BRAND_KIT: "Brand Kit",
  CONTENT_WRITING: "Content Writing",
};
export const jobTypeLabel = (id: string) => JOB_TYPE_LABELS[id] ?? id;

const ROLE_LABELS: Record<Role, string> = {
  DEVELOPER: "Developer",
  DESIGNER: "Designer",
  WRITER: "Writer",
  QA_REVIEWER: "QA Reviewer",
  TEAM_LEAD: "Team Lead",
  ADMIN: "Admin",
};
export const roleLabel = (r: Role) => ROLE_LABELS[r] ?? r;

export const initialsOf = (s: string) =>
  s.trim().split(/[\s@.]+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
