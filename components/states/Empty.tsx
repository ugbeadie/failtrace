export function Empty({ message }: { message: string }) {
  return (
    <p className="rounded border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
      {message}
    </p>
  );
}
