interface OptimizedCodePanelProps {
  code?: string;
}

export function OptimizedCodePanel({ code }: OptimizedCodePanelProps) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Optimized Code</h2>
      <pre className="mt-3 max-h-[360px] overflow-auto rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100">
        <code>{code || "Optimized code will appear here."}</code>
      </pre>
    </section>
  );
}
