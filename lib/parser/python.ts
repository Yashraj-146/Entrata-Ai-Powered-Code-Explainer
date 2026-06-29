import { spawn } from "child_process";
import type { AstFacts } from "@/types";

const PYTHON_FACT_EXTRACTOR = String.raw`
import ast
import json
import sys

source = sys.stdin.read()

try:
    tree = ast.parse(source)
except SyntaxError as exc:
    print(json.dumps({"error": f"Invalid Python syntax: {exc.msg} on line {exc.lineno}"}))
    sys.exit(2)

facts = {
    "language": "python",
    "functions": [],
    "classes": [],
    "loops": 0,
    "conditionals": 0,
    "imports": [],
    "returns": False,
}
imports = set()

for node in ast.walk(tree):
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
        params = len(node.args.args) + len(node.args.kwonlyargs)
        if node.args.vararg:
            params += 1
        if node.args.kwarg:
            params += 1
        facts["functions"].append({"name": node.name, "params": params})
    elif isinstance(node, ast.ClassDef):
        methods = sum(isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)) for child in node.body)
        facts["classes"].append({"name": node.name, "methods": methods})
    elif isinstance(node, (ast.For, ast.AsyncFor, ast.While)):
        facts["loops"] += 1
    elif isinstance(node, (ast.If, ast.IfExp, ast.Match)):
        facts["conditionals"] += 1
    elif isinstance(node, ast.Import):
        for alias in node.names:
            imports.add(alias.name)
    elif isinstance(node, ast.ImportFrom):
        module = node.module or ""
        imports.add(module if module else ".")
    elif isinstance(node, ast.Return):
        facts["returns"] = True

facts["imports"] = sorted(imports)
print(json.dumps(facts))
`;

export async function parsePythonFacts(code: string): Promise<AstFacts> {
  return new Promise((resolve, reject) => {
    const child = spawn("python3", ["-c", PYTHON_FACT_EXTRACTOR], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", () => {
      reject(new Error("Python parser is unavailable. Install python3 and try again."));
    });

    child.on("close", (codeNumber) => {
      try {
        const parsed = JSON.parse(stdout) as AstFacts | { error: string };
        if ("error" in parsed) {
          reject(new Error(parsed.error));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error(stderr.trim() || `Python AST parsing failed with exit code ${codeNumber ?? "unknown"}.`));
      }
    });

    child.stdin.write(code);
    child.stdin.end();
  });
}
