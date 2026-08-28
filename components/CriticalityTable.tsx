"use client";

import { Fragment } from "react";
import { useApi } from "@/lib/useApi";
import type { CriticalityRow } from "@/types";
import { ImpactBar } from "./ImpactBar";
import { severityTextClass } from "@/lib/severity";
import { Loading } from "./states/Loading";
import { Empty } from "./states/Empty";
import { ErrorState } from "./states/ErrorState";

export function CriticalityTable({
  onSelect,
  selectedId,
}: {
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  const { state, reload } = useApi<CriticalityRow[]>("/api/criticality");

  if (state.status === "loading") return <Loading rows={6} />;
  if (state.status === "error")
    return <ErrorState message={state.message} onRetry={reload} />;
  if (state.data.length === 0)
    return <Empty message="No equipment loaded. Run the seed script." />;

  const rows = state.data;
  const max = Math.max(rows.length - 1, 1);
  const total = rows.reduce((s, r) => s + r.impact, 0);
  const top2 = (rows[0]?.impact ?? 0) + (rows[1]?.impact ?? 0);
  const rank3Impact = rows[2]?.impact;

  return (
    <table className="w-full text-[13px]">
      <caption className="px-3.5 pt-2.5 pb-2 text-left text-[12.5px] leading-tight text-slate-500">
        All {rows.length} machines ranked by how many others stop when they
        fail.
      </caption>
      <thead>
        <tr className="border-y border-slate-200 bg-slate-50 text-left font-mono text-[9.5px] tracking-wider text-slate-500 uppercase">
          <th scope="col" className="px-3.5 py-1.5 text-right font-semibold">
            #
          </th>
          <th scope="col" className="py-1.5 pr-2.5 font-semibold">
            Machine
          </th>
          <th scope="col" className="py-1.5 pr-2.5 font-semibold">
            Location
          </th>
          <th scope="col" className="py-1.5 pr-3.5 font-semibold">
            Machines stopped
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <Fragment key={row.id}>
            <tr
              onClick={() => onSelect(row.id)}
              aria-current={row.id === selectedId ? "true" : undefined}
              className={`cursor-pointer border-b border-slate-100 transition ${
                row.id === selectedId ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
            >
              <td className="px-3.5 py-1 text-right font-mono text-[11px] text-slate-400">
                {String(i + 1).padStart(2, "0")}
              </td>
              <td className="py-1 pr-2.5">
                <span className="font-mono text-[11px] text-slate-900">
                  {row.id}
                </span>
                <span className="ml-2 text-slate-800">{row.name}</span>
              </td>
              <td className="py-1 pr-2.5 whitespace-nowrap text-slate-500">
                {row.location}
              </td>
              <td className="py-1 pr-3.5">
                <span className="flex items-center gap-2">
                  <span className="flex-1">
                    <ImpactBar value={row.impact} max={max} />
                  </span>
                  <span
                    className={`w-5 shrink-0 text-right font-mono text-xs font-semibold tabular-nums ${severityTextClass(row.impact)}`}
                  >
                    {row.impact}
                  </span>
                </span>
              </td>
            </tr>
            {i === 1 && total > 0 && (
              <tr key="cliff">
                <td colSpan={4} className="p-0">
                  <div className="flex items-center gap-2.5 border-t-2 border-b border-t-slate-900 border-b-slate-200 bg-slate-50 px-3.5 py-1.5">
                    <span className="font-mono text-[9.5px] font-semibold tracking-wider text-slate-900 uppercase">
                      The cliff
                    </span>
                    <span className="text-xs text-slate-600">
                      Ranks 1–2 carry {top2} of {total} downstream stops (
                      {Math.round((top2 / total) * 100)}%){rank3Impact != null
                        ? `. Below this line, no machine takes more than ${rank3Impact} with it.`
                        : "."}
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
