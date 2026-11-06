# Coding profile roadmap

Based on the development plan supplied with the Z365 profile reference. This roadmap distinguishes implemented UI behavior from future backend and integration work.

## Current delivery: profile UI and repository organization

- [x] Responsive light-glass profile with reusable cards.
- [x] Editable profile header, username, location, college, bio, and social links.
- [x] Statistics, rank scopes, interactive rating history, skills, platform ratings, activity, and achievement dialogs.
- [x] 365-day activity heatmap, five intensity levels, day details, period filters, active days, totals, and streak calculations.
- [x] Workspace navigation and local resource exploration checklists.
- [x] Unified `apps/` and `packages/` structure, root commands, shared models, and frontend CI.
- [x] Frontend API client, Zod validation, explicit API/demo cache isolation, connection/error states, and profile/platform mutations.
- [ ] Backend-owned authenticated profile APIs and database persistence.
- [ ] Verified activity aggregation and live profile data.
- [ ] Transparent Z365 rating and leaderboard calculations.
- [ ] Server-enforced public profile privacy and authorization tests.

Demo profile statistics, dates, ratings, platform values, and badges are explicitly identified as sample data. API mode displays only validated backend responses, with empty/error states instead of sample fallback. Browser-persisted profile edits and checklist changes do not constitute verified engineering activity.

## Development phases

1. **Profile UI:** the current deliverable. React + TypeScript + Vite, Tailwind CSS, reusable shadcn-compatible UI foundations, Lucide, Recharts, custom CSS activity calendar, TanStack Query.
2. **Profile backend:** implement identity-linked profiles, public usernames, authenticated updates, privacy controls, and PostgreSQL persistence inside `apps/core-api`.
3. **Activity tracking:** record accepted submissions, project completions, debugging labs, assessments, and agent builds; aggregate daily activity.
4. **Rating and leaderboard:** define and document an engineering score, rating history, periodic rankings, and college/country filters among actual Z365 users.
5. **Skill graph:** derive domain proficiency from verified challenges, tests, assessments, and completed work instead of editable percentages.
6. **External integrations:** connect GitHub and coding platforms only where reliable access is available; display source attribution and refresh times.
7. **Achievements and portfolio:** award performance milestones, expose repository links and demonstrated competencies, and create privacy-aware public profiles such as `/u/{username}`.
8. **Recruiter tools:** add skill-based discovery, candidate comparison, evidence, and filters later.

## Core API ownership

Use the existing Java 21 + Spring Boot + PostgreSQL modular monolith. Do not introduce a profile microservice.

| Module | Future profile responsibility |
| --- | --- |
| `users` | Identity, unique usernames, public profiles, authenticated edits, privacy |
| `activity` | Events, daily aggregation, activity heatmaps |
| `submissions` | Accepted results and solved problems |
| `skills` | Evidence-based proficiency |
| `ratings` | Scores, rankings, history |
| `achievements` | Verified badges and milestones |
| `integrations` | External platform and repository sync |

Proposed endpoints, **not yet implemented**:

```text
GET   /api/v1/users/{username}
PATCH /api/v1/users/me
GET   /api/v1/users/{username}/stats
GET   /api/v1/users/{username}/activity
GET   /api/v1/users/{username}/skills
GET   /api/v1/users/{username}/ratings
GET   /api/v1/users/{username}/achievements
GET   /api/v1/leaderboard
```

Start database work with `user_profiles`, `activity_events`, `daily_activity`, `skill_scores`, `rating_history`, `achievements`, and `user_achievements`, related to the central user and challenge tables. Use Flyway migrations and idempotent event aggregation. Do not expose user-specific state through the current development-only security configuration without implementing authentication and authorization.

## Design principles

Light canvas `#F7F8FC`, white glass, purple accent `#6258E8`, deep text `#14213D`, success green `#16A34A`. Keep transparency subtle, reserve purple for active navigation and charts, and use green for activity and positive changes. Support small screens, keyboard users, visible focus, and reduced motion.

## Next integration milestone

Complete authenticated profile persistence and activity aggregation, replace the sample query with real core API data, and test username uniqueness, update authorization, privacy, date boundaries, and actual-user rankings. Keep external platform synchronization and recruiter features in later phases.
