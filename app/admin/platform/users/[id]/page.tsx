"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Mail, Phone, KeyRound, ShieldCheck, Trash2, Loader2,
  AlertCircle, ExternalLink, Building2,
} from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useApiQuery } from "@/hooks/useApiQuery";
import { platformAdminApi } from "@/lib/platformAdmin";
import { StudioApiError } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import type { PlatformUser } from "@/types";

const ROLES = ["TENANT_ADMIN", "STAFF", "CUSTOMER"];

export default function PlatformUserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data, loading, error, refetch } = useApiQuery(
    () => platformAdminApi.getUser(params.id), [params.id],
  );
  const user = data;

  const [busy, setBusy] = useState<"role" | "active" | "reset" | "delete" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function changeRole(role: string) {
    if (!user || role === user.role) return;
    setBusy("role"); setActionError(null);
    try {
      await platformAdminApi.updateUser(user.id, { role });
      setToast(`Role changed to ${role.replace("_", " ")}`);
      refetch();
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setActionError(humanizeError(e, "Couldn't change the role."));
    } finally { setBusy(null); }
  }

  async function toggleActive() {
    if (!user) return;
    setBusy("active"); setActionError(null);
    try {
      await platformAdminApi.updateUser(user.id, { active: !user.active });
      setToast(user.active ? "User deactivated" : "User activated");
      refetch();
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setActionError(humanizeError(e, "Couldn't change the status."));
    } finally { setBusy(null); }
  }

  async function resetPassword() {
    if (!user) return;
    setBusy("reset"); setActionError(null);
    try {
      await platformAdminApi.resetUserPassword(user.id);
      setToast("Reset email queued");
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setActionError(humanizeError(e, "Couldn't send the reset email."));
    } finally { setBusy(null); }
  }

  async function softDelete() {
    if (!user) return;
    setBusy("delete"); setActionError(null);
    try {
      await platformAdminApi.deleteUser(user.id);
      router.push("/admin/platform/users");
    } catch (e) {
      setActionError(humanizeError(e, "Couldn't delete."));
      setBusy(null);
    }
  }

  return (
    <StudioShell title={user?.fullName ?? user?.email ?? "User"} subtitle="Platform user detail">
      <Link href="/admin/platform/users" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-content-secondary hover:text-ink">
        <ArrowLeft size={15} /> Back to users
      </Link>

      {toast && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/20 bg-success-bg px-4 py-2.5 text-[13px] text-success">
          <ShieldCheck size={15} /> {toast}
        </div>
      )}

      {loading && !user ? (
        <LoadingState label="Loading user…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !user ? (
        <EmptyState icon={AlertCircle} title="Not found" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(0,340px)]">
          {/* Left column */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-bg font-mono text-[14px] font-medium text-primary-light">
                  {(user.fullName ?? user.email).slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[20px] font-semibold tracking-[-0.01em] text-ink">{user.fullName ?? "—"}</h2>
                  <p className="flex items-center gap-1.5 truncate font-mono text-[12px] text-content-muted">
                    <Mail size={11} /> {user.email}
                    {user.googleLinked && (
                      <span className="rounded-sm bg-primary-bg px-1.5 py-0.5 text-[10px] text-primary-light">Google linked</span>
                    )}
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.05em] ${user.active ? "bg-success-bg text-success" : "bg-neutral-surface2 text-content-muted"}`}>
                  {user.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-neutral-border pt-4 text-[13px] sm:grid-cols-4">
                <Field label="Role" value={user.role.replace("_", " ")} />
                <Field label="Phone" value={user.phone ?? "—"} />
                <Field label="Last login" value={user.lastLoginAt ? fmtDateTime(user.lastLoginAt) : "Never"} />
                <Field label="Joined" value={fmtDateTime(user.createdAt)} />
              </div>
            </div>

            {/* Tenant context */}
            {user.tenant && (
              <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
                <h3 className="mb-3 text-[14px] font-medium text-ink">Tenant</h3>
                <Link
                  href={`/admin/platform/tenants/${user.tenant.id}`}
                  className="flex items-center justify-between rounded-lg border border-neutral-border bg-neutral-surface2 px-4 py-3 hover:border-primary/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-bg text-primary-light">
                      <Building2 size={15} />
                    </span>
                    <div>
                      <p className="text-[13px] font-medium text-ink">{user.tenant.name}</p>
                      <p className="font-mono text-[11px] text-content-muted">
                        {user.tenant.slug}.conddo.io · {user.tenant.planId ?? "no plan"} · {user.tenant.status}
                      </p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-content-muted" />
                </Link>
              </div>
            )}
          </div>

          {/* Right column — actions */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5">
              <h3 className="mb-3 text-[14px] font-medium text-ink">Admin actions</h3>
              {actionError && (
                <p className="mb-3 rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-[12px] text-danger">{actionError}</p>
              )}

              {/* Role */}
              <div className="mb-4">
                <p className="mb-1.5 text-[11px] uppercase tracking-[0.05em] text-content-muted">Role</p>
                <select
                  value={user.role}
                  onChange={(e) => changeRole(e.target.value)}
                  disabled={busy !== null}
                  className="h-9 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3 text-[13px] text-ink focus:border-primary focus:outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r.replace("_", " ")}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <button
                  onClick={toggleActive} disabled={busy !== null}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-[13px] font-medium hover:opacity-90 disabled:opacity-50 ${
                    user.active
                      ? "border-warning/30 bg-warning-bg text-warning"
                      : "border-success/30 bg-success-bg text-success"
                  }`}
                >
                  {busy === "active" ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  {user.active ? "Deactivate user" : "Reactivate user"}
                </button>

                <button
                  onClick={resetPassword} disabled={busy !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-neutral-strong bg-neutral-surface2 px-3 py-2 text-[13px] font-medium text-content-secondary hover:bg-neutral-surface2/60 disabled:opacity-50"
                >
                  {busy === "reset" ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Send reset email
                </button>

                <button
                  onClick={() => setConfirmDelete(true)} disabled={busy !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-[13px] font-medium text-danger hover:opacity-90 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Soft-delete user
                </button>
              </div>
              <p className="mt-3 text-[11px] text-content-muted">
                Deactivating or changing role revokes the user's refresh-token family.
                The last active TENANT_ADMIN of a tenant is protected (422 LAST_ADMIN_PROTECTED).
              </p>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && user && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => !busy && setConfirmDelete(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-border bg-neutral-surface p-6">
            <h2 className="mb-2 text-[17px] font-medium text-ink">Soft-delete this user?</h2>
            <p className="mb-5 text-[14px] text-content-secondary">
              Deactivates the account and revokes every session. Their data stays in the database. If this is the last active TENANT_ADMIN of a tenant, the deletion is refused.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(false)} disabled={busy === "delete"} className="rounded-md border border-neutral-border px-4 py-2 text-[14px] text-content-secondary hover:bg-neutral-surface2">Cancel</button>
              <button onClick={softDelete} disabled={busy === "delete"} className="inline-flex items-center gap-2 rounded-md bg-danger px-4 py-2 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-50">
                {busy === "delete" ? <Loader2 size={14} className="animate-spin" /> : null} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </StudioShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.05em] text-content-muted">{label}</p>
      <p className="mt-0.5 text-[13px] text-ink">{value}</p>
    </div>
  );
}

/** Translate backend error codes into UX-friendly messages. */
function humanizeError(e: unknown, fallback: string): string {
  if (e instanceof StudioApiError) {
    if (e.code === "LAST_ADMIN_PROTECTED") {
      return "This is the last active TENANT_ADMIN of this tenant — promote another user first.";
    }
    if (e.code === "PLATFORM_API_UNAVAILABLE") {
      return "Studio can't reach the platform's password-reset endpoint right now.";
    }
    return e.message;
  }
  return fallback;
}
