"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Globe, Users, Briefcase, CheckCircle2, Pause, Play, Trash2,
  Loader2, AlertCircle, ExternalLink, Mail,
} from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useApiQuery } from "@/hooks/useApiQuery";
import { platformAdminApi } from "@/lib/platformAdmin";
import { StudioApiError } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import type { PlatformTenant, PlatformUser } from "@/types";

const verticalLabel = (v: string | null) =>
  !v ? "—" : v.replace(/_/g, " ").replace(/(^| )./g, (m) => m.toUpperCase());

export default function PlatformTenantDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const tenantQ = useApiQuery(() => platformAdminApi.getTenant(params.id), [params.id]);
  const usersQ = useApiQuery(() => platformAdminApi.usersForTenant(params.id), [params.id]);
  const tenant = tenantQ.data;
  const users = usersQ.data ?? [];

  const [busy, setBusy] = useState<"suspend" | "reactivate" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function suspend() {
    if (!tenant) return;
    setBusy("suspend"); setError(null);
    try {
      await platformAdminApi.updateTenant(tenant.id, { status: "SUSPENDED" });
      tenantQ.refetch();
    } catch (e) {
      setError(e instanceof StudioApiError ? e.message : "Couldn't suspend the tenant.");
    } finally { setBusy(null); }
  }

  async function reactivate() {
    if (!tenant) return;
    setBusy("reactivate"); setError(null);
    try {
      await platformAdminApi.updateTenant(tenant.id, { status: "ACTIVE" });
      tenantQ.refetch();
    } catch (e) {
      setError(e instanceof StudioApiError ? e.message : "Couldn't reactivate.");
    } finally { setBusy(null); }
  }

  async function softDelete() {
    if (!tenant) return;
    setBusy("delete"); setError(null);
    try {
      await platformAdminApi.deleteTenant(tenant.id);
      router.push("/admin/platform/tenants");
    } catch (e) {
      setError(e instanceof StudioApiError ? e.message : "Couldn't delete.");
      setBusy(null);
    }
  }

  return (
    <StudioShell title={tenant?.name ?? "Tenant"} subtitle="Platform tenant detail">
      <Link
        href="/admin/platform/tenants"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-content-secondary hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to tenants
      </Link>

      {tenantQ.loading && !tenant ? (
        <LoadingState label="Loading tenant…" />
      ) : tenantQ.error ? (
        <ErrorState error={tenantQ.error} onRetry={tenantQ.refetch} />
      ) : !tenant ? (
        <EmptyState icon={AlertCircle} title="Not found" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(0,320px)]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Header card */}
            <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-bg text-primary-light">
                  <Globe size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[20px] font-semibold tracking-[-0.01em] text-ink">{tenant.name}</h2>
                  <a
                    href={`https://${tenant.slug}.conddo.io`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[12px] text-primary-light hover:underline"
                  >
                    {tenant.slug}.conddo.io <ExternalLink size={11} />
                  </a>
                </div>
                <StatusBadge status={tenant.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-neutral-border pt-4 text-[13px] sm:grid-cols-4">
                <Field label="Vertical" value={verticalLabel(tenant.verticalId)} />
                <Field label="Plan" value={tenant.planId ?? "—"} />
                <Field label="Custom domain" value={tenant.customDomain ?? "—"} />
                <Field label="Joined" value={fmtDateTime(tenant.createdAt)} />
              </div>
            </div>

            {/* Counts */}
            {tenant.counts && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Tile icon={Users}      label="Users"          value={String(tenant.counts.users)} />
                <Tile icon={CheckCircle2} label="Active users"  value={String(tenant.counts.activeUsers)} />
                <Tile icon={Briefcase}  label="Active jobs"    value={String(tenant.counts.activeJobs)} />
                <Tile icon={CheckCircle2} label="Delivered"     value={String(tenant.counts.deliveredJobs)} />
              </div>
            )}

            {/* Users */}
            <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-6">
              <h3 className="mb-4 text-[15px] font-medium text-ink">Users</h3>
              {usersQ.loading ? (
                <p className="text-[13px] text-content-secondary">Loading…</p>
              ) : users.length === 0 ? (
                <p className="text-[13px] text-content-secondary">No users.</p>
              ) : (
                <ul className="divide-y divide-neutral-border">
                  {users.map((u) => <UserRow key={u.id} u={u} />)}
                </ul>
              )}
            </div>
          </div>

          {/* Right column — actions */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5">
              <h3 className="mb-3 text-[14px] font-medium text-ink">Admin actions</h3>
              {error && (
                <p className="mb-3 rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-[12px] text-danger">{error}</p>
              )}
              <div className="space-y-2">
                {tenant.status === "ACTIVE" && (
                  <button
                    onClick={suspend} disabled={busy !== null}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-warning/30 bg-warning-bg px-3 py-2 text-[13px] font-medium text-warning hover:opacity-90 disabled:opacity-50"
                  >
                    {busy === "suspend" ? <Loader2 size={14} className="animate-spin" /> : <Pause size={14} />} Suspend tenant
                  </button>
                )}
                {tenant.status === "SUSPENDED" && (
                  <button
                    onClick={reactivate} disabled={busy !== null}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-success/30 bg-success-bg px-3 py-2 text-[13px] font-medium text-success hover:opacity-90 disabled:opacity-50"
                  >
                    {busy === "reactivate" ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Reactivate
                  </button>
                )}
                {tenant.status !== "DELETED" && (
                  <button
                    onClick={() => setConfirmDelete(true)} disabled={busy !== null}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-[13px] font-medium text-danger hover:opacity-90 disabled:opacity-50"
                  >
                    <Trash2 size={14} /> Soft-delete
                  </button>
                )}
              </div>
              <p className="mt-3 text-[11px] text-content-muted">
                Suspending or deleting revokes every refresh-token family on this tenant — all users bounce.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && tenant && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => !busy && setConfirmDelete(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-border bg-neutral-surface p-6">
            <h2 className="mb-2 text-[17px] font-medium text-ink">Soft-delete {tenant.name}?</h2>
            <p className="mb-5 text-[14px] text-content-secondary">
              This flips the tenant's status to DELETED, revokes every active session, and hides it from the active list. Their data stays in the database — only an Admin can hard-delete.
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

function Tile({ icon: Icon, label, value }: { icon: typeof Globe; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-border bg-neutral-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12px] text-content-muted">{label}</p>
        <Icon size={15} className="text-content-muted" />
      </div>
      <p className="font-mono text-[22px] font-semibold leading-none text-ink">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: PlatformUser["role"] | "ACTIVE" | "SUSPENDED" | "DELETED" }) {
  const style = (
    status === "ACTIVE"    ? "bg-success-bg text-success" :
    status === "SUSPENDED" ? "bg-warning-bg text-warning" :
    status === "DELETED"   ? "bg-neutral-surface2 text-content-muted" :
                              "bg-neutral-surface2 text-content-secondary"
  );
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.05em] ${style}`}>
      {status}
    </span>
  );
}

function UserRow({ u }: { u: PlatformUser }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <Link href={`/admin/platform/users/${u.id}`} className="flex min-w-0 items-center gap-3 hover:text-primary-light">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-bg font-mono text-[11px] font-medium text-primary-light">
          {(u.fullName ?? u.email).slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] text-ink">{u.fullName ?? u.email}</p>
          <p className="flex items-center gap-1.5 truncate font-mono text-[11px] text-content-muted">
            <Mail size={10} /> {u.email}
            {u.googleLinked && <span className="rounded-sm bg-primary-bg px-1 py-0.5 text-[9px] text-primary-light">G</span>}
          </p>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-2 text-[11px]">
        <span className="rounded-md bg-neutral-surface2 px-2 py-0.5 text-content-secondary">{u.role}</span>
        <span className={`rounded-full px-2 py-0.5 font-medium uppercase tracking-[0.04em] ${u.active ? "bg-success-bg text-success" : "bg-neutral-surface2 text-content-muted"}`}>
          {u.active ? "Active" : "Inactive"}
        </span>
      </div>
    </li>
  );
}
