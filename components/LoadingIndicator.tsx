interface LoadingIndicatorProps {
  active: boolean;
}

export function LoadingIndicator({ active }: LoadingIndicatorProps) {
  if (!active) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-[var(--accent-strong)]" role="status" aria-live="polite">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--accent)]" />
      Asking Ollama
    </div>
  );
}
