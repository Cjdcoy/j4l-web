import { useEffect, useState } from "react";
import type { LoadState } from "./types";

export function usePolling<T>(initialData: T, loader: (signal: AbortSignal) => Promise<T>, intervalMS: number) {
  const [state, setState] = useState<LoadState<T>>({
    data: initialData,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let disposed = false;
    let timeoutID: number | undefined;
    let controller: AbortController | null = null;

    async function load() {
      controller?.abort();
      controller = new AbortController();

      try {
        const data = await loader(controller.signal);
        if (!disposed) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (!disposed && !(error instanceof DOMException && error.name === "AbortError")) {
          setState((current) => ({
            ...current,
            loading: false,
            error: error instanceof Error ? error.message : "Request failed",
          }));
        }
      } finally {
        if (!disposed) {
          timeoutID = window.setTimeout(load, intervalMS);
        }
      }
    }

    load();

    return () => {
      disposed = true;
      controller?.abort();
      if (timeoutID !== undefined) {
        window.clearTimeout(timeoutID);
      }
    };
  }, [intervalMS, loader]);

  return state;
}
