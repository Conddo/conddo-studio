// Conddo Studio domain types — mirror the backend DTOs (io.conddo.studio.web.dto).

export type Role = "DEVELOPER" | "DESIGNER" | "WRITER" | "QA_REVIEWER" | "TEAM_LEAD" | "ADMIN";

export type JobStatus =
  | "QUEUED" | "AVAILABLE" | "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED"
  | "IN_REVIEW" | "REVISION" | "APPROVED" | "DELIVERED" | "ESCALATED" | "CANCELLED";

export type SlaTone = "GREEN" | "AMBER" | "RED";

/** Design Standard "kind" — the AI uses these to ground its suggestions per
 *  vertical (e.g. a PHARMACY job pulls the active PALETTE standards for that
 *  vertical into the colour-palette prompt). The set is fixed by the backend. */
export type DesignStandardKind = "PALETTE" | "LAYOUT" | "COPY_PATTERN" | "TYPOGRAPHY";

/** Design Standard — admin-curated reference content per (vertical, kind). A
 *  null vertical means "applies to every vertical". `content` is a free-form
 *  JSONB blob whose shape depends on `kind` (palette hex map, layout grid
 *  config, copy snippets, font/scale config). Mirrors
 *  io.conddo.studio.web.dto.DesignStandardDto. */
export type DesignStandard = {
  id: string;
  vertical: string | null;
  kind: DesignStandardKind;
  name: string;
  description: string | null;
  content: Record<string, unknown>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

/** A QA checklist item attached to a JobType (or override). Stored as JSONB on
 *  the backend; the FE keeps it loosely typed since admins can add arbitrary
 *  keys. The minimum contract is { id, label, required }. */
export type QaChecklistItem = {
  id: string;
  label: string;
  required?: boolean;
  section?: string;
  [extra: string]: unknown;
};

/** Studio job type — mirrors io.conddo.studio.web.dto.JobTypeDto. The id is
 *  UPPER_SNAKE_CASE (3-32 chars) and stable; everything else can be edited by
 *  ADMIN via PATCH. Soft-delete via DELETE flips `active` to false. */
export type JobType = {
  id: string;
  displayName: string;
  colour: string;
  assignedToRoles: string[];
  slaHours: number;
  qaRequired: boolean;
  qaChecklist: QaChecklistItem[];
  active: boolean;
};

export type Staff = {
  id: string;
  name: string;
  email: string;
  role: Role;
  skills: string[];
  active: boolean;
  lastActive: string | null;
};

export type AuthResult = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  staff: Staff;
};

export type JobCard = {
  id: string;
  jobNumber: string;
  jobType: string;
  title: string;
  status: JobStatus;
  slaTone: SlaTone;
  slaDeadline: string;
  assignedTo: string | null;
  tenantId: string;
  createdAt: string;
};

/** A file uploaded to a job (Cloudinary-backed). Backend returns a loose
 *  Map<String, Object> — these are the fields the asset service emits. */
export type JobAsset = {
  id: string;
  filename: string;
  url: string;                  // Cloudinary secure_url
  publicId?: string;
  contentType?: string;
  bytes?: number;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt?: string;
};

// ----- AI assistant (§8) — fail-safe results; `available:false` means Claude
//       is unconfigured/down/unparseable and the UI should hide the assist UX
//       rather than show an error.

export type AiCopyResult = {
  available: boolean;
  section: string;
  copy: Record<string, unknown>; // section-specific shape (HERO: headline/subheadline/ctaText, etc.)
};

export type AiPaletteResult = {
  available: boolean;
  palette: Record<string, string>;
};

export type AiRankedImage = {
  url: string;
  score: number;                // 1..10
  reason: string;
  recommendation: "RECOMMENDED" | "ACCEPTABLE" | "REJECT";
};

export type AiRankResult = {
  available: boolean;
  ranked: AiRankedImage[];      // sorted by score desc
};

export type JobActivity = {
  id: string;
  action: string;
  detail: string | null;
  staffId: string | null;
  at: string;
};

export type QaReview = {
  id: string;
  reviewerId: string;
  reviewerName?: string | null;
  reviewNumber: number;
  outcome: "APPROVED" | "REVISION";
  reviewerNotes: string | null;
  positiveNotes: string | null;
  checklist: Record<string, { passed: boolean; note: string | null }>;
  at: string;
};

export type Performance = {
  staffId: string;
  jobsCompleted: number;
  jobsTarget: number;
  firstPassQaRate: number;     // 0..1, backend-computed
  revisionsReceived: number;
};

export type StudioNotification = {
  id: string;
  type: string;                // e.g. JOB_ASSIGNED, REVISION_REQUESTED, ESCALATED
  title: string;
  message: string;
  jobId: string | null;
  read: boolean;
  at: string;
};

export type NotificationFeed = {
  items: StudioNotification[];
  unread: number;
};

export type JobDetail = {
  id: string;
  jobNumber: string;
  jobType: string;
  title: string;
  status: JobStatus;
  slaTone: SlaTone;
  slaDeadline: string;
  slaExtendedBy: number;
  revisionCount: number;
  assignedTo: string | null;
  assignedToName: string | null;
  tenantId: string;
  studioUrl: string | null;
  brief: Record<string, unknown>;
  assets: Record<string, unknown>[];
  activity: JobActivity[];
  qaReviews: QaReview[];
  createdAt: string;
};
