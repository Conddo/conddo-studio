// Notifications — /api/jobs/notifications/* (feed + mark-read).
//
// Real-time updates flow over the SSE stream (lib/sse.ts → `notification.created`
// event). This module just owns the HTTP read/mutate side: hydrate, mark one,
// mark all. NotificationsBell and the notifications page hydrate once via
// feed() and then track changes via useStudioEvent.
import { api } from "./api";
import type { NotificationFeed } from "@/types";

export const notificationsApi = {
  feed: (unreadOnly = false) =>
    api.get<NotificationFeed>(`/notifications${unreadOnly ? "?unread=true" : ""}`),
  markRead: (id: string) => api.patch<void>(`/notifications/${id}/read`),
  /** Bulk-mark every unread notification as read. Returns the count cleared. */
  markAllRead: () => api.patch<{ updated: number }>(`/notifications/read-all`),
};
