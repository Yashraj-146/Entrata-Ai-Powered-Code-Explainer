"use client";

import { FormEvent, useMemo, useState } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { OptimizedCodePanel } from "@/components/OptimizedCodePanel";
import type { ApiErrorResponse, ExplainResponse, HistoryItem, LanguageInput, SupportedLanguage } from "@/types";

const STARTER_CODE = `def calculate_total(items):
    total = 0
    for item in items:
        if item["active"]:
            total += item["price"]
    return total`;

const EDITOR_LANGUAGE_BY_INPUT: Record<LanguageInput, SupportedLanguage> = {
  auto: "python",
  python: "python",
  javascript: "javascript",
  typescript: "typescript"
};

export default function Home() {
  const [code, setCode] = useState(STARTER_CODE);
  const [language, setLanguage] = useState<LanguageInput>("auto");
  const [result, setResult] = useState<ExplainResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const editorLanguage = useMemo(() => {
    if (result?.astFacts.language && language === "auto") {
      return result.astFacts.language;
    }
    return EDITOR_LANGUAGE_BY_INPUT[language];
  }, [language, result?.astFacts.language]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);

    if (code.trim().length === 0) {
      setError("Enter a Python, JavaScript, or TypeScript snippet before submitting.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language })
      });

      const payload = (await response.json()) as ExplainResponse | ApiErrorResponse;
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "The request failed.");
      }

      setResult(payload);
      const item: HistoryItem = {
        ...payload,
        id: crypto.randomUUID(),
        language: payload.astFacts.language,
        code,
        createdAt: new Date().toISOString()
      };
      setSelectedHistoryId(item.id);
      setHistory((current) => [item, ...current].slice(0, 20));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to explain this snippet.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleHistorySelect(item: HistoryItem) {
    setSelectedHistoryId(item.id);
    setCode(item.code);
    setLanguage(item.language);
    setResult({
      explanation: item.explanation,
      optimizedCode: item.optimizedCode,
      astFacts: item.astFacts,
      cached: item.cached
    });
    setError(undefined);
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-slate-950">AI Code Explainer</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Explain and optimize Python, JavaScript, or TypeScript snippets with AST preprocessing and a local Ollama model.
          </p>
        </div>
        <LoadingIndicator active={isLoading} />
      </header>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              Language
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as LanguageInput)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm"
              >
                <option value="auto">Auto detect</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
              </select>
            </label>
            <div className="flex items-center gap-3">
              {result ? (
                <span className="text-xs font-medium text-slate-500">
                  {result.cached ? "Served from cache" : `Detected ${result.astFacts.language}`}
                </span>
              ) : null}
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Explaining" : "Explain Code"}
              </button>
            </div>
          </div>

          <CodeEditor code={code} language={editorLanguage} onChange={setCode} />

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-[var(--danger)]" role="alert">
              {error}
            </div>
          ) : null}
        </section>

        <HistoryPanel history={history} selectedId={selectedHistoryId} onSelect={handleHistorySelect} />
      </form>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <ExplanationPanel explanation={result?.explanation} />
        <OptimizedCodePanel code={result?.optimizedCode} />
      </section>

      {result ? (
        <section className="mt-6 rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">AST Facts</h2>
          <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-slate-100 p-4 text-xs leading-5 text-slate-800">
            <code>{JSON.stringify(result.astFacts, null, 2)}</code>
          </pre>
        </section>
      ) : null}
    </main>
  );
}
