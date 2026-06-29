import { createHash } from "crypto";
import type { CachedResult, SupportedLanguage } from "@/types";

export interface ResponseCache {
  get(key: string): CachedResult | undefined;
  set(key: string, value: CachedResult): void;
}

class InMemoryResponseCache implements ResponseCache {
  private readonly entries = new Map<string, CachedResult>();

  get(key: string): CachedResult | undefined {
    return this.entries.get(key);
  }

  set(key: string, value: CachedResult): void {
    this.entries.set(key, value);
  }
}

export const responseCache: ResponseCache = new InMemoryResponseCache();

export function createCacheKey(input: {
  normalizedCode: string;
  language: SupportedLanguage;
  modelName: string;
  promptVersion: string;
}): string {
  const payload = `${input.normalizedCode}\n${input.language}\n${input.modelName}\n${input.promptVersion}`;
  return createHash("sha256").update(payload).digest("hex");
}
