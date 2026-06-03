"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2, MailOpen } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { notificationsApi } from "@/lib/notifications";
import { StudioApiError, type Result } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import type { NotificationFeed, StudioNotification } from "@/types";

// Lightweight type label — backend `type` is an enum string like JOB_ASSIGNED.
const typeLabel = (t: string) =>
  t.replace(/_/g, " ").toLowerCase().replace(/(^| )./g, (m) => m.toUpperCase());

const POLL_MS = 30_000;

export default function NotificationsPage() {
  const [feed, setFeed] = useState<NotificationFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const r: Result<NotificationFeed> = await notificationsApi.feed(unreadOnly);
      setFeed(r.data);
    } catch (e) {
      setError(e instanceof StudioApiError ? e : e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [unreadOnly]);

  // Initial + when toggle changes.
  useEffect(() => { load(); }, [load]);

  // Silent poll while the tab is open (no SSE yet — see lib/notifications.ts).
  useEffect(() => {
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      load(true);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  async function markRead(n: StudioNotification) {
    if (n.read || busyId) return;
    setBusyId(n.id);
    // Optimistic: flip locally, then call. On error, reload to resync.
    setFeed((prev) => prev && {
      items: prev.items.map((x) => x.id === n.id ? { ...x, read: true } : x),
      unread: Math.max(0, prev.unread - 1),
    });
    try { await notificationsApi.markRead(n.id); }
    catch { await load(true); }
    finally { setBusyId(null); }
  }

  async function markAllRead() {
    if (!feed || feed.unread === 0 || busyId === "all") return;
    setBusyId("all");
    // Optimistic: flip every unread, then call. Resync from the server on error.
    setFeed((prev) => prev && {
      items: prev.items.map((x) => ({ ...x, read: true })),
      unread: 0,
    });
    try { await notificationsApi.markAllRead(); }
    catch { await load(true); }
    finally { setBusyId(null); }
  }

  const items = feed?.items ?? [];

  return (
    <StudioShell
      title="Notifications"
      subtitle={feed ? `${feed.unread} unread` : "Your activity feed."}
      actions={
        <>
          {feed && feed.unread > 0 && (
            <button
              onClick={markAllRead}
              disabled={busyId === "all"}
              className="inline-flex items-center gap-2 rounded-md border border-neutral-strong px-3 py-1.5 text-[13px] font-medium text-content-secondary transition-colors hover:bg-neutral-surface2 hover:text-ink disabled:opacity-50"
            >
              {busyId === "all" ? <Loader2 size={15} className="animate-spin" /> : <MailOpen size={15} />} Mark all read
            </button>
          )}
          <button
            onClick={() => setUnreadOnly((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors ${
              unreadOnly ? "border-primary bg-primary-bg text-primary-light" : "border-neutral-strong text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
            }`}
          >
            <CheckCheck size={15} /> {unreadOnly ? "Showing unread" : "Show unread only"}
          </button>
        </>
      }
    >
      {loading && !feed ? (
        <LoadingState label="Loading notifications…" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => load()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={unreadOnly ? "No unread notifications" : "Nothing here yet"}
          description={unreadOnly ? "You're all caught up." : "You'll see job assignments, QA outcomes, and escalations here."}
        />
      ) : (
        <ul className="overflow-hidden rounded-xl border border-neutral-border bg-neutral-surface">
          {items.map((n) => (
            <li key={n.id} className={`flex items-start gap-3 border-b border-neutral-border px-4 py-3 last:border-b-0 ${n.read ? "" : "bg-primary-bg/30"}`}>
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-content-muted/40" : "bg-primary"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2">
                  <p className="text-[14px] font-medium text-ink">{n.title}</p>
                  <span className="rounded-md bg-neutral-surface2 px-2 py-0.5 text-[11px] text-content-secondary">{typeLabel(n.type)}</span>
                </div>
                {n.message && <p className="mt-0.5 text-[13px] text-content-secondary">{n.message}</p>}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[12px] text-content-muted">
                  <span className="font-mono">{fmtDateTime(n.at)}</span>
                  {n.jobId && (
                    <Link href={`/jobs/${n.jobId}`} className="text-primary-light hover:underline">
                      Open job →
                    </Link>
                  )}
                </div>
              </div>
              {!n.read && (
                <button
                  onClick={() => markRead(n)}
                  disabled={busyId === n.id}
                  className="shrink-0 rounded-md border border-neutral-border px-2 py-1 text-[12px] text-content-secondary hover:bg-neutral-surface2 disabled:opacity-50"
                >
                  {busyId === n.id ? <Loader2 size={13} className="animate-spin" /> : "Mark read"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </StudioShell>
  );
}
