"use client";

import { useApi } from "@/lib/useApi";
import type { EquipmentDetail as Detail } from "@/types";
import { Loading } from "./states/Loading";
import { Empty } from "./states/Empty";
import { ErrorState } from "./states/ErrorState";

export function EquipmentDetail({ id }: { id: string }) {
  const { state, reload } = useApi<Detail>(`/api/equipment/${id}`);

  if (state.status === "loading") return <Loading rows={5} />;
  if (state.status === "error")
    return <ErrorState message={state.message} onRetry={reload} />;

  const { equipment, downstream, parts, technicians } = state.data;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">
          {equipment.name}
        </h2>
        <p className="mt-1 font-mono text-sm text-slate-500">
          {equipment.id} · {equipment.location}
        </p>
      </header>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-medium text-slate-900">If this fails</h3>
          <span className="text-sm text-slate-500">
            {downstream.length} machine{downstream.length === 1 ? "" : "s"} stop
            {downstream.length === 1 ? "s" : ""}
          </span>
        </div>

        {downstream.length === 0 ? (
          <Empty message="Nothing depends on this machine. Failure here stops nothing else." />
        ) : (
          <ul className="divide-y divide-slate-100 rounded border border-slate-200">
            {downstream.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between px-3 py-2"
              >
                <span className="text-sm text-slate-800">{d.name}</span>
                <span className="font-mono text-xs text-slate-400">
                  {d.hops} hop{d.hops === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-8 sm:grid-cols-2">
        <section>
          <h3 className="mb-3 font-medium text-slate-900">Parts</h3>
          {parts.length === 0 ? (
            <Empty message="No parts recorded." />
          ) : (
            <ul className="space-y-1">
              {parts.map((p) => (
                <li key={p.id} className="text-sm text-slate-700">
                  {p.name}{" "}
                  <span className="font-mono text-xs text-slate-400">
                    {p.id}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-3 font-medium text-slate-900">
            Certified technicians
          </h3>
          {technicians.length === 0 ? (
            <Empty message="Nobody is certified for this machine." />
          ) : (
            <ul className="space-y-1">
              {technicians.map((t) => (
                <li key={t.id} className="text-sm text-slate-700">
                  {t.name}{" "}
                  <span className="text-xs text-slate-400">{t.trade}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
