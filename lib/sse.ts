// Studio job-board Server-Sent Events — singleton stream that fans out to
// every React subscriber. Backend contract: BACKEND_STATUS.md §2 (event names
// + payload shapes). Browsers' built-in EventSource can't set Authorization
// headers, so we use Microsoft's fetch-event-source polyfill to pass the
// STUDIO_JWT as a Bearer token.
//
// Why one connection per tab:
// - Browsers cap concurrent HTTP/1.1 connections at 6 per origin; an SSE
//   stream burns one until it disconnects.
// - The server-side SseService is "one emitter per (staffId, tab)" — fanning
//   out from a single client connection matches that semantic.
// - Reconnect logic is harder to get right per-component; centralising it
//   here means the rest of the app just calls `on(event, handler)`.

import { fetchEventSource } from "@microsoft/fetch-event-source";
import { getAccessToken } from "./auth";

const ROOT = process.env.NEXT_PUBLIC_STUDIO_API_URL ?? "";
const URL = `${ROOT}/api/jobs/events`;

// Event names mirror the backend's JobLifecycleEvent constants exactly.
// Adding a new event? Add it here AND give it a payload type below.
export type StudioEventName =
  | "hello"
  | "heartbeat"
  | "job.created"
  | "job.claimed"
  | "job.started"
  | "job.submitted"
  | "job.approved"
  | "job.revision_requested"
  | "job.reassigned"
  | "job.escalated"
  | "job.sla_extended"
  | "sla.tick"
  | "notification.created";

/** Payload shapes per BACKEND_STATUS.md §2. Use `unknown` defensively where
 *  the field is optional or only present on certain transitions. */
export type StudioEventPayload = {
  "hello": { staffId: string; role: string; at: string };
  "heartbeat": { at: string };
  "job.created": { jobId: string; jobNumber: string; jobTypeId: string; status: string; slaTone: string };
  "job.claimed": { jobId: string; jobNumber: string; jobTypeId: string; staffId: string };
  "job.started": { jobId: string; jobNumber: string; staffId: string };
  "job.submitted": { jobId: string; jobNumber: string; jobTypeId: string; staffId: string };
  "job.approved": { jobId: string; jobNumber: string; assignedTo: string | null };
  "job.revision_requested": { jobId: string; jobNumber: string; assignedTo: string | null; feedback: string };
  "job.reassigned": { jobId: string; jobNumber: string; newStaffId: string };
  "job.escalated": { jobId: string; jobNumber: string; reason: string };
  "job.sla_extended": { jobId: string; jobNumber: string; addedHours: number; assignedTo: string | null };
  "sla.tick": Array<{ jobId: string; jobNumber: string; tone: "GREEN" | "AMBER" | "RED"; hoursToDeadline: number; assignedTo: string | null }>;
  "notification.created": { staffId: string; notificationId: string; type: string; title: string; message: string; jobId: string | null; jobNumber: string | null };
};

type EventListener<E extends StudioEventName> = (data: StudioEventPayload[E]) => void;

/** Thrown by fetchEventSource's onopen to stop retry loops we know won't recover. */
class FatalSseError extends Error {}

class StudioEventStream {
  private ctrl: AbortController | null = null;
  private listeners = new Map<StudioEventName, Set<EventListener<StudioEventName>>>();
  /** True between connect() and disconnect() — even while reconnecting. */
  private wantsConnection = false;

  /** Open the stream (idempotent). Safe to call from many places. */
  connect() {
    if (this.wantsConnection) return;
    if (!ROOT) return; // env not configured — no-op, screens still work
    this.wantsConnection = true;
    this.run();
  }

  /** Close the stream + clear listeners. Call this on logout. */
  disconnect() {
    this.wantsConnection = false;
    this.ctrl?.abort();
    this.ctrl = null;
    this.listeners.clear();
  }

  /** Subscribe to one event. Returns a disposer; call it on component unmount. */
  on<E extends StudioEventName>(event: E, handler: EventListener<E>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as EventListener<StudioEventName>);
    return () => {
      this.listeners.get(event)?.delete(handler as EventListener<StudioEventName>);
    };
  }

  private async run() {
    while (this.wantsConnection) {
      this.ctrl = new AbortController();
      const token = getAccessToken();
      if (!token) {
        // No JWT yet (still logging in). Wait a beat and retry.
        await sleep(1000);
        continue;
      }
      try {
        await fetchEventSource(URL, {
          headers: { Authorization: `Bearer ${token}` },
          signal: this.ctrl.signal,
          // openWhenHidden lets the stream survive when the tab is in the
          // background (browsers throttle non-visible tabs); we still want
          // job.created / notification.created to land.
          openWhenHidden: true,
          onopen: async (res) => {
            if (res.ok && res.headers.get("content-type")?.includes("text/event-stream")) return;
            // 401 = token expired; fall through to outer catch so the next
            // run() iteration re-reads localStorage (which the api client
            // will have refreshed via /auth/refresh on its next call).
            if (res.status === 401) throw new Error("sse_unauthorized");
            // Any other non-stream response is fatal — don't burn retries.
            throw new FatalSseError(`SSE open failed: ${res.status}`);
          },
          onmessage: (ev) => {
            const name = ev.event as StudioEventName;
            if (!name) return; // anonymous "message" frames (we don't send any)
            let data: unknown;
            try { data = ev.data ? JSON.parse(ev.data) : null; } catch { return; }
            this.dispatch(name, data);
          },
          onerror: (err) => {
            // Return a number to wait that many ms before reconnect.
            // Throwing here is fatal (stops retry); we throw only for
            // FatalSseError so unknown errors get a backoff retry.
            if (err instanceof FatalSseError) throw err;
            return 3000;
          },
          onclose: () => {
            // Server closed the stream; fetchEventSource will not auto-reconnect
            // on close (only on error), so we throw to break out and re-loop.
            throw new Error("sse_closed");
          },
        });
      } catch (err) {
        if (err instanceof FatalSseError) {
          // Stop the loop; recoverable by an explicit disconnect/connect cycle.
          this.wantsConnection = false;
          return;
        }
        // sse_closed / sse_unauthorized / network: backoff and retry.
        await sleep(2000);
      }
    }
  }

  private dispatch(event: StudioEventName, data: unknown) {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;
    // Copy to array so handlers that unsubscribe themselves don't mutate the
    // set we're iterating.
    for (const h of Array.from(set)) {
      try { h(data as StudioEventPayload[StudioEventName]); }
      catch (e) { /* don't let one bad handler break the stream */ console.error("SSE handler error", event, e); }
    }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** App-wide singleton. Connect from StudioShell on mount, disconnect on logout. */
export const studioEvents = new StudioEventStream();
