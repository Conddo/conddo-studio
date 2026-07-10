"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity, AlertTriangle, CheckCircle2, ExternalLink, LogOut,
  RefreshCcw, Sparkles, Zap,
} from "lucide-react";
import {
  clearAdminToken, conddoAdminApi, ConddoApiError, getAdminToken, loginAdmin,
  type PlatformOverview, type TenantSiteAdminRow,
} from "@/lib/conddoApi";

/**
 * The single Studio dashboard — QA queue + platform snapshot on one page.
 *
 * <p>Uses main Conddo API auth (SUPER_ADMIN Bearer). If no token is present
 * we render an inline login form; on submit we hit /auth/login on the main
 * API and cache the token in localStorage. Logging out clears the token and
 * bounces back to the login state.
 *
 * <p>Deliberately dependency-free — the whole page renders from two
 * endpoints so we don't drag Studio's job / notification machinery into
 * the simplified single-page world.
 */
export default function StudioDashboard() {
  const [authed, setAuthed] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    setAuthed(getAdminToken() !== null);
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-neutral-bg" />;
  }

  return authed
    ? <PlatformDashboard onSignOut={() => { clearAdminToken(); setAuthed(false); }} />
    : <SignInCard onSignedIn={() => setAuthed(true)} />;
}

// ----- Sign-in ------------------------------------------------------------

function SignInCard({ onSignedIn }: { onSignedIn: () => void }) {
  const [tenantSlug, setTenantSlug] = useState("platform");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await loginAdmin({ tenantSlug: tenantSlug.trim(), email: email.trim(), password });
      if (result.role !== "SUPER_ADMIN") {
        setError(`This account has role ${result.role}. Studio needs SUPER_ADMIN.`);
        return;
      }
      onSignedIn();
    } catch (err) {
      setError(err instanceof ConddoApiError ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-bg px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border border-neutral-border bg-white p-6 shadow-sm"
      >
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
            <Sparkles size={18} strokeWidth={2.25} />
          </div>
          <h1 className="text-[18px] font-semibold text-ink">Conddo Studio</h1>
          <p className="mt-0.5 text-[13px] text-neutral-fg">
            Sign in with your platform admin account.
          </p>
        </div>

        <div className="space-y-3">
          <Field label="Tenant slug" htmlFor="s-slug">
            <input
              id="s-slug"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              placeholder="platform"
              className="h-10 w-full rounded-md border border-neutral-border px-3 text-[14px] outline-none focus:border-primary"
              autoComplete="off"
            />
          </Field>
          <Field label="Email" htmlFor="s-email">
            <input
              id="s-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-md border border-neutral-border px-3 text-[14px] outline-none focus:border-primary"
              autoComplete="username"
              autoFocus
            />
          </Field>
          <Field label="Password" htmlFor="s-pass">
            <input
              id="s-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-md border border-neutral-border px-3 text-[14px] outline-none focus:border-primary"
              autoComplete="current-password"
            />
          </Field>
          {error && (
            <p className="rounded-md border border-danger/25 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !email || !password}
            className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary text-[14px] font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ----- Dashboard ----------------------------------------------------------

function PlatformDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [pending, setPending] = useState<TenantSiteAdminRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, ps] = await Promise.all([
        conddoAdminApi.overview(),
        conddoAdminApi.pendingSites(),
      ]);
      setOverview(ov);
      setPending(ps);
    } catch (err) {
      setError(err instanceof ConddoApiError ? err.message : "Couldn't load platform snapshot.");
      if (err instanceof ConddoApiError && err.status === 401) {
        clearAdminToken();
        onSignOut();
      }
    } finally {
      setLoading(false);
    }
  }, [onSignOut]);

  useEffect(() => { load(); }, [load]);

  async function approve(siteId: string) {
    setApproving(siteId);
    try {
      await conddoAdminApi.approveSite(siteId);
      setPending((prev) => prev?.filter((s) => s.id !== siteId) ?? null);
      // Re-fetch overview to update pendingQaCount
      const ov = await conddoAdminApi.overview();
      setOverview(ov);
    } catch (err) {
      setError(err instanceof ConddoApiError ? err.message : "Couldn't approve site.");
    } finally {
      setApproving(null);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-bg">
      <TopBar onSignOut={onSignOut} onRefresh={load} loading={loading} />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-danger/25 bg-rose-50 px-4 py-3 text-[13.5px] text-rose-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {overview && <MetricsRow overview={overview} />}
        {overview && <BreakdownRow overview={overview} />}
        <QaQueue rows={pending} onApprove={approve} approving={approving} loading={loading && pending === null} />
      </main>
    </div>
  );
}

function TopBar({
  onSignOut, onRefresh, loading,
}: { onSignOut: () => void; onRefresh: () => void; loading: boolean }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-border bg-white/85 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
          <Sparkles size={16} strokeWidth={2.25} />
        </div>
        <p className="text-[14.5px] font-semibold text-ink">Conddo Studio</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-fg hover:bg-neutral-bg disabled:opacity-40"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] text-neutral-fg hover:bg-neutral-bg"
        >
          <LogOut size={14} strokeWidth={2.25} />
          Sign out
        </button>
      </div>
    </header>
  );
}

