"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Globe, ChevronRight, Plus, AlertCircle, Globe2 } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { ApiKeyResultModal } from "@/components/app/ApiKeyResultModal";
import { RegisterSiteModal } from "@/components/app/RegisterSiteModal";
import { useApiQuery } from "@/hooks/useApiQuery";
import { meQuery } from "@/lib/account";
import { fmtDateTime } from "@/lib/format";
import { sitesApi, deriveStatus, type DerivedStatus, type TenantSiteSummary } from "@/lib/sites";
import type { Staff } from "@/types";

const FILTERS: { id: DerivedStatus | "ALL"; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "live", label: "Live" },
  { id: "pending_qa", label: "Pending QA" },
  { id: "inactive", label: "Inactive" },
];

const STATUS_STYLE: Record<DerivedStatus, { text: string; bg: string; label: string }> = {
  live:        { text: "text-success",       bg: "bg-success-bg",         label: "Live" },
  pending_qa:  { text: "text-warning",       bg: "bg-warning-bg",         label: "Pending QA" },
  draft:       { text: "text-content-muted", bg: "bg-neutral-surface2",   label: "Draft" },
  inactive:    { text: "text-content-muted", bg: "bg-neutral-surface2",   label: "Inactive" },
};

const verticalLabel = (v: string | null) =>
  !v ? "—" : v.replace(/_/g, " ").replace(/(^| )./g, (m) => m.toUpperCase());

export default function PlatformSitesPage() {
  const { data: me } = useApiQuery<Staff>(meQuery);
  const role = me?.role;
  const isAdmin = role === "ADMIN";

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DerivedStatus | "ALL">("ALL");
  const [registerOpen, setRegisterOpen] = useState(false);

  // Plaintext key reveal state — cleared the moment the modal closes.
  const [keyResult, setKeyResult] = useState<{ key: string; tenantName: string } | null>(null);

  const { data, loading, error, refetch } = useApiQuery(sitesApi.list);
  const allSites = data ?? [];

  // Client-side search + filter (small dataset; can server-side later).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allSites.filter((s) => {
      if (filter !== "ALL" && deriveStatus(s) !== filter) return false;
      if (!q) return true;
      const hay = [
        s.tenantName, s.subdomain ?? "", s.customDomain ?? "",
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [allSites, filter, search]);

  // Read-only for non-elevated roles. Permitted: ADMIN, TEAM_LEAD, QA_REVIEWER.
  const hasAccess = role === "ADMIN" || role === "TEAM_LEAD" || role === "QA_REVIEWER";
  if (me && !hasAccess) {
    return (
      <StudioShell title="Platform sites" subtitle="ADMIN / TEAM_LEAD / QA only.">
        <EmptyState
          icon={AlertCircle}
          title="Access required"
          description="Site management is restricted to admins, leads, and QA reviewers."
        />
      </StudioShell>
    );
  }

  return (
    <StudioShell
      title="Platform sites"
      subtitle="Tenant websites registered to Conddo."
      actions={
        isAdmin ? (
          <button
            type="button"
            onClick={() => setRegisterOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-[13px] font-medium text-white hover:bg-primary-hover"
          >
            <Plus size={15} /> Register site
          </button>
        ) : undefined
      }
    >
      {/* Search + filter */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tenant, subdomain, or custom domain…"
            className="h-10 w-full rounded-md border border-neutral-strong bg-neutral-bg pl-9 pr-3 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                filter === f.id
                  ? "border-primary bg-primary-bg text-primary-light"
                  : "border-neutral-strong text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && allSites.length === 0 ? (
        <LoadingState label="Loading sites…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Globe2}
          title={search || filter !== "ALL" ? "No sites match" : "No sites registered yet"}
          description={
            search || filter !== "ALL"
              ? "Try a different search or filter."
              : isAdmin
                ? "Click \"Register site\" to provision a tenant site + issue its Site API Key."
                : "Tenant sites will appear here once an admin registers them."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface">
          <ul className="divide-y divide-neutral-border">
            {filtered.map((s) => <SiteRow key={s.id} s={s} />)}
          </ul>
        </div>
      )}

      <RegisterSiteModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={(key, _id, tenantName) => {
          setKeyResult({ key, tenantName });
          refetch();
        }}
      />

      {keyResult && (
        <ApiKeyResultModal
          apiKey={keyResult.key}
          title={`Site API Key issued for ${keyResult.tenantName}`}
          description="Share this securely with the developer rebuilding the site (1Password preferred)."
          open={true}
          onClose={() => setKeyResult(null)}
        />
      )}
    </StudioShell>
  );
}

function SiteRow({ s }: { s: TenantSiteSummary }) {
  const status = deriveStatus(s);
  const style = STATUS_STYLE[status];
  const primaryDomain = s.customDomain ?? (s.subdomain ? `${s.subdomain}.conddo.io` : "—");
  return (
    <li>
      <Link
        href={`/admin/platform/sites/${s.id}`}
        className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-surface2"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-bg text-primary-light">
            <Globe size={15} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-ink">{s.tenantName}</p>
            <p className="truncate font-mono text-[11px] text-content-muted">
              {primaryDomain} · {verticalLabel(s.tenantVertical)} · sk_live_••••{s.apiKeyLast4}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden font-mono text-[11px] text-content-muted sm:inline">
            {fmtDateTime(s.qaApprovedAt ?? s.createdAt)}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em] ${style.bg} ${style.text}`}>
            {style.label}
          </span>
          <ChevronRight size={16} className="text-content-muted" />
        </div>
      </Link>
    </li>
  );
}
