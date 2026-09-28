# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Playwright Test + TypeScript framework for API (and, in progress, UI) testing of [Toolshop](https://practicesoftwaretesting.com), a public demo e-commerce app. Tests run against the live public API — there is no local server.

## Commands

```bash
npm ci && npx playwright install          # setup
cp .env.example .env.qa                   # required before any run (see Environment)

npm test                                  # all projects
npm run test:api                          # --project=api (tests/api)
npm run test:ui                           # --project=chromium (tests/ui)
npm run test:headed                       # chromium, headed
npm run report                            # open last HTML report

npx playwright test tests/api/products.spec.ts     # single file
npx playwright test -g "wrong password"            # by test title
ENV=staging npm run test:api                       # use .env.staging

npm run lint                              # ESLint (typescript-eslint + eslint-plugin-playwright)
npm run typecheck                         # tsc --noEmit

npm run api:spec                          # re-download OpenAPI spec into spec/
npm run api:gen                           # regenerate src/types/generated/toolshop-api.d.ts

npm run docker:build                      # build image (docker/Dockerfile)
npm run docker:test                       # run all tests in container
npm run docker:test:api                   # run API tests in container
```

## Conventions (enforced by ESLint, `eslint.config.mjs`)

- No `page.waitForTimeout()`: wait on a locator or a web-first assertion instead.
- No `{ force: true }` on actions: fix the actionability problem instead.
- Use web-first assertions (`await expect(locator).toBeVisible()`), not `expect(await locator.isVisible()).toBe(true)`.
- Every promise must be awaited (`@typescript-eslint/no-floating-promises`).
- A Claude Code PostToolUse hook (`.claude/hooks/lint-ts.mjs`) lints each `.ts` file Claude edits and reports ESLint errors back.
- TypeScript is pinned to 6.0.x because typescript-eslint doesn't support TS 7 yet (TS 7 has no JS compiler API).

## Environment

- `src/config/env.ts` loads `.env.<ENV>` (default `ENV=qa`) and throws on import if `BASE_URL`, `API_URL`, `USERNAME` or `PASSWORD` is missing. Because `playwright.config.ts` imports it, **every** Playwright command (even `--list`) fails without a valid env file.
- `.env.*` files are git-ignored and excluded from the Docker image; docker-compose injects `../.env.${ENV:-qa}` at runtime and sets `CI=true` (so retries=2, workers=2, `forbidOnly`).
- The Docker base image tag (`mcr.microsoft.com/playwright:v1.62.1-noble`) must match the `@playwright/test` version in `package-lock.json` — bump both together.

## Architecture

- **Projects** (`playwright.config.ts`): `api` → `tests/api` with `baseURL = API_URL`; `chromium` and `webkit` → `tests/ui` with `baseURL = BASE_URL`. `testIdAttribute` is `data-test` (Toolshop's attribute). Only spec files under `tests/` are run.
- **Fixtures, not base classes**: tests import `test`/`expect` from `src/fixtures/fixtures.ts`, not `@playwright/test`. Fixtures: `apiClient` (wraps the per-test `request` context) and `customerToken` (logs in the `.env` user via `POST /users/login` and yields the bearer token). Add new shared setup as fixtures here.
- **`ApiClient`** (`src/api/ApiClient.ts`): thin wrapper over `APIRequestContext`; paths are relative to `baseURL`, auth is passed per call as `{ token }`. It returns raw `APIResponse` — tests assert status themselves.
- **Response validation**: validate bodies with `expectToMatchSchema(schema, await res.json())` from `src/utils/schema.ts`, which asserts and returns typed data. Zod schemas live in `src/schemas/toolshop.schemas.ts`; use `paginated(ItemSchema)` for list endpoints.
- **Schemas are hand-written on purpose**: in the OpenAPI spec every response field is optional, so generated validators would accept `{}`. Keep Zod schemas strict (required fields, `min(1)`, positive prices). The generated `src/types/generated/toolshop-api.d.ts` is used for request typing only and must not be edited by hand; `spec/toolshop-openapi.json` is pinned so contract changes show up in `git diff`.
- `src/types/toolshop.ts` holds hand-written interfaces that overlap with the Zod-inferred types; prefer `z.infer` / the return value of `expectToMatchSchema` in new code.
- tsconfig declares path aliases (`@api/*`, `@fixtures/*`, `@utils/*`, `@pages/*`), but existing tests use relative imports (`../../src/...`).

## Test data rules

- The `.env` account is shared and **read-only**. Repeated failed logins against it caused `423 Locked` and broke unrelated tests. Tests that change account state (wrong password, password change, logout) must use freshly registered disposable users (a `newCustomer` fixture is planned but does not exist yet).

## Repo quirks

- `src/api/*.spec.ts` are stray copies of API specs (some differ from `tests/api/`). They are outside every `testDir`, so they never run (they are still type-checked by `tsc`). `tests/api/` is canonical.
- `tests/ui/`, `src/pages/` and `src/components/` are planned but not created yet; `.github/workflows/playwright.yaml` is empty.
