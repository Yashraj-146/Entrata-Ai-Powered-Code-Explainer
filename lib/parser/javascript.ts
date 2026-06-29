import * as acorn from "acorn";
import * as walk from "acorn-walk";
import type { AstFacts, ClassFact, FunctionFact } from "@/types";

type NodeWithShape = {
  type: string;
  id?: { name?: string } | null;
  key?: { name?: string; value?: string } | null;
  params?: unknown[];
  value?: { params?: unknown[] } | null;
  source?: { value?: string };
  specifiers?: Array<{ local?: { name?: string } }>;
};

export function parseJavaScriptFacts(code: string): AstFacts {
  let ast: acorn.Node;

  try {
    ast = acorn.parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowHashBang: true
    });
  } catch {
    ast = acorn.parse(code, {
      ecmaVersion: "latest",
      sourceType: "script",
      allowHashBang: true
    });
  }

  const functions: FunctionFact[] = [];
  const classes: ClassFact[] = [];
  const imports = new Set<string>();
  let loops = 0;
  let conditionals = 0;
  let returns = false;

  walk.full(ast, (node) => {
    const shaped = node as NodeWithShape;

    switch (shaped.type) {
      case "FunctionDeclaration":
        functions.push({ name: shaped.id?.name ?? "anonymous", params: shaped.params?.length ?? 0 });
        break;
      case "FunctionExpression":
      case "ArrowFunctionExpression":
        functions.push({ name: shaped.id?.name ?? "anonymous", params: shaped.params?.length ?? 0 });
        break;
      case "MethodDefinition":
      case "PropertyDefinition":
        if (shaped.type === "MethodDefinition") {
          functions.push({
            name: shaped.key?.name ?? String(shaped.key?.value ?? "method"),
            params: shaped.value?.params?.length ?? 0
          });
        }
        break;
      case "ClassDeclaration":
      case "ClassExpression":
        classes.push({ name: shaped.id?.name ?? "anonymous" });
        break;
      case "ForStatement":
      case "ForInStatement":
      case "ForOfStatement":
      case "WhileStatement":
      case "DoWhileStatement":
        loops += 1;
        break;
      case "IfStatement":
      case "ConditionalExpression":
      case "SwitchStatement":
        conditionals += 1;
        break;
      case "ImportDeclaration":
        if (shaped.source?.value) {
          imports.add(shaped.source.value);
        }
        break;
      case "CallExpression":
        break;
      case "ReturnStatement":
        returns = true;
        break;
      default:
        break;
    }
  });

  return {
    language: "javascript",
    functions,
    classes,
    loops,
    conditionals,
    imports: Array.from(imports).sort(),
    returns
  };
}
