"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { notificationsApi } from "@/lib/notifications";

const POLL_MS = 30_000;

/** Header bell with unread badge. Polls the feed for an unread count (no SSE
 *  endpoint yet — see lib/notifications.ts). Quiet failure: a missing/erroring
 *  notifications service shouldn't take the header down. */
export function NotificationsBell() {
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        const r = await notificationsApi.feed();
        if (!cancelled) setUnread(r.data.unread ?? 0);
      } catch {
        /* keep last known count; don't surface backend errors in the chrome */
      }
    };

    tick();
    timer = setInterval(tick, POLL_MS);
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
      title="Notifications"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
    >
      <Bell size={18} />
      {unread > 0 && (
        <span className="absolute right-1 top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 font-mono text-[10px] font-medium text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
