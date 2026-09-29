# Playwright Automation Framework (TypeScript)

![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white)

UI + API test automation framework built with **Playwright Test** and **TypeScript**.
The system under test is [Toolshop](https://practicesoftwaretesting.com) — a demo e-commerce app by Testsmith
with a public REST API and OpenAPI specification.

Designed and built by **Natalia Kharlanova**.

## Highlights

- **API layer** — a thin `ApiClient` wrapper over Playwright's `APIRequestContext` with Bearer token support.
- **Fixtures instead of BaseTest** — dependencies (`apiClient`, `customerToken`) are injected per test, created lazily and isolated.
- **Multi-environment config** — `.env.<name>` files selected by the `ENV` variable, with fail-fast validation of required variables.
- **Runtime schema validation** — every response is validated with **Zod**; TypeScript types are inferred from the schemas.
- **Contract tracking** — the OpenAPI spec is pinned in the repo, so API changes show up in `git diff`; request types are generated from it.
- **Reporting** — list, HTML and JUnit XML reporters; traces, screenshots and video on failure.

## Tech stack

| Area | Tool |
|---|---|
| Test runner | Playwright Test |
| Language | TypeScript |
| Schema validation | Zod |
| Type generation | openapi-typescript |
| Config | dotenv |
| Browsers | Chromium, WebKit |

## Project structure

```
.
├── spec/
│   └── toolshop-openapi.json      # pinned OpenAPI spec (source of truth for the contract)
├── src/
│   ├── api/ApiClient.ts           # HTTP wrapper: get / post / put / delete + auth header
│   ├── config/env.ts              # loads .env.<ENV>, validates required variables
│   ├── fixtures/fixtures.ts       # apiClient, customerToken
│   ├── schemas/toolshop.schemas.ts# Zod schemas for API responses
│   ├── types/
│   │   ├── toolshop.ts            # shared types
│   │   └── generated/             # types generated from the OpenAPI spec (do not edit)
│   ├── utils/schema.ts            # expectToMatchSchema() helper
│   ├── pages/                     # Page Objects (UI, in progress)
│   └── components/                # reusable UI components (in progress)
├── tests/
│   ├── api/                       # API tests
│   └── ui/                        # UI tests (in progress)
├── .env.example                   # template for environment files
└── playwright.config.ts           # projects, reporters, retries, workers
```

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
git clone https://github.com/NataliaKharlanova/playwright-automation-framework-TS.git
cd playwright-automation-framework-TS
npm ci
npx playwright install
```

### Configure the environment

Create an environment file from the template and fill in the values:

```bash
cp .env.example .env.qa
```

| Variable | Description |
|---|---|
| `BASE_URL` | UI base URL, e.g. `https://practicesoftwaretesting.com` |
| `API_URL` | API base URL, e.g. `https://api.practicesoftwaretesting.com` |
| `USERNAME` | customer email used for login |
| `PASSWORD` | customer password |

`.env.*` files are git-ignored — only `.env.example` is committed.
If a variable is missing, the run stops immediately with a clear message such as
`Missing env variable: API_URL (check .env.qa)`.

## Running tests

| Command | What it does |
|---|---|
| `npm test` | run all projects |
| `npm run test:api` | run API tests |
| `npm run test:ui` | run UI tests in Chromium |
| `npm run test:headed` | run UI tests with a visible browser |
| `npm run report` | open the last HTML report |
| `npm run typecheck` | type-check the whole project without running tests |

Select an environment with the `ENV` variable (default is `qa`):

```bash
ENV=staging npm run test:api
```

Useful Playwright options:

```bash
npx playwright test tests/api/products.spec.ts   # one file
npx playwright test -g "wrong password"          # tests by name
npx playwright test --project=api --ui           # interactive UI mode
npx playwright test --repeat-each=20             # hunt for flaky tests
```

## API test coverage

| Area | Scenarios |
|---|---|
| Auth | valid login returns a token (schema-validated); wrong password returns 401 |
| Brands | list of brands matches schema |
| Products | paginated list; product by id matches the list item (data chaining); unknown id returns 404; search by name |
| Invoices | 401 without token; 200 with customer token |
| Users | `/users/me` returns the logged-in customer; 401 without token |

## Design decisions

**Why fixtures instead of a BaseTest class.**
Fixtures give composition over inheritance: a test declares what it needs and receives only that.
Setup and teardown live in one place, and every test gets its own isolated instance, so parallel runs need no `ThreadLocal`-style workarounds.

**Why hand-written Zod schemas when an OpenAPI spec exists.**
In the Toolshop spec every response field is optional, so validation generated from it would accept an empty object.
Response schemas are therefore written by hand and stricter (required fields, non-empty strings, positive prices).
The spec is still used where it is precise: request body types are generated from it, and the pinned copy makes contract changes visible in code review.

**Why tests that change account state use disposable users.**
A negative login test run repeatedly against the shared demo account triggered the server's lockout (`423 Locked`) and broke unrelated tests.
State-changing tests (wrong password, password change, logout) must run on freshly registered users; shared accounts are read-only.

## Updating the API contract

```bash
npm run api:spec   # download the latest OpenAPI spec
git diff spec/     # review what changed in the API
npm run api:gen    # regenerate TypeScript types
```

## Roadmap

- [x] API layer, fixtures, multi-environment config
- [x] API tests with runtime schema validation
- [ ] `newCustomer` fixture — register a disposable user per test
- [ ] UI tests with Page Object Model
- [ ] Login via API + authenticated browser session for UI tests
- [ ] Docker image for local runs
- [ ] GitHub Actions: type-check, API and UI tests, browser matrix, report artifacts

## Author

**Natalia Kharlanova** — SDET

- GitHub: [@NataliaKharlanova](https://github.com/NataliaKharlanova)
- LinkedIn: [linkedin.com/in/natalia-kharlanova-85637564](https://www.linkedin.com/in/natalia-kharlanova-85637564/)

## Credits

System under test: [Practice Software Testing — Toolshop](https://practicesoftwaretesting.com) by Testsmith.