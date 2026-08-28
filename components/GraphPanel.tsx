"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CriticalityRow, DownstreamItem } from "@/types";

type NodeState = "source" | "affected" | "unaffected";

type PositionedNode = {
  id: string;
  name: string;
  impact: number;
  state: NodeState;
  hops: number | null;
  x: number;
  y: number;
};

type Frac = { level: number; lane: number };

const COLOR: Record<NodeState, string> = {
  source: "#DC2626",
  affected: "#F97316",
  unaffected: "#94A3B8",
};

const PAD_X = 56;
const PAD_TOP = 28;
const PAD_BOTTOM = 32;
const HIT_RADIUS = 18;

/**
 * Layered (Sugiyama-style) layout: level = longest path from a root along
 * FEEDS edges, lane = position within the level after barycenter passes to
 * keep parents roughly aligned with their children.
 *
 * A real supply graph usually has hub nodes (a generator feeding a dozen
 * machines at once) whose edges skip straight past intermediate levels.
 * Drawn as one long diagonal, those edges cut across every other level's
 * lanes and tangle the whole diagram — no amount of lane-ordering fixes
 * that, because the edge was never routed through those lanes to begin
 * with. So every edge spanning more than one level gets broken into a
 * chain of invisible "dummy" waypoints, one per level it passes through.
 * Dummies take part in the barycenter passes like real nodes (so the
 * routing itself gets straightened), then the edge draws as a smooth path
 * through its waypoints instead of a single cross-cutting line.
 */
function computeLayout(equipment: CriticalityRow[], feeds: [string, string][]) {
  const ids = equipment.map((e) => e.id);
  const idSet = new Set(ids);
  const realEdges = feeds.filter(([f, t]) => idSet.has(f) && idSet.has(t));

  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  ids.forEach((id) => {
    outgoing.set(id, []);
    incoming.set(id, []);
  });
  realEdges.forEach(([from, to]) => {
    outgoing.get(from)!.push(to);
    incoming.get(to)!.push(from);
  });

  const level = new Map<string, number>();
  const degreeLeft = new Map(ids.map((id) => [id, incoming.get(id)!.length]));
  const queue = ids.filter((id) => degreeLeft.get(id) === 0);
  queue.forEach((id) => level.set(id, 0));
  for (let head = 0; head < queue.length; head++) {
    const id = queue[head];
    const lvl = level.get(id)!;
    for (const next of outgoing.get(id)!) {
      level.set(next, Math.max(level.get(next) ?? 0, lvl + 1));
      const left = degreeLeft.get(next)! - 1;
      degreeLeft.set(next, left);
      if (left === 0) queue.push(next);
    }
  }
  // Anything unreached (a cycle — shouldn't happen for a supply chain, but
  // guard against bad seed data) just lands on level 0.
  ids.forEach((id) => {
    if (!level.has(id)) level.set(id, 0);
  });

  // Expand every edge into a chain of unit-length hops through dummy
  // waypoints, and collect every node (real + dummy) into per-level groups.
  const nodeLevel = new Map<string, number>();
  ids.forEach((id) => nodeLevel.set(id, level.get(id)!));
  const layerOut = new Map<string, string[]>();
  const layerIn = new Map<string, string[]>();
  const touch = (key: string) => {
    if (!layerOut.has(key)) layerOut.set(key, []);
    if (!layerIn.has(key)) layerIn.set(key, []);
  };
  ids.forEach(touch);

  const edgeRoute = new Map<string, string[]>();
  realEdges.forEach(([from, to]) => {
    const lf = level.get(from)!;
    const lt = level.get(to)!;
    const chain = [from];
    for (let lvl = lf + 1; lvl < lt; lvl++) {
      const dKey = `·dummy·${from}→${to}@${lvl}`;
      nodeLevel.set(dKey, lvl);
      touch(dKey);
      chain.push(dKey);
    }
    chain.push(to);
    edgeRoute.set(`${from}→${to}`, chain);
    for (let i = 0; i < chain.length - 1; i++) {
      layerOut.get(chain[i])!.push(chain[i + 1]);
      layerIn.get(chain[i + 1])!.push(chain[i]);
    }
  });

  const maxLevel = Math.max(0, ...Array.from(nodeLevel.values()));
  const byLevel: string[][] = Array.from({ length: maxLevel + 1 }, () => []);
  nodeLevel.forEach((lvl, key) => byLevel[lvl].push(key));
  byLevel.forEach((group) => group.sort());

  const lane = new Map<string, number>();
  byLevel.forEach((group) => group.forEach((key, i) => lane.set(key, i)));

  const barycenterPass = (forward: boolean) => {
    const levels = forward
      ? byLevel.map((_, i) => i).slice(1)
      : byLevel
          .map((_, i) => i)
          .slice(0, -1)
          .reverse();
    for (const lvl of levels) {
      const scored = byLevel[lvl].map((key) => {
        const neighbours = forward ? layerIn.get(key)! : layerOut.get(key)!;
        const avg = neighbours.length
          ? neighbours.reduce((s, n) => s + (lane.get(n) ?? 0), 0) / neighbours.length
          : (lane.get(key) ?? 0);
        return { key, avg };
      });
      scored.sort((a, b) => a.avg - b.avg);
      byLevel[lvl] = scored.map((s) => s.key);
      byLevel[lvl].forEach((key, i) => lane.set(key, i));
    }
  };
  barycenterPass(true);
  barycenterPass(false);
  barycenterPass(true);
  barycenterPass(false);

  const maxLane = Math.max(0, ...byLevel.map((g) => g.length - 1));

  const fraction = new Map<string, Frac>();
  nodeLevel.forEach((lvl, key) => {
    fraction.set(key, {
      level: maxLevel > 0 ? lvl / maxLevel : 0.5,
      lane: maxLane > 0 ? (lane.get(key) ?? 0) / maxLane : 0.5,
    });
  });

  return { fraction, edgeRoute };
}

