"use client";

import { useState } from "react";
import { Calendar, TrendingUp, Plus, DollarSign, X, Edit2, Trash2 } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { useApiQuery } from "@/hooks/useApiQuery";
import { internalOpsApi, type WeeklyMetricReview } from "@/lib/internalOps";

export default function WeeklyReviewsPage() {
  const { data: reviews } = useApiQuery(internalOpsApi.weeklyReviews);
  const { data: latest } = useApiQuery(internalOpsApi.latestWeeklyReview);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReview, setEditingReview] = useState<WeeklyMetricReview | null>(null);

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
                        onClick={() => setEditingReview(review)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreateModal(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-neutral-border bg-neutral-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-ink">New Weekly Review</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-[13px] text-content-secondary">CRUD functionality coming soon</p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditingReview(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-neutral-border bg-neutral-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-ink">Edit Weekly Review</h3>
              <button 
                onClick={() => setEditingReview(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-[13px] text-content-secondary">CRUD functionality coming soon</p>
          </div>
        </div>
      )}
    </StudioShell>
  );
}
