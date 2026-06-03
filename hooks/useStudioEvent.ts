"use client";

import { useEffect, useRef } from "react";
import { studioEvents, type StudioEventName, type StudioEventPayload } from "@/lib/sse";

/** Subscribe a component to one Studio event. The handler is wrapped in a ref
 *  so callers don't need to memoise it — re-renders won't churn subscriptions.
 *  The disposer auto-fires on unmount. */
export function useStudioEvent<E extends StudioEventName>(
  event: E,
  handler: (data: StudioEventPayload[E]) => void,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const dispose = studioEvents.on(event, (data) => handlerRef.current(data));
    return dispose;
  }, [event]);
}
