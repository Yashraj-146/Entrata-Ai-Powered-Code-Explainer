# CODEX_HANDOFF.md

# AI-Powered Code Explainer

## Project Objective

Build an AI-powered code explainer that accepts Python and JavaScript code snippets, generates concise plain-English explanations using a locally hosted LLM via Ollama, and produces an AI-optimized version of the submitted code.

The project should be fully functional within a single working day while demonstrating good software architecture, prompt engineering, AST-based preprocessing, caching, and thoughtful handling of LLM limitations.

---

# Project Goals

## Core Features (MVP)

- Accept Python code
- Accept JavaScript code
- Automatically detect language
- Parse source code into an AST
- Extract deterministic AST-derived facts
- Generate a concise (2–4 sentence) explanation
- Generate an optimized version of the submitted code
- Maintain history of submitted snippets during the current session
- Use syntax-highlighted editor
- Cache LLM responses to avoid unnecessary inference

---

## Optional (Only if Time Permits)

- Streaming responses from Ollama
- Side-by-side diff viewer
- Estimated time complexity
- Estimated space complexity

Streaming should never delay completion of the MVP.

---

# Architecture

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

# Technology Stack

## Frontend

- Next.js (App Router)
- React
- TypeScript
- Monaco Editor
- Tailwind CSS (recommended)

---

## Backend

- Next.js API Routes

---

## LLM

Ollama

Recommended models:

- qwen2.5-coder:7b
- deepseek-coder-v2:16b-lite

The model should be configurable.

Example:

```env
OLLAMA_MODEL=qwen2.5-coder:7b
OLLAMA_BASE_URL=http://localhost:11434
```

Application should communicate with:

```
POST http://localhost:11434/api/chat
```

or

```
POST http://localhost:11434/api/generate
```

---

# LLM Provider Abstraction

Implement a provider interface.

Example:

```ts
interface LLMProvider {
    explain(prompt: string): Promise<string>;
    optimize(prompt: string): Promise<string>;
}
```

Initial implementation:

```
OllamaProvider
```

Future providers can implement the same interface without affecting business logic.

---

# AST Parsing

AST parsing is a required feature.

Supported languages:

- Python
- JavaScript

Recommended parsers:

Python

- ast

JavaScript

- Acorn
or
- @babel/parser

---

# AST Fact Extraction

Do NOT send the raw AST to the LLM.

Instead, derive deterministic semantic facts.

Example:

```json
{
  "language": "python",
  "functions": [
    {
      "name": "calculateTotal",
      "params": 2
    }
  ],
  "classes": [],
  "loops": 2,
  "conditionals": 3,
  "imports": [
    "math"
  ],
  "returns": true
}
```

Reasons:

- Much smaller prompt
- Lower inference time
- Lower memory usage
- Easier prompt engineering
- Deterministic facts reduce hallucinations

---

# Prompt Strategy

Prompt should remain deterministic.

Template:

```
Language

<language>

AST Summary

Functions:
...

Classes:
...

Loops:
...

Conditionals:
...

Imports:
...

Returns:
...

Source Code

...

Tasks

1. Explain the code in 2–4 sentences.
2. Describe the primary logic.
3. Generate a cleaner, more maintainable version.
4. Preserve existing behavior.
5. Do not invent functionality that is not present.
```

---

# Hallucination Mitigation

The system should reduce hallucinations by:

- Parsing code before prompting
- Sending deterministic AST-derived facts
- Providing the original source code
- Constraining the prompt
- Explicitly instructing the model not to speculate

If functionality cannot be determined from the snippet, the explanation should acknowledge uncertainty instead of making assumptions.

---

# Code Normalization

Before hashing:

Normalize the source code.

Normalization should include:

- Trim whitespace
- Normalize line endings
- Convert tabs to spaces
- Remove excessive blank lines

Future improvement:

- Black for Python
- Prettier for JavaScript

---

# Cache Strategy

Purpose:

- Reduce Ollama inference time
- Avoid repeated prompt generation
- Avoid repeated optimization requests

---

## Cache Key

```
SHA256(
normalizedCode +
language +
modelName +
promptVersion
)
```

Example

```
SHA256(
normalizedCode +
"python" +
"qwen2.5-coder:7b" +
"v1"
)
```

Prompt version must be included so future prompt improvements automatically invalidate stale cache entries.

---

## Cache Flow

```
Normalize

↓

Generate Hash

↓

Lookup Cache

↓

Hit?

↓

Yes

Return Cached Response

No

↓

Parse AST

↓

Extract Facts

↓

Build Prompt

↓

Ollama

↓

Store Cache

↓

Return Result
```

---

## Cache Storage

For MVP:

```
Map<string, CachedResult>
```

No persistence required.

Future implementations may replace this with:

- Redis
- SQLite
- PostgreSQL

Cache implementation should remain behind an interface.

---

# Cached Data

Each entry should contain:

```ts
{
    explanation,
    optimizedCode,
    astFacts,
    createdAt
}
```

---

# Session History

Requirement:

Users can submit multiple snippets and review previous explanations.

