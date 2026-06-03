"use client";

import { useCallback, useEffect, useState } from "react";
import type { Result } from "@/lib/api";

/** Run a Studio API call with loading/error/refetch state. Mirrors the pattern
 *  used in conddo-app. `deps` re-run the fetcher when they change. */
export function useApiQuery<T>(fetcher: () => Promise<Result<T>>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<Result<T>["meta"]>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetcher()
      .then((r) => {
        if (!active) return;
        setData(r.data);
        setMeta(r.meta);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);

  const refetch = useCallback(() => {
    run();
  }, [run]);

  return { data, meta, loading, error, refetch };
}
