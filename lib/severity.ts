export type Severity = "none" | "low" | "medium" | "high";

export function severityOf(impact: number): Severity {
  if (impact === 0) return "none";
  if (impact <= 4) return "low";
  if (impact <= 9) return "medium";
  return "high";
}

const BAR: Record<Severity, string> = {
  none: "bg-slate-400",
  low: "bg-amber-400",
  medium: "bg-orange-500",
  high: "bg-red-600",
};

const TEXT: Record<Severity, string> = {
  none: "text-slate-400",
  low: "text-amber-600",
  medium: "text-orange-600",
  high: "text-red-600",
};

export function severityBarClass(impact: number): string {
  return BAR[severityOf(impact)];
}

export function severityTextClass(impact: number): string {
  return TEXT[severityOf(impact)];
}
