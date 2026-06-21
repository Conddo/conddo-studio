"use client";

import { useState } from "react";
import { MapPin, Calendar, AlertTriangle, CheckCircle, Clock, Plus, Filter, X, Edit2, Trash2 } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { useApiQuery } from "@/hooks/useApiQuery";
import { internalOpsApi, type RoadmapDashboard, type RoadmapItem } from "@/lib/internalOps";

export default function RoadmapPage() {
  const { data: dashboard } = useApiQuery(internalOpsApi.roadmapDashboard);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNED": return "text-content-muted";
      case "IN_PROGRESS": return "text-blue-500";
      case "BLOCKED": return "text-red-500";
      case "COMPLETED": return "text-green-500";
      case "CANCELLED": return "text-content-muted";
      case "DEFERRED": return "text-yellow-600";
      default: return "text-content-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PLANNED": return <Clock size={16} className={getStatusColor(status)} />;
      case "IN_PROGRESS": return <MapPin size={16} className={getStatusColor(status)} />;
      case "BLOCKED": return <AlertTriangle size={16} className={getStatusColor(status)} />;
      case "COMPLETED": return <CheckCircle size={16} className={getStatusColor(status)} />;
      default: return <Clock size={16} className={getStatusColor(status)} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-100 text-red-700";
      case "HIGH": return "bg-orange-100 text-orange-700";
      case "MEDIUM": return "bg-yellow-100 text-yellow-700";
      case "LOW": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "PRODUCT": return "bg-purple-100 text-purple-700";
      case "ENGINEERING": return "bg-blue-100 text-blue-700";
      case "DESIGN": return "bg-pink-100 text-pink-700";
      case "MARKETING": return "bg-green-100 text-green-700";
      case "SALES": return "bg-yellow-100 text-yellow-700";
      case "OPERATIONS": return "bg-gray-100 text-gray-700";
      case "INFRASTRUCTURE": return "bg-indigo-100 text-indigo-700";
      case "SECURITY": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <StudioShell 
      title="Product Roadmap" 
      subtitle="Strategic planning and milestone tracking for Conddo."
      actions={
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-600"
        >
          <Plus size={16} />
          Add Item
        </button>
      }
    >
      <div className="space-y-6">
        {/* Status Counts */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink">
              <MapPin size={17} />
              Overview
            </h2>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] text-content-secondary">Planned</p>
                <Clock size={14} className="text-content-muted" />
              </div>
              <p className="font-mono text-[28px] font-semibold leading-none text-ink">
                {dashboard?.statusCounts?.planned ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] text-content-secondary">In Progress</p>
                <MapPin size={14} className="text-blue-500" />
              </div>
              <p className="font-mono text-[28px] font-semibold leading-none text-ink">
                {dashboard?.statusCounts?.inProgress ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] text-content-secondary">Blocked</p>
                <AlertTriangle size={14} className="text-red-500" />
              </div>
              <p className="font-mono text-[28px] font-semibold leading-none text-ink">
                {dashboard?.statusCounts?.blocked ?? 0}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] text-content-secondary">Completed</p>
                <CheckCircle size={14} className="text-green-500" />
              </div>
              <p className="font-mono text-[28px] font-semibold leading-none text-ink">
                {dashboard?.statusCounts?.completed ?? 0}
              </p>
            </div>
          </div>
        </section>

        {/* Active Roadmap Items */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink">
              <Calendar size={17} />
              Active Items
            </h2>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 rounded-lg border border-neutral-border bg-neutral-surface px-3 py-2 text-[13px] text-ink hover:bg-neutral-bg">
                <Filter size={14} />
                Filter
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
            {dashboard?.activeItems && dashboard.activeItems.length > 0 ? (
              <div className="space-y-4">
                {dashboard.activeItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 rounded-lg border border-neutral-border bg-neutral-bg p-4">
                    <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                        {item.quarter && (
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                            {item.quarter}
                          </span>
                        )}
                      </div>
                      <p className="text-[14px] font-medium text-ink">{item.title}</p>
                      <p className="text-[12px] text-content-secondary">{item.description}</p>
                      {item.assignedTo && (
                        <p className="mt-2 text-[11px] text-content-muted">Assigned to: {item.assignedTo}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingItem(item)}
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
                      <div className="text-right">
                        <p className="text-[11px] text-content-muted">Target</p>
                        <p className="font-mono text-[12px] text-ink">
                          {new Date(item.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        {item.estimatedHours && (
                          <p className="mt-1 text-[11px] text-content-muted">
                            {item.estimatedHours}h est.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-content-secondary">No active roadmap items</p>
            )}
          </div>
        </section>

        {/* Recently Completed */}
        {dashboard?.recentlyCompleted && dashboard.recentlyCompleted.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-medium text-ink">
                <CheckCircle size={17} />
                Recently Completed
              </h2>
            </div>

            <div className="rounded-xl border border-neutral-border bg-neutral-surface p-5">
              <div className="space-y-3">
                {dashboard.recentlyCompleted.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border border-neutral-border bg-neutral-bg p-4">
                    <CheckCircle size={16} className="text-green-500" />
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-ink">{item.title}</p>
                      <p className="text-[12px] text-content-secondary">{item.category}</p>
                    </div>
                    {item.completedDate && (
                      <div className="text-right">
                        <p className="text-[11px] text-content-muted">Completed</p>
                        <p className="font-mono text-[12px] text-ink">
                          {new Date(item.completedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreateModal(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-neutral-border bg-neutral-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-ink">Add Roadmap Item</h3>
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

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditingItem(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-neutral-border bg-neutral-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-ink">Edit Roadmap Item</h3>
              <button 
                onClick={() => setEditingItem(null)}
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
