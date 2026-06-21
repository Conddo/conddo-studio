"use client";

import { Calendar, TrendingUp, Plus, DollarSign } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";

export default function WeeklyReviewsPage() {
  return (
    <StudioShell title="Weekly Metric Reviews" subtitle="Weekly performance tracking and analysis for Conddo.">
      <div className="space-y-6">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink">
              <TrendingUp size={17} />
              Latest Review
            </h2>
          </div>

          <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
            <p className="text-[13px] text-content-secondary">Weekly reviews coming soon</p>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink">
              <Calendar size={17} />
              All Reviews
            </h2>
            <button className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-600">
              <Plus size={16} />
              New Review
            </button>
          </div>

          <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
            <p className="text-[13px] text-content-secondary">No weekly reviews yet</p>
          </div>
        </section>
      </div>
    </StudioShell>
  );
}
