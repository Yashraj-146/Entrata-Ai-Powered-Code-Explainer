interface ExplanationPanelProps {
  explanation?: string;
}

export function ExplanationPanel({ explanation }: ExplanationPanelProps) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Explanation</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {explanation || "Submit a snippet to generate a concise explanation."}
      </p>
    </section>
  );
}
