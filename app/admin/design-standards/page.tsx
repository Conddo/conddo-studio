"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, Loader2, X, AlertCircle, Trash2, Palette, LayoutGrid, FileText, Type } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useApiQuery } from "@/hooks/useApiQuery";
import { designStandardsApi, type CreateDesignStandardInput, type UpdateDesignStandardInput } from "@/lib/designStandards";
import { meQuery } from "@/lib/account";
import { fmtDateTime } from "@/lib/format";
import { StudioApiError } from "@/lib/api";
import type { DesignStandard, DesignStandardKind, Staff } from "@/types";

const KINDS: DesignStandardKind[] = ["PALETTE", "LAYOUT", "COPY_PATTERN", "TYPOGRAPHY"];
const KIND_LABEL: Record<DesignStandardKind, string> = {
  PALETTE: "Palette",
  LAYOUT: "Layout",
  COPY_PATTERN: "Copy Pattern",
  TYPOGRAPHY: "Typography",
};
const KIND_ICON: Record<DesignStandardKind, typeof Palette> = {
  PALETTE: Palette,
  LAYOUT: LayoutGrid,
  COPY_PATTERN: FileText,
  TYPOGRAPHY: Type,
};

// Common Conddo verticals — admins can type any string, this list is just for the dropdown.
// "" / null on a standard means "applies to every vertical" (Global).
const VERTICAL_SUGGESTIONS = [
  "", // Global
  "pharmacy",
  "fashion",
  "logistics",
  "professional_services",
  "beauty",
  "retail",
  "food",
];
const verticalLabel = (v: string | null | undefined) =>
  v === null || v === undefined || v === ""
    ? "Global"
    : v.replace(/_/g, " ").replace(/(^| )./g, (m) => m.toUpperCase());

