"use client";

import type { SharedPart } from "@/types";
import { Empty } from "./states/Empty";

export function SharedParts({
  parts,
  selectedId,
  onSelect,
}: {
  parts: SharedPart[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (parts.length === 0)
    return (
      <div className="p-3.5">
        <Empty message="No part is fitted to more than one machine. Every failure here is confined to a single asset." />
      </div>
    );

  return (
    <table className="w-full text-[13px]">
      <caption className="px-3.5 pt-2.5 pb-2 text-left text-[12.5px] leading-tight text-slate-500">
        Parts fitted to more than one machine. One bad batch stops every
        machine listed.
      </caption>
      <thead>
        <tr className="border-y border-slate-200 bg-slate-50 text-left font-mono text-[9.5px] tracking-wider text-slate-500 uppercase">
          <th scope="col" className="px-3.5 py-1.5 font-semibold">
            Part
          </th>
          <th scope="col" className="py-1.5 pr-2.5 font-semibold">
            Description
          </th>
          <th scope="col" className="py-1.5 pr-3.5 font-semibold">
            Fitted to
          </th>
        </tr>
      </thead>
      <tbody>
        {parts.map((p) => (
          <tr key={p.id} className="border-b border-slate-100 align-top">
            <td className="px-3.5 py-2 font-mono text-[11px] whitespace-nowrap">
              {p.id}
            </td>
            <td className="py-2 pr-2.5 text-[12.5px] text-slate-500">
              {p.name}
            </td>
            <td className="py-1.5 pr-3.5">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="mr-0.5 font-mono text-[11px] font-semibold text-slate-900">
                  ×{p.machineCount}
                </span>
                {p.machines.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSelect(m.id)}
                    className={`flex items-baseline gap-1.5 border px-2 py-0.5 transition ${
                      m.id === selectedId
                        ? "border-slate-900 bg-slate-100"
                        : "border-slate-200 hover:border-slate-900"
                    }`}
                  >
                    <span className="font-mono text-[10px] text-slate-500">
                      {m.id}
                    </span>
                    <span className="text-[12.5px]">{m.name}</span>
                  </button>
                ))}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
