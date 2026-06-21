"use client";

import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, Plus, MapPin, Calendar } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { useApiQuery } from "@/hooks/useApiQuery";
import { internalOpsApi, type FinancialSummary, type ActivitiesDashboard } from "@/lib/internalOps";
import Link from "next/link";

export default function InternalOpsPage() {
  const { data: financial, loading: financialLoading, error: financialError, refetch: refetchFinancial } = 
    useApiQuery(internalOpsApi.financialSummary);
  
  const { data: activities, loading: activitiesLoading, error: activitiesError, refetch: refetchActivities } = 
    useApiQuery(internalOpsApi.activitiesDashboard);

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value?: number) => {
    if (value === undefined || value === null) return "—";
    return `${(value * 100).toFixed(1)}%`;
  };

  const getRunwayStatus = (months?: number) => {
    if (!months) return { color: "text-content-muted", label: "Unknown" };
    if (months >= 12) return { color: "text-green-600", label: "Healthy" };
    if (months >= 6) return { color: "text-yellow-600", label: "Moderate" };
    return { color: "text-red-600", label: "Critical" };
  };

  const runwayStatus = getRunwayStatus(financial?.cashRunwayMonths);

  return (
    <StudioShell title="Internal Operations" subtitle="Financial metrics and day-to-day activity tracking for Conddo.">
      <div className="space-y-6">
        {/* Quick Links */}
        <section>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link href="/internal/roadmap" className="flex items-center gap-3 rounded-xl border border-neutral-border bg-neutral-surface p-5 hover:bg-neutral-bg transition-colors">
              <div className="rounded-lg bg-blue-100 p-3">
                <MapPin size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-ink">Product Roadmap</p>
                <p className="text-[12px] text-content-secondary">Strategic planning and milestones</p>
              </div>
            </Link>
            <Link href="/internal/weekly-reviews" className="flex items-center gap-3 rounded-xl border border-neutral-border bg-neutral-surface p-5 hover:bg-neutral-bg transition-colors">
              <div className="rounded-lg bg-purple-100 p-3">
                <Calendar size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-ink">Weekly Reviews</p>
                <p className="text-[12px] text-content-secondary">Performance tracking and analysis</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Financial Summary Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink">
              <DollarSign size={17} />
              Financial Overview
            </h2>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Cash Balance */}
            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <p className="mb-2 text-[12px] text-content-secondary">Cash Balance</p>
              <p className="font-mono text-[24px] font-semibold leading-none text-ink">
                {formatCurrency(financial?.cashBalance)}
              </p>
            </div>

            {/* Net Burn Rate */}
            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <p className="mb-2 text-[12px] text-content-secondary">Net Burn Rate</p>
              <p className="font-mono text-[24px] font-semibold leading-none text-ink">
                {formatCurrency(financial?.netBurnRate)}
                <span className="text-[12px] text-content-muted">/mo</span>
              </p>
            </div>

            {/* Cash Runway */}
            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <p className="mb-2 text-[12px] text-content-secondary">Cash Runway</p>
              <p className={`font-mono text-[24px] font-semibold leading-none ${runwayStatus.color}`}>
                {financial?.cashRunwayMonths ?? "—"}
                <span className="text-[12px]"> months</span>
              </p>
              <p className="mt-1 text-[11px] text-content-muted">{runwayStatus.label}</p>
            </div>

            {/* Zero Cash Date */}
            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <p className="mb-2 text-[12px] text-content-secondary">Zero Cash Date</p>
              <p className="font-mono text-[24px] font-semibold leading-none text-ink">
                {financial?.zeroCashDate ? new Date(financial.zeroCashDate).toLocaleDateString("en-US", { 
                  month: "short", 
                  year: "numeric" 
                }) : "—"}
              </p>
            </div>
          </div>

          {/* Revenue Metrics */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* MRR */}
            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <p className="mb-2 text-[12px] text-content-secondary">MRR</p>
              <p className="font-mono text-[24px] font-semibold leading-none text-ink">
                {formatCurrency(financial?.mrr)}
              </p>
            </div>

            {/* ARR */}
            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <p className="mb-2 text-[12px] text-content-secondary">ARR</p>
              <p className="font-mono text-[24px] font-semibold leading-none text-ink">
                {formatCurrency(financial?.arr)}
              </p>
            </div>

            {/* Total Customers */}
            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <p className="mb-2 text-[12px] text-content-secondary">Total Customers</p>
              <p className="font-mono text-[24px] font-semibold leading-none text-ink">
                {financial?.totalCustomers ?? "—"}
              </p>
            </div>

            {/* LTV:CAC Ratio */}
            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <p className="mb-2 text-[12px] text-content-secondary">LTV:CAC Ratio</p>
              <p className="font-mono text-[24px] font-semibold leading-none text-ink">
                {financial?.ltvToCacRatio ? financial.ltvToCacRatio.toFixed(2) : "—"}
              </p>
            </div>
          </div>

          {/* Retention Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <p className="mb-2 text-[12px] text-content-secondary">Net Revenue Retention</p>
              <p className="font-mono text-[28px] font-semibold leading-none text-ink">
                {formatPercent(financial?.netRevenueRetention)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <p className="mb-2 text-[12px] text-content-secondary">Gross Revenue Retention</p>
              <p className="font-mono text-[28px] font-semibold leading-none text-ink">
                {formatPercent(financial?.grossRevenueRetention)}
              </p>
            </div>
          </div>
        </section>

        {/* Operational Activities Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink">
              <TrendingUp size={17} />
              Operational Activities
            </h2>
          </div>

          {/* Status Counts */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] text-content-secondary">Planned</p>
                <Clock size={14} className="text-content-muted" />
              </div>
              <p className="font-mono text-[28px] font-semibold leading-none text-ink">
                {activities?.statusCounts?.planned ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] text-content-secondary">In Progress</p>
                <TrendingUp size={14} className="text-blue-500" />
              </div>
              <p className="font-mono text-[28px] font-semibold leading-none text-ink">
                {activities?.statusCounts?.inProgress ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] text-content-secondary">Blocked</p>
                <AlertTriangle size={14} className="text-red-500" />
              </div>
              <p className="font-mono text-[28px] font-semibold leading-none text-ink">
                {activities?.statusCounts?.blocked ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] text-content-secondary">Completed</p>
                <CheckCircle size={14} className="text-green-500" />
              </div>
              <p className="font-mono text-[28px] font-semibold leading-none text-ink">
                {activities?.statusCounts?.completed ?? 0}
              </p>
            </div>
          </div>

          {/* Active Activities List */}
          <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
            <h3 className="mb-4 text-[14px] font-medium text-ink">Active Activities</h3>
            {activities?.activeActivities && activities.activeActivities.length > 0 ? (
              <div className="space-y-3">
                {activities.activeActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 rounded-lg border border-neutral-border bg-neutral-bg p-4">
                    <div className="mt-0.5">
                      {activity.status === "IN_PROGRESS" && <TrendingUp size={16} className="text-blue-500" />}
                      {activity.status === "BLOCKED" && <AlertTriangle size={16} className="text-red-500" />}
                      {activity.status === "PLANNED" && <Clock size={16} className="text-content-muted" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-ink">{activity.title}</p>
                      <p className="text-[12px] text-content-secondary">{activity.category}</p>
                      {activity.assignedTo && (
                        <p className="mt-1 text-[11px] text-content-muted">Assigned to: {activity.assignedTo}</p>
                      )}
                    </div>
                    {activity.targetDate && (
                      <div className="text-right">
                        <p className="text-[11px] text-content-muted">Target</p>
                        <p className="font-mono text-[12px] text-ink">
                          {new Date(activity.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-content-secondary">No active activities</p>
            )}
          </div>
        </section>
      </div>
    </StudioShell>
  );
}
