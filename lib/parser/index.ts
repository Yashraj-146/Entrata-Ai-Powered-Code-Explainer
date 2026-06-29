import type { AstFacts, SupportedLanguage } from "@/types";
import { parseJavaScriptFacts } from "./javascript";
import { parsePythonFacts } from "./python";
import { parseTypeScriptFacts } from "./typescript";

export async function parseAstFacts(code: string, language: SupportedLanguage): Promise<AstFacts> {
  if (language === "python") {
    return parsePythonFacts(code);
  }

  if (language === "typescript") {
    return parseTypeScriptFacts(code);
  }

  return parseJavaScriptFacts(code);
}
