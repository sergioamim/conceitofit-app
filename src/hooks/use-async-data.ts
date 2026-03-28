"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface AsyncDataState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

interface UseAsyncDataReturn<T> extends AsyncDataState<T> {
  /** Re-run the fetcher with the same args as the last call */
  refetch: () => void;
  /** Manually run the fetcher with new args */
  run: (...args: unknown[]) => Promise<T | undefined>;
  /** Reset to initial state */
  reset: () => void;
}

/**
 * Generic hook for async data fetching with loading/error states.
 *
 * @param fetcher  Async function that returns data
 * @param options  Configuration options
 * @param options.initialData  Initial value for data (defaults to `null`)
 * @param options.immediate  Whether to run the fetcher on mount (default: true)
 */
export function useAsyncData<T = unknown>(
  fetcher: (...args: unknown[]) => Promise<T>,
  options: {
    initialData?: T;
    immediate?: boolean;
  } = {},
): UseAsyncDataReturn<T> {
  const { initialData = null as T, immediate = true } = options;

  const [state, setState] = useState<AsyncDataState<T>>({
    data: initialData,
    loading: immediate,
    error: null,
  });

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const lastArgsRef = useRef<unknown[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async (...args: unknown[]): Promise<T | undefined> => {
    lastArgsRef.current = args;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await fetcherRef.current(...args);
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null });
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        const message =
          err instanceof Error ? err.message : "Erro inesperado";
        setState((prev) => ({ ...prev, loading: false, error: message }));
      }
      return undefined;
    }
  }, []);

  const refetch = useCallback(() => {
    void run(...lastArgsRef.current);
  }, [run]);

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
  }, [initialData]);

  useEffect(() => {
    if (immediate) {
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    run,
    refetch,
    reset,
  };
}
