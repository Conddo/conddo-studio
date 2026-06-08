"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Copy, Check, RotateCw, ShieldCheck, ShieldOff, Power, PowerOff,
  Globe, AlertTriangle, Loader2, History, Pencil, Save, X,
} from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { ApiKeyResultModal } from "@/components/app/ApiKeyResultModal";
import { useApiQuery } from "@/hooks/useApiQuery";
import { meQuery } from "@/lib/account";
import { fmtDateTime } from "@/lib/format";
import { StudioApiError } from "@/lib/api";
import {
  sitesApi, deriveStatus, type DerivedStatus, type TenantSiteDetail,
  type HostingProvider, type SiteType, type UpdateSiteInput,
  type SiteAuditEntry, type SiteAuditAction,
} from "@/lib/sites";
import type { Staff } from "@/types";

const STATUS_STYLE: Record<DerivedStatus, { text: string; bg: string; label: string }> = {
  live:       { text: "text-success",       bg: "bg-success-bg",       label: "Live" },
  pending_qa: { text: "text-warning",       bg: "bg-warning-bg",       label: "Pending QA" },
  draft:      { text: "text-content-muted", bg: "bg-neutral-surface2", label: "Draft" },
  inactive:   { text: "text-content-muted", bg: "bg-neutral-surface2", label: "Inactive" },
};

const ACTION_LABEL: Record<SiteAuditAction, string> = {
  REGISTERED:       "Site registered",
  KEY_ROTATED:      "API key issued / rotated",
  QA_APPROVED:      "QA approved",
  QA_REVOKED:       "QA revoked",
  ACTIVATED:        "Activated",
  DEACTIVATED:      "Deactivated",
  METADATA_UPDATED: "Metadata updated",
};

const HOSTING: HostingProvider[] = ["conddo", "vercel", "9stacks"];
const SITE_TYPES: SiteType[] = ["custom_built", "template"];

export default function SiteDetailPage({ params }: { params: { id: string } }) {
  const { data: me } = useApiQuery<Staff>(meQuery);
  const role = me?.role;
  const isAdmin = role === "ADMIN";
  const isReviewer = role === "QA_REVIEWER";

  const site = useApiQuery(() => sitesApi.get(params.id), [params.id]);
  const audit = useApiQuery(() => sitesApi.audit(params.id), [params.id]);

  if (site.loading) return <StudioShell title="Site"><LoadingState label="Loading site…" /></StudioShell>;
  if (site.error) return <StudioShell title="Site"><ErrorState error={site.error} onRetry={site.refetch} /></StudioShell>;
  if (!site.data) return <StudioShell title="Site"><EmptyState icon={Globe} title="Site not found" description="It may have been deleted." /></StudioShell>;

  return (
    <SiteDetail
      site={site.data}
      audit={audit.data ?? []}
      refetch={() => { site.refetch(); audit.refetch(); }}
      isAdmin={isAdmin}
      isReviewer={isReviewer}
    />
  );
}

