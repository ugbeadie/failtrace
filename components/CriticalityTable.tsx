"use client";

import { useApi } from "@/lib/useApi";
import type { CriticalityRow } from "@/types";
import { Loading } from "./states/Loading";
import { Empty } from "./states/Empty";
import { ErrorState } from "./states/ErrorState";

export function CriticalityTable({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  const { state, reload } = useApi<CriticalityRow[]>("/api/criticality");

  if (state.status === "loading") return <Loading rows={6} />;
  if (state.status === "error")
    return <ErrorState message={state.message} onRetry={reload} />;
  if (state.data.length === 0)
    return <Empty message="No equipment loaded. Run the seed script." />;

  const max = Math.max(...state.data.map((r) => r.impact), 1);

  return (
    <table className="w-full text-sm">
      <caption className="sr-only">
        Equipment ranked by how many other machines stop if it fails
      </caption>
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400">
          <th scope="col" className="pb-2 font-medium">
            Machine
          </th>
          <th scope="col" className="pb-2 font-medium">
            Location
          </th>
          <th scope="col" className="pb-2 text-right font-medium">
            Stops
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {state.data.map((row) => (
          <tr
            key={row.id}
            onClick={() => onSelect(row.id)}
            className="cursor-pointer hover:bg-slate-50"
          >
            <td className="py-2.5">
              <span className="text-slate-800">{row.name}</span>
              <span className="ml-2 font-mono text-xs text-slate-400">
                {row.id}
              </span>
            </td>
            <td className="py-2.5 text-slate-500">{row.location}</td>
            <td className="py-2.5">
              <div className="flex items-center justify-end gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-800"
                    style={{ width: `${(row.impact / max) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right font-mono text-slate-700">
                  {row.impact}
                </span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
