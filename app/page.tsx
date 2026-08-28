"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import type { Equipment, EquipmentDetail as Detail } from "@/types";
import { EquipmentList } from "@/components/EquipmentList";
import { EquipmentDetail } from "@/components/EquipmentDetail";
import { GraphPanel } from "@/components/GraphPanel";
import { CriticalityTable } from "@/components/CriticalityTable";
import { SharedParts } from "@/components/SharedParts";
import { Loading } from "@/components/states/Loading";
import { ErrorState } from "@/components/states/ErrorState";

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const equipmentApi = useApi<Equipment[]>("/api/equipment");
  const feedsApi = useApi<[string, string][]>("/api/feeds");
  const detailApi = useApi<Detail>(
    selectedId ? `/api/equipment/${selectedId}` : null,
  );

  const equipment =
    equipmentApi.state.status === "success" ? equipmentApi.state.data : [];
  const feeds = feedsApi.state.status === "success" ? feedsApi.state.data : [];
  const detail =
    detailApi.state.status === "success" ? detailApi.state.data : null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Failtrace
        </h1>
        <p className="mt-1 text-slate-600">
          Trace how a single equipment failure spreads through a plant.
        </p>
      </header>

      <div className="grid gap-10 md:grid-cols-[260px_1fr]">
        <aside>
          {equipmentApi.state.status === "loading" && <Loading rows={6} />}
          {equipmentApi.state.status === "error" && (
            <ErrorState
              message={equipmentApi.state.message}
              onRetry={equipmentApi.reload}
            />
          )}
          {equipmentApi.state.status === "success" && (
            <EquipmentList
              equipment={equipment}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </aside>

        <section className="space-y-8">
          {equipment.length > 0 && feeds.length > 0 && (
            <GraphPanel
              equipment={equipment}
              feeds={feeds}
              selectedId={selectedId}
              downstream={detail?.downstream ?? []}
              onSelect={setSelectedId}
            />
          )}

          {!selectedId && (
            <p className="text-slate-500">
              Select a machine to see what stops if it fails.
            </p>
          )}

          {selectedId && detailApi.state.status === "loading" && (
            <Loading rows={5} />
          )}

          {selectedId && detailApi.state.status === "error" && (
            <ErrorState
              message={detailApi.state.message}
              onRetry={detailApi.reload}
            />
          )}

          {selectedId && detail && <EquipmentDetail detail={detail} />}
        </section>
      </div>

      <section className="mt-14 border-t border-slate-200 pt-10">
        <h2 className="text-lg font-medium text-slate-900">
          Criticality ranking
        </h2>
        <p className="mb-5 mt-1 text-sm text-slate-600">
          Every machine scored by how many others stop if it fails. Highest
          first.
        </p>
        <CriticalityTable onSelect={setSelectedId} />
      </section>

      <section className="mt-14 border-t border-slate-200 pt-10">
        <h2 className="text-lg font-medium text-slate-900">Shared parts</h2>
        <p className="mb-5 mt-1 text-sm text-slate-600">
          Parts fitted to more than one machine. One failed part can stop
          several machines at once, so these are the ones worth stocking.
        </p>
        <SharedParts />
      </section>
    </main>
  );
}
