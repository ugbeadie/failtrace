export function Loading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-1.5" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-8 animate-pulse bg-slate-100"
          style={{ width: `${96 - i * 8}%` }}
        />
      ))}
    </div>
  );
}
