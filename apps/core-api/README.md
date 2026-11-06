# Z365 Core API

The platform's modular monolith: Java 21, Spring Boot 4.1.2, Spring Modulith, PostgreSQL 18, Flyway, and Spring Security.

From the repository root, create `.env` from `.env.example`, start PostgreSQL with `npm run db:up`, and then:

```sh
cd apps/core-api
./mvnw spring-boot:run
```

On Windows, use `mvnw.cmd` and point `JAVA_HOME` at JDK 21. Database settings are `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`; Spring's defaults match the example local database. Spring Boot also imports the root `.env` when launched from `apps/core-api` (or from the repository root). The Compose `POSTGRES_*` values supply matching database defaults; exported `DB_*` settings take precedence.

- API: `http://localhost:8080/api/v1/challenges`
- OpenAPI: `http://localhost:8080/v3/api-docs`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Health: `http://localhost:8080/actuator/health`

```sh
./mvnw test
./mvnw verify
```

CI uses JDK 21 and PostgreSQL. Set `PROFILE_TEST_DB_URL`, `PROFILE_TEST_DB_USER`, and `PROFILE_TEST_DB_PASSWORD` to exercise the profile flow against a disposable PostgreSQL database. The existing container startup test runs when Docker is available.

The `auth`, `users`, and `integrations` modules implement account sessions, developer profiles, and verified provider imports. The existing `challenges` module remains available. See [API inventory, migrations and provider limits](../../docs/profile-foundation.md).
