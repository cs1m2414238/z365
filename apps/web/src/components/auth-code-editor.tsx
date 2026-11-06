import { useId, useState } from "react";
import { Terminal } from "lucide-react";
import {
  authGreeting,
  greetingCode,
  previewFrameworks,
  type AuthMode,
  type PreviewFramework,
} from "@/lib/auth-preview";
import { useTypewriter } from "@/lib/use-typewriter";

function CodeLine({
  number,
  text,
  active,
}: {
  number: number;
  text: string;
  active: boolean;
}) {
  const tokens = text.split(
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[^\n]*|@[\w.]+|\b(?:import|from|class|return|export|function|const|async|def|type|boolean)\b|\b(?:String|WelcomeController|FastAPI|Welcome|express)\b)/g,
  );
  return (
    <span className={`auth-code-line${active ? " is-current" : ""}`}>
      <span className="auth-line-number">{number}</span>
      <span>
        {tokens.map((token, index) => {
          const color = /^["']/.test(token)
            ? "string"
            : token.startsWith("#")
              ? "comment"
              : token.startsWith("@")
                ? "annotation"
                : /^(import|from|class|return|export|function|const|async|def|type|boolean)$/.test(
                      token,
                    )
                  ? "keyword"
                  : /^(String|WelcomeController|FastAPI|Welcome|express)$/.test(
                        token,
                      )
                    ? "type"
                    : undefined;
          return color ? (
            <span className={`code-${color}`} key={index}>
              {token}
            </span>
          ) : (
            token
          );
        })}
        {text ? null : "\u00a0"}
      </span>
    </span>
  );
}

export function AuthCodeEditor({
  mode,
  name,
  username,
}: {
  mode: AuthMode;
  name: string;
  username: string;
}) {
  const [framework, setFramework] = useState<PreviewFramework>("spring");
  const editorId = useId();
  const selected = previewFrameworks.find((item) => item.id === framework)!;
  const greeting = authGreeting(mode, name, username);
  const typing = useTypewriter(greeting, true);
  const lines = greetingCode(framework, mode, greeting);
  return (
    <figure
      className="auth-code-editor"
      aria-label="Interactive developer greeting preview"
    >
      <div className="auth-editor-toolbar">
        <span className="auth-editor-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="auth-editor-file">
          <span aria-hidden="true">&lt;/&gt;</span> {selected.file}
        </span>
        <span className="auth-editor-live">
          <i /> LIVE PREVIEW
        </span>
      </div>
      <div
        className="auth-framework-tabs"
        role="group"
        aria-label="Preview framework"
      >
        {previewFrameworks.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={framework === item.id}
            aria-controls={editorId}
            onClick={() => setFramework(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <pre
        id={editorId}
        className="auth-editor-code"
        aria-label={`${selected.label} greeting example`}
      >
        <code>
          {lines.map((line, index) => (
            <CodeLine
              key={index}
              number={index + 1}
              text={line}
              active={line.includes("return")}
            />
          ))}
        </code>
      </pre>
      <figcaption className="auth-editor-console">
        <div>
          <Terminal size={11} />
          <span>TERMINAL · PREVIEW</span>
          <span className="auth-editor-language">{selected.language}</span>
        </div>
        <p aria-hidden="true">
          <span className="auth-terminal-prompt">›</span> {typing.text}
          <span
            className={
              typing.animated ? "auth-code-caret" : "auth-code-caret is-static"
            }
          />
        </p>
        <span className="sr-only" role="status" aria-live="polite">
          {greeting}
        </span>
      </figcaption>
    </figure>
  );
}
