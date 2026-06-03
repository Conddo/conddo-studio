// Notifications — /api/jobs/notifications/* (feed + mark-read).
//
// SSE is not yet exposed by the backend (no SseEmitter / text/event-stream
// endpoint at time of writing) — the UI polls this feed instead. When the
// backend ships a stream endpoint, swap the polling in NotificationsBell /
// the page over to EventSource without changing this module's shape.
import { api } from "./api";
import type { NotificationFeed } from "@/types";

export const notificationsApi = {
  feed: (unreadOnly = false) =>
    api.get<NotificationFeed>(`/notifications${unreadOnly ? "?unread=true" : ""}`),
  markRead: (id: string) => api.patch<void>(`/notifications/${id}/read`),
  /** Bulk-mark every unread notification as read. Returns the count cleared. */
  markAllRead: () => api.patch<{ updated: number }>(`/notifications/read-all`),
};
