export type AuthMode = "login" | "register";
export type RegistrationStep = 0 | 1 | 2;
export const registrationSteps = ["Email", "Name", "Account"] as const;

export function authGreeting(mode: AuthMode, name: string, username: string) {
  const firstName = Array.from(name.trim().split(/\s+/)[0] || "developer")
    .slice(0, 20)
    .join("");
  const handle = /^[a-zA-Z0-9_]{3,24}$/.test(username.trim())
    ? username.trim()
    : "developer";
  return mode === "register"
    ? `Hello, ${firstName}.`
    : `Welcome back, ${handle}.`;
}

export const previewFrameworks = [
  {
    id: "spring",
    label: "Spring Boot",
    file: "WelcomeController.java",
    language: "Java",
  },
  { id: "react", label: "React", file: "Welcome.tsx", language: "TypeScript" },
  { id: "fastapi", label: "FastAPI", file: "welcome.py", language: "Python" },
  {
    id: "express",
    label: "Express",
    file: "welcome.ts",
    language: "TypeScript",
  },
] as const;

export type PreviewFramework = (typeof previewFrameworks)[number]["id"];

/** Display-only examples. JSON quoting keeps entered names inside string literals. */
export function greetingCode(
  framework: PreviewFramework,
  mode: AuthMode,
  greeting: string,
) {
  const message = JSON.stringify(greeting);
  const route = mode === "register" ? "/register" : "/welcome";
  switch (framework) {
    case "spring":
      return [
        "@RestController",
        '@RequestMapping("/z365")',
        "class WelcomeController {",
        "",
        `  @${mode === "register" ? "Post" : "Get"}Mapping("${route}")`,
        "  String greet() {",
        `    return ${message};`,
        "  }",
        "}",
      ];
    case "react":
      return [
        'import type { ReactNode } from "react";',
        "",
        "",
        "export function Welcome(): ReactNode {",
        `  const message = ${message};`,
        "",
        "  return <h1>{message}</h1>;",
        "}",
        "",
      ];
    case "fastapi":
      return [
        "from fastapi import FastAPI",
        "",
        "app = FastAPI()",
        "",
        `@app.${mode === "register" ? "post" : "get"}("/z365${route}")`,
        "async def welcome():",
        `    return {"message": ${message}}`,
        "",
        "# Every stack. One workspace.",
      ];
    case "express":
      return [
        'import express from "express";',
        "",
        "const app = express();",
        "",
        `app.${mode === "register" ? "post" : "get"}("/z365${route}", (req, res) => {`,
        `  const message = ${message};`,
        "  return res.json({ message });",
        "});",
        "",
      ];
  }
}
