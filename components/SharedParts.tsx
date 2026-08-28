"use client";

import { useApi } from "@/lib/useApi";
import type { SharedPart } from "@/types";
import { Loading } from "./states/Loading";
import { Empty } from "./states/Empty";
import { ErrorState } from "./states/ErrorState";

export function SharedParts() {
  const { state, reload } = useApi<SharedPart[]>("/api/shared-parts");

  if (state.status === "loading") return <Loading rows={5} />;
  if (state.status === "error")
    return <ErrorState message={state.message} onRetry={reload} />;
  if (state.data.length === 0)
    return <Empty message="No part is fitted to more than one machine." />;

  return (
    <ul className="divide-y divide-slate-100 rounded border border-slate-200">
      {state.data.map((part) => (
        <li key={part.id} className="px-4 py-3">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <span className="text-sm text-slate-800">{part.name}</span>
              <span className="ml-2 font-mono text-xs text-slate-400">
                {part.id}
              </span>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
              {part.machineCount} machines
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {part.machines.join(" · ")}
          </p>
        </li>
      ))}
    </ul>
  );
}
