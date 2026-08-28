"use client";

import type { EquipmentDetail as Detail, SharedPart } from "@/types";
import { ImpactBar } from "./ImpactBar";
import { severityTextClass } from "@/lib/severity";
import { Empty } from "./states/Empty";

export function EquipmentDetail({
  detail,
  sharedParts,
  maxImpact,
  onSelect,
}: {
  detail: Detail;
  sharedParts: SharedPart[];
  maxImpact: number;
  onSelect: (id: string) => void;
}) {
  const { equipment, downstream, parts, technicians } = detail;
  const impact = downstream.length;
  const sharedCountByPart = new Map(
    sharedParts.map((p) => [p.id, p.machineCount]),
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-slate-200 px-3.5 py-4">
        <h3 className="font-archivo text-xl leading-tight font-semibold tracking-tight text-slate-900">
          {equipment.name}
        </h3>
        <p className="mt-0.5 mb-3.5 font-mono text-[10.5px] tracking-wide text-slate-500 uppercase">
          {equipment.id} · {equipment.location}
        </p>

        <div className="flex items-end gap-3">
          <span
            className={`font-mono text-5xl leading-none font-semibold tabular-nums ${severityTextClass(impact)}`}
          >
            {impact}
          </span>
          <span className="max-w-[16ch] pb-1 text-[12.5px] text-slate-900">
            machine{impact === 1 ? "" : "s"} stop{impact === 1 ? "s" : ""} with
            it
          </span>
        </div>

        <div className="mt-2.5">
          <ImpactBar value={impact} max={Math.max(maxImpact, 1)} size="lg" />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] text-slate-400">
          <span>0</span>
          <span>{maxImpact} = whole plant</span>
        </div>
      </div>

      <div>
        <h4 className="flex items-baseline justify-between gap-2 border-b border-slate-200 px-3.5 py-1.5 font-mono text-[9.5px] font-semibold tracking-wider text-slate-900 uppercase">
          <span>Stops downstream</span>
          <span className="text-slate-400">{downstream.length}</span>
        </h4>
        {downstream.length === 0 ? (
          <div className="p-3.5">
            <Empty message="Nothing depends on this machine. A failure here is contained — no downstream stops." />
          </div>
        ) : (
          <ul className="border-b border-slate-200">
            {downstream.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => onSelect(d.id)}
                  className="grid w-full grid-cols-[26px_1fr_auto] items-center gap-2 border-b border-slate-100 px-3.5 py-1.5 text-left transition hover:bg-slate-50"
                >
                  <span className="text-right font-mono text-[11px] font-medium text-slate-900">
                    H{d.hops}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="h-px shrink-0 bg-slate-300"
                      style={{ width: `${d.hops * 7}px` }}
                    />
                    <span className="shrink-0 font-mono text-[10.5px] text-slate-500">
                      {d.id}
                    </span>
                    <span className="truncate text-[13px] text-slate-900">
                      {d.name}
                    </span>
                  </span>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F97316]" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <h4 className="flex items-baseline justify-between gap-2 border-b border-slate-200 px-3.5 py-1.5 font-mono text-[9.5px] font-semibold tracking-wider text-slate-900 uppercase">
          <span>Parts fitted</span>
          <span className="text-slate-400">{parts.length}</span>
        </h4>
        {parts.length === 0 ? (
          <div className="p-3.5">
            <Empty message="No parts recorded for this machine." />
          </div>
        ) : (
          <ul className="border-b border-slate-200">
            {parts.map((p) => {
              const count = sharedCountByPart.get(p.id);
              return (
                <li
                  key={p.id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-slate-100 px-3.5 py-1.5"
                >
                  <span className="font-mono text-[10.5px] text-slate-500">
                    {p.id}
                  </span>
                  <span className="truncate text-[13px] text-slate-900">
                    {p.name}
                  </span>
                  <span
                    className={`border font-mono text-[10px] tracking-wide ${
                      count
                        ? "border-slate-200 px-1.5 py-0.5 text-slate-900"
                        : "border-transparent text-slate-400"
                    }`}
                  >
                    {count ? `×${count}` : "–"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <h4 className="flex items-baseline justify-between gap-2 border-b border-slate-200 px-3.5 py-1.5 font-mono text-[9.5px] font-semibold tracking-wider text-slate-900 uppercase">
          <span>Certified to fix it</span>
          <span className="text-slate-400">{technicians.length}</span>
        </h4>
        {technicians.length === 0 ? (
          <div className="p-3.5">
            <Empty message="Nobody is certified for this machine." />
          </div>
        ) : (
          <ul>
            {technicians.map((t) => (
              <li
                key={t.id}
                className="grid grid-cols-[auto_1fr] items-baseline gap-2 border-b border-slate-100 px-3.5 py-1.5"
              >
                <span className="font-mono text-[10.5px] text-slate-500">
                  {t.id}
                </span>
                <span className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[13px] font-medium text-slate-900">
                    {t.name}
                  </span>
                  <span className="font-mono text-[9.5px] tracking-wide text-slate-500 uppercase">
                    {t.trade}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
