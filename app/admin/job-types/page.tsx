"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Plus, Loader2, X, AlertCircle, Trash2, RotateCcw } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useApiQuery } from "@/hooks/useApiQuery";
import { jobTypesApi, type CreateJobTypeInput, type UpdateJobTypeInput } from "@/lib/jobTypes";
import { meQuery } from "@/lib/account";
import { StudioApiError } from "@/lib/api";
import type { JobType, Staff } from "@/types";

// The roles that can be assigned to a job type. Mirrors the backend's allow-list.
const ASSIGNABLE_ROLES = ["DEVELOPER", "DESIGNER", "WRITER", "QA_REVIEWER"] as const;
const ID_PATTERN = /^[A-Z][A-Z0-9_]{2,31}$/;

const roleLabel = (r: string) => r.replace(/_/g, " ").toLowerCase().replace(/(^| )./g, (m) => m.toUpperCase());

export default function JobTypesPage() {
  const { data, loading, error, refetch } = useApiQuery(jobTypesApi.list);
  const { data: me } = useApiQuery<Staff>(meQuery);
  const isAdmin = me?.role === "ADMIN";

  const [showInactive, setShowInactive] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<JobType | null>(null);

  const types = useMemo(() => {
    const all = data ?? [];
    return showInactive ? all : all.filter((t) => t.active);
  }, [data, showInactive]);

  return (
    <StudioShell
      title="Job Types"
      subtitle="Configure work types, who handles them, and how fast they must turn around."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactive((v) => !v)}
            className={`hidden rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors sm:inline-flex ${
              showInactive ? "border-primary bg-primary-bg text-primary-light" : "border-neutral-strong text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
            }`}
          >
            {showInactive ? "Showing all" : "Show inactive"}
          </button>
          {isAdmin && (
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover"
            >
              <Plus size={17} /> <span className="hidden sm:inline">New type</span>
            </button>
          )}
        </div>
      }
    >
      {loading && types.length === 0 ? (
        <LoadingState label="Loading job types…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : types.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={showInactive ? "No job types yet" : "No active job types"}
          description={showInactive
            ? "Create one to start producing work. Job types live for the lifetime of the platform."
            : "Every active type is hidden. Toggle “Show inactive” to see what's been retired, or reactivate one."}
          action={isAdmin ? (
            <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover">
              <Plus size={17} /> Create job type
            </button>
          ) : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-neutral-border bg-neutral-surface2 text-[11px] uppercase tracking-[0.05em] text-content-muted">
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Assigned to</th>
                  <th className="px-4 py-3 font-medium">SLA</th>
                  <th className="px-4 py-3 font-medium">QA</th>
                  <th className="px-4 py-3 font-medium">Checklist</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {types.map((t) => (
                  <JobTypeRow key={t.id} t={t} isAdmin={isAdmin} onClick={() => isAdmin && setEditing(t)} onChanged={refetch} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {createOpen && (
        <JobTypeFormModal
          mode="create"
          initial={null}
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setCreateOpen(false); refetch(); }}
        />
      )}
      {editing && (
        <JobTypeFormModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}
    </StudioShell>
  );
}

function JobTypeRow({ t, isAdmin, onClick, onChanged }: {
  t: JobType; isAdmin: boolean; onClick: () => void; onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggleActive(e: React.MouseEvent) {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      if (t.active) await jobTypesApi.remove(t.id);
      else await jobTypesApi.update(t.id, { active: true });
      onChanged();
    } catch { /* surfaced via the next refetch */ }
    finally { setBusy(false); }
  }

  return (
    <tr
      onClick={onClick}
      className={`border-b border-neutral-border last:border-b-0 ${isAdmin ? "cursor-pointer hover:bg-neutral-surface2" : ""}`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: t.colour || "#7C5CBF" }} />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-ink">{t.displayName}</p>
            <p className="truncate font-mono text-[11px] text-content-muted">{t.id}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {t.assignedToRoles.length === 0 ? (
            <span className="text-[12px] text-content-muted">—</span>
          ) : t.assignedToRoles.map((r) => (
            <span key={r} className="rounded-md bg-neutral-surface2 px-2 py-0.5 text-[11px] text-content-secondary">{roleLabel(r)}</span>
          ))}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] text-ink">{t.slaHours}h</td>
      <td className="px-4 py-3 text-[13px] text-content-secondary">{t.qaRequired ? "Required" : "—"}</td>
      <td className="px-4 py-3 text-[13px] text-content-secondary">
        {t.qaChecklist?.length ? `${t.qaChecklist.length} item${t.qaChecklist.length === 1 ? "" : "s"}` : "—"}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={toggleActive}
          disabled={!isAdmin || busy}
          title={!isAdmin ? "ADMIN only" : t.active ? "Retire (soft-delete)" : "Reactivate"}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
            t.active ? "bg-success-bg text-success hover:bg-success/20" : "bg-neutral-surface2 text-content-muted hover:bg-neutral-surface2/60"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : t.active ? null : <RotateCcw size={12} />}
          {t.active ? "Active" : "Retired"}
        </button>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Create / Edit modal
// ---------------------------------------------------------------------------

function JobTypeFormModal({ mode, initial, onClose, onSaved }: {
  mode: "create" | "edit";
  initial: JobType | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [id, setId] = useState(initial?.id ?? "");
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [colour, setColour] = useState(initial?.colour ?? "#7C5CBF");
  const [assignedToRoles, setAssignedToRoles] = useState<string[]>(initial?.assignedToRoles ?? []);
  const [slaHours, setSlaHours] = useState(initial?.slaHours ?? 24);
  const [qaRequired, setQaRequired] = useState(initial?.qaRequired ?? true);
  const [qaChecklist, setQaChecklist] = useState(initial?.qaChecklist ?? []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trap focus + esc-to-close (matches the staff modal's pattern).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  function toggleRole(r: string) {
    setAssignedToRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  }

  function addChecklistItem() {
    setQaChecklist((prev) => [...prev, { id: `item_${prev.length + 1}`, label: "", required: true }]);
  }

  function patchChecklistItem(idx: number, patch: Partial<{ id: string; label: string; required: boolean }>) {
    setQaChecklist((prev) => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  }

  function removeChecklistItem(idx: number) {
    setQaChecklist((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "create" && !ID_PATTERN.test(id)) {
      setError("ID must be UPPER_SNAKE_CASE, 3–32 chars (e.g. WEBSITE_BUILD).");
      return;
    }
    if (!displayName.trim()) { setError("Display name is required."); return; }
    if (slaHours <= 0) { setError("SLA hours must be positive."); return; }
    if (assignedToRoles.length === 0) { setError("Pick at least one role to assign this type to."); return; }

    setSaving(true);
    try {
      const cleanChecklist = qaChecklist.filter((c) => c.label && c.label.trim());
      if (mode === "create") {
        const body: CreateJobTypeInput = {
          id: id.trim(), displayName: displayName.trim(), colour: colour.trim(),
          assignedToRoles, slaHours, qaRequired, qaChecklist: cleanChecklist,
        };
        await jobTypesApi.create(body);
      } else if (initial) {
        const body: UpdateJobTypeInput = {
          displayName: displayName.trim(), colour: colour.trim(),
          assignedToRoles, slaHours, qaRequired, qaChecklist: cleanChecklist,
        };
        await jobTypesApi.update(initial.id, body);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-border bg-neutral-surface p-6 sm:p-7">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-[17px] font-medium text-ink">{mode === "create" ? "New job type" : `Edit ${initial?.displayName}`}</h2>
            <p className="mt-0.5 text-[13px] text-content-secondary">
              {mode === "create"
                ? "Defines a kind of work the studio produces — and the staff role + SLA that owns it."
                : "Tune SLA hours, roles, and the QA checklist. The ID can't change."}
            </p>
          </div>
          <button onClick={() => !saving && onClose()} className="rounded-md p-1 text-content-muted hover:text-ink"><X size={18} /></button>
        </div>

        {error && (
          <p className="mb-4 flex items-center gap-2 rounded-lg border border-danger/20 bg-danger-bg px-3 py-2 text-[13px] text-danger">
            <AlertCircle size={15} /> {error}
          </p>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">ID</label>
              {mode === "create" ? (
                <input
                  value={id}
                  onChange={(e) => setId(e.target.value.toUpperCase())}
                  placeholder="WEBSITE_REVISION"
                  className="h-11 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3.5 font-mono text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                  required
                />
              ) : (
                <p className="flex h-11 items-center rounded-md border border-neutral-border bg-neutral-surface2 px-3.5 font-mono text-[13px] text-content-muted">{initial?.id}</p>
              )}
              {mode === "create" && <p className="mt-1 text-[11px] text-content-muted">UPPER_SNAKE_CASE, 3–32 chars. Permanent — referenced by every job of this type.</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Website Revision"
                className="h-11 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3.5 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
            <div>
              <label className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Brand colour</label>
              <div className="flex items-center gap-2">
                <input
                  type="color" value={colour} onChange={(e) => setColour(e.target.value)}
                  className="h-11 w-14 cursor-pointer rounded-md border border-neutral-strong bg-neutral-bg"
                  aria-label="Pick colour"
                />
                <input
                  value={colour} onChange={(e) => setColour(e.target.value)}
                  className="h-11 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3 font-mono text-[13px] text-ink focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">SLA hours</label>
              <input
                type="number" min={1} value={slaHours} onChange={(e) => setSlaHours(Number(e.target.value))}
                className="h-11 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3 text-[14px] text-ink focus:border-primary focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Assign to</label>
            <div className="flex flex-wrap gap-1.5">
              {ASSIGNABLE_ROLES.map((r) => {
                const on = assignedToRoles.includes(r);
                return (
                  <button key={r} type="button"
                    onClick={() => toggleRole(r)}
                    className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
                      on ? "border-primary bg-primary-bg text-primary-light" : "border-neutral-border text-content-secondary hover:border-primary/50"
                    }`}>{roleLabel(r)}</button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-content-muted">Only staff with at least one of these roles will see new jobs of this type.</p>
          </div>

          <div>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink">
              <input type="checkbox" checked={qaRequired} onChange={(e) => setQaRequired(e.target.checked)} className="h-4 w-4 rounded border-neutral-strong" />
              Require QA before delivery
            </label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[12px] uppercase tracking-[0.06em] text-content-secondary">QA checklist</label>
              <button type="button" onClick={addChecklistItem} className="inline-flex items-center gap-1 rounded-md border border-neutral-border px-2 py-1 text-[11px] text-content-secondary hover:bg-neutral-surface2 hover:text-ink">
                <Plus size={12} /> Add item
              </button>
            </div>
            {qaChecklist.length === 0 ? (
              <p className="rounded-md border border-dashed border-neutral-border px-3 py-3 text-[12px] text-content-muted">No checklist items yet. QA reviewers will see a free-form approval.</p>
            ) : (
              <ul className="space-y-2">
                {qaChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <input
                      value={String(item.id ?? "")}
                      onChange={(e) => patchChecklistItem(idx, { id: e.target.value })}
                      placeholder="item_id"
                      className="h-9 w-32 shrink-0 rounded-md border border-neutral-strong bg-neutral-bg px-2 font-mono text-[12px] text-ink focus:border-primary focus:outline-none"
                    />
                    <input
                      value={String(item.label ?? "")}
                      onChange={(e) => patchChecklistItem(idx, { label: e.target.value })}
                      placeholder="What QA must verify"
                      className="h-9 min-w-0 flex-1 rounded-md border border-neutral-strong bg-neutral-bg px-3 text-[13px] text-ink focus:border-primary focus:outline-none"
                    />
                    <label className="flex shrink-0 items-center gap-1 text-[12px] text-content-secondary">
                      <input type="checkbox" checked={Boolean(item.required)} onChange={(e) => patchChecklistItem(idx, { required: e.target.checked })} className="h-3.5 w-3.5" />
                      Required
                    </label>
                    <button type="button" onClick={() => removeChecklistItem(idx)} aria-label="Remove item" className="rounded-md p-1.5 text-content-muted hover:bg-danger-bg hover:text-danger">
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => !saving && onClose()} className="rounded-md border border-neutral-border px-4 py-2 text-[14px] text-content-secondary hover:bg-neutral-surface2">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
