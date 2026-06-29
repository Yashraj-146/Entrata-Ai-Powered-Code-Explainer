import ts from "typescript";
import type { AstFacts, ClassFact, FunctionFact } from "@/types";

export function parseTypeScriptFacts(code: string): AstFacts {
  const sourceFile = ts.createSourceFile("snippet.ts", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const diagnostics =
    ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.Latest
      },
      reportDiagnostics: true
    }).diagnostics ?? [];

  if (diagnostics.length > 0) {
    const firstDiagnostic = diagnostics[0];
    const position = sourceFile.getLineAndCharacterOfPosition(firstDiagnostic.start ?? 0);
    const message = ts.flattenDiagnosticMessageText(firstDiagnostic.messageText, " ");
    throw new Error(`Invalid TypeScript syntax: ${message} on line ${position.line + 1}`);
  }

  const functions: FunctionFact[] = [];
  const classes: ClassFact[] = [];
  const imports = new Set<string>();
  let loops = 0;
  let conditionals = 0;
  let returns = false;

  function visit(node: ts.Node): void {
    if (ts.isFunctionDeclaration(node)) {
      functions.push({ name: node.name?.text ?? "anonymous", params: node.parameters.length });
    } else if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      functions.push({ name: ts.isFunctionExpression(node) ? node.name?.text ?? "anonymous" : "anonymous", params: node.parameters.length });
    } else if (ts.isMethodDeclaration(node)) {
      functions.push({ name: node.name.getText(sourceFile), params: node.parameters.length });
    } else if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      const methods = node.members.filter(ts.isMethodDeclaration).length;
      classes.push({ name: node.name?.text ?? "anonymous", methods });
    } else if (
      ts.isForStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node)
    ) {
      loops += 1;
    } else if (ts.isIfStatement(node) || ts.isConditionalExpression(node) || ts.isSwitchStatement(node)) {
      conditionals += 1;
    } else if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        imports.add(moduleSpecifier.text);
      }
    } else if (ts.isImportEqualsDeclaration(node)) {
      imports.add(node.moduleReference.getText(sourceFile));
    } else if (ts.isReturnStatement(node)) {
      returns = true;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    language: "typescript",
    functions,
    classes,
    loops,
    conditionals,
    imports: Array.from(imports).sort(),
    returns
  };
}
