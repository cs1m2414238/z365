# Z365 frontend

- This application uses React, TypeScript, Vite, and React Router.
- Preserve the existing dashboard layout, glass styling, Sora/Manrope typography, and Z365 SVG icons. Enhance the approved design rather than replacing it.
- Keep browser concerns in this app. Account access, persistence and provider sync belong in the core API.
- Keep API responses validated, demo data explicitly labeled, and demo and API caches separate. Never fall back to illustrative statistics after an API failure.
- Keep profile request and response validation aligned with the core API contract.
- Run the frontend tests, TypeScript checks, and production build before delivery.
- Keep shared contexts, hooks, and metadata in `src/lib/`; component modules should export only components so Vite Fast Refresh keeps state consistent.
