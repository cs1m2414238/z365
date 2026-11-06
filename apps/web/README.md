# Z365 Web

The glass coding dashboard connects to the Spring Boot profile API and supports Light and Dark modes.

## Stack

- Node.js 26 LTS, pinned to 26.13.0 in the repository's `.nvmrc` and `.node-version`
- React, TypeScript, Vite, and React Router
- Tailwind CSS 4, shadcn-compatible Button/Card foundations, Radix Slot
- TanStack Query, Axios, Zod, and Recharts
- Original Z365 SVG glyphs and Lucide controls
- Locally bundled Sora and Manrope fonts

## Run

Use Node.js 26 and install from the repository root to link `@z365/contracts`:

```sh
npm install
npm run dev
```

The frontend runs at `http://127.0.0.1:5173`. `npm run build` outputs `apps/web/dist`; `npm start` previews that build at `http://127.0.0.1:4173`.

```sh
npm test
npm run typecheck
npm run build
```

## Preserved dashboard and enhancements

The original layout, Sora/Manrope typography, custom icons, profile cards, heatmap, chart, and achievement badges are preserved. The original stylesheet is `src/styles/globals.css`. Additive API states live in `profile-enhancements.css`; glass and theme layers live in `themes.css`.

The top-bar appearance control offers Z365 Spectrum. All modes use the same layout, typography, icons, spacing, and content; only colors, material, and decorative emphasis change. Dark uses the Focus palette and is the default when no preference is saved. The appearance button switches directly between Light and Dark. Preferences persist in this browser, sync across tabs, and are restored before the app paints. Saved appearance preferences remain compatible. Mode changes do not alter API data or profile ownership.

| Mode                  | Foundation                                | Treatment                                                                              |
| --------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| Light — Cloud White   | `#F7F8FA`, white cards, indigo navigation | Neutral small cards, subtle lavender profile glass, stronger secondary text            |
| Dark — Graphite Black | `#0B0C0C`, `#1A1B1C` cards                | Clear grey borders, warm gold profile tint, gold rating line, no backdrop blur or glow |

Shared palette and semantic tokens live in `src/styles/themes.css`. Blue/cyan represents data, green represents progress, gold represents rank, and violet is reserved for agent and identity accents. The five-step heatmap remains green in every mode. Rating charts use gold in both appearances, while skill bars share a consistent gradient treatment in amber, teal, blue, violet, and coral. One full-width header carries a single Z365 logo, appearance, search, notification, and account controls. Primary navigation stays on the left without an enclosing panel background or divider, becoming a compact icon rail on smaller screens. There is no panel toggle. Desktop dashboard cards use tighter padding and a bounded content width. Help remains available in the account menu; the demo/API selector lives in the footer.

Profile enhancements include validated edits, visibility selection, a loading state during save, server error feedback, platform-link management with pending verification, per-panel error/empty states, and keyboard-friendly activity navigation.

## API and demo modes

API mode loads the signed-in profile at `/`. Select a public username or the labeled preview through the footer source control, or open:

- `/?source=demo`: explicit illustrative preview.
- `/u/your_username?source=api`: backend-connected profile client.
- `/preview`: explicit demo route.

Copy `.env.example` to `.env.local` to configure a server and initial username:

```dotenv
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=/api/v1
# VITE_PROFILE_USERNAME=your_username
BACKEND_PROXY_URL=http://localhost:8080
```

The Vite development and preview servers proxy `/api` to `BACKEND_PROXY_URL`. Production hosting must route `/api` to the backend or set `VITE_API_BASE_URL` at build time. `VITE_*` variables are public browser configuration; never put secrets in them.

API mode uses Axios with session cookies and a CSRF token for writes, validates response envelopes and data with Zod, and isolates caches by source, username, and resource. Missing or invalid responses show connection/error states. They **never fall back to demo totals, ratings, identity, or badges**. Empty verified results stay empty.

Use the account menu to register, sign in, edit privacy, sign out, or delete an account. Codeforces and GitHub links support verification and live sync. See [the profile foundation guide](../../docs/profile-foundation.md) and [frontend API shapes](../../docs/frontend-api-contract.md).

Edit controls follow the server's `canEdit` response. The backend remains responsible for authentication, ownership, profile privacy, CSRF, and verified activity. Linking a platform requests a connection; it does not itself verify a handle or generate ratings.

## Source organization

- `src/main.tsx`, `src/App.tsx`: providers and React Router routes.
- `src/components/`: the approved workspace and profile components, connection states, and themes.
- `src/components/ui/`: reusable UI and Z365 icons.
- `src/lib/api/`: Axios client, Zod contracts, explicit demo fixtures, and contract tests.
- `src/styles/`: the original design plus additive enhancements and themes.
- `tests/`: calendar and streak tests.

The existing learning, practice, projects, labs, and agents pages remain labeled preview screens. Later frontend milestones are the coding leaderboard, organization explorer, engineering workspace, and agent factory.

## Browser storage and assets

Only demo edits (`z365.profile.v1`), preview platform links (`z365.platforms.preview.v1`), exploration checklists (`z365.progress.v1`), and appearance (`z365.theme.v1`) are stored locally. API profile updates are saved through the API client. Authentication tokens are not stored by this app.

The sample avatar is bundled in `public/images/avatar.jpg`, sourced from [Unsplash](https://images.unsplash.com/photo-1506794778202-cad84cf45f1d). API profiles use server-provided avatars or an initial-based fallback.

## Account onboarding

Registration guides users through email, display name, and then username/password. Back preserves the identity fields, and the real registration request is sent only from the final step. Sign-in still accepts a username or email.

The left-hand editor offers Spring Boot, React, FastAPI, and Express examples. Its terminal types a greeting using the entered name (for example, “Hello, Priyanshu.”) or sign-in handle. These are illustrative examples, not executed code or authentication responses. Animation respects reduced motion and stops in hidden/mobile views. Credentials are never passed to the preview component. The dashboard layout and existing Light/Dark tokens remain shared.
