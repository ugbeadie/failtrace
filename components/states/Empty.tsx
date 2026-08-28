export function Empty({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-5">
      <p className="mb-1 font-mono text-[10px] tracking-wider text-slate-500 uppercase">
        Nothing here
      </p>
      <p className="text-sm text-slate-700">{message}</p>
    </div>
  );
}
