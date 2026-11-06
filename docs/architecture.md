# Architecture

Z365 uses a monorepo with a modular monolith for core business behavior and separate services for AI workflows and isolated execution.

| Location | Technology | Responsibility |
| --- | --- | --- |
| `apps/web` | React, Vite, TypeScript, Tailwind CSS | User interface and workspace |
| `apps/core-api` | Java 21, Spring Boot 4, Spring Modulith | Identity, challenges, submissions, learning, profiles, and progress |
| `apps/agent-service` | Python/FastAPI scaffold | Future AI workflows; entry point is empty |
| `apps/runner` | Python worker scaffold | Future isolated execution; entry point is empty |
| `packages/contracts` | TypeScript and future generated schemas | Shared boundary models |
| `infra` | Docker Compose | Local service dependencies |

The root npm workspace includes the web application and contracts only. Maven and Python builds retain their own dependency management. The web app preserves the approved dashboard and separates illustrative demo mode from validated API responses. The core API owns account sessions, profile visibility, platform verification and activity imports. The web app validates their responses with Zod. See [profile API and database inventory](profile-foundation.md).

## Core boundaries

Spring Modulith verifies Java package boundaries. Existing feature packages include `auth`, `users`, `challenges`, `submissions`, `learning`, `progress`, and `skills`; shared infrastructure is in `common` and `config`.

Profile capabilities belong in this application. The [profile roadmap](plans/coding-profile.md) maps future activity, rating, achievement, and integration behavior into modules in the core API. Implement modules when their behavior is added rather than creating empty services.

Profile scores must come from verified Z365 activity. External platform ratings remain source-specific and must not be presented as a universal cross-platform rank. Privacy, authenticated updates, and public-profile access must be enforced in the core API.

## Separate runtimes

AI work benefits from Python's ecosystem and an independent scaling lifecycle. Untrusted code execution requires a stronger isolation boundary than the core API process. The runner scaffold is not itself a production sandbox; real execution requires dedicated isolation, network restrictions, and resource limits.

## Directory migration

The frontend moved from `frontend/` to `apps/web/`, shared files from `shared/` to `packages/contracts/`, and an empty legacy `backend/target` tree was removed. The existing `apps/core-api`, `apps/agent-service`, and `apps/runner` paths were preserved. Root scripts, documentation, shared imports, and frontend CI use the consolidated layout.
