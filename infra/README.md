# Infrastructure

`docker-compose.yml` currently starts **PostgreSQL only**. From the repository root, copy `.env.example` to `.env`, then run:

```sh
npm run db:up
npm run db:down
```

The same commands can be run directly as `docker compose --env-file .env -f infra/docker-compose.yml up -d` and `down`. Stopping the stack keeps the named data volume.

The Java API, Next.js web app, agent service, and runner are started separately. Cloud deployment targets are documented in `docs/deployment.md`; additional infrastructure should be added when needed.
