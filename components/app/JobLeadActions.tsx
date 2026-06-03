"use client";

import { useState } from "react";
import { Loader2, UserCog, Clock, AlertTriangle } from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { adminApi } from "@/lib/admin";
import { StudioApiError } from "@/lib/api";
import { roleLabel } from "@/lib/format";

type ActiveForm = "reassign" | "extend" | "escalate" | null;

/** Lead/admin interventions on a job: reassign, extend SLA, escalate.
 *  Visible only when the caller mounts it (role-gated by the parent). */
export function JobLeadActions({ jobId, currentAssignee, onChanged }: {
  jobId: string;
  currentAssignee: string | null;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState<ActiveForm>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Fields
  const [staffId, setStaffId] = useState("");
  const [hours, setHours] = useState("4");
  const [extendReason, setExtendReason] = useState("");
  const [escalateReason, setEscalateReason] = useState("");

  // Staff list (only fetched when the reassign form opens).
  const staffQuery = useApiQuery(() => open === "reassign" ? adminApi.listStaff() : Promise.resolve({ data: [] }), [open]);
  const staff = (staffQuery.data ?? []).filter((s) => s.active && s.id !== currentAssignee);

  function close() { if (!busy) { setOpen(null); setError(null); } }

  async function run(kind: ActiveForm, fn: () => Promise<unknown>, successMsg: string) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setToast(successMsg);
      setOpen(null);
      onChanged();
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : "Couldn't apply that change.");
    } finally {
      setBusy(false);
    }
  }

  function ToggleBtn({ id, icon: Icon, label }: { id: ActiveForm; icon: typeof UserCog; label: string }) {
    const active = open === id;
    return (
      <button
        type="button"
        onClick={() => setOpen(active ? null : id)}
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors ${
          active ? "border-primary bg-primary-bg text-primary-light" : "border-neutral-strong text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
        }`}
      >
        <Icon size={14} /> {label}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[14px] font-medium text-ink">Lead actions</h3>
        {toast && <span className="text-[12px] text-success">{toast}</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        <ToggleBtn id="reassign" icon={UserCog} label="Reassign" />
        <ToggleBtn id="extend" icon={Clock} label="Extend SLA" />
        <ToggleBtn id="escalate" icon={AlertTriangle} label="Escalate" />
      </div>

      {error && <p className="mt-3 rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-[12px] text-danger">{error}</p>}

      {open === "reassign" && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (!staffId) return; run("reassign", () => adminApi.reassign(jobId, staffId), "Reassigned"); }}
          className="mt-4 space-y-3"
        >
          <label className="block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Reassign to</label>
          <select
            value={staffId} onChange={(e) => setStaffId(e.target.value)} required
            className="h-10 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3 text-[13px] text-ink focus:border-primary focus:outline-none"
          >
            <option value="">{staffQuery.loading ? "Loading staff…" : "Pick a teammate"}</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name} — {roleLabel(s.role)}</option>)}
          </select>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className="rounded-md border border-neutral-border px-3 py-1.5 text-[12px] text-content-secondary hover:bg-neutral-surface2">Cancel</button>
            <button type="submit" disabled={busy || !staffId} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-white hover:bg-primary-hover disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : null} Reassign
            </button>
          </div>
        </form>
      )}

      {open === "extend" && (
        <form
          onSubmit={(e) => { e.preventDefault(); const n = Number(hours); if (!n || n <= 0) return; run("extend", () => adminApi.extendSla(jobId, n, extendReason.trim() || undefined), `Extended by ${n}h`); }}
          className="mt-4 space-y-3"
        >
          <div>
            <label className="mb-1 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Hours to add</label>
            <input
              type="number" min={1} value={hours} onChange={(e) => setHours(e.target.value)} required
              className="h-10 w-32 rounded-md border border-neutral-strong bg-neutral-bg px-3 text-[13px] text-ink focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Reason</label>
            <textarea value={extendReason} onChange={(e) => setExtendReason(e.target.value)} rows={2}
              placeholder="Why is the SLA being extended?"
              className="w-full rounded-md border border-neutral-strong bg-neutral-bg p-2.5 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className="rounded-md border border-neutral-border px-3 py-1.5 text-[12px] text-content-secondary hover:bg-neutral-surface2">Cancel</button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-white hover:bg-primary-hover disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : null} Extend
            </button>
          </div>
        </form>
      )}

      {open === "escalate" && (
        <form
          onSubmit={(e) => { e.preventDefault(); run("escalate", () => adminApi.escalate(jobId, escalateReason.trim() || undefined), "Escalated"); }}
          className="mt-4 space-y-3"
        >
          <div>
            <label className="mb-1 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Reason (optional)</label>
            <textarea value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} rows={2}
              placeholder="Why does this need leadership attention?"
              className="w-full rounded-md border border-neutral-strong bg-neutral-bg p-2.5 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className="rounded-md border border-neutral-border px-3 py-1.5 text-[12px] text-content-secondary hover:bg-neutral-surface2">Cancel</button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-md bg-danger px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : null} Escalate
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
