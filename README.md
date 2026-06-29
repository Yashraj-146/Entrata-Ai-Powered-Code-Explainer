# AI Code Explainer

AI Code Explainer is a Next.js App Router application that explains and optimizes Python, JavaScript, or TypeScript snippets using a locally hosted Ollama model. The app uses Monaco Editor for input, parses code before prompting, extracts deterministic AST facts, caches repeated requests, and keeps snippet history in browser state for the current session.

## Architecture

- `app/page.tsx` contains the client workflow and session history state.
- `app/api/explain/route.ts` owns validation, language detection, normalization, cache lookup, AST parsing, prompt construction, and LLM invocation.
- `components/` contains reusable UI panels.
- `lib/parser/` extracts AST-derived facts for Python, JavaScript, and TypeScript.
- `lib/llm/` keeps model calls behind the `LLMProvider` abstraction.
- `lib/cache.ts`, `lib/normalize.ts`, `lib/language.ts`, and `lib/prompt.ts` isolate business logic.

# Architecture Flow

Single repository using Next.js App Router.

```
                     Next.js

        React UI + Monaco Editor
                  │
                  ▼
          /api/explain
                  │
                  ▼
        Language Detection
                  │
                  ▼
          Normalize Code
                  │
                  ▼
        Generate Cache Key
                  │
         ┌────────┴─────────┐
         │                  │
     Cache Hit         Cache Miss
         │                  │
         ▼                  ▼
 Return Cached        Parse AST
 Response                  │
                            ▼
              AST Fact Extraction
                            │
                            ▼
                 Prompt Builder
                            │
                            ▼
                 Ollama (Local)
                            │
          ┌─────────────────┴────────────────┐
          ▼                                  ▼
 Explanation                     Optimized Code
          │                                  │
          └─────────────────┬────────────────┘
                            ▼
                     Store Cache Entry
                            │
                            ▼
                        Return Result
```

---

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
```

## Ollama

Install Ollama from [https://ollama.com](https://ollama.com), then pull the recommended model:

```bash
ollama pull qwen2.5-coder:7b
```

Start the local server:

```bash
ollama serve
```

## Run The App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run typecheck
npm run build
```

## Design Decisions

The LLM is called only from the server route so environment variables and provider details stay out of the browser. The UI keeps history in React state as required, while the server keeps the response cache in memory behind a cache interface so it can later be replaced with Redis, SQLite, or Postgres.

## AST Pipeline

The API normalizes the submitted source, detects or validates the language, parses the snippet, and extracts deterministic facts. Python uses the standard `ast` module through `python3`; JavaScript uses Acorn with `acorn-walk`; TypeScript uses the TypeScript compiler API. The app sends facts such as function names, class names, loop counts, conditional counts, imports, and return presence to the model instead of sending the raw AST.

## Cache Strategy

Responses are cached in a `Map<string, CachedResult>`. Cache keys are generated with:

```text
SHA256(normalizedCode + language + modelName + promptVersion)
```

Including `OLLAMA_MODEL` and the prompt version prevents stale responses when the model or prompt changes.

## Hallucination Mitigation

The prompt includes the original source code plus deterministic AST facts and explicitly tells the model not to speculate. It asks for concise JSON with a 2-4 sentence explanation and behavior-preserving optimized code. If behavior cannot be determined from the snippet, the model is instructed to acknowledge uncertainty.

## Notes

Only Python, JavaScript, and TypeScript are supported. Streaming, diff viewing, and complexity estimation are intentionally left as optional future improvements so the MVP remains reliable.
