"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import type {
  CriticalityRow,
  EquipmentDetail as Detail,
  SharedPart,
} from "@/types";
import { EquipmentList } from "@/components/EquipmentList";
import { EquipmentDetail } from "@/components/EquipmentDetail";
import { GraphPanel } from "@/components/GraphPanel";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { Loading } from "@/components/states/Loading";
import { ErrorState } from "@/components/states/ErrorState";

const LEGEND = [
  { label: "0", className: "bg-slate-400" },
  { label: "1–4", className: "bg-amber-400" },
  { label: "5–9", className: "bg-orange-500" },
  { label: "10+", className: "bg-red-600" },
] as const;

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const equipmentApi = useApi<CriticalityRow[]>("/api/equipment");
  const feedsApi = useApi<[string, string][]>("/api/feeds");
  const detailApi = useApi<Detail>(
    selectedId ? `/api/equipment/${selectedId}` : null,
  );
  const sharedPartsApi = useApi<SharedPart[]>("/api/shared-parts");

  const equipment =
    equipmentApi.state.status === "success" ? equipmentApi.state.data : [];
  const feeds = feedsApi.state.status === "success" ? feedsApi.state.data : [];
  const detail =
    detailApi.state.status === "success" ? detailApi.state.data : null;
  const sharedParts =
    sharedPartsApi.state.status === "success" ? sharedPartsApi.state.data : [];
  const maxImpact = Math.max(equipment.length - 1, 1);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <header className="flex flex-wrap items-center gap-6 border-b border-slate-200 px-4">
        <div className="flex items-baseline gap-3.5 py-2.5">
          <h1 className="font-archivo text-xl font-bold tracking-tight text-slate-900 uppercase">
            Failtrace
          </h1>
          <p className="max-w-[50ch] text-[13px] text-slate-500">
            Trace how a single equipment failure spreads through a plant.
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 py-2">
          <span className="font-mono text-[9px] tracking-wider text-slate-500 uppercase">
            Impact
          </span>
          <div className="flex items-end gap-0.5">
            {LEGEND.map((l) => (
              <div key={l.label} className="flex flex-col items-center gap-0.5">
                <div className={`h-1.5 w-6 ${l.className}`} />
                <span className="font-mono text-[9px] text-slate-500">
                  {l.label}
                </span>
              </div>
            ))}
          </div>
          <span className="mx-1.5 h-6 w-px bg-slate-200" />
          <span className="font-mono text-[10px] tracking-wide text-slate-500">
            {equipment.length} machines · {feeds.length} links
          </span>
        </div>
      </header>

      <div className="flex flex-1 flex-wrap overflow-hidden md:flex-nowrap">
        <aside className="min-h-75 w-full min-w-57 overflow-y-auto border-r border-slate-200 md:w-64 md:flex-none">
          {equipmentApi.state.status === "loading" && (
            <div className="p-3.5">
              <Loading rows={6} />
            </div>
          )}
          {equipmentApi.state.status === "error" && (
            <div className="p-3.5">
              <ErrorState
                message={equipmentApi.state.message}
                onRetry={equipmentApi.reload}
              />
            </div>
          )}
          {equipmentApi.state.status === "success" && (
            <EquipmentList
              equipment={equipment}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </aside>

        <section className="min-h-85 min-w-75 flex-4 border-r border-slate-200">
          {(equipmentApi.state.status === "loading" ||
            feedsApi.state.status === "loading") && (
            <div className="p-3.5">
              <Loading rows={6} />
            </div>
          )}
          {(equipmentApi.state.status === "error" ||
            feedsApi.state.status === "error") && (
            <div className="p-3.5">
              <ErrorState
                message={
                  equipmentApi.state.status === "error"
                    ? equipmentApi.state.message
                    : feedsApi.state.status === "error"
                      ? feedsApi.state.message
                      : ""
                }
                onRetry={() => {
                  equipmentApi.reload();
                  feedsApi.reload();
                }}
              />
            </div>
          )}
          {equipmentApi.state.status === "success" &&
            feedsApi.state.status === "success" && (
              <GraphPanel
                equipment={equipment}
                feeds={feeds}
                selectedId={selectedId}
                downstream={detail?.downstream ?? []}
                onSelect={setSelectedId}
              />
            )}
        </section>

        <section className="min-h-85 w-full min-w-68 overflow-hidden md:w-64 md:flex-none lg:w-72">
          {!selectedId && (
            <p className="p-4 text-sm text-slate-500">
              Select a machine to see what stops if it fails.
            </p>
          )}
          {selectedId && detailApi.state.status === "loading" && (
            <div className="p-3.5">
              <Loading rows={5} />
            </div>
          )}
          {selectedId && detailApi.state.status === "error" && (
            <div className="p-3.5">
              <ErrorState
                message={detailApi.state.message}
                onRetry={detailApi.reload}
              />
            </div>
          )}
          {selectedId && detail && (
            <EquipmentDetail
              detail={detail}
              sharedParts={sharedParts}
              maxImpact={maxImpact}
              onSelect={setSelectedId}
            />
          )}
        </section>
      </div>

      <div className="h-60 flex-none border-t border-slate-200 md:h-64">
        <AnalysisPanel
          selectedId={selectedId}
          onSelect={setSelectedId}
          sharedPartsState={sharedPartsApi.state}
          onRetrySharedParts={sharedPartsApi.reload}
        />
      </div>
    </div>
  );
}
