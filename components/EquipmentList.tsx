"use client";

import type { Equipment } from "@/types";

export function EquipmentList({
  equipment,
  selectedId,
  onSelect,
}: {
  equipment: Equipment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const byLocation = equipment.reduce<Record<string, Equipment[]>>((acc, e) => {
    (acc[e.location] ??= []).push(e);
    return acc;
  }, {});

  return (
    <nav aria-label="Equipment">
      {Object.entries(byLocation).map(([location, machines]) => (
        <div key={location} className="mb-5">
          <h3 className="mb-1.5 px-3 text-xs font-medium uppercase tracking-wider text-slate-400">
            {location}
          </h3>
          <ul>
            {machines.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => onSelect(m.id)}
                  aria-current={m.id === selectedId ? "true" : undefined}
                  className={`w-full rounded px-3 py-2 text-left text-sm transition ${
                    m.id === selectedId
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="block">{m.name}</span>
                  <span
                    className={`block font-mono text-xs ${
                      m.id === selectedId ? "text-slate-400" : "text-slate-400"
                    }`}
                  >
                    {m.id}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
