export type SupportedLanguage = "python" | "javascript" | "typescript";

export type LanguageInput = SupportedLanguage | "auto";

export interface FunctionFact {
  name: string;
  params: number;
}

export interface ClassFact {
  name: string;
  methods?: number;
}

export interface AstFacts {
  language: SupportedLanguage;
  functions: FunctionFact[];
  classes: ClassFact[];
  loops: number;
  conditionals: number;
  imports: string[];
  returns: boolean;
}

export interface ExplainRequest {
  language?: LanguageInput;
  code?: string;
}

export interface ExplainResponse {
  explanation: string;
  optimizedCode: string;
  astFacts: AstFacts;
  cached: boolean;
}

export interface CachedResult {
  explanation: string;
  optimizedCode: string;
  astFacts: AstFacts;
  createdAt: string;
}

export interface HistoryItem extends ExplainResponse {
  id: string;
  language: SupportedLanguage;
  code: string;
  createdAt: string;
}

export interface ApiErrorResponse {
  error: string;
}
