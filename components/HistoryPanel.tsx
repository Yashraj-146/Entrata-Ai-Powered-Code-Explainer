import type { HistoryItem } from "@/types";

interface HistoryPanelProps {
  history: HistoryItem[];
  selectedId?: string;
  onSelect: (item: HistoryItem) => void;
}

export function HistoryPanel({ history, selectedId, onSelect }: HistoryPanelProps) {
  return (
    <aside className="rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">Session History</h2>
        <span className="text-xs font-medium text-slate-500">{history.length}</span>
      </div>
      <div className="mt-4 space-y-2">
        {history.length === 0 ? (
          <p className="text-sm leading-6 text-slate-500">Previous snippets will be kept here for this browser session.</p>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className={`block w-full rounded-lg border p-3 text-left transition ${
                selectedId === item.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--accent-strong)]">
                {item.language}
              </span>
              <span className="mt-1 line-clamp-2 block text-sm text-slate-700">
                {item.code.split("\n").find((line) => line.trim()) ?? "Untitled snippet"}
              </span>
              <span className="mt-2 block text-xs text-slate-500">{new Date(item.createdAt).toLocaleTimeString()}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
