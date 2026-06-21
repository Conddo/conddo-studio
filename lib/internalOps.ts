// Internal Operations API — financial metrics, accounting, and operational activities
import { api } from "./api";

export type FinancialMetrics = {
  id?: number;
  month: string; // YearMonth format "2024-01"
  cashBalance?: number;
  grossBurnRate?: number;
  netBurnRate?: number;
  cashRunwayMonths?: number;
  zeroCashDate?: string;
  mrr?: number;
  arr?: number;
  newMrr?: number;
  churnedMrr?: number;
  expansionMrr?: number;
  totalCustomers?: number;
  newCustomers?: number;
  churnedCustomers?: number;
  cac?: number;
  ltv?: number;
  ltvToCacRatio?: number;
  cacPaybackMonths?: number;
  netRevenueRetention?: number;
  grossRevenueRetention?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AccountingEntry = {
  id?: number;
  entryNumber?: string;
  type: "REVENUE" | "EXPENSE" | "CASH_IN" | "CASH_OUT" | "ACCRUAL" | "DEFERRAL";
  category: "SUBSCRIPTION" | "ONE_TIME" | "EXPANSION" | "SERVICE" | "PAYROLL" | "INFRASTRUCTURE" | "MARKETING" | "SALES" | "LEGAL" | "OFFICE" | "SOFTWARE" | "INVESTMENT" | "LOAN" | "GRANT" | "REFUND" | "PAYMENT";
  description: string;
  amount: number;
  entryDate: string;
  recognizedDate?: string;
  relatedEntity?: string;
  reference?: string;
  status: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OperationalActivity = {
  id?: number;
  title: string;
  description: string;
  category: "PRODUCT" | "ENGINEERING" | "SALES" | "MARKETING" | "OPERATIONS" | "FINANCE" | "HR" | "LEGAL";
  status: "PLANNED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
  startDate?: string;
  targetDate?: string;
  completedDate?: string;
  priority?: number;
  assignedTo?: string;
  tags?: string;
  progressNotes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type FinancialSummary = {
  cashBalance?: number;
  netBurnRate?: number;
  cashRunwayMonths?: number;
  zeroCashDate?: string;
  mrr?: number;
  arr?: number;
  ltvToCacRatio?: number;
  netRevenueRetention?: number;
  grossRevenueRetention?: number;
  totalCustomers?: number;
  month?: string;
};

export type AccountingSummary = {
  totalRevenue: number;
  totalExpenses: number;
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
  period: { start: string; end: string };
};

export type ActivitiesDashboard = {
  activeActivities: OperationalActivity[];
  statusCounts: {
    planned: number;
    inProgress: number;
    blocked: number;
    completed: number;
  };
  recentlyCompleted: OperationalActivity[];
};

export type RoadmapItem = {
  id?: number;
  title: string;
  description: string;
  category: "PRODUCT" | "ENGINEERING" | "DESIGN" | "MARKETING" | "SALES" | "OPERATIONS" | "INFRASTRUCTURE" | "SECURITY";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "PLANNED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED" | "DEFERRED";
  targetDate: string;
  startDate?: string;
  completedDate?: string;
  assignedTo?: string;
  quarter?: string;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string;
  successCriteria?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type WeeklyMetricReview = {
  id?: number;
  weekStartDate: string;
  weekEndDate: string;
  cashBalance?: number;
  netBurnRate?: number;
  cashRunwayMonths?: number;
  mrr?: number;
  arr?: number;
  totalCustomers?: number;
  newCustomersThisWeek?: number;
  churnedCustomersThisWeek?: number;
  cac?: number;
  ltv?: number;
  ltvToCacRatio?: number;
  netRevenueRetention?: number;
  activeUsers?: number;
  dailyActiveUsers?: number;
  newSignups?: number;
  supportTickets?: number;
  churnRate?: number;
  highlights?: string;
  concerns?: string;
  keyLearnings?: string;
  actionItems?: string;
  blockers?: string;
  reviewedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RoadmapDashboard = {
  activeItems: RoadmapItem[];
  statusCounts: {
    planned: number;
    inProgress: number;
    blocked: number;
    completed: number;
  };
  recentlyCompleted: RoadmapItem[];
};

export const internalOpsApi = {
  // Financial Metrics
  financialSummary: () => api.get<FinancialSummary>("/operations/financial/summary"),
  financialHistory: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    const queryString = query.toString();
    return api.get<FinancialMetrics[]>(`/operations/financial/history${queryString ? `?${queryString}` : ""}`);
  },
  createFinancialMetrics: (metrics: FinancialMetrics) =>
    api.post<FinancialMetrics>("/operations/financial/metrics", metrics),
  updateFinancialMetrics: (id: number, updates: Partial<FinancialMetrics>) =>
    api.patch<FinancialMetrics>(`/operations/financial/metrics/${id}`, updates),

  // Accounting
  accountingEntries: (params?: { startDate?: string; endDate?: string; category?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    if (params?.category) query.set("category", params.category);
    if (params?.type) query.set("type", params.type);
    const queryString = query.toString();
    return api.get<AccountingEntry[]>(`/operations/accounting/entries${queryString ? `?${queryString}` : ""}`);
  },
  createAccountingEntry: (entry: AccountingEntry) =>
    api.post<AccountingEntry>("/operations/accounting/entries", entry),
  accountingSummary: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    const queryString = query.toString();
    return api.get<AccountingSummary>(`/operations/accounting/summary${queryString ? `?${queryString}` : ""}`);
  },

  // Operational Activities
  activities: (params?: { status?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.category) query.set("category", params.category);
    const queryString = query.toString();
    return api.get<OperationalActivity[]>(`/operations/activities${queryString ? `?${queryString}` : ""}`);
  },
  activitiesDashboard: () =>
    api.get<ActivitiesDashboard>("/operations/activities/dashboard"),
  createActivity: (activity: OperationalActivity) =>
    api.post<OperationalActivity>("/operations/activities", activity),
  updateActivity: (id: number, updates: Partial<OperationalActivity>) =>
    api.patch<OperationalActivity>(`/operations/activities/${id}`, updates),
  deleteActivity: (id: number) =>
    api.del<void>(`/operations/activities/${id}`),

  // Roadmap Planner
  roadmap: (params?: { status?: string; category?: string; priority?: string; quarter?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.category) query.set("category", params.category);
    if (params?.priority) query.set("priority", params.priority);
    if (params?.quarter) query.set("quarter", params.quarter);
    const queryString = query.toString();
    return api.get<RoadmapItem[]>(`/operations/roadmap${queryString ? `?${queryString}` : ""}`);
  },
  roadmapDashboard: () => api.get<RoadmapDashboard>("/operations/roadmap/dashboard"),
  createRoadmapItem: (item: RoadmapItem) =>
    api.post<RoadmapItem>("/operations/roadmap", item),
  updateRoadmapItem: (id: number, updates: Partial<RoadmapItem>) =>
    api.patch<RoadmapItem>(`/operations/roadmap/${id}`, updates),
  deleteRoadmapItem: (id: number) =>
    api.del<void>(`/operations/roadmap/${id}`),

  // Weekly Metric Reviews
  weeklyReviews: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    const queryString = query.toString();
    return api.get<WeeklyMetricReview[]>(`/operations/weekly-reviews${queryString ? `?${queryString}` : ""}`);
  },
  latestWeeklyReview: () => api.get<WeeklyMetricReview>("/operations/weekly-reviews/latest"),
  createWeeklyReview: (review: WeeklyMetricReview) =>
    api.post<WeeklyMetricReview>("/operations/weekly-reviews", review),
  updateWeeklyReview: (id: number, updates: Partial<WeeklyMetricReview>) =>
    api.patch<WeeklyMetricReview>(`/operations/weekly-reviews/${id}`, updates),
  deleteWeeklyReview: (id: number) =>
    api.del<void>(`/operations/weekly-reviews/${id}`),
};
