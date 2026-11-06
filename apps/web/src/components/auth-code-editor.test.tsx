import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthCodeEditor } from "./auth-code-editor";

afterEach(cleanup);

describe("developer greeting preview", () => {
  it("greets the entered first name across frameworks without a pause control", () => {
    const { rerender } = render(
      <AuthCodeEditor mode="register" name="" username="" />,
    );
    rerender(
      <AuthCodeEditor mode="register" name="Priyanshu Sharma" username="" />,
    );
    expect(screen.getByRole("status").textContent).toBe("Hello, Priyanshu.");
    for (const [framework, file] of [
      ["Spring Boot", "WelcomeController.java"],
      ["React", "Welcome.tsx"],
      ["FastAPI", "welcome.py"],
      ["Express", "welcome.ts"],
    ]) {
      const choice = screen.getByRole("button", { name: framework });
      fireEvent.click(choice);
      expect(choice.getAttribute("aria-pressed")).toBe("true");
      expect(screen.getByText(file)).toBeTruthy();
      expect(
        screen.getByLabelText(`${framework} greeting example`).textContent,
      ).toContain('"Hello, Priyanshu."');
      expect(screen.getByRole("status").textContent).toBe("Hello, Priyanshu.");
    }
    expect(screen.queryByRole("button", { name: /pause/i })).toBeNull();
  });

  it("keeps email addresses out of the sign-in greeting and safely displays quoted names", () => {
    const { rerender } = render(
      <AuthCodeEditor
        mode="login"
        name="Previous Name"
        username="private@example.test"
      />,
    );
    expect(screen.getByRole("status").textContent).toBe(
      "Welcome back, developer.",
    );
    expect(screen.queryByText(/private@example/)).toBeNull();
    rerender(<AuthCodeEditor mode="register" name={'Noor"'} username="" />);
    expect(
      screen.getByLabelText("Spring Boot greeting example").textContent,
    ).toContain('"Hello, Noor\\\"."');
    expect(screen.getByRole("status").textContent).toBe('Hello, Noor".');
  });
});
