"use client";

import { useState } from "react";
import { Calendar, TrendingUp, Plus, DollarSign, X, Edit2, Trash2 } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { useApiQuery } from "@/hooks/useApiQuery";
import { internalOpsApi, type WeeklyMetricReview } from "@/lib/internalOps";

export default function WeeklyReviewsPage() {
  const { data: reviews, refetch } = useApiQuery(internalOpsApi.weeklyReviews);
  const { data: latest } = useApiQuery(internalOpsApi.latestWeeklyReview);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReview, setEditingReview] = useState<WeeklyMetricReview | null>(null);
  const [formData, setFormData] = useState<Partial<WeeklyMetricReview>>({
    weekStartDate: "",
    weekEndDate: "",
    cashBalance: undefined,
    netBurnRate: undefined,
    cashRunwayMonths: undefined,
    mrr: undefined,
    arr: undefined,
    totalCustomers: undefined,
    newCustomersThisWeek: undefined,
    churnedCustomersThisWeek: undefined,
    cac: undefined,
    ltv: undefined,
    ltvToCacRatio: undefined,
    netRevenueRetention: undefined,
    activeUsers: undefined,
    dailyActiveUsers: undefined,
    newSignups: undefined,
    supportTickets: undefined,
    churnRate: undefined,
    highlights: "",
    concerns: "",
    keyLearnings: "",
    actionItems: "",
    blockers: "",
    reviewedBy: "",
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

  const handleCreate = async () => {
    try {
      await internalOpsApi.createWeeklyReview(formData as WeeklyMetricReview);
      setShowCreateModal(false);
      setFormData({
        weekStartDate: "",
        weekEndDate: "",
        cashBalance: undefined,
        netBurnRate: undefined,
        cashRunwayMonths: undefined,
        mrr: undefined,
        arr: undefined,
        totalCustomers: undefined,
        newCustomersThisWeek: undefined,
        churnedCustomersThisWeek: undefined,
        cac: undefined,
        ltv: undefined,
        ltvToCacRatio: undefined,
        netRevenueRetention: undefined,
        activeUsers: undefined,
        dailyActiveUsers: undefined,
        newSignups: undefined,
        supportTickets: undefined,
        churnRate: undefined,
        highlights: "",
        concerns: "",
        keyLearnings: "",
        actionItems: "",
        blockers: "",
        reviewedBy: "",
      });
      refetch();
    } catch (error) {
      console.error("Failed to create weekly review:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingReview?.id) return;
    try {
      await internalOpsApi.updateWeeklyReview(editingReview.id, formData);
      setEditingReview(null);
      setFormData({
        weekStartDate: "",
        weekEndDate: "",
        cashBalance: undefined,
        netBurnRate: undefined,
        cashRunwayMonths: undefined,
        mrr: undefined,
        arr: undefined,
        totalCustomers: undefined,
        newCustomersThisWeek: undefined,
        churnedCustomersThisWeek: undefined,
        cac: undefined,
        ltv: undefined,
        ltvToCacRatio: undefined,
        netRevenueRetention: undefined,
        activeUsers: undefined,
        dailyActiveUsers: undefined,
        newSignups: undefined,
        supportTickets: undefined,
        churnRate: undefined,
        highlights: "",
        concerns: "",
        keyLearnings: "",
        actionItems: "",
        blockers: "",
        reviewedBy: "",
      });
      refetch();
    } catch (error) {
      console.error("Failed to update weekly review:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this weekly review?")) return;
    try {
      await internalOpsApi.deleteWeeklyReview(id);
      refetch();
    } catch (error) {
      console.error("Failed to delete weekly review:", error);
    }
  };

  const openEditModal = (review: WeeklyMetricReview) => {
    setEditingReview(review);
    setFormData(review);
  };

  return (
    <StudioShell 
      title="Weekly Metric Reviews" 
      subtitle="Weekly performance tracking and analysis for Conddo."
      actions={
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-600"
        >
          <Plus size={16} />
          New Review
        </button>
      }
    >
      <div className="space-y-6">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink">
              <TrendingUp size={17} />
              Latest Review
            </h2>
            {latest && (
              <span className="rounded-lg bg-neutral-surface px-3 py-1 text-[12px] text-content-secondary">
                {new Date(latest.weekStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(latest.weekEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>

          {latest ? (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
                <div className="mb-2 flex items-center gap-2">
                  <DollarSign size={14} className="text-content-muted" />
                  <p className="text-[12px] text-content-secondary">Cash Balance</p>
                </div>
                <p className="font-mono text-[24px] font-semibold leading-none text-ink">
                  {formatCurrency(latest.cashBalance)}
                </p>
              </div>

              <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp size={14} className="text-content-muted" />
                  <p className="text-[12px] text-content-secondary">Net Burn Rate</p>
                </div>
                <p className="font-mono text-[24px] font-semibold leading-none text-ink">
                  {formatCurrency(latest.netBurnRate)}
                  <span className="text-[12px] text-content-muted">/mo</span>
                </p>
              </div>

              <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Calendar size={14} className="text-content-muted" />
                  <p className="text-[12px] text-content-secondary">Cash Runway</p>
                </div>
                <p className="font-mono text-[24px] font-semibold leading-none text-ink">
                  {latest.cashRunwayMonths ?? "—"}
                  <span className="text-[12px]"> months</span>
                </p>
              </div>

              <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
                <div className="mb-2 flex items-center gap-2">
                  <DollarSign size={14} className="text-content-muted" />
                  <p className="text-[12px] text-content-secondary">MRR</p>
                </div>
                <p className="font-mono text-[24px] font-semibold leading-none text-ink">
                  {formatCurrency(latest.mrr)}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <p className="text-[13px] text-content-secondary">No weekly review data available</p>
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink">
              <Calendar size={17} />
              All Reviews
            </h2>
          </div>

          <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
            {reviews && reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="flex items-center gap-4 rounded-lg border border-neutral-border bg-neutral-bg p-4">
                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-ink">
                        {new Date(review.weekStartDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                      <p className="text-[12px] text-content-secondary">
                        {new Date(review.weekStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(review.weekEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                      {review.reviewedBy && (
                        <p className="mt-1 text-[11px] text-content-muted">Reviewed by: {review.reviewedBy}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openEditModal(review)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => review.id && handleDelete(review.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-content-secondary hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="grid grid-cols-2 gap-4 text-right">
                        <div>
                          <p className="text-[11px] text-content-muted">Cash Balance</p>
                          <p className="font-mono text-[13px] text-ink">{formatCurrency(review.cashBalance)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-content-muted">MRR</p>
                          <p className="font-mono text-[13px] text-ink">{formatCurrency(review.mrr)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-content-secondary">No weekly reviews yet</p>
            )}
          </div>
        </section>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingReview) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => {
            setShowCreateModal(false);
            setEditingReview(null);
          }} />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-neutral-border bg-neutral-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-ink">
                {editingReview ? "Edit Weekly Review" : "New Weekly Review"}
              </h3>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingReview(null);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">Week Start Date</label>
                  <input
                    type="date"
                    value={formData.weekStartDate}
                    onChange={(e) => setFormData({ ...formData, weekStartDate: e.target.value })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">Week End Date</label>
                  <input
                    type="date"
                    value={formData.weekEndDate}
                    onChange={(e) => setFormData({ ...formData, weekEndDate: e.target.value })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">Cash Balance</label>
                  <input
                    type="number"
                    value={formData.cashBalance || ""}
                    onChange={(e) => setFormData({ ...formData, cashBalance: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">Net Burn Rate</label>
                  <input
                    type="number"
                    value={formData.netBurnRate || ""}
                    onChange={(e) => setFormData({ ...formData, netBurnRate: e.target.value ? Number(e.target.value) : undefined })}
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
                    value={formData.cashRunwayMonths || ""}
                    onChange={(e) => setFormData({ ...formData, cashRunwayMonths: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">MRR</label>
                  <input
                    type="number"
                    value={formData.mrr || ""}
                    onChange={(e) => setFormData({ ...formData, mrr: e.target.value ? Number(e.target.value) : undefined })}
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
                    value={formData.arr || ""}
                    onChange={(e) => setFormData({ ...formData, arr: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">Total Customers</label>
                  <input
                    type="number"
                    value={formData.totalCustomers || ""}
                    onChange={(e) => setFormData({ ...formData, totalCustomers: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">New Customers This Week</label>
                  <input
                    type="number"
                    value={formData.newCustomersThisWeek || ""}
                    onChange={(e) => setFormData({ ...formData, newCustomersThisWeek: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">Churned Customers This Week</label>
                  <input
                    type="number"
                    value={formData.churnedCustomersThisWeek || ""}
                    onChange={(e) => setFormData({ ...formData, churnedCustomersThisWeek: e.target.value ? Number(e.target.value) : undefined })}
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
                    value={formData.cac || ""}
                    onChange={(e) => setFormData({ ...formData, cac: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">LTV</label>
                  <input
                    type="number"
                    value={formData.ltv || ""}
                    onChange={(e) => setFormData({ ...formData, ltv: e.target.value ? Number(e.target.value) : undefined })}
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
                    value={formData.ltvToCacRatio || ""}
                    onChange={(e) => setFormData({ ...formData, ltvToCacRatio: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">Net Revenue Retention</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.netRevenueRetention || ""}
                    onChange={(e) => setFormData({ ...formData, netRevenueRetention: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">Active Users</label>
                  <input
                    type="number"
                    value={formData.activeUsers || ""}
                    onChange={(e) => setFormData({ ...formData, activeUsers: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">Daily Active Users</label>
                  <input
                    type="number"
                    value={formData.dailyActiveUsers || ""}
                    onChange={(e) => setFormData({ ...formData, dailyActiveUsers: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">New Signups</label>
                  <input
                    type="number"
                    value={formData.newSignups || ""}
                    onChange={(e) => setFormData({ ...formData, newSignups: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-ink">Support Tickets</label>
                  <input
                    type="number"
                    value={formData.supportTickets || ""}
                    onChange={(e) => setFormData({ ...formData, supportTickets: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-ink">Churn Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.churnRate || ""}
                  onChange={(e) => setFormData({ ...formData, churnRate: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-ink">Highlights</label>
                <textarea
                  value={formData.highlights}
                  onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                  className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                  rows={2}
                  placeholder="Enter highlights"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-ink">Concerns</label>
                <textarea
                  value={formData.concerns}
                  onChange={(e) => setFormData({ ...formData, concerns: e.target.value })}
                  className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                  rows={2}
                  placeholder="Enter concerns"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-ink">Key Learnings</label>
                <textarea
                  value={formData.keyLearnings}
                  onChange={(e) => setFormData({ ...formData, keyLearnings: e.target.value })}
                  className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                  rows={2}
                  placeholder="Enter key learnings"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-ink">Action Items</label>
                <textarea
                  value={formData.actionItems}
                  onChange={(e) => setFormData({ ...formData, actionItems: e.target.value })}
                  className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                  rows={2}
                  placeholder="Enter action items"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-ink">Blockers</label>
                <textarea
                  value={formData.blockers}
                  onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                  className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                  rows={2}
                  placeholder="Enter blockers"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-ink">Reviewed By</label>
                <input
                  type="text"
                  value={formData.reviewedBy}
                  onChange={(e) => setFormData({ ...formData, reviewedBy: e.target.value })}
                  className="w-full rounded-lg border border-neutral-border bg-neutral-bg px-3 py-2 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                  placeholder="Enter reviewer name"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingReview ? handleUpdate : handleCreate}
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-600"
                >
                  {editingReview ? "Update" : "Create"}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingReview(null);
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
