"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import type { Equipment } from "@/types";
import { EquipmentList } from "@/components/EquipmentList";
import { EquipmentDetail } from "@/components/EquipmentDetail";
import { Loading } from "@/components/states/Loading";
import { ErrorState } from "@/components/states/ErrorState";

export default function Home() {
  const { state, reload } = useApi<Equipment[]>("/api/equipment");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
          {state.status === "loading" && <Loading rows={6} />}
          {state.status === "error" && (
            <ErrorState message={state.message} onRetry={reload} />
          )}
          {state.status === "success" && (
            <EquipmentList
              equipment={state.data}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </aside>

        <section>
          {selectedId ? (
            <EquipmentDetail key={selectedId} id={selectedId} />
          ) : (
            <p className="pt-2 text-slate-500">
              Select a machine to see what stops if it fails.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