function MetricsRow({ overview }: { overview: PlatformOverview }) {
  const cards = [
    { label: "Tenants", value: overview.totalTenants.toLocaleString(),
      hint: `+${overview.newTenantsLast30Days} in last 30d`, icon: Activity, tone: "ok" as const },
    { label: "Pending QA", value: overview.pendingQaCount.toLocaleString(),
      hint: overview.pendingQaCount > 0 ? "Needs review" : "All clear",
      icon: AlertTriangle,
      tone: (overview.pendingQaCount > 0 ? "warn" : "ok") as "warn" | "ok" },
    { label: "Live sites", value: overview.activeSitesCount.toLocaleString(),
      hint: "Currently accepting traffic", icon: CheckCircle2, tone: "ok" as const },
    { label: "Credits burned", value: overview.totalCreditsUsedPlatformWide.toLocaleString(),
      hint: "Across all cycles", icon: Zap, tone: "ok" as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon, tone }) => (
        <div
          key={label}
          className={`rounded-xl border p-4 ${
            tone === "warn"
              ? "border-amber-300/60 bg-amber-50"
              : "border-neutral-border bg-white"
          }`}
        >
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-neutral-fg">
              {label}
            </p>
            <Icon size={14} className={tone === "warn" ? "text-amber-600" : "text-neutral-fg"} />
          </div>
          <p className="text-[24px] font-semibold tracking-tight text-ink">{value}</p>
          <p className={`mt-0.5 text-[12.5px] ${
            tone === "warn" ? "text-amber-800" : "text-neutral-fg"
          }`}>
            {hint}
          </p>
        </div>
      ))}
    </div>
  );
}

function BreakdownRow({ overview }: { overview: PlatformOverview }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <BreakdownCard title="Tenants by vertical" data={overview.tenantsByVertical} />
      <BreakdownCard title="Tenants by tier" data={overview.tenantsByTier} />
    </div>
  );
}

function BreakdownCard({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  return (
    <section className="rounded-xl border border-neutral-border bg-white p-4">
      <p className="mb-3 text-[11.5px] font-medium uppercase tracking-[0.06em] text-neutral-fg">
        {title}
      </p>
      {entries.length === 0 ? (
        <p className="py-4 text-center text-[13px] italic text-neutral-fg">No data yet</p>
      ) : (
        <ul className="space-y-2.5">
          {entries.map(([key, val]) => {
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return (
              <li key={key}>
                <div className="mb-1 flex items-center justify-between text-[13px] text-ink">
                  <span className="font-medium">{friendlyLabel(key)}</span>
                  <span className="tabular-nums text-neutral-fg">
                    {val.toLocaleString()} <span className="ml-1 text-[11.5px]">({pct}%)</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-bg">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function QaQueue({
  rows, onApprove, approving, loading,
}: {
  rows: TenantSiteAdminRow[] | null;
  onApprove: (id: string) => void;
  approving: string | null;
  loading: boolean;
}) {
  return (
    <section className="rounded-xl border border-neutral-border bg-white">
      <div className="flex items-center justify-between border-b border-neutral-border px-4 py-3">
        <p className="text-[13.5px] font-medium text-ink">Sites awaiting QA</p>
        {rows && rows.length > 0 && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-medium text-amber-800">
            {rows.length} pending
          </span>
        )}
      </div>
      {loading && (
        <div className="p-8 text-center text-[13px] text-neutral-fg">Loading…</div>
      )}
      {!loading && rows && rows.length === 0 && (
        <div className="p-8 text-center">
          <CheckCircle2 size={20} className="mx-auto mb-2 text-emerald-600" />
          <p className="text-[13.5px] font-medium text-ink">Queue empty</p>
          <p className="mt-1 text-[12.5px] text-neutral-fg">No sites waiting for review.</p>
        </div>
      )}
      {!loading && rows && rows.length > 0 && (
        <ul className="divide-y divide-neutral-border">
          {rows.map((site) => (
            <li key={site.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-ink">
                  {site.subdomain ?? site.customDomain ?? "Unnamed site"}
                </p>
                <p className="mt-0.5 truncate text-[12.5px] text-neutral-fg">
                  Submitted:{" "}
                  {site.submittedUrl ? (
                    <a
                      href={site.submittedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 text-primary hover:underline"
                    >
                      {site.submittedUrl} <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span className="italic">no URL submitted</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onApprove(site.id)}
                disabled={approving === site.id}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[13px] font-medium text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-60"
              >
                {approving === site.id ? "Approving…" : "Approve"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ----- helpers ------------------------------------------------------------

function Field({ label, htmlFor, children }: {
  label: string; htmlFor: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-[11.5px] font-medium uppercase tracking-[0.05em] text-neutral-fg">
        {label}
      </label>
      {children}
    </div>
  );
}

function friendlyLabel(key: string): string {
  if (!key || key === "unknown") return "Unknown";
  return key.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
