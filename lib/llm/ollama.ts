import type { GeneratedCodeResponse, LLMProvider } from "./provider";

interface OllamaChatResponse {
  message?: {
    content?: string;
  };
  response?: string;
  error?: string;
}

const DEFAULT_TIMEOUT_MS = 90_000;

export class OllamaProvider implements LLMProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly modelName: string,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS
  ) {}

  async explainAndOptimize(prompt: string): Promise<GeneratedCodeResponse> {
    if (!this.baseUrl || !this.modelName) {
      throw new Error("Ollama configuration is missing. Set OLLAMA_BASE_URL and OLLAMA_MODEL.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.modelName,
          stream: false,
          format: "json",
          messages: [
            {
              role: "system",
              content:
                "You produce concise code explanations and behavior-preserving optimized code. Return JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          options: {
            temperature: 0.1,
            top_p: 0.9
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Ollama returned HTTP ${response.status}. Confirm the model is pulled and ollama serve is running.`);
      }

      const payload = (await response.json()) as OllamaChatResponse;
      if (payload.error) {
        throw new Error(payload.error);
      }

      return parseModelJson(payload.message?.content ?? payload.response ?? "");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("Ollama timed out. Try a smaller snippet or a faster local model.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function parseModelJson(content: string): GeneratedCodeResponse {
  const trimmed = content.trim();
  const jsonText = trimmed.startsWith("```") ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "") : trimmed;

  try {
    const parsed = JSON.parse(jsonText) as Partial<GeneratedCodeResponse>;
    if (typeof parsed.explanation !== "string" || typeof parsed.optimizedCode !== "string") {
      throw new Error("Missing explanation or optimizedCode.");
    }

    return {
      explanation: parsed.explanation.trim(),
      optimizedCode: parsed.optimizedCode.trim()
    };
  } catch {
    throw new Error("Ollama returned an invalid response. Retry, or use a model that follows JSON instructions more reliably.");
  }
}

export function createOllamaProvider(): OllamaProvider {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const modelName = process.env.OLLAMA_MODEL ?? "";
  return new OllamaProvider(baseUrl, modelName);
}

export function getConfiguredModelName(): string {
  return process.env.OLLAMA_MODEL ?? "";
}
