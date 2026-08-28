export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-start gap-3.5 border border-slate-200 bg-slate-50 p-4">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-slate-900 font-mono text-sm font-semibold">
        !
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-1 font-mono text-[10px] tracking-wider text-slate-500 uppercase">
          Query failed
        </p>
        <p className="mb-3 text-sm text-slate-800">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-slate-900 px-3.5 py-1.5 font-mono text-[11px] font-medium tracking-wider text-white uppercase transition hover:bg-slate-700"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
