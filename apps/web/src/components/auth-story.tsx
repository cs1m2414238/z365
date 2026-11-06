import { ArrowRight } from "lucide-react";
import { PracticeIcon, ProjectIcon, Z365Icon } from "@/components/ui/z365-icon";
import { AuthCodeEditor } from "@/components/auth-code-editor";
import type { AuthMode } from "@/lib/auth-preview";

export function AuthStory({
  mode,
  name,
  username,
}: {
  mode: AuthMode;
  name: string;
  username: string;
}) {
  return (
    <aside className="auth-story" aria-label="Your Z365 workspace">
      <div className="auth-story-copy">
        <span className="auth-eyebrow">
          <i /> A DEVELOPER PLATFORM
        </span>
        <h2>
          From solving problems
          <br />
          <em>to building software.</em>
        </h2>
        <p>Practice, debug, and build. Your stack, your way.</p>
      </div>
      <AuthCodeEditor mode={mode} name={name} username={username} />
      <div
        className="auth-engineering-path"
        aria-label="Practice, debug, build"
      >
        <span>
          <PracticeIcon size={14} /> Practice
        </span>
        <ArrowRight size={14} aria-hidden="true" />
        <span>
          <Z365Icon name="debug" size={14} /> Debug
        </span>
        <ArrowRight size={14} aria-hidden="true" />
        <span>
          <ProjectIcon size={14} /> Build
        </span>
      </div>
    </aside>
  );
}
