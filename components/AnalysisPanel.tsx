"use client";

import { useState } from "react";
import type { State } from "@/lib/useApi";
import type { SharedPart } from "@/types";
import { CriticalityTable } from "./CriticalityTable";
import { SharedParts } from "./SharedParts";
import { Loading } from "./states/Loading";
import { ErrorState } from "./states/ErrorState";

export function AnalysisPanel({
  selectedId,
  onSelect,
  sharedPartsState,
  onRetrySharedParts,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  sharedPartsState: State<SharedPart[]>;
  onRetrySharedParts: () => void;
}) {
  const [tab, setTab] = useState<"criticality" | "shared">("criticality");
  const tabClass = (active: boolean) =>
    `border-b-2 px-4 py-2.5 font-mono text-[10.5px] font-semibold tracking-wider uppercase transition ${
      active
        ? "border-slate-900 bg-white text-slate-900"
        : "border-transparent text-slate-500 hover:text-slate-900"
    }`;

  return (
    <section
      aria-label="Plant-wide analysis"
      className="flex h-full flex-col"
    >
      <div
        role="tablist"
        aria-label="Plant-wide analysis"
        className="-mb-px flex items-stretch gap-0 border-b border-slate-200 bg-slate-50"
      >
        <button
          role="tab"
          aria-selected={tab === "criticality"}
          onClick={() => setTab("criticality")}
          className={tabClass(tab === "criticality")}
        >
          Criticality ranking
        </button>
        <button
          role="tab"
          aria-selected={tab === "shared"}
          onClick={() => setTab("shared")}
          className={tabClass(tab === "shared")}
        >
          Shared parts
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {tab === "criticality" && (
          <CriticalityTable onSelect={onSelect} selectedId={selectedId} />
        )}
        {tab === "shared" && (
          <>
            {sharedPartsState.status === "loading" && (
              <div className="p-3.5">
                <Loading rows={5} />
              </div>
            )}
            {sharedPartsState.status === "error" && (
              <div className="p-3.5">
                <ErrorState
                  message={sharedPartsState.message}
                  onRetry={onRetrySharedParts}
                />
              </div>
            )}
            {sharedPartsState.status === "success" && (
              <SharedParts
                parts={sharedPartsState.data}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
