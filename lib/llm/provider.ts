export interface GeneratedCodeResponse {
  explanation: string;
  optimizedCode: string;
}

export interface LLMProvider {
  explainAndOptimize(prompt: string): Promise<GeneratedCodeResponse>;
}