export default function DesignStandardsPage() {
  const [kindFilter, setKindFilter] = useState<DesignStandardKind | "ALL">("ALL");
  const { data, loading, error, refetch } = useApiQuery(
    () => designStandardsApi.list(kindFilter === "ALL" ? undefined : kindFilter),
    [kindFilter],
  );
  const { data: me } = useApiQuery<Staff>(meQuery);
  const isAdmin = me?.role === "ADMIN";

  const [showInactive, setShowInactive] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<DesignStandard | null>(null);
  const [verticalFilter, setVerticalFilter] = useState<string>("ALL");

  const standards = useMemo(() => {
    const all = data ?? [];
    return all.filter((s) => {
      if (!showInactive && !s.active) return false;
      if (verticalFilter === "ALL") return true;
      if (verticalFilter === "GLOBAL") return !s.vertical;
      return s.vertical === verticalFilter;
    });
  }, [data, showInactive, verticalFilter]);

  // Derive distinct verticals present in the data for the filter dropdown.
  const verticals = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((s) => { if (s.vertical) set.add(s.vertical); });
    return Array.from(set).sort();
  }, [data]);

  return (
    <StudioShell
      title="Design Standards"
      subtitle="Curated palettes, layouts, copy patterns and typography that ground AI suggestions per vertical."
      actions={
        isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover"
          >
            <Plus size={17} /> <span className="hidden sm:inline">New standard</span>
          </button>
        )
      }
    >
      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <KindTab label="All kinds" active={kindFilter === "ALL"} onClick={() => setKindFilter("ALL")} />
        {KINDS.map((k) => (
          <KindTab key={k} label={KIND_LABEL[k]} icon={KIND_ICON[k]} active={kindFilter === k} onClick={() => setKindFilter(k)} />
        ))}
        <span className="mx-1 h-5 w-px bg-neutral-border" />
        <select
          value={verticalFilter}
          onChange={(e) => setVerticalFilter(e.target.value)}
          className="h-8 rounded-md border border-neutral-strong bg-neutral-bg px-2 text-[12px] text-ink focus:border-primary focus:outline-none"
        >
          <option value="ALL">Every vertical</option>
          <option value="GLOBAL">Global only</option>
          {verticals.map((v) => <option key={v} value={v}>{verticalLabel(v)}</option>)}
        </select>
        <button
          onClick={() => setShowInactive((v) => !v)}
          className={`rounded-md border px-3 py-1 text-[12px] font-medium transition-colors ${
            showInactive ? "border-primary bg-primary-bg text-primary-light" : "border-neutral-strong text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
          }`}
        >
          {showInactive ? "Showing all" : "Show inactive"}
        </button>
      </div>

      {loading && standards.length === 0 ? (
        <LoadingState label="Loading standards…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : standards.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No standards yet"
          description={kindFilter === "ALL"
            ? "Seed the library so the AI assistant has something to ground its suggestions on. Start with a brand palette or a hero layout pattern."
            : `No active ${KIND_LABEL[kindFilter].toLowerCase()} standards. Add one to make this kind available to the AI.`}
          action={isAdmin ? (
            <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover">
              <Plus size={17} /> Add a standard
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {standards.map((s) => (
            <StandardCard
              key={s.id}
              s={s}
              isAdmin={isAdmin}
              onClick={() => isAdmin && setEditing(s)}
              onChanged={refetch}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <StandardFormModal
          mode="create"
          initial={null}
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setCreateOpen(false); refetch(); }}
        />
      )}
      {editing && (
        <StandardFormModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}
    </StudioShell>
  );
}

function KindTab({ label, icon: Icon, active, onClick }: {
  label: string; icon?: typeof Palette; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-[12px] font-medium transition-colors ${
        active ? "border-primary bg-primary-bg text-primary-light" : "border-neutral-strong text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
      }`}
    >
      {Icon && <Icon size={13} />} {label}
    </button>
  );
}

function StandardCard({ s, isAdmin, onClick, onChanged }: {
  s: DesignStandard; isAdmin: boolean; onClick: () => void; onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const Icon = KIND_ICON[s.kind];

  async function toggleActive(e: React.MouseEvent) {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      if (s.active) await designStandardsApi.remove(s.id);
      else await designStandardsApi.update(s.id, { active: true });
      onChanged();
    } catch { /* surfaced on next refetch */ }
    finally { setBusy(false); }
  }

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border border-neutral-border bg-neutral-surface p-4 transition-colors ${
        isAdmin ? "cursor-pointer hover:border-primary/50" : ""
      } ${!s.active ? "opacity-60" : ""}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-bg text-primary-light">
            <Icon size={15} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-ink">{s.name}</p>
            <p className="font-mono text-[11px] text-content-muted">{KIND_LABEL[s.kind]} · {verticalLabel(s.vertical)}</p>
          </div>
        </div>
        <button
          onClick={toggleActive}
          disabled={!isAdmin || busy}
          title={!isAdmin ? "ADMIN only" : s.active ? "Retire" : "Reactivate"}
          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.05em] transition-colors ${
            s.active ? "bg-success-bg text-success hover:bg-success/20" : "bg-neutral-surface2 text-content-muted hover:bg-neutral-surface2/60"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {busy ? "…" : s.active ? "Active" : "Retired"}
        </button>
      </div>

      {s.description && (
        <p className="mb-3 line-clamp-3 text-[12px] leading-relaxed text-content-secondary">{s.description}</p>
      )}

      {/* Palette swatches preview */}
      {s.kind === "PALETTE" && <PalettePreview content={s.content} />}

      <p className="mt-3 font-mono text-[10px] text-content-muted">Updated {fmtDateTime(s.updatedAt)}</p>
    </div>
  );
}

/** Reads hex values out of a palette's content blob and shows them as 5–8 swatches.
 *  The content shape is admin-defined — we just walk for anything that looks like #RRGGBB. */
function PalettePreview({ content }: { content: Record<string, unknown> }) {
  const swatches = useMemo(() => {
    const out: { label: string; hex: string }[] = [];
    const walk = (obj: unknown, prefix: string) => {
      if (typeof obj === "string" && /^#[0-9a-f]{6}$/i.test(obj)) {
        out.push({ label: prefix, hex: obj });
      } else if (obj && typeof obj === "object") {
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          walk(v, prefix ? `${prefix}.${k}` : k);
        }
      }
    };
    walk(content, "");
    return out.slice(0, 8);
  }, [content]);

  if (swatches.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {swatches.map((s) => (
        <span key={s.label}
          title={`${s.label} · ${s.hex}`}
          className="block h-7 w-7 rounded-md border border-neutral-border"
          style={{ background: s.hex }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create / Edit modal
// ---------------------------------------------------------------------------

function StandardFormModal({ mode, initial, onClose, onSaved }: {
  mode: "create" | "edit";
  initial: DesignStandard | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState<DesignStandardKind>(initial?.kind ?? "PALETTE");
  const [vertical, setVertical] = useState<string>(initial?.vertical ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [contentJson, setContentJson] = useState(() =>
    JSON.stringify(initial?.content ?? exampleContentFor(initial?.kind ?? "PALETTE"), null, 2),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed example content when the user changes kind on a fresh form.
  // Don't overwrite if they've already edited the JSON.
  useEffect(() => {
    if (mode !== "create") return;
    const current = safeParseJson(contentJson);
    const previousExample = JSON.stringify(exampleContentFor(initial?.kind ?? "PALETTE"));
    if (JSON.stringify(current) === previousExample || !current) {
      setContentJson(JSON.stringify(exampleContentFor(kind), null, 2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  // Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Name is required."); return; }
    const content = safeParseJson(contentJson);
    if (contentJson.trim() && !content) {
      setError("Content must be valid JSON. (Leave the field empty for a metadata-only standard.)");
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        const body: CreateDesignStandardInput = {
          kind, name: name.trim(),
          vertical: vertical.trim() || null,
          description: description.trim() || null,
          content: content ?? {},
        };
        await designStandardsApi.create(body);
      } else if (initial) {
        const body: UpdateDesignStandardInput = {
          name: name.trim(),
          vertical: vertical.trim() || null,
          description: description.trim() || null,
          content: content ?? {},
        };
        await designStandardsApi.update(initial.id, body);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const KindIcon = KIND_ICON[kind];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-border bg-neutral-surface p-6 sm:p-7">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-bg text-primary-light">
              <KindIcon size={16} />
            </span>
            <div>
              <h2 className="text-[17px] font-medium text-ink">{mode === "create" ? "New design standard" : `Edit ${initial?.name}`}</h2>
              <p className="mt-0.5 text-[13px] text-content-secondary">
                {mode === "create"
                  ? "Pick a kind, scope it to a vertical (or leave global), and describe the standard so the AI can ground on it."
                  : "Update the standard. Kind can't change once set — delete + recreate to switch kinds."}
              </p>
            </div>
          </div>
          <button onClick={() => !saving && onClose()} className="rounded-md p-1 text-content-muted hover:text-ink"><X size={18} /></button>
        </div>

        {error && (
          <p className="mb-4 flex items-center gap-2 rounded-lg border border-danger/20 bg-danger-bg px-3 py-2 text-[13px] text-danger">
            <AlertCircle size={15} /> {error}
          </p>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
            <div>
              <label className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Kind</label>
              {mode === "create" ? (
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as DesignStandardKind)}
                  className="h-11 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3 text-[13px] text-ink focus:border-primary focus:outline-none"
                >
                  {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                </select>
              ) : (
                <p className="flex h-11 items-center rounded-md border border-neutral-border bg-neutral-surface2 px-3 font-mono text-[12px] text-content-muted">{KIND_LABEL[kind]}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Vertical</label>
              <input
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
                placeholder="e.g. pharmacy — leave blank for Global"
                list="vertical-suggestions"
                className="h-11 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3.5 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
              />
              <datalist id="vertical-suggestions">
                {VERTICAL_SUGGESTIONS.filter(Boolean).map((v) => <option key={v} value={v} />)}
              </datalist>
              <p className="mt-1 text-[11px] text-content-muted">Lowercase, underscore-separated. Leave blank to apply to every vertical.</p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Clinical Trust Palette"
              className="h-11 w-full rounded-md border border-neutral-strong bg-neutral-bg px-3.5 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] uppercase tracking-[0.06em] text-content-secondary">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this standard expresses and when the AI should apply it."
              className="w-full rounded-md border border-neutral-strong bg-neutral-bg p-3 text-[14px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[12px] uppercase tracking-[0.06em] text-content-secondary">Content (JSON)</label>
              <button
                type="button"
                onClick={() => setContentJson(JSON.stringify(exampleContentFor(kind), null, 2))}
                className="text-[11px] text-primary-light hover:underline"
              >
                Reset to example
              </button>
            </div>
            <textarea
              value={contentJson}
              onChange={(e) => setContentJson(e.target.value)}
              rows={10}
              spellCheck={false}
              className="w-full rounded-md border border-neutral-strong bg-neutral-bg p-3 font-mono text-[12px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-content-muted">
              Free-form JSONB on the backend. Shape suggestion shown — the AI reads whatever you put here when grounding a {KIND_LABEL[kind].toLowerCase()} prompt.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => !saving && onClose()} className="rounded-md border border-neutral-border px-4 py-2 text-[14px] text-content-secondary hover:bg-neutral-surface2">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function safeParseJson(s: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Example `content` shapes per kind — purely a starting scaffold the admin can edit. */
function exampleContentFor(kind: DesignStandardKind): Record<string, unknown> {
  switch (kind) {
    case "PALETTE":
      return {
        primary: "#7C5CBF", primaryHover: "#6A4DAD", primaryLight: "#A07FD4", primaryBg: "#F0ECFA",
        background: "#FFFFFF", surface: "#F8F8F6",
        textPrimary: "#111111", textSecondary: "#6B6B6B",
        border: "#E5E5E3",
        notes: "WCAG-AA contrast on every text/background pair.",
      };
    case "LAYOUT":
      return {
        grid: { columns: 12, gutter: 24, container: 1280 },
        spacing: { section: 96, block: 48, item: 16 },
        breakpoints: { sm: 640, md: 768, lg: 1024 },
        notes: "Use 8-pt spacing scale; section padding doubles on lg.",
      };
    case "COPY_PATTERN":
      return {
        hero: {
          structure: "[outcome verb] + [specific value] + [audience]",
          example: "Sell more medications — trusted by 200+ Nigerian patients.",
        },
        cta: { primary: "Book consultation", secondary: "View prices" },
        avoid: ["seamless", "leverage", "innovative", "best-in-class"],
      };
    case "TYPOGRAPHY":
      return {
        fontHeading: "Inter",
        fontBody: "Inter",
        scale: { h1: 48, h2: 36, h3: 24, body: 16, small: 13 },
        weights: { regular: 400, medium: 500, bold: 600 },
        notes: "Tracking -0.02em on display sizes.",
      };
  }
}
