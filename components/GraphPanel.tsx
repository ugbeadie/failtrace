"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Equipment, DownstreamItem } from "@/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="h-[460px] animate-pulse rounded bg-slate-100" />
  ),
});

type GraphNode = {
  id: string;
  name: string;
  state: "source" | "affected" | "unaffected";
};

export function GraphPanel({
  equipment,
  feeds,
  selectedId,
  downstream,
  onSelect,
}: {
  equipment: Equipment[];
  feeds: [string, string][];
  selectedId: string | null;
  downstream: DownstreamItem[];
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => {
    const affected = new Set(downstream.map((d) => d.id));
    return {
      nodes: equipment.map<GraphNode>((e) => ({
        id: e.id,
        name: e.name,
        state:
          e.id === selectedId
            ? "source"
            : affected.has(e.id)
              ? "affected"
              : "unaffected",
      })),
      links: feeds.map(([source, target]) => ({ source, target })),
    };
  }, [equipment, feeds, selectedId, downstream]);

  // Push nodes apart vertically. The default charge (-30) is far too weak
  // once every node carries a name label beside it.
  useEffect(() => {
    graphRef.current?.d3Force("charge")?.strength(-200);
  }, [data]);

  const colours = {
    source: "#b91c1c",
    affected: "#f97316",
    unaffected: "#cbd5e1",
  } as const;

  return (
    <div ref={containerRef} className="rounded border border-slate-200">
      <ForceGraph2D
        ref={graphRef}
        graphData={data}
        width={width}
        height={460}
        dagMode="lr"
        dagLevelDistance={110}
        cooldownTicks={100}
        d3VelocityDecay={0.3}
        nodeRelSize={4}
        linkColor={() => "#e2e8f0"}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node) => onSelect(node.id as string)}
        onEngineStop={() => graphRef.current?.zoomToFit(400, 70)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as GraphNode & { x: number; y: number };

          ctx.beginPath();
          ctx.arc(n.x, n.y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = colours[n.state];
          ctx.fill();

          const fontSize = 10 / globalScale;
          ctx.font = `${fontSize}px ui-sans-serif, system-ui, sans-serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = n.state === "unaffected" ? "#94a3b8" : "#0f172a";
          ctx.fillText(n.name, n.x + 7, n.y);
        }}
      />
    </div>
  );
}
