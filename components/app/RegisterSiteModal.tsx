"use client";

import { useEffect, useState } from "react";
import { Loader2, X, Search } from "lucide-react";
import { sitesApi, type HostingProvider, type SiteType } from "@/lib/sites";
import { platformAdminApi } from "@/lib/platformAdmin";
import { StudioApiError } from "@/lib/api";
import type { PlatformTenant } from "@/types";

const HOSTING: HostingProvider[] = ["conddo", "vercel", "9stacks"];
const SITE_TYPES: SiteType[] = ["custom_built", "template"];

/** Register a new tenant_sites row. On success this fires onRegistered with
 *  the plaintext API key the BE returned; the parent opens an
 *  ApiKeyResultModal to show it to the user. */
export function RegisterSiteModal({
  open,
  onClose,
  onRegistered,
}: {
  open: boolean;
  onClose: () => void;
  onRegistered: (apiKey: string, siteId: string, tenantName: string) => void;
}) {
  const [tenantQuery, setTenantQuery] = useState("");
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [tenant, setTenant] = useState<PlatformTenant | null>(null);

  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [hostingProvider, setHostingProvider] = useState<HostingProvider | "">("");
  const [siteType, setSiteType] = useState<SiteType>("custom_built");
  const [submittedUrl, setSubmittedUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Debounced tenant typeahead — same pattern as Studio's other admin pages.
  useEffect(() => {
    if (!open) return;
    const q = tenantQuery.trim();
    if (q.length < 2) {
      setTenants([]);
      return;
    }
    let active = true;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await platformAdminApi.listTenants({ q, status: "ACTIVE", size: 8 });
        if (active) setTenants(r.data ?? []);
      } catch {
        if (active) setTenants([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(t); };
  }, [tenantQuery, open]);

  function reset() {
    setTenantQuery(""); setTenants([]); setTenant(null);
    setSubdomain(""); setCustomDomain("");
    setHostingProvider(""); setSiteType("custom_built");
    setSubmittedUrl("");
    setError(null); setFieldErrors({});
    setSearchOpen(false);
  }

  function close() {
    if (saving) return;
    reset();
    onClose();
  }

  function pickTenant(t: PlatformTenant) {
    setTenant(t);
    setTenantQuery(t.name);
    setSearchOpen(false);
    // Auto-suggest the subdomain from the tenant's slug — user can edit.
    if (!subdomain) setSubdomain(t.slug);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!tenant) errs.tenant = "Pick a tenant from the search.";
    if (!subdomain.trim() && !customDomain.trim()) {
      errs.domain = "Provide at least one of subdomain or custom domain.";
    }
    if (customDomain.trim() && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(customDomain.trim())) {
      errs.customDomain = "Enter a bare domain — no scheme, no path. e.g. sebandbayor.com.ng";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate() || !tenant) return;
    setSaving(true);
    try {
      const r = await sitesApi.register({
        tenantId: tenant.id,
        subdomain: subdomain.trim() || undefined,
        customDomain: customDomain.trim() || undefined,
        hostingProvider: hostingProvider || undefined,
        siteType,
        submittedUrl: submittedUrl.trim() || undefined,
      });
      onRegistered(r.data.apiKey, r.data.site.id, tenant.name);
      reset();
      onClose();
    } catch (err) {
      if (err instanceof StudioApiError) {
        // Map the spec's three predictable 409s to inline field errors.
        if (err.code === "SUBDOMAIN_TAKEN") {
          setFieldErrors({ subdomain: "That subdomain is already in use." });
        } else if (err.code === "CUSTOM_DOMAIN_TAKEN") {
          setFieldErrors({ customDomain: "That domain is already registered to another tenant." });
        } else if (err.code === "TENANT_ALREADY_HAS_SITE") {
          setError(`${tenant.name} already has a site registered. Edit it from the list instead of registering a new one.`);
        } else {
          setError(err.message);
        }
      } else {
        setError("Couldn't register the site. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => !saving && close()} />
      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-border bg-neutral-surface p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-medium text-ink">Register a site</h2>
            <p className="mt-0.5 text-[13px] text-content-secondary">Provision a tenant_sites row and issue a Site API Key.</p>
          </div>
          <button
            type="button"
            onClick={() => !saving && close()}
            aria-label="Close"
            className="rounded-md p-1 text-content-muted hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-[13px] text-danger">{error}</p>
        )}

        <form onSubmit={submit} className="space-y-4">
          {/* Tenant picker — typeahead. */}
          <div className="relative">
            <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-content-secondary">Tenant</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
              <input
                value={tenantQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setTenantQuery(e.target.value);
                  setTenant(null);
                  setSearchOpen(true);
                }}
                placeholder="Search by name or slug…"
                className={`h-11 w-full rounded-md border bg-neutral-bg pl-9 pr-3 text-[14px] text-ink placeholder:text-content-muted focus:outline-none ${
                  fieldErrors.tenant ? "border-danger" : "border-neutral-strong focus:border-primary"
                }`}
              />
            </div>
            {searchOpen && tenantQuery.trim().length >= 2 && (
              <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-neutral-border bg-neutral-surface shadow-lg">
                {searching ? (
                  <li className="px-3 py-2 text-[13px] text-content-muted">Searching…</li>
                ) : tenants.length === 0 ? (
                  <li className="px-3 py-2 text-[13px] text-content-muted">No tenants match.</li>
                ) : (
                  tenants.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => pickTenant(t)}
                        className="w-full px-3 py-2 text-left hover:bg-neutral-surface2"
                      >
                        <p className="text-[13px] text-ink">{t.name}</p>
                        <p className="font-mono text-[11px] text-content-muted">{t.slug} · {t.verticalId ?? "—"}</p>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
            {fieldErrors.tenant && <p className="mt-1 text-[12px] text-danger">{fieldErrors.tenant}</p>}
          </div>

          {fieldErrors.domain && (
            <p className="rounded-md bg-warning-bg px-3 py-1.5 text-[12px] text-warning">{fieldErrors.domain}</p>
          )}

          {/* Subdomain + Custom domain */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-content-secondary">Subdomain</label>
              <div className="flex">
                <input
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                  placeholder="e.g. seb-bayorpharmaceutical"
                  className={`h-11 flex-1 rounded-l-md border border-r-0 bg-neutral-bg px-3 text-[14px] text-ink placeholder:text-content-muted focus:outline-none ${
                    fieldErrors.subdomain ? "border-danger" : "border-neutral-strong focus:border-primary"
                  }`}
                />
                <span className="inline-flex h-11 items-center rounded-r-md border border-neutral-strong bg-neutral-surface2 px-3 font-mono text-[12px] text-content-muted">
                  .conddo.io
                </span>
              </div>
              {fieldErrors.subdomain && <p className="mt-1 text-[12px] text-danger">{fieldErrors.subdomain}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-content-secondary">Custom domain</label>
              <input
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
                placeholder="e.g. sebandbayor.com.ng"
                className={`h-11 w-full rounded-md border bg-neutral-bg px-3 text-[14px] text-ink placeholder:text-content-muted focus:outline-none ${
                  fieldErrors.customDomain ? "border-danger" : "border-neutral-strong focus:border-primary"
                }`}
              />
              {fieldErrors.customDomain && <p className="mt-1 text-[12px] text-danger">{fieldErrors.customDomain}</p>}
            </div>
          </div>

          {/* Hosting + type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-content-secondary">Hosting provider</label>
              <select
                value={hostingProvider}
                onChange={(e) => setHostingProvider(e.target.value as HostingProvider | "")}
                className="h-11 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3 text-[14px] text-ink focus:border-primary focus:outline-none"
              >
                <option value="">Not set</option>
                {HOSTING.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-content-secondary">Site type</label>
              <select
                value={siteType}
                onChange={(e) => setSiteType(e.target.value as SiteType)}
                className="h-11 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3 text-[14px] text-ink focus:border-primary focus:outline-none"
              >
                {SITE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submitted URL (optional, can be edited later) */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-content-secondary">Submitted URL (optional)</label>
            <input
              value={submittedUrl}
              onChange={(e) => setSubmittedUrl(e.target.value)}
              placeholder="e.g. https://staging.sebandbayor.com.ng"
              className="h-11 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-content-muted">The dev can submit this later from their job detail. Leave blank if it's not deployed yet.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={close}
              disabled={saving}
              className="rounded-md border border-neutral-border px-4 py-2 text-[14px] text-content-secondary hover:bg-neutral-surface2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : null}
              {saving ? "Registering…" : "Register + issue key"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
