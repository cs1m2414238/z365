# Repository audit — 6 November 2026

The existing monorepo boundaries are appropriate. Runnable applications stay in `apps`, shared TypeScript contracts in `packages/contracts`, local infrastructure in `infra`, and architecture/backlog material in `docs`. No working application needs to be moved or recreated.

| Area | Current state | Corrections and limits |
| --- | --- | --- |
| Web | React/TypeScript/Vite, reusable dashboard components, validated API client, first-visit sign-in and dedicated registration | Preserve the approved layout, fonts and icons. Light and Dark only. Dark retains Focus colors. |
| Accounts | Registration, BCrypt passwords, CSRF, session rotation, logout, unique usernames/emails, account deletion | Registration returns to API data, safe internal redirects preserve query strings, and password byte limits are checked before requests. Unconfigured OAuth buttons no longer simulate sign-in through demo navigation. |
| Profiles | Editing, private-by-default visibility, public profile routes, owner permissions, empty/loading/error states | Public profile links bypass first-visit onboarding. Fresh accounts display zero recorded activity and unavailable scores. |
| Provider imports | GitHub and Codeforces ownership checks, bounded imports, job leases, retries, deduplication and UTC activity | Other platform links remain explicitly limited. OAuth, complete rating history and backfilled provider history remain future work. |
| Database | PostgreSQL 18, Flyway V1–V5, profile/connection/activity tables and unique indexes | Corrected the Docker 18 persistent volume mount and restricted the host binding to loopback. Root `.env` supplies matching API/Compose configuration. No user accounts are seeded. |
| Local startup | Portable Node and installed JDKs, Windows startup script, persistent project Docker database | `npm run dev:local` starts the dependency and application processes, stores logs under `.tools`, and leaves account registration to the user. |
| Challenges | Catalog lookup/list/create APIs and repository/service/controller tests | Authoring requires an administrator. A complete problem editor, isolated execution, submissions/verdicts and a public-only catalog policy need further work. |
| Exposure | Actuator health and info | Removed public metrics exposure and changed health details to authorized access only. Production deployment still requires TLS and environment-specific access policies. |
| Python services | Empty agent and runner entry points, Docker/requirements scaffolds | Corrected documentation that claimed running services and sandbox guarantees. No AI agent or secure execution service exists yet. |
| Verification | Frontend calendar/component/contract/auth tests, backend unit/API/module/database tests | Account lifecycle and migrations run against a separate test database, never the user's account database. Dependency audit and production build are part of this review. |

## Verification results

- Core API: 22 tests passed, including the account lifecycle against the separate test database and a real PostgreSQL Testcontainers startup.
- Web: six calendar checks and 51 component/contract/authentication cases. The security-test starter now matches Spring Boot 4, Testcontainers uses the Docker-compatible 1.21.4 line, and frontend workers run serially for reliable local startup.
- Production dependency audit: zero reported vulnerabilities.
- Live setup: API and Vite use the persistent project PostgreSQL database on port 5433. The fresh account database had zero registered users before handoff.
- Authentication pages: shared Z365 Light/Dark styling, responsive form layout, password visibility control, explicit demo access and no simulated social sign-in.

## Inventories

The [profile foundation](profile-foundation.md) records the account, privacy, integration and profile APIs and V4/V5 schema. V1–V3 create the original identity/challenge/progress/skill schema, seed challenge content, and add Modulith event publications. No schema changes are required for this correction pass.

The [architecture overview](architecture.md) describes the modular monolith. The [local development guide](development.md) describes startup and configuration. The Docker volume path follows the [official PostgreSQL image](https://hub.docker.com/_/postgres).

## Remaining priorities

1. Let the owner register the first real account and connect a provider account they control.
2. Add email verification and password recovery before a public launch; decide session persistence and shared rate limiting for multiple API instances.
3. Apply published-only catalog reads, pagination and administrative challenge management as part of the [coding environment phase](plans/coding-environment.md).
4. Implement isolated execution and deterministic grading before claiming run/submit functionality.
5. Build ranking, learning, organizations, labs and agents incrementally from verified evidence. Current library pages are previews, not completed backend modules.

Passing this local review does not mean the later platform phases or production deployment are complete.