export function GraphPanel({
  equipment,
  feeds,
  selectedId,
  downstream,
  onSelect,
}: {
  equipment: CriticalityRow[];
  feeds: [string, string][];
  selectedId: string | null;
  downstream: DownstreamItem[];
  onSelect: (id: string) => void;
}) {
  // Sized off the canvas's own wrapper — NOT the outer GraphPanel box, which
  // also includes the header and legend. Measuring the outer box previously
  // fed a too-tall height into both the drawing buffer and the node-position
  // math, so the graph rendered squished and only nodes near the top ever
  // fell inside the canvas's actual (shorter) hit-testing area.
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionsRef = useRef<Map<string, PositionedNode>>(new Map());
  const [size, setSize] = useState({ width: 600, height: 340 });
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hopsById = useMemo(() => {
    const m = new Map<string, number>();
    downstream.forEach((d) => m.set(d.id, d.hops));
    return m;
  }, [downstream]);

  const { fraction, edgeRoute } = useMemo(
    () => computeLayout(equipment, feeds),
    [equipment, feeds],
  );

  const isActiveEndpoint = (id: string) => id === selectedId || hopsById.has(id);

  useEffect(() => {
    const canvas = canvasRef.current;
    const { width: W, height: H } = size;
    if (!canvas || !W || !H) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const pixelOf = (key: string) => {
      const f = fraction.get(key) ?? { level: 0.5, lane: 0.5 };
      return {
        x: PAD_X + f.level * (W - 2 * PAD_X),
        y: PAD_TOP + f.lane * (H - PAD_TOP - PAD_BOTTOM),
      };
    };

    const pos = new Map<string, PositionedNode>();
    equipment.forEach((e) => {
      const { x, y } = pixelOf(e.id);
      const state: NodeState =
        e.id === selectedId ? "source" : hopsById.has(e.id) ? "affected" : "unaffected";
      pos.set(e.id, {
        id: e.id,
        name: e.name,
        impact: e.impact,
        state,
        hops: hopsById.get(e.id) ?? null,
        x,
        y,
      });
    });
    positionsRef.current = pos;

    feeds.forEach(([from, to]) => {
      const route = edgeRoute.get(`${from}→${to}`);
      if (!route) return;
      const points = route.map(pixelOf);
      const active = isActiveEndpoint(from) && hopsById.has(to);

      ctx.beginPath();
      const first = points[0];
      const last = points[points.length - 1];
      const dir = last.x >= first.x ? 1 : -1;
      ctx.moveTo(first.x + 8 * dir, first.y);
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        const isLast = i === points.length - 2;
        const mx = (a.x + b.x) / 2;
        const bx = isLast ? b.x - 11 * dir : b.x;
        ctx.bezierCurveTo(mx, a.y, mx, b.y, bx, b.y);
      }
      ctx.strokeStyle = active ? "#F97316" : "#E2E8F0";
      ctx.lineWidth = active ? 1.6 : 1.1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(last.x - 8 * dir, last.y);
      ctx.lineTo(last.x - 15 * dir, last.y - 3.4);
      ctx.lineTo(last.x - 15 * dir, last.y + 3.4);
      ctx.closePath();
      ctx.fillStyle = active ? "#F97316" : "#CBD5E1";
      ctx.fill();
    });

    pos.forEach((n) => {
      const isHovered = hovered === n.id;
      const r = n.state === "source" ? 8 : n.state === "affected" ? 6 : 5;

      if (n.state === "source") {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = COLOR.source;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = COLOR[n.state];
      ctx.fill();
      if (isHovered) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#0F172A";
        ctx.stroke();
      }

      ctx.font = `${n.state === "source" ? "600 " : ""}10px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = n.state === "unaffected" ? "#94A3B8" : "#0F172A";
      let label = n.name;
      if (label.length > 18) label = label.slice(0, 17) + "…";
      ctx.fillText(label, n.x, n.y + r + 5);

      if (n.hops != null) {
        ctx.font = "9px ui-monospace, monospace";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = COLOR.affected;
        ctx.fillText(`H${n.hops}`, n.x, n.y - r - 4);
      }
    });

    if (hovered) {
      const n = pos.get(hovered);
      if (n) {
        const text = `${n.name}  ·  stops ${n.impact}`;
        ctx.font = "10px ui-monospace, monospace";
        const w = ctx.measureText(text).width + 16;
        const x = Math.min(Math.max(n.x - w / 2, 6), W - w - 6);
        const y = Math.max(n.y - 34, 6);
        ctx.fillStyle = "#0F172A";
        ctx.fillRect(x, y, w, 20);
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(text, x + 8, y + 10.5);
      }
    }
  }, [equipment, feeds, fraction, edgeRoute, selectedId, hopsById, hovered, size]);

  const nodeAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best: string | null = null;
    let bestDist = HIT_RADIUS;
    positionsRef.current.forEach((n) => {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < bestDist) {
        bestDist = d;
        best = n.id;
      }
    });
    return best;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3.5 py-2.5">
        <h2 className="font-mono text-[10px] font-semibold tracking-wider text-slate-900 uppercase">
          Supply network
        </h2>
        <span className="font-mono text-[10px] text-slate-500">
          {selectedId
            ? `${downstream.length} of ${Math.max(equipment.length - 1, 0)} downstream`
            : `${equipment.length} machines`}
        </span>
      </div>

      <div ref={canvasWrapRef} className="min-h-75 flex-1 bg-slate-50">
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          style={{ cursor: hovered ? "pointer" : "default" }}
          onClick={(e) => {
            const id = nodeAt(e.clientX, e.clientY);
            if (id) onSelect(id);
          }}
          onMouseMove={(e) => {
            const id = nodeAt(e.clientX, e.clientY);
            setHovered((prev) => (prev === id ? prev : id));
          }}
          onMouseLeave={() => setHovered(null)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 px-3.5 py-1.5">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
          <span className="font-mono text-[9.5px] tracking-wide text-slate-900 uppercase">
            Source
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#F97316]" />
          <span className="font-mono text-[9.5px] tracking-wide text-slate-900 uppercase">
            Stops too
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#94A3B8]" />
          <span className="font-mono text-[9.5px] tracking-wide text-slate-500 uppercase">
            Unaffected
          </span>
        </span>
        <span className="flex-1" />
        <span className="font-mono text-[9.5px] tracking-wide text-slate-400 uppercase">
          Supply flows left → right
        </span>
      </div>
    </div>
  );
}
