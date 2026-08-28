import { severityBarClass } from "@/lib/severity";

export function ImpactBar({
  value,
  max,
  size = "sm",
}: {
  value: number;
  max: number;
  size?: "sm" | "lg";
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const segment = max > 0 ? 100 / max : 100;

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 ${
        size === "lg" ? "h-3.5" : "h-2"
      }`}
    >
      <div
        className={`absolute inset-y-0 left-0 ${severityBarClass(value)}`}
        style={{ width: `${pct}%` }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent 0 calc(${segment}% - 1px), #FFFFFF calc(${segment}% - 1px) ${segment}%)`,
        }}
      />
    </div>
  );
}