function SiteDetail({
  site, audit, refetch, isAdmin, isReviewer,
}: {
  site: TenantSiteDetail;
  audit: SiteAuditEntry[];
  refetch: () => void;
  isAdmin: boolean;
  isReviewer: boolean;
}) {
  const status = deriveStatus(site);
  const style = STATUS_STYLE[status];
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyResult, setKeyResult] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"subdomain" | "domain" | null>(null);
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [rotateConfirmOpen, setRotateConfirmOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);

  function copy(text: string, which: "subdomain" | "domain") {
    navigator.clipboard.writeText(text).then(() => {
      setCopyState(which);
      setTimeout(() => setCopyState(null), 1500);
    });
  }

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
      refetch();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : "Couldn't complete that action.");
    } finally {
      setBusy(null);
    }
  }

  async function rotateKey() {
    setBusy("rotate");
    setError(null);
    try {
      const r = await sitesApi.rotateKey(site.id);
      setKeyResult(r.data.apiKey);
      setRotateConfirmOpen(false);
      refetch();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : "Couldn't rotate the key.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <StudioShell title={site.tenantName} subtitle="Platform site detail">
      <Link href="/admin/platform/sites" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-content-secondary hover:text-ink">
        <ArrowLeft size={15} /> Back to sites
      </Link>

      {error && (
        <p className="mb-4 rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-[13px] text-danger">{error}</p>
      )}

      {/* Header */}
      <section className="mb-6 rounded-2xl border border-neutral-border bg-neutral-surface p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Link href={`/admin/platform/tenants/${site.tenantId}`} className="text-[15px] font-medium text-ink hover:text-primary-light hover:underline">
                {site.tenantName}
              </Link>
              <span className="rounded-md bg-neutral-surface2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.05em] text-content-muted">
                {site.tenantVertical ?? "—"}
              </span>
            </div>
            <p className="text-[13px] text-content-secondary">Registered {fmtDateTime(site.createdAt)}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em] ${style.bg} ${style.text}`}>
            {style.label}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DomainRow
            label="Subdomain"
            value={site.subdomain ? `${site.subdomain}.conddo.io` : null}
            copyState={copyState === "subdomain" ? "copied" : "idle"}
            onCopy={() => site.subdomain && copy(`${site.subdomain}.conddo.io`, "subdomain")}
          />
          <DomainRow
            label="Custom domain"
            value={site.customDomain}
            copyState={copyState === "domain" ? "copied" : "idle"}
            onCopy={() => site.customDomain && copy(site.customDomain, "domain")}
          />
        </div>
      </section>

      {/* API key */}
      <section className="mb-6 rounded-2xl border border-neutral-border bg-neutral-surface p-5">
        <h3 className="mb-3 text-[14px] font-medium text-ink">Site API Key</h3>
        <div className="flex flex-wrap items-center gap-2">
          <code className="inline-flex h-10 flex-1 items-center rounded-md border border-neutral-strong bg-neutral-bg px-3 font-mono text-[12px] text-ink">
            sk_live_••••••••{site.apiKeyLast4}
          </code>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setRotateConfirmOpen(true)}
              disabled={busy === "rotate"}
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-neutral-strong px-3 text-[13px] font-medium text-content-secondary hover:bg-neutral-surface2 hover:text-ink disabled:opacity-50"
            >
              {busy === "rotate" ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
              Rotate key
            </button>
          )}
        </div>
        <p className="mt-2 font-mono text-[11px] text-content-muted">
          Plaintext was last shown {site.lastKeyRotatedAt ? fmtDateTime(site.lastKeyRotatedAt) : "on registration"}. Only the last 4 characters are stored after that.
        </p>
      </section>

      {/* Metadata */}
      <section className="mb-6 rounded-2xl border border-neutral-border bg-neutral-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[14px] font-medium text-ink">Metadata</h3>
          {isAdmin && !editingMeta && (
            <button
              type="button"
              onClick={() => setEditingMeta(true)}
              className="inline-flex items-center gap-1 rounded-md border border-neutral-strong px-2 py-1 text-[12px] text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>
        {editingMeta ? (
          <MetadataEditor
            site={site}
            saving={busy === "patch"}
            onCancel={() => setEditingMeta(false)}
            onSave={async (body) => {
              await run("patch", () => sitesApi.update(site.id, body));
              setEditingMeta(false);
            }}
          />
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-3">
            <Field label="Hosting" value={site.hostingProvider ?? "—"} />
            <Field label="Site type" value={site.siteType?.replace("_", " ") ?? "—"} />
            <Field label="Submitted URL" value={site.submittedUrl ?? "—"} />
          </dl>
        )}
      </section>

      {/* QA + active */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* QA */}
        <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5">
          <h3 className="mb-2 text-[14px] font-medium text-ink">QA approval</h3>
          {site.qaApproved ? (
            <>
              <p className="mb-3 text-[13px] text-content-secondary">
                Approved {fmtDateTime(site.qaApprovedAt)}{site.qaApprovedByName ? ` by ${site.qaApprovedByName}` : ""}
              </p>
              {(isAdmin || isReviewer) && (
                <button
                  type="button"
                  onClick={() => run("qaRevoke", () => sitesApi.qaRevoke(site.id))}
                  disabled={busy === "qaRevoke"}
                  className="inline-flex items-center gap-1.5 rounded-md border border-neutral-strong px-3 py-1.5 text-[13px] font-medium text-content-secondary hover:bg-neutral-surface2 hover:text-ink disabled:opacity-50"
                >
                  {busy === "qaRevoke" ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
                  Revoke approval
                </button>
              )}
            </>
          ) : (
            <>
              <p className="mb-3 text-[13px] text-content-secondary">Awaiting QA review.</p>
              {(isAdmin || isReviewer) && (
                <button
                  type="button"
                  onClick={() => setQaModalOpen(true)}
                  disabled={busy === "qaApprove"}
                  className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  <ShieldCheck size={14} /> Approve QA
                </button>
              )}
            </>
          )}
        </div>

        {/* Active toggle */}
        <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5">
          <h3 className="mb-2 text-[14px] font-medium text-ink">Active</h3>
          <p className="mb-3 text-[13px] text-content-secondary">
            {site.isActive ? "Public endpoints serve traffic." : "Public endpoints return SITE_NOT_LIVE."}
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={() =>
                run("toggleActive", () =>
                  site.isActive ? sitesApi.deactivate(site.id) : sitesApi.activate(site.id)
                )
              }
              disabled={busy === "toggleActive"}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-medium disabled:opacity-50 ${
                site.isActive
                  ? "border-neutral-strong text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
                  : "bg-primary text-white hover:bg-primary-hover"
              }`}
            >
              {busy === "toggleActive" ? <Loader2 size={14} className="animate-spin" /> :
                site.isActive ? <PowerOff size={14} /> : <Power size={14} />}
              {site.isActive ? "Deactivate" : "Activate"}
            </button>
          )}
        </div>
      </section>

      {/* Audit log */}
      <section className="rounded-2xl border border-neutral-border bg-neutral-surface p-5">
        <h3 className="mb-3 flex items-center gap-2 text-[14px] font-medium text-ink">
          <History size={14} /> Audit log
        </h3>
        {audit.length === 0 ? (
          <p className="text-[13px] text-content-muted">No entries yet.</p>
        ) : (
          <ol className="space-y-3">
            {audit.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-ink">{ACTION_LABEL[a.action] ?? a.action}</p>
                  {a.detail && <p className="text-[12px] text-content-secondary">{a.detail}</p>}
                  <p className="font-mono text-[11px] text-content-muted">{a.byStaffName} · {fmtDateTime(a.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Rotate confirm */}
      {rotateConfirmOpen && (
        <RotateConfirmModal
          onClose={() => setRotateConfirmOpen(false)}
          onConfirm={rotateKey}
          saving={busy === "rotate"}
        />
      )}

      {/* QA approve modal */}
      {qaModalOpen && (
        <QaApproveModal
          onClose={() => setQaModalOpen(false)}
          onApprove={async (note) => {
            await run("qaApprove", () => sitesApi.qaApprove(site.id, note));
            setQaModalOpen(false);
          }}
          saving={busy === "qaApprove"}
        />
      )}

      {/* Plaintext key reveal */}
      {keyResult && (
        <ApiKeyResultModal
          apiKey={keyResult}
          title={`New API Key issued for ${site.tenantName}`}
          description="The old key is now invalid. Share this with the developer maintaining the site."
          open={true}
          onClose={() => setKeyResult(null)}
        />
      )}
    </StudioShell>
  );
}

function DomainRow({
  label, value, copyState, onCopy,
}: {
  label: string;
  value: string | null;
  copyState: "idle" | "copied";
  onCopy: () => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-content-muted">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate font-mono text-[13px] text-ink">{value ?? "—"}</code>
        {value && (
          <button
            type="button"
            onClick={onCopy}
            aria-label={`Copy ${label}`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
          >
            {copyState === "copied" ? <Check size={13} className="text-success" /> : <Copy size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mb-0.5 text-[11px] font-medium uppercase tracking-[0.06em] text-content-muted">{label}</dt>
      <dd className="font-mono text-[12px] text-ink">{value}</dd>
    </div>
  );
}

function MetadataEditor({
  site, saving, onCancel, onSave,
}: {
  site: TenantSiteDetail;
  saving: boolean;
  onCancel: () => void;
  onSave: (body: UpdateSiteInput) => Promise<void>;
}) {
  const [hosting, setHosting] = useState<HostingProvider | "">(site.hostingProvider ?? "");
  const [type, setType] = useState<SiteType>(site.siteType ?? "custom_built");
  const [submitted, setSubmitted] = useState(site.submittedUrl ?? "");
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-[0.06em] text-content-muted">Hosting</label>
          <select
            value={hosting}
            onChange={(e) => setHosting(e.target.value as HostingProvider | "")}
            className="h-10 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3 text-[13px] text-ink focus:border-primary focus:outline-none"
          >
            <option value="">Not set</option>
            {HOSTING.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-[0.06em] text-content-muted">Site type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SiteType)}
            className="h-10 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3 text-[13px] text-ink focus:border-primary focus:outline-none"
          >
            {SITE_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-[11px] uppercase tracking-[0.06em] text-content-muted">Submitted URL</label>
        <input
          value={submitted}
          onChange={(e) => setSubmitted(e.target.value)}
          placeholder="https://staging.example.com"
          className="h-10 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-md border border-neutral-border px-3 py-1.5 text-[13px] text-content-secondary hover:bg-neutral-surface2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onSave({
              hostingProvider: hosting || undefined,
              siteType: type,
              submittedUrl: submitted.trim() || undefined,
            })
          }
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </button>
      </div>
    </div>
  );
}

function RotateConfirmModal({
  onClose, onConfirm, saving,
}: {
  onClose: () => void;
  onConfirm: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-border bg-neutral-surface p-6">
        <div className="mb-3 flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-warning-bg text-warning">
            <AlertTriangle size={17} />
          </span>
          <div>
            <h3 className="text-[16px] font-medium text-ink">Rotate this site's API key?</h3>
            <p className="mt-1 text-[13px] text-content-secondary">
              The current key will stop working immediately. Any deployed site using it will break until the developer redeploys with the new key.
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-neutral-border px-3 py-1.5 text-[13px] text-content-secondary hover:bg-neutral-surface2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
            Rotate key
          </button>
        </div>
      </div>
    </div>
  );
}

function QaApproveModal({
  onClose, onApprove, saving,
}: {
  onClose: () => void;
  onApprove: (note: string) => Promise<void>;
  saving: boolean;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-border bg-neutral-surface p-6">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-[16px] font-medium text-ink">Approve QA</h3>
          <button onClick={() => !saving && onClose()} aria-label="Close" className="text-content-muted hover:text-ink"><X size={16} /></button>
        </div>
        <p className="mb-3 text-[13px] text-content-secondary">
          Site goes live once approved — public endpoints will serve real traffic. Add an optional note for the audit log.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Reviewed against the pharmacy public-API checklist; all endpoints behaving correctly."
          rows={3}
          className="mb-4 w-full rounded-md border border-neutral-strong bg-neutral-bg p-3 text-[13px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-neutral-border px-3 py-1.5 text-[13px] text-content-secondary hover:bg-neutral-surface2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onApprove(note.trim())}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
