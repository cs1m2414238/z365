# Profile and platform foundation

The existing Spring Boot application owns accounts, privacy and imports. It compiles for Java 21. The existing React dashboard reads the same validated API shapes and offers Light and Dark. The labeled preview is available at `/?source=demo`.

## Local flow

1. Start PostgreSQL and the core API using the [local development guide](development.md). Flyway applies the profile and activity migrations.
2. Open `/register` to create an account, or `/login` to sign in with a username or email. The account menu also exposes account access. On Windows, `npm run dev:local` starts the API, database and web app together.
3. Open **Edit profile** to change the name, username, biography, location, links, skills, HTTPS image URLs or visibility. New accounts are private. A public profile can be opened at `/u/<username>`.
4. Open **View all** on Platform rankings. Link GitHub or Codeforces, place the displayed code in the indicated public profile field, then choose Verify. Remove the code after successful verification.
5. Review the import status, data coverage and last successful sync in the platform dialog. Disconnect to remove the link and its imported records.

## API inventory

| Method and route | Result |
| --- | --- |
| `GET /api/v1/auth/csrf` | Session-backed CSRF header name and token |
| `POST /api/v1/auth/register` | Create a private profile with a hashed password |
| `POST /api/v1/auth/login` | Form fields `username` and `password`, with the CSRF header. Returns 204 and rotates the session ID |
| `POST /api/v1/auth/logout` | Invalidate the session, 204 |
| `GET /api/v1/users/me` | Current profile |
| `PATCH /api/v1/users/me` | Update supplied profile fields |
| `DELETE /api/v1/users/me` | Delete the account with current-password confirmation |
| `GET, PATCH /api/v1/users/me/settings` | Owner-only email and privacy settings |
| `GET /api/v1/users/{username}` | Public or owner profile |
| `GET /api/v1/users/{username}/{stats,activity,skills,ratings,platforms,achievements}` | Profile resources with the same visibility checks |
| `POST /api/v1/users/me/platforms` | Save an owner-managed connection |
| `POST /api/v1/users/me/platforms/{platform}/sync` | Queue verification or refresh, 202 |
| `DELETE /api/v1/users/me/platforms/{platform}` | Disconnect and cascade-delete imported activity |

V4 adds `user_profiles`, `user_profile_skills`, `platform_accounts` and `external_activity`. It backfills private profiles for existing accounts and adds case-insensitive unique indexes for usernames and emails. Resolve any case-insensitive duplicates before applying V4 to an existing database. V5 stores provider timestamps and event labels for recent activity. Migrations V1–V3 retain their checksums.

Sessions use an immutable user ID in the Spring Security principal. Passwords use the Spring delegating BCrypt encoder. Browser mutations fetch a fresh CSRF token and submit it in the returned header. The session cookie is HttpOnly, SameSite=Lax, and secure when `SESSION_COOKIE_SECURE=true`. Configure allowed origins with `WEB_ORIGINS`. The login/register limiter is local to one instance and uses the peer address. TLS, trusted proxy configuration, shared throttling and shared sessions need deployment decisions before scaling. [Spring Security session persistence](https://docs.spring.io/spring-security/reference/servlet/authentication/persistence.html) · [Spring Security CSRF](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html)

## Provider behavior

- Codeforces uses public `user.info` and `user.status`. The organization marker proves profile control. The importer spaces requests at least two seconds apart and reads up to five pages of 500 submissions within the activity window. Current rating is separate from Z365 scores. Distinct solved problems use accepted submissions with a contest and problem index. [Codeforces API methods](https://codeforces.com/apiHelp/methods) · [Codeforces API objects](https://codeforces.com/apiHelp/objects)
- GitHub uses public user and public user events endpoints. The bio marker proves profile control and the numeric actor ID constrains imports. The latest fetch is bounded by the provider’s 30-day and 300-event limits. A push event counts as an action, regardless of its commit count. A server-side `GITHUB_API_TOKEN` is optional for public API quota. [GitHub users API](https://docs.github.com/en/rest/users/users#get-a-user) · [GitHub public events API](https://docs.github.com/en/rest/activity/events#list-public-events-for-a-user)
- Pending and limited links are visible to their owner. Only verified links contribute public statistics. LeetCode, GeeksforGeeks, CodeChef and HackerRank can be saved as links with a limited status.
- A database lease claims one due connection at a time. Matching the lease on completion prevents an expired job or disconnected account from writing its results. Success schedules a six-hour refresh. Transient failures back off and honor provider retry timing within the documented daily cap. The worker logs provider failures without logging codes, credentials or raw payloads.
- The heatmap covers 365 UTC days and counts stored events plus Z365 solves. Empty cells mean no recorded actions for that date. Provider windows can be incomplete. Records are deduplicated by connection and provider event ID.

The initial implementation stores the current Codeforces rating. Contest history, OAuth connections, email verification and recovery, uploads, Z365 scoring, assessed skills and earned achievements remain future work. Unavailable scores are null and the corresponding collections are empty. Challenge creation now requires an authenticated administrator and CSRF protection. Registration always creates a regular user; it does not automatically promote the first account. Administration tooling remains future work.

## Verification

Run `mvn verify` using JDK 21 or a newer JDK targeting release 21. For the profile integration suite, point `PROFILE_TEST_DB_URL`, `PROFILE_TEST_DB_USER` and `PROFILE_TEST_DB_PASSWORD` at a disposable PostgreSQL database. Tests migrate it and exercise registration, sessions, CSRF, privacy, deletion and import persistence. Provider tests supply deterministic HTTP responses.

From the root, run `npm test` and `npm run build`. For live provider verification, use an external account you control so you can place and remove its proof code.

## Code map

| Location | Changes |
| --- | --- |
| `apps/core-api/src/main/java/com/z365/coreapi/auth`, `config/ProfileSecurityConfig.java` | Registration, session security, CSRF and authentication throttling |
| `apps/core-api/src/main/java/com/z365/coreapi/users` | Account and profile persistence, owner authorization, activity and statistics |
| `apps/core-api/src/main/java/com/z365/coreapi/integrations` | Provider clients, verified links, job leases and normalized imports |
| `apps/core-api/src/main/resources/db/migration` | Profile, verification, activity and event metadata migrations |
| `apps/web/src/components`, `apps/web/src/lib/api` | Account dialog, profile editing, source attribution, verification, API validation and cache handling |
| `apps/web/src/styles/themes.css` | Shared Light and Dark design tokens |
