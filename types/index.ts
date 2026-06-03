// Conddo Studio domain types — mirror the backend DTOs (io.conddo.studio.web.dto).

export type Role = "DEVELOPER" | "DESIGNER" | "WRITER" | "QA_REVIEWER" | "TEAM_LEAD" | "ADMIN";

export type JobStatus =
  | "QUEUED" | "AVAILABLE" | "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED"
  | "IN_REVIEW" | "REVISION" | "APPROVED" | "DELIVERED" | "ESCALATED" | "CANCELLED";

export type SlaTone = "GREEN" | "AMBER" | "RED";

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
