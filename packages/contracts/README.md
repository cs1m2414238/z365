# Shared contracts

`@z365/contracts` is a private npm workspace for models shared by the web application and future generated API clients.

`src/index.ts` currently contains:

- `Profile`: the editable frontend profile view model. This is not yet a core API response contract.
- `ActivityDay`: a date-keyed activity total used by the calendar.
- `ApiResponse<T>`: the existing Spring Boot success envelope.
- `Challenge`: the existing challenge response shape.

Import models with `import type { Profile } from "@z365/contracts"`. Run `npm install` from the repository root to link the package. Python and Java services remain independently built; future OpenAPI/JSON Schema generation should live here rather than duplicating service implementations.
