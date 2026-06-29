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

## Why We Chose These AI Tools

### Ollama: Local LLM Hosting

Ollama was selected as the AI inference platform because it allows the application to run large language models locally instead of relying on cloud APIs.

Reasons:
- Privacy first: source code never leaves the user's machine, which matters when analyzing proprietary code snippets.
- No API costs: unlike hosted APIs, Ollama has no per-request pricing, making it practical for local development, student projects, and internal developer tools.
- Low latency: local inference avoids network round trips once the model is loaded.
- Offline capability: the application can continue to function without an internet connection.
- Model flexibility: models can be swapped by changing `OLLAMA_MODEL` without modifying application logic.

### Qwen2.5-Coder 7B

The default model is `qwen2.5-coder:7b` because it is optimized for software engineering tasks while still being small enough to run on consumer hardware.

Reasons:
- Strong understanding of Python, JavaScript, and TypeScript.
- Produces useful code explanations, refactoring suggestions, and optimization recommendations.
- The 7B parameter size balances local performance with coding quality.
- Open-source availability makes it suitable for local deployment without API or licensing lock-in.

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

## Design Rationale

The architecture is driven by a simple principle: each component should solve a real problem without introducing unnecessary complexity. The project uses a single Next.js App Router application instead of splitting the frontend and backend into separate services. This keeps development, deployment, and maintenance straightforward while preserving a clear separation of concerns: the React UI owns the user experience, while the server-side API owns validation, language detection, AST analysis, prompt construction, caching, and LLM communication.

For AI inference, the application uses Ollama with `qwen2.5-coder:7b` to keep code analysis local. This avoids per-request API costs, protects source code privacy, and removes dependence on external AI services during normal use. Qwen2.5-Coder was selected because it performs well on Python, JavaScript, and TypeScript tasks while remaining practical to run on consumer hardware.

The application does not rely on the language model alone. Before prompting, it performs language-specific AST parsing and extracts deterministic facts such as functions, classes, imports, loops, conditionals, and return usage. These facts are included alongside the original source code, grounding the model in the actual program structure and improving the consistency of explanations and optimized code.

The system is designed to evolve without large architectural changes. Model calls are isolated behind the `LLMProvider` interface, and caching is isolated behind its own interface. That makes it straightforward to adopt another model provider later or replace the in-memory cache with Redis, SQLite, or PostgreSQL as requirements grow.

## AST Pipeline

The API normalizes the submitted source, detects or validates the language, parses the snippet, and extracts deterministic facts. Python uses the standard `ast` module through `python3`; JavaScript uses Acorn with `acorn-walk`; TypeScript uses the TypeScript compiler API. The app sends facts such as function names, class names, loop counts, conditional counts, imports, and return presence to the model instead of sending the raw AST.

## Cache Strategy

Responses are cached in a `Map<string, CachedResult>`. Cache keys are generated with:

```text
SHA256(normalizedCode + language + modelName + promptVersion)
```

Reasons:
- Avoids repeated LLM inference for identical requests.
- Reduces response time.
- Improves scalability.
- Ensures cache invalidation when either the model or prompt changes.

## Hallucination Mitigation

The prompt includes the original source code plus deterministic AST facts and explicitly tells the model not to speculate. It asks for concise JSON with a 2-4 sentence explanation and behavior-preserving optimized code. If behavior cannot be determined from the snippet, the model is instructed to acknowledge uncertainty.

## Notes

Only Python, JavaScript, and TypeScript are supported. Streaming, diff viewing, and complexity estimation are intentionally left as optional future improvements so the MVP remains reliable.
