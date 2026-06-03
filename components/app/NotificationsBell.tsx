"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { notificationsApi } from "@/lib/notifications";
import { useStudioEvent } from "@/hooks/useStudioEvent";

/** Header bell with unread badge. Hydrates the count once from /notifications,
 *  then keeps it in sync via the `notification.created` SSE event — no
 *  polling. Quiet failure: a missing/erroring backend doesn't break the
 *  header chrome. */
export function NotificationsBell() {
  const [unread, setUnread] = useState<number>(0);

  // One-shot hydrate of the initial unread count. After that the count is
  // driven by SSE (or by the notifications page itself when the user reads).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await notificationsApi.feed();
        if (!cancelled) setUnread(r.data.unread ?? 0);
      } catch { /* keep last known count */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Live increment when the backend pushes a new notification.
  useStudioEvent("notification.created", () => {
    setUnread((n) => n + 1);
  });

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
