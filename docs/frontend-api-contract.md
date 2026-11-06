# Frontend profile integration contract

This document describes the React client shapes implemented in `apps/web/src/lib/api/`. The Spring Boot profile endpoints and session flow are listed in the [profile API inventory](profile-foundation.md).

The frontend's dashboard design is preserved. API mode renders validated responses and explicit loading, private-profile, missing-profile, network, and contract-error states. Demo data is available only in explicitly labeled demo mode; it is not an error fallback.

## Transport

- Default base URL: `/api/v1`.
- Requests include the session cookie. Writes fetch `GET /auth/csrf` and send the returned `X-CSRF-TOKEN` header. The account dialog signs in via the core API.
- No passwords, access tokens, or backend secrets are embedded in Vite environment variables or stored by this frontend.
- Success responses use the existing envelope: `{ "success": true, "data": ... }`, with optional `message` and `timestamp`.
- Errors may use the backend's existing error envelope. The UI maps status codes to useful messages instead of displaying server internals.
- API mode never substitutes preview data, including after 401, 403, 404, invalid JSON shapes, timeouts, or network failures.
- Zod contracts in `apps/web/src/lib/api/schemas.ts` are the authoritative frontend shapes.

## Profile identity

`GET /users/{username}` expects the following `data` object. Values below illustrate the shape only:

```json
{
  "id": "user-id",
  "username": "developer",
  "displayName": "Developer Name",
  "bio": "Building thoughtful software.",
  "location": "India",
  "college": "",
  "role": "Full-Stack Engineer",
  "githubUrl": "https://github.com/developer",
  "linkedinUrl": "",
  "avatarUrl": null,
  "joinedAt": "2026-11-03T00:00:00Z",
  "isPublic": true,
  "verified": false,
  "active": false,
  "canEdit": false
}
```

Usernames contain 3–24 letters, numbers, or underscores. Avatar URLs must be http/https or null. Empty social links use empty strings; populated GitHub/LinkedIn links use their HTTPS domains. Missing `canEdit`, `verified`, and `active` flags default to false. API responses must supply other required fields; incomplete payloads are integration errors.

`PATCH /users/me` accepts `username`, `displayName`, `bio`, `location`, `college`, `githubUrl`, `linkedinUrl`, `isPublic`, `role`, `avatarUrl`, `bannerUrl`, and `skills`. The image fields accept HTTPS URLs and an empty string clears an image. `skills` contains up to 12 self-reported names. It expects the updated identity in the success envelope. The client validates limits and social URLs, disables repeated save clicks, preserves the last valid profile on failure, updates the identity cache, and refreshes related resources on success.

The backend must authorize the authenticated owner independently of any client field. A public profile read does not grant edit permission. `isPublic` is a requested preference; the backend must enforce it.

## Statistics

`GET /users/{username}/stats` expects nonnegative integer counts and null for unavailable dimensions:

```json
{
  "problemsSolved": 0,
  "projectsBuilt": null,
  "labsCompleted": null,
  "agentsCreated": null,
  "activeDays": 0,
  "currentStreak": 0,
  "longestStreak": 0,
  "totalContributions": 0
}
```

Zero is a valid result. Missing fields and numeric strings are rejected rather than turned into plausible-looking sample values. The frontend does not implement an engineering scoring algorithm.

## Activity

`GET /users/{username}/activity` expects:

```json
{
  "from": "2025-11-04",
  "to": "2026-11-03",
  "days": [{ "date": "2026-11-03", "count": 2 }],
  "recent": []
}
```

The current backend reports 365 UTC days. The client accepts an ordered range of at most 366 days. Day keys must be valid, unique calendar dates inside the range. Counts are nonnegative integers. Within a successful response, omitted dates represent no reported activity and are displayed as empty cells; no cells are fabricated after a request failure. Frontend calendar totals and streaks are presentation calculations over these server-supplied day counts.

Each optional recent activity entry has `id`, `verb`, `title`, `detail`, ISO `occurredAt`, `section` (`learn`, `practice`, `projects`, `labs`, `agents`), `icon`, and `color`. An optional `url` links to the verified provider profile. Allowed colors are `green`, `purple`, `pink`, `blue`, `orange`, and `slate`.

## Skills and ratings

`GET /users/{username}/skills` returns an array of `{ "name", "score", "evidenceCount", "icon", "source" }`. Scores range from 0 to 100. Evidence counts are nonnegative integers. The UI displays these values; it does not derive proficiency from manually entered percentages.

`GET /users/{username}/ratings` returns:

```json
{
  "score": null,
  "level": null,
  "methodology": "Backend-owned description of verified Z365 scoring.",
  "history": [],
  "rankings": []
}
```

History entries contain valid `date` and nonnegative numeric `rating`. Ranking entries contain `scope` (`Z365`, `College`, `Country`), `label`, positive `rank` or null, `percentile` between 0 and 100 or null, and nonnegative `participants`. Null rankings/scores render as unranked, not a made-up number. Comparisons must be among actual Z365 users; external ratings remain separate. Chart period changes filter the supplied history, not generated growth.

## Platform connections

`GET /users/{username}/platforms` returns an array of:

```json
{
  "id": "connection-id",
  "platform": "github",
  "handle": "developer",
  "url": "https://github.com/developer",
  "status": "pending",
  "rating": null,
  "rank": null,
  "lastSyncedAt": null
}
```

Platforms are `github`, `leetcode`, `codeforces`, `codechef`, `gfg`, and `hackerrank`. Status is `pending`, `verified`, `limited`, or `error`. Owner responses may include a proof code, sync status and failure message. Verified connections report observed action counts and the latest import coverage. URLs are HTTPS. Ratings and rank are displayed only for verified connections. The client never treats entering a username as verification.

- `POST /users/me/platforms`: accepts only `{ "platform", "handle" }`; returns the connection. No ratings, verification flags, or user IDs are supplied by the client.
- `DELETE /users/me/platforms/{platform}`: removes the authenticated owner's connection; a successful empty response is sufficient.

`POST /users/me/platforms/{platform}/sync` queues verification or refresh for GitHub and Codeforces. Other platforms show the limited state.

## Achievements

`GET /users/{username}/achievements` returns `{ "items": [], "totalAvailable": 0 }`. Each item has `id`, `name`, `subtitle`, `description`, ISO `earnedAt`, `icon`, and an allowed color. Counts, earned dates, and badges come from the backend. The frontend does not award production achievements when editing a profile or preview checklist.

## Frontend configuration and verification

`apps/web/.env.example` documents the public Vite configuration and development proxy. Production hosting must proxy `/api` before applying the SPA fallback; otherwise the HTML fallback will fail Zod validation. When using a different origin, the backend must allow the frontend origin and the configured credential/CSRF flow.

Frontend tests cover malformed responses, zero totals, dates, request payloads, privacy/read-only UI, failed saves, query cache refresh, API/demo isolation, calendar calculations, and theme persistence. Frontend tests use mock responses. The backend PostgreSQL integration suite verifies the session, privacy and import persistence flows against the migrated schema.
