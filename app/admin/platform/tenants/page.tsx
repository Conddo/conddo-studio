"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Globe, ChevronRight, Building2, AlertCircle } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useApiQuery } from "@/hooks/useApiQuery";
import { platformAdminApi } from "@/lib/platformAdmin";
import { meQuery } from "@/lib/account";
import { fmtDateTime } from "@/lib/format";
import type { PlatformTenant, PlatformTenantStatus, Staff } from "@/types";

const STATUS_FILTERS: { id: PlatformTenantStatus | "ALL"; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "ACTIVE", label: "Active" },
  { id: "SUSPENDED", label: "Suspended" },
  { id: "DELETED", label: "Deleted" },
];

const STATUS_STYLE: Record<PlatformTenantStatus, { text: string; bg: string }> = {
  ACTIVE:    { text: "text-success",        bg: "bg-success-bg" },
  SUSPENDED: { text: "text-warning",        bg: "bg-warning-bg" },
  DELETED:   { text: "text-content-muted",  bg: "bg-neutral-surface2" },
};

const verticalLabel = (v: string | null) =>
  !v ? "—" : v.replace(/_/g, " ").replace(/(^| )./g, (m) => m.toUpperCase());

export default function PlatformTenantsPage() {
  const { data: me } = useApiQuery<Staff>(meQuery);
  const isAdmin = me?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PlatformTenantStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);

  const { data, loading, error, refetch, meta } = useApiQuery(
    () => platformAdminApi.listTenants({
      q: search.trim() || undefined,
      status: status === "ALL" ? undefined : status,
      page, size: 25,
    }),
    [search, status, page],
  );
  const tenants = data ?? [];

  if (me && !isAdmin) {
    return (
      <StudioShell title="Platform Admin" subtitle="ADMIN-only.">
        <EmptyState
          icon={AlertCircle}
          title="Admin access required"
          description="Platform-wide tenant management is ADMIN-only. Talk to your team lead if you need access."
        />
      </StudioShell>
    );
  }

  return (
    <StudioShell title="Platform tenants" subtitle="Every workspace on Conddo.io.">
      {/* Search + filter */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by name, slug, or domain…"
            className="h-10 w-full rounded-md border border-neutral-strong bg-neutral-bg pl-9 pr-3 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setStatus(f.id); setPage(0); }}
              className={`rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                status === f.id
                  ? "border-primary bg-primary-bg text-primary-light"
                  : "border-neutral-strong text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && tenants.length === 0 ? (
        <LoadingState label="Loading tenants…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : tenants.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search ? `No tenants match "${search}"` : "No tenants yet"}
          description={search ? "Try a different search or status filter." : "Tenants appear here as businesses sign up."}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface">
          <ul className="divide-y divide-neutral-border">
            {tenants.map((t) => (
              <TenantRow key={t.id} t={t} />
            ))}
          </ul>
        </div>
      )}

      {/* Pagination — backend caps page size at 100; meta.total drives the count */}
      {meta?.total !== undefined && tenants.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-[13px] text-content-secondary">
          <span className="font-mono text-[12px] text-content-muted">
            Page {page + 1} · {tenants.length} of {meta.total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md border border-neutral-border px-3 py-1.5 text-[12px] hover:bg-neutral-surface2 disabled:opacity-50"
            >Prev</button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * 25 >= meta.total}
              className="rounded-md border border-neutral-border px-3 py-1.5 text-[12px] hover:bg-neutral-surface2 disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      )}
    </StudioShell>
  );
}

function TenantRow({ t }: { t: PlatformTenant }) {
  const style = STATUS_STYLE[t.status];
  return (
    <li>
      <Link
        href={`/admin/platform/tenants/${t.id}`}
        className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-surface2"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-bg text-primary-light">
            <Globe size={15} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-ink">{t.name}</p>
            <p className="font-mono text-[11px] text-content-muted">
              {t.slug}.conddo.io · {verticalLabel(t.verticalId)} · {t.planId ?? "no plan"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden font-mono text-[11px] text-content-muted sm:inline">
            {fmtDateTime(t.createdAt)}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em] ${style.bg} ${style.text}`}>
            {t.status}
          </span>
          <ChevronRight size={16} className="text-content-muted" />
        </div>
      </Link>
    </li>
  );
}