Implementation:

React state.

Example:

```ts
const [history, setHistory] = useState([]);
```

History is intentionally not persisted.

---

# API

## POST /api/explain

Input

```json
{
  "language": "python",
  "code": "..."
}
```

Response

```json
{
  "explanation": "...",
  "optimizedCode": "...",
  "astFacts": {},
  "cached": false
}
```

If cache hit

```json
{
  "cached": true
}
```

---

# Error Handling

Handle:

- Empty input
- Unsupported language
- Invalid syntax
- AST parsing failures
- Ollama unavailable
- Ollama timeout
- Invalid model configuration

Errors shown to users should be concise and actionable.

Internal errors should be logged.

---

# Suggested Project Structure

```
app/
│
├── page.tsx
├── layout.tsx
│
├── api/
│   └── explain/
│        route.ts
│
components/
│
├── CodeEditor.tsx
├── ExplanationPanel.tsx
├── OptimizedCodePanel.tsx
├── HistoryPanel.tsx
├── LoadingIndicator.tsx
│
lib/
│
├── cache.ts
├── normalize.ts
├── language.ts
├── prompt.ts
├── parser/
│      python.ts
│      javascript.ts
│
├── llm/
│      provider.ts
│      ollama.ts
│
types/
│
└── index.ts
```

---

# Files Likely to Change

High Priority

- app/page.tsx
- app/api/explain/route.ts
- components/CodeEditor.tsx
- components/ExplanationPanel.tsx
- components/OptimizedCodePanel.tsx
- components/HistoryPanel.tsx
- lib/cache.ts
- lib/normalize.ts
- lib/prompt.ts
- lib/language.ts
- lib/parser/python.ts
- lib/parser/javascript.ts
- lib/llm/provider.ts
- lib/llm/ollama.ts
- types/index.ts

Optional

- components/DiffViewer.tsx
- components/ComplexityPanel.tsx

---

# Assumptions

- Ollama is installed locally.
- qwen2.5-coder:7b has been pulled locally using:
ollama pull qwen2.5-coder:7b
and the Ollama server is running via:
ollama serve
- Users are anonymous.
- Authentication is not required.
- Only Python and JavaScript are supported.
- History only needs to exist during the current browser session.
- In-memory cache is sufficient for the MVP.
- AST-derived facts are deterministic and generated locally.
- The selected Ollama model is configurable through environment variables.
- Prompt versioning is used for cache invalidation.
- Streaming is optional and should only be attempted after the MVP is complete.

---

# Unfinished Work Checklist

## Core

- [ ] Initialize Next.js App Router project
- [ ] Install Monaco Editor
- [ ] Build main UI
- [ ] Implement language selector
- [ ] Implement `/api/explain`
- [ ] Implement language detection
- [ ] Implement code normalization
- [ ] Implement Python AST parser
- [ ] Implement JavaScript AST parser
- [ ] Extract deterministic AST facts
- [ ] Build prompt generator
- [ ] Implement Ollama provider
- [ ] Implement explanation generation
- [ ] Implement optimized code generation
- [ ] Implement in-memory cache
- [ ] Implement React session history
- [ ] Add loading state
- [ ] Add error handling
- [ ] Test Python snippets
- [ ] Test JavaScript snippets

## Nice-to-Have

- [ ] Streaming responses
- [ ] Diff viewer
- [ ] Time complexity estimation
- [ ] Space complexity estimation

---

# Execution Plan

1. Initialize a Next.js App Router project with TypeScript and Tailwind CSS.
2. Install and configure Monaco Editor for syntax-highlighted code input.
3. Build the main UI with a language selector, editor, explanation panel, optimized code panel, and session history panel.
4. Configure Ollama integration through environment variables (`OLLAMA_BASE_URL` and `OLLAMA_MODEL`) and implement an `LLMProvider` abstraction with an `OllamaProvider`.
5. Implement language detection for Python and JavaScript and validate unsupported languages.
6. Normalize submitted code (whitespace, tabs, line endings, blank lines).
7. Generate a cache key using `SHA256(normalizedCode + language + modelName + promptVersion)`.
8. Implement an in-memory cache (`Map<string, CachedResult>`) and return cached responses whenever possible.
9. Parse the source code into an AST using Python `ast` or Acorn/@babel/parser for JavaScript.
10. Extract deterministic AST-derived facts (functions, classes, loops, conditionals, imports, return presence, etc.).
11. Build a deterministic prompt containing the AST facts and original source code with instructions to explain and optimize the code without speculation.
12. Send the prompt to the configured Ollama model and receive both the explanation and optimized code.
13. Cache the generated result and return the explanation, optimized code, AST facts, and cache status.
14. Implement robust error handling for invalid input, parser failures, Ollama connectivity issues, model configuration problems, and timeouts.
15. Verify users can submit multiple snippets and browse previous explanations using React state.
16. If time remains, add streaming responses, a side-by-side diff viewer, and complexity estimation.
17. Polish the UI, test edge cases, and document the architecture, AST pipeline, caching strategy, Ollama setup, and hallucination mitigation in the README.
```