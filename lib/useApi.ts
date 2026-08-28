"use client";

import { useCallback, useEffect, useState } from "react";

export type State<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

export function useApi<T>(url: string | null) {
  const [state, setState] = useState<State<T>>({ status: "loading" });

  const load = useCallback(async () => {
    if (!url) return;
    setState({ status: "loading" });

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setState({ status: "success", data: await res.json() });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }, [url]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, reload: load };
}
