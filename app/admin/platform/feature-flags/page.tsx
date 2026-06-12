"use client";

import { useMemo, useState } from "react";
import {
  ShieldCheck, ShieldX, Search, Inbox, CheckCircle2, XCircle, Clock,
  AlertCircle, Loader2,
} from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useApiQuery } from "@/hooks/useApiQuery";
import { meQuery } from "@/lib/account";
import { fmtDateTime } from "@/lib/format";
import {
  featureFlagsApi,
  featureLabel,
  STATUS_LABELS,
  type FeatureFlagRequest,
  type FlagRequestStatus,
} from "@/lib/featureFlags";
import type { Staff } from "@/types";

const FILTERS: { id: FlagRequestStatus | "all"; label: string; icon: React.ElementType }[] = [
  { id: "interest", label: "Awaiting review", icon: Inbox },
  { id: "granted",  label: "Granted",         icon: CheckCircle2 },
  { id: "revoked",  label: "Revoked",         icon: XCircle },
  { id: "all",      label: "All",             icon: Clock },
];

const verticalLabel = (v: string | null) =>
  !v ? "—" : v.replace(/_/g, " ").replace(/(^| )./g, (m) => m.toUpperCase());

const timeAgo = (s: string | null): string => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};

export default function PlatformFeatureFlagsPage() {
  const { data: me } = useApiQuery<Staff>(meQuery);
  const role = me?.role;
  const isAdmin = role === "ADMIN";

  const [filter, setFilter] = useState<FlagRequestStatus | "all">("interest");
  const [search, setSearch] = useState("");

  const { data, loading, error, refetch } = useApiQuery(
    () => featureFlagsApi.list({ status: filter }),
    [filter],
  );
  const requests = data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) =>
      r.tenantName.toLowerCase().includes(q) ||
      r.tenantSlug.toLowerCase().includes(q) ||
      featureLabel(r.featureKey).toLowerCase().includes(q),
    );
  }, [requests, search]);

  // Headline counts for the filter chips — fetched once with status=all so
  // every chip shows its tally regardless of which is active. This is the
  // pattern from /admin/platform/sites.
  const allQ = useApiQuery(() => featureFlagsApi.list({ status: "all" }));
  const all = allQ.data ?? [];
  const counts = useMemo(() => ({
    interest: all.filter((r) => r.status === "interest").length,
    granted:  all.filter((r) => r.status === "granted").length,
    revoked:  all.filter((r) => r.status === "revoked").length,
    all:      all.length,
  }), [all]);

  return (
    <StudioShell
      title="Beta Access Requests"
      subtitle="Tenants request access to beta features from /features on their dashboard. Review and grant from here."
    >

      {!isAdmin && (
        <div className="mb-5 flex items-start gap-2 rounded-md border border-warning/30 bg-warning-bg px-4 py-3 text-[13px] text-warning">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <p>
            Granting beta access requires ADMIN role. You can see the queue but not act on it.
          </p>
        </div>
      )}

      {/* Filter chips */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const Icon = f.icon;
          const count = counts[f.id];
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                active
                  ? "border border-primary bg-neutral-surface font-medium text-primary"
                  : "border border-transparent text-content-secondary hover:text-primary"
              }`}
            >
              <Icon size={13} />
              {f.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
                  active ? "bg-primary-bg text-primary" : "bg-neutral-surface2 text-content-muted"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          placeholder="Search by tenant name, slug, or feature"
          className="h-11 w-full max-w-md rounded-lg border border-neutral-border bg-neutral-surface pl-11 pr-3 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
        />
      </div>

      {loading ? (
        <LoadingState label="Loading requests…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={
            filter === "interest" ? "Queue is empty" :
            filter === "granted"  ? "Nothing granted yet" :
            filter === "revoked"  ? "Nothing revoked" :
                                    "No requests yet"
          }
          description={
            filter === "interest"
              ? "When a tenant clicks Request Beta access on their /features page, it appears here for review."
              : "Switch the filter to see other statuses."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-neutral-border bg-neutral-surface2 text-[11px] uppercase tracking-[0.05em] text-content-secondary">
                  <th className="px-5 py-3 font-medium">Tenant</th>
                  <th className="px-5 py-3 font-medium">Feature</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Activity</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border">
                {filtered.map((r) => (
                  <RequestRow
                    key={`${r.tenantId}-${r.featureKey}`}
                    r={r}
                    canAct={isAdmin}
                    onChanged={() => { refetch(); allQ.refetch(); }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </StudioShell>
  );
}

function RequestRow({
  r,
  canAct,
  onChanged,
}: {
  r: FeatureFlagRequest;
  canAct: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<"grant" | "revoke" | null>(null);

  async function grant() {
    if (!confirm(`Grant ${featureLabel(r.featureKey)} to ${r.tenantName}?`)) return;
    setBusy("grant");
    try {
      await featureFlagsApi.grant(r.tenantId, r.featureKey);
      onChanged();
    } catch (e) {
      alert(`Couldn't grant: ${e instanceof Error ? e.message : "Please try again."}`);
    } finally {
      setBusy(null);
    }
  }

  async function revoke() {
    if (!confirm(`Revoke ${featureLabel(r.featureKey)} from ${r.tenantName}? Their UI will hide the feature on next page load.`)) return;
    setBusy("revoke");
    try {
      await featureFlagsApi.revoke(r.tenantId, r.featureKey);
      onChanged();
    } catch (e) {
      alert(`Couldn't revoke: ${e instanceof Error ? e.message : "Please try again."}`);
    } finally {
      setBusy(null);
    }
  }

  const statusTone =
    r.status === "granted" ? "text-success bg-success-bg" :
    r.status === "revoked" ? "text-content-muted bg-neutral-surface2" :
                             "text-warning bg-warning-bg";

  return (
    <tr className="group transition-colors hover:bg-neutral-surface2">
      {/* Tenant */}
      <td className="px-5 py-3.5">
        <p className="text-[14px] font-medium text-ink">{r.tenantName}</p>
        <p className="font-mono text-[11px] text-content-muted">
          {r.tenantSlug}
          {r.tenantVertical && <span className="ml-1.5">· {verticalLabel(r.tenantVertical)}</span>}
          {r.tenantPlan && <span className="ml-1.5">· {r.tenantPlan}</span>}
        </p>
      </td>

      {/* Feature */}
      <td className="px-5 py-3.5">
        <p className="text-[13px] text-ink">{featureLabel(r.featureKey)}</p>
        <p className="font-mono text-[11px] text-content-muted">{r.featureKey}</p>
      </td>

      {/* Status */}
      <td className="px-5 py-3.5">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusTone}`}>
          {STATUS_LABELS[r.status]}
        </span>
      </td>

      {/* Activity timeline */}
      <td className="px-5 py-3.5 text-[12px] text-content-secondary">
        {r.interestAt && (
          <p>Requested {timeAgo(r.interestAt)}</p>
        )}
        {r.grantedAt && (
          <p className="text-[11px] text-content-muted">
            {r.status === "revoked" ? "Granted then revoked " : "Granted "}
            {fmtDateTime(r.grantedAt)}
            {r.grantedByName && <span> · by {r.grantedByName}</span>}
          </p>
        )}
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5 text-right">
        {canAct ? (
          r.status === "interest" || r.status === "revoked" ? (
            <button
              type="button"
              onClick={grant}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-success/90 disabled:opacity-60"
            >
              {busy === "grant" ? <Loader2 size={11} className="animate-spin" /> : <ShieldCheck size={11} />}
              {r.status === "revoked" ? "Re-grant" : "Grant"}
            </button>
          ) : (
            <button
              type="button"
              onClick={revoke}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-md border border-danger/30 bg-danger-bg px-3 py-1.5 text-[12px] font-medium text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-60"
            >
              {busy === "revoke" ? <Loader2 size={11} className="animate-spin" /> : <ShieldX size={11} />}
              Revoke
            </button>
          )
        ) : (
          <span className="text-[11px] text-content-muted">Read-only</span>
        )}
      </td>
    </tr>
  );
}
