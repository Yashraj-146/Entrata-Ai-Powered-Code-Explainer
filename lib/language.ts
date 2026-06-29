import type { LanguageInput, SupportedLanguage } from "@/types";

const PYTHON_HINTS = [
  /^\s*def\s+\w+\s*\(/m,
  /^\s*class\s+\w+.*:/m,
  /^\s*from\s+\w+/m,
  /^\s*import\s+\w+/m,
  /^\s*elif\b/m,
  /:\s*(?:\n|$)/
];

const JAVASCRIPT_HINTS = [
  /\bfunction\s+\w*\s*\(/,
  /\bconst\s+\w+\s*=/,
  /\blet\s+\w+\s*=/,
  /\bvar\s+\w+\s*=/,
  /=>/,
  /\bimport\s+.*\s+from\s+["']/,
  /\bexport\s+/
];

const TYPESCRIPT_HINTS = [
  /\binterface\s+\w+/,
  /\btype\s+\w+\s*=/,
  /:\s*(?:string|number|boolean|unknown|never|void|[A-Z]\w*)(?:\[\])?\b/,
  /\bimplements\s+\w+/,
  /\benum\s+\w+/,
  /\bas\s+(?:const|[A-Z]\w*)\b/,
  /<[A-Z]\w*(?:,\s*[A-Z]\w*)*>/
];

export function normalizeLanguageInput(language: unknown): LanguageInput {
  if (
    language === "python" ||
    language === "javascript" ||
    language === "typescript" ||
    language === "auto" ||
    language === undefined
  ) {
    return language ?? "auto";
  }

  throw new Error("Unsupported language. Choose Python, JavaScript, TypeScript, or Auto.");
}

export function detectLanguage(code: string, requestedLanguage: LanguageInput = "auto"): SupportedLanguage {
  if (requestedLanguage === "python" || requestedLanguage === "javascript" || requestedLanguage === "typescript") {
    return requestedLanguage;
  }

  const pythonScore = PYTHON_HINTS.reduce((score, pattern) => score + Number(pattern.test(code)), 0);
  const javascriptScore = JAVASCRIPT_HINTS.reduce((score, pattern) => score + Number(pattern.test(code)), 0);
  const typescriptScore = TYPESCRIPT_HINTS.reduce((score, pattern) => score + Number(pattern.test(code)), 0);

  if (pythonScore === 0 && javascriptScore === 0 && typescriptScore === 0) {
    throw new Error("Could not detect the language. Select Python, JavaScript, or TypeScript and try again.");
  }

  if (typescriptScore > 0 && typescriptScore >= javascriptScore) {
    return "typescript";
  }

  return javascriptScore > pythonScore ? "javascript" : "python";
}
