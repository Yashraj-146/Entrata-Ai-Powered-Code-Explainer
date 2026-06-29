import { NextResponse } from "next/server";
import { createCacheKey, responseCache } from "@/lib/cache";
import { detectLanguage, normalizeLanguageInput } from "@/lib/language";
import { createOllamaProvider, getConfiguredModelName } from "@/lib/llm/ollama";
import { normalizeCode } from "@/lib/normalize";
import { parseAstFacts } from "@/lib/parser";
import { buildExplanationPrompt, PROMPT_VERSION } from "@/lib/prompt";
import type { ApiErrorResponse, ExplainRequest, ExplainResponse } from "@/types";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse<ExplainResponse | ApiErrorResponse>> {
  try {
    const body = (await request.json()) as ExplainRequest;
    const originalCode = typeof body.code === "string" ? body.code : "";

    if (originalCode.trim().length === 0) {
      return errorResponse("Enter a Python, JavaScript, or TypeScript snippet before submitting.", 400);
    }

    const requestedLanguage = normalizeLanguageInput(body.language);
    const normalizedCode = normalizeCode(originalCode);
    const language = detectLanguage(normalizedCode, requestedLanguage);
    const modelName = getConfiguredModelName();

    if (!modelName) {
      return errorResponse("OLLAMA_MODEL is not configured. Add it to your environment and restart Next.js.", 500);
    }

    const cacheKey = createCacheKey({
      normalizedCode,
      language,
      modelName,
      promptVersion: PROMPT_VERSION
    });
    const cached = responseCache.get(cacheKey);

    if (cached) {
      return NextResponse.json({
        explanation: cached.explanation,
        optimizedCode: cached.optimizedCode,
        astFacts: cached.astFacts,
        cached: true
      });
    }

    const astFacts = await parseAstFacts(normalizedCode, language);
    const prompt = buildExplanationPrompt({ code: originalCode, facts: astFacts });
    const provider = createOllamaProvider();
    const generated = await provider.explainAndOptimize(prompt);

    responseCache.set(cacheKey, {
      explanation: generated.explanation,
      optimizedCode: generated.optimizedCode,
      astFacts,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      explanation: generated.explanation,
      optimizedCode: generated.optimizedCode,
      astFacts,
      cached: false
    });
  } catch (error) {
    console.error("Explain API failed", error);
    const message = error instanceof Error ? error.message : "Something went wrong while explaining the snippet.";
    const status = isClientInputError(message) ? 400 : 502;
    return errorResponse(message, status);
  }
}

function errorResponse(message: string, status: number): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

function isClientInputError(message: string): boolean {
  return /unsupported language|could not detect|invalid .*syntax|enter a/i.test(message);
}
