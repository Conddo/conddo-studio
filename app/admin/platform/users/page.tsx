"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Users, Mail, ChevronRight, AlertCircle } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useApiQuery } from "@/hooks/useApiQuery";
import { platformAdminApi } from "@/lib/platformAdmin";
import { meQuery } from "@/lib/account";
import type { PlatformUser, Staff } from "@/types";

const ROLES = ["TENANT_ADMIN", "STAFF", "CUSTOMER"];

export default function PlatformUsersPage() {
  const { data: me } = useApiQuery<Staff>(meQuery);
  const isAdmin = me?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string | "ALL">("ALL");
  const [page, setPage] = useState(0);

  const { data, loading, error, refetch, meta } = useApiQuery(
    () => platformAdminApi.listUsers({
      q: search.trim() || undefined,
      role: role === "ALL" ? undefined : role,
      page, size: 25,
    }),
    [search, role, page],
  );
  const users = data ?? [];

  if (me && !isAdmin) {
    return (
      <StudioShell title="Platform Admin" subtitle="ADMIN-only.">
        <EmptyState icon={AlertCircle} title="Admin access required" description="Platform-wide user management is ADMIN-only." />
      </StudioShell>
    );
  }

  return (
    <StudioShell title="Platform users" subtitle="Every user across every tenant.">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by email, name, or tenant…"
            className="h-10 w-full rounded-md border border-neutral-strong bg-neutral-bg pl-9 pr-3 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => { setRole("ALL"); setPage(0); }}
            className={`rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors ${
              role === "ALL" ? "border-primary bg-primary-bg text-primary-light" : "border-neutral-strong text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
            }`}
          >All</button>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r); setPage(0); }}
              className={`rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                role === r ? "border-primary bg-primary-bg text-primary-light" : "border-neutral-strong text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
              }`}
            >{r.replace("_", " ")}</button>
          ))}
        </div>
      </div>

      {loading && users.length === 0 ? (
        <LoadingState label="Loading users…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title={search ? `No users match "${search}"` : "No users"} description="Try a different search or role filter." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface">
          <ul className="divide-y divide-neutral-border">
            {users.map((u) => <Row key={u.id} u={u} />)}
          </ul>
        </div>
      )}

      {meta?.total !== undefined && users.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-[13px] text-content-secondary">
          <span className="font-mono text-[12px] text-content-muted">
            Page {page + 1} · {users.length} of {meta.total}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded-md border border-neutral-border px-3 py-1.5 text-[12px] hover:bg-neutral-surface2 disabled:opacity-50">Prev</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * 25 >= meta.total} className="rounded-md border border-neutral-border px-3 py-1.5 text-[12px] hover:bg-neutral-surface2 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </StudioShell>
  );
}

function Row({ u }: { u: PlatformUser }) {
  return (
    <li>
      <Link href={`/admin/platform/users/${u.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-surface2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-bg font-mono text-[12px] font-medium text-primary-light">
            {(u.fullName ?? u.email).slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-ink">{u.fullName ?? u.email}</p>
            <p className="flex items-center gap-1.5 truncate font-mono text-[11px] text-content-muted">
              <Mail size={10} /> {u.email}
              {u.googleLinked && <span className="rounded-sm bg-primary-bg px-1 py-0.5 text-[9px] text-primary-light">G</span>}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-md bg-neutral-surface2 px-2 py-0.5 text-[11px] text-content-secondary">{u.role}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em] ${u.active ? "bg-success-bg text-success" : "bg-neutral-surface2 text-content-muted"}`}>
            {u.active ? "Active" : "Inactive"}
          </span>
          <ChevronRight size={16} className="text-content-muted" />
        </div>
      </Link>
    </li>
  );
}
