import type { AstFacts } from "@/types";

export const PROMPT_VERSION = "v1";

function listFunctions(facts: AstFacts): string {
  if (facts.functions.length === 0) {
    return "None";
  }

  return facts.functions.map((item) => `- ${item.name} (${item.params} params)`).join("\n");
}

function listClasses(facts: AstFacts): string {
  if (facts.classes.length === 0) {
    return "None";
  }

  return facts.classes
    .map((item) => `- ${item.name}${typeof item.methods === "number" ? ` (${item.methods} methods)` : ""}`)
    .join("\n");
}

export function buildExplanationPrompt(input: { code: string; facts: AstFacts }): string {
  const { code, facts } = input;

  return `You are a careful senior software engineer explaining code for another developer.
Use only the source code and deterministic AST summary provided below.
Do not speculate. If behavior cannot be determined from the snippet, say so briefly.
Return valid JSON only with this exact shape:
{
  "explanation": "2-4 concise sentences in plain English",
  "optimizedCode": "cleaner code that preserves behavior"
}

Language

${facts.language}

AST Summary

Functions:
${listFunctions(facts)}

Classes:
${listClasses(facts)}

Loops:
${facts.loops}

Conditionals:
${facts.conditionals}

Imports:
${facts.imports.length > 0 ? facts.imports.join(", ") : "None"}

Returns:
${facts.returns ? "Yes" : "No"}

Source Code

\`\`\`${facts.language}
${code}
\`\`\`

Tasks
1. Explain the code in 2-4 sentences.
2. Describe the primary logic.
3. Generate a cleaner, more maintainable version.
4. Preserve existing behavior.
5. Do not invent functionality that is not present.`;
}
