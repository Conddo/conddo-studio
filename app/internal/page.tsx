"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, Plus, MapPin, Calendar, X, Edit2, Trash2 } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { useApiQuery } from "@/hooks/useApiQuery";
import { internalOpsApi, type FinancialSummary, type ActivitiesDashboard, type FinancialMetrics } from "@/lib/internalOps";
import Link from "next/link";

export default function InternalOpsPage() {
  const { data: financial, loading: financialLoading, error: financialError, refetch: refetchFinancial } = 
    useApiQuery(internalOpsApi.financialSummary);
  
  const { data: activities, loading: activitiesLoading, error: activitiesError, refetch: refetchActivities } = 
    useApiQuery(internalOpsApi.activitiesDashboard);

  const { data: financialHistory, refetch: refetchHistory } = useApiQuery(internalOpsApi.financialHistory);

  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [editingFinancial, setEditingFinancial] = useState<FinancialMetrics | null>(null);
  const [financialFormData, setFinancialFormData] = useState<Partial<FinancialMetrics>>({
    month: "",
    cashBalance: undefined,
    grossBurnRate: undefined,
    netBurnRate: undefined,
    cashRunwayMonths: undefined,
    zeroCashDate: undefined,
    mrr: undefined,
    arr: undefined,
    newMrr: undefined,
    churnedMrr: undefined,
    expansionMrr: undefined,
    totalCustomers: undefined,
    newCustomers: undefined,
    churnedCustomers: undefined,
    cac: undefined,
    ltv: undefined,
    ltvToCacRatio: undefined,
    cacPaybackMonths: undefined,
    netRevenueRetention: undefined,
    grossRevenueRetention: undefined,
  });

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

  const handleCreateFinancial = async () => {
    try {
      await internalOpsApi.createFinancialMetrics(financialFormData as FinancialMetrics);
      setShowFinancialModal(false);
      setFinancialFormData({
        month: "",
        cashBalance: undefined,
        grossBurnRate: undefined,
        netBurnRate: undefined,
        cashRunwayMonths: undefined,
        zeroCashDate: undefined,
        mrr: undefined,
        arr: undefined,
        newMrr: undefined,
        churnedMrr: undefined,
        expansionMrr: undefined,
        totalCustomers: undefined,
        newCustomers: undefined,
        churnedCustomers: undefined,
        cac: undefined,
        ltv: undefined,
        ltvToCacRatio: undefined,
        cacPaybackMonths: undefined,
        netRevenueRetention: undefined,
        grossRevenueRetention: undefined,
      });
      refetchFinancial();
      refetchHistory();
    } catch (error) {
      console.error("Failed to create financial metrics:", error);
    }
  };

  const handleUpdateFinancial = async () => {
    if (!editingFinancial?.id) return;
    try {
      await internalOpsApi.updateFinancialMetrics(editingFinancial.id, financialFormData);
      setEditingFinancial(null);
      setFinancialFormData({
        month: "",
        cashBalance: undefined,
        grossBurnRate: undefined,
        netBurnRate: undefined,
        cashRunwayMonths: undefined,
        zeroCashDate: undefined,
        mrr: undefined,
        arr: undefined,
        newMrr: undefined,
        churnedMrr: undefined,
        expansionMrr: undefined,
        totalCustomers: undefined,
        newCustomers: undefined,
        churnedCustomers: undefined,
        cac: undefined,
        ltv: undefined,
        ltvToCacRatio: undefined,
        cacPaybackMonths: undefined,
        netRevenueRetention: undefined,
        grossRevenueRetention: undefined,
      });
      refetchFinancial();
      refetchHistory();
    } catch (error) {
      console.error("Failed to update financial metrics:", error);
    }
  };

  const handleDeleteFinancial = async (id: number) => {
    if (!confirm("Are you sure you want to delete this financial metrics entry?")) return;
    try {
      await internalOpsApi.updateFinancialMetrics(id, {});
      refetchFinancial();
      refetchHistory();
    } catch (error) {
      console.error("Failed to delete financial metrics:", error);
    }
  };

  const openEditFinancialModal = (metrics: FinancialMetrics) => {
    setEditingFinancial(metrics);
    setFinancialFormData(metrics);
  };

  return (
    <StudioShell 
      title="Internal Operations" 
      subtitle="Financial metrics and day-to-day activity tracking for Conddo."
      actions={
        <button 
          onClick={() => setShowFinancialModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-600"
        >
          <Plus size={16} />
          Add Financial Metrics
        </button>
      }
    >
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

          {/* Financial History */}
          {financialHistory && financialHistory.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-4 text-[14px] font-medium text-ink">Financial History</h3>
              <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
                <div className="space-y-3">
                  {financialHistory.slice(0, 5).map((metrics) => (
                    <div key={metrics.id} className="flex items-center gap-4 rounded-lg border border-neutral-border bg-neutral-bg p-4">
                      <div className="flex-1">
                        <p className="text-[14px] font-medium text-ink">{metrics.month}</p>
                        <p className="text-[12px] text-content-secondary">
                          Cash: {formatCurrency(metrics.cashBalance)} | MRR: {formatCurrency(metrics.mrr)} | Burn: {formatCurrency(metrics.netBurnRate)}/mo
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openEditFinancialModal(metrics)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => metrics.id && handleDeleteFinancial(metrics.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-content-secondary hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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

      {/* Financial Metrics Create/Edit Modal */}
      {(showFinancialModal || editingFinancial) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => {
            setShowFinancialModal(false);
            setEditingFinancial(null);
          }} />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-neutral-border bg-neutral-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-ink">
                {editingFinancial ? "Edit Financial Metrics" : "Add Financial Metrics"}
              </h3>
              <button 
                onClick={() => {
                  setShowFinancialModal(false);
                  setEditingFinancial(null);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-ink">Month (YYYY-MM)</label>
                <input
                  type="month"
                  value={financialFormData.month}
                  onChange={(e) => setFinancialFormData({ ...financialFormData, month: e.target.value })}
                  className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">Cash Balance</label>
                  <input
                    type="number"
                    value={financialFormData.cashBalance || ""}
                    onChange={(e) => setFinancialFormData({ ...financialFormData, cashBalance: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">Net Burn Rate</label>
                  <input
                    type="number"
                    value={financialFormData.netBurnRate || ""}
                    onChange={(e) => setFinancialFormData({ ...financialFormData, netBurnRate: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">Cash Runway (months)</label>
                  <input
                    type="number"
                    value={financialFormData.cashRunwayMonths || ""}
                    onChange={(e) => setFinancialFormData({ ...financialFormData, cashRunwayMonths: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">MRR</label>
                  <input
                    type="number"
                    value={financialFormData.mrr || ""}
                    onChange={(e) => setFinancialFormData({ ...financialFormData, mrr: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">ARR</label>
                  <input
                    type="number"
                    value={financialFormData.arr || ""}
                    onChange={(e) => setFinancialFormData({ ...financialFormData, arr: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">Total Customers</label>
                  <input
                    type="number"
                    value={financialFormData.totalCustomers || ""}
                    onChange={(e) => setFinancialFormData({ ...financialFormData, totalCustomers: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">CAC</label>
                  <input
                    type="number"
                    value={financialFormData.cac || ""}
                    onChange={(e) => setFinancialFormData({ ...financialFormData, cac: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">LTV</label>
                  <input
                    type="number"
                    value={financialFormData.ltv || ""}
                    onChange={(e) => setFinancialFormData({ ...financialFormData, ltv: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">LTV:CAC Ratio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={financialFormData.ltvToCacRatio || ""}
                    onChange={(e) => setFinancialFormData({ ...financialFormData, ltvToCacRatio: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">Net Revenue Retention</label>
                  <input
                    type="number"
                    step="0.01"
                    value={financialFormData.netRevenueRetention || ""}
                    onChange={(e) => setFinancialFormData({ ...financialFormData, netRevenueRetention: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingFinancial ? handleUpdateFinancial : handleCreateFinancial}
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-600"
                >
                  {editingFinancial ? "Update" : "Create"}
                </button>
                <button
                  onClick={() => {
                    setShowFinancialModal(false);
                    setEditingFinancial(null);
                  }}
                  className="flex-1 rounded-lg border border-neutral-border bg-neutral-surface px-4 py-2 text-[13px] font-medium text-ink hover:bg-neutral-bg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StudioShell>
  );
}
