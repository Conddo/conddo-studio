"use client";

import { useState } from "react";
import { Users, UserPlus, Loader2, X, AlertCircle } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useApiQuery } from "@/hooks/useApiQuery";
import { adminApi } from "@/lib/admin";
import { roleLabel, initialsOf, fmtDateTime } from "@/lib/format";
import { StudioApiError } from "@/lib/api";
import type { Role, Staff } from "@/types";

const ROLES: Role[] = ["DEVELOPER", "DESIGNER", "WRITER", "QA_REVIEWER", "TEAM_LEAD", "ADMIN"];
const SKILLS = ["WEBSITE_BUILD", "WEBSITE_REVISION", "GRAPHIC_DESIGN", "AD_CREATIVE", "BRAND_KIT", "CONTENT_WRITING"];
const skillLabel = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/(^| )./g, (m) => m.toUpperCase());

function InviteStaffModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("DEVELOPER");
  const [skills, setSkills] = useState<string[]>(["WEBSITE_BUILD"]);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open) return null;

  function reset() { setEmail(""); setFullName(""); setRole("DEVELOPER"); setSkills(["WEBSITE_BUILD"]); setPassword(""); setError(null); }
  function close() { if (saving) return; reset(); onClose(); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setSaving(true);
    try {
      await adminApi.createStaff({ email: email.trim(), fullName: fullName.trim(), role, skills, password });
      reset(); onClose(); onCreated();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : "Couldn't add staff member.");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={close} />
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-border bg-neutral-surface p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-[17px] font-medium text-ink">Add staff member</h2>
            <p className="mt-0.5 text-[13px] text-content-secondary">They'll be able to log in with this email + password.</p>
          </div>
          <button onClick={close} className="rounded-md p-1 text-content-muted hover:text-ink"><X size={18} /></button>
        </div>
        {error && (
          <p className="mb-4 flex items-center gap-2 rounded-lg border border-danger/20 bg-danger-bg px-3 py-2 text-[13px] text-danger">
            <AlertCircle size={15} /> {error}
          </p>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="James Okafor"
                className="h-11 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3.5 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="james@conddo.io"
                className="h-11 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3.5 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}
              className="h-11 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3 text-[14px] text-ink focus:border-primary focus:outline-none">
              {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Skills</label>
            <div className="flex flex-wrap gap-1.5">
              {SKILLS.map((s) => {
                const on = skills.includes(s);
                return (
                  <button key={s} type="button"
                    onClick={() => setSkills((prev) => on ? prev.filter((x) => x !== s) : [...prev, s])}
                    className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
                      on ? "border-primary bg-primary-bg text-primary-light" : "border-neutral-border text-content-secondary hover:border-primary/50"
                    }`}>{skillLabel(s)}</button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-content-muted">Staff only see jobs matching their skills.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Temporary password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" placeholder="At least 8 characters"
              className="h-11 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3.5 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="rounded-md border border-neutral-border px-4 py-2 text-[14px] text-content-secondary hover:bg-neutral-surface2">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}{saving ? "Adding…" : "Add staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StaffRow({ s, onChanged }: { s: Staff; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);

  async function update(patch: { role?: Role; active?: boolean }) {
    setBusy(true);
    try { await adminApi.updateStaff(s.id, patch); onChanged(); }
    finally { setBusy(false); }
  }

  return (
    <tr className="border-b border-neutral-border last:border-b-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-bg font-mono text-[12px] font-medium text-primary-light">
            {initialsOf(s.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] text-ink">{s.name}</p>
            <p className="truncate text-[12px] text-content-muted">{s.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <select value={s.role} onChange={(e) => update({ role: e.target.value as Role })} disabled={busy}
          className="rounded-md border border-neutral-border bg-neutral-surface2 px-2 py-1 text-[13px] text-ink focus:border-primary focus:outline-none">
          {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </select>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {(s.skills ?? []).slice(0, 3).map((k) => (
            <span key={k} className="rounded-md bg-neutral-surface2 px-2 py-0.5 text-[11px] text-content-secondary">{skillLabel(k)}</span>
          ))}
          {s.skills && s.skills.length > 3 && <span className="text-[11px] text-content-muted">+{s.skills.length - 3}</span>}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-[13px] text-content-secondary">{s.lastActive ? fmtDateTime(s.lastActive) : <span className="text-content-muted">Never</span>}</td>
      <td className="px-4 py-3 text-right">
        <button onClick={() => update({ active: !s.active })} disabled={busy}
          className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
            s.active ? "bg-success-bg text-success hover:bg-success/20" : "bg-neutral-surface2 text-content-muted hover:bg-neutral-surface2/60"
          }`}>
          {busy ? "…" : s.active ? "Active" : "Suspended"}
        </button>
      </td>
    </tr>
  );
}

export default function StaffPage() {
  const { data, loading, error, refetch } = useApiQuery(adminApi.listStaff);
  const staff = data ?? [];
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <StudioShell
      title="Staff"
      subtitle="Studio team members and roles."
      actions={
        <button onClick={() => setInviteOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover">
          <UserPlus size={17} /> <span className="hidden sm:inline">Add staff</span>
        </button>
      }
    >
      {loading && staff.length === 0 ? (
        <LoadingState label="Loading staff…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : staff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff yet"
          description="Add your developers, designers, writers, and reviewers to get the board moving."
          action={
            <button onClick={() => setInviteOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover">
              <UserPlus size={17} /> Add your first teammate
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-neutral-border bg-neutral-surface2 text-[11px] uppercase tracking-[0.05em] text-content-muted">
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Skills</th>
                  <th className="px-4 py-3 font-medium">Last active</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => <StaffRow key={s.id} s={s} onChanged={refetch} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InviteStaffModal open={inviteOpen} onClose={() => setInviteOpen(false)} onCreated={refetch} />
    </StudioShell>
  );
}
