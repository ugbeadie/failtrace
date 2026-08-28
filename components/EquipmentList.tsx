"use client";

import type { CriticalityRow } from "@/types";
import { ImpactBar } from "./ImpactBar";
import { severityTextClass } from "@/lib/severity";

export function EquipmentList({
  equipment,
  selectedId,
  onSelect,
}: {
  equipment: CriticalityRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  // Scale every bar against "this failure takes down every other machine" —
  // the same worst-case denominator used across the graph panel and detail view.
  const max = Math.max(equipment.length - 1, 1);

  const byLocation = equipment.reduce<Record<string, CriticalityRow[]>>(
    (acc, e) => {
      (acc[e.location] ??= []).push(e);
      return acc;
    },
    {},
  );

  return (
    <nav aria-label="Machines">
      {Object.entries(byLocation).map(([location, machines]) => (
        <div key={location}>
          <div className="sticky top-0 z-10 flex items-baseline justify-between gap-2 border-b border-slate-200 bg-white px-3.5 py-1.5">
            <span className="font-mono text-[10px] font-semibold tracking-wider text-slate-900 uppercase">
              {location}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {machines.length}
            </span>
          </div>
          <ul>
            {machines.map((m) => {
              const isSelected = m.id === selectedId;
              return (
                <li key={m.id}>
                  <button
                    onClick={() => onSelect(m.id)}
                    aria-current={isSelected ? "true" : undefined}
                    className={`flex w-full items-center gap-2.5 border-b border-slate-100 py-1.5 pr-3 pl-2.5 text-left transition ${
                      isSelected ? "bg-slate-100 shadow-[inset_3px_0_0_0_#0F172A]" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="w-14 shrink-0 font-mono text-[10.5px] text-slate-500">
                      {m.id}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-slate-900">
                      {m.name}
                    </span>
                    <span className="w-11 shrink-0">
                      <ImpactBar value={m.impact} max={max} />
                    </span>
                    <span
                      className={`w-4 shrink-0 text-right font-mono text-xs font-semibold tabular-nums ${severityTextClass(m.impact)}`}
                    >
                      {m.impact}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
