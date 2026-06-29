"use client";

import Editor from "@monaco-editor/react";
import type { SupportedLanguage } from "@/types";

interface CodeEditorProps {
  code: string;
  language: SupportedLanguage;
  onChange: (value: string) => void;
}

export function CodeEditor({ code, language, onChange }: CodeEditorProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-sm">
      <Editor
        height="470px"
        defaultLanguage={language}
        language={language}
        value={code}
        onChange={(value) => onChange(value ?? "")}
        theme="vs-light"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbersMinChars: 3,
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 4
        }}
      />
    </div>
  );
}
