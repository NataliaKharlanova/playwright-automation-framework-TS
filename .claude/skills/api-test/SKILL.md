---
name: api-test
description: Scaffold typed ApiClient methods, a type, a Zod schema and a CRUD + negative-case spec for one Toolshop API resource, then type-check and run it.
argument-hint: <resource>  (e.g. categories, products, favorites)
disable-model-invocation: true
---

# /api-test $ARGUMENTS

Generate API tests for the Toolshop resource **`$ARGUMENTS`**, following the existing patterns in this repo. If `$ARGUMENTS` is empty, stop and ask which resource to generate.

## 1. Read before writing

Read these files. The generated code must look like them:

- `src/api/ApiClient.ts`: HTTP wrapper (`get/post/put/delete`, `{ token }` option, returns raw `APIResponse`)
- `src/fixtures/fixtures.ts`: `apiClient`, `customerToken`. Tests import `test`/`expect` from here, never from `@playwright/test`.
- `src/types/toolshop.ts`, `src/schemas/toolshop.schemas.ts`, `src/utils/schema.ts` (`expectToMatchSchema`, `paginated()`)
- `tests/api/products.spec.ts` (list, get-by-id, 404, data chaining) and `tests/api/invoices.spec.ts` (401 vs token)
- If `tests/api/$ARGUMENTS.spec.ts` or methods for this resource already exist, extend them instead of duplicating them. Show the user what already exists.

Then look up `/$ARGUMENTS` in `spec/toolshop-openapi.json`. For each operation, note: path and id parameter name, `security` (whether it needs a token), the documented response codes, and the request body schema under `components.schemas` (for example `BrandRequest`). **Only generate operations the spec actually defines.** If there is no PUT or DELETE, skip it and say so. If the resource does not exist in the spec, stop and list the closest resources.

## 2. Type: `src/types/toolshop.ts`

- Add a `<Entity>` response interface with the fields the tests rely on, in the same style as `Brand`/`Product`.
- For request bodies, use the generated type instead of a hand-written one:
  `import type { components } from './generated/toolshop-api';` then
  `export type <Entity>Request = components['schemas']['<Entity>Request'];`
- Never edit `src/types/generated/`.

## 3. Schema: `src/schemas/toolshop.schemas.ts`

Add `<Entity>Schema` with Zod. It must be **stricter than the spec**, because the spec marks every response field optional: required fields, `.min(1)` on names and slugs, `.positive()` on prices, `z.email()` for emails. Wrap list endpoints that are paginated with `paginated(<Entity>Schema)`, and use `z.array(...)` for plain arrays. Check which one applies by calling the list endpoint once (`curl -s "$API_URL/$ARGUMENTS" | head -c 500`).

## 4. ApiClient methods: `src/api/ApiClient.ts`

Add thin, typed resource methods on top of the existing generic ones. Keep the generic methods unchanged. Pattern:

```ts
// <Entity>
list<Entities>(opts?: RequestOptions) { return this.get('/<resource>', opts); }
get<Entity>(id: string, opts?: RequestOptions) { return this.get(`/<resource>/${id}`, opts); }
create<Entity>(data: <Entity>Request, opts?: RequestOptions) { return this.post('/<resource>', data, opts); }
update<Entity>(id: string, data: <Entity>Request, opts?: RequestOptions) { return this.put(`/<resource>/${id}`, data, opts); }
delete<Entity>(id: string, opts?: RequestOptions) { return this.delete(`/<resource>/${id}`, opts); }
```

Methods return the raw `APIResponse`. Status and schema assertions belong in the test. Use 4-space indentation, as in the file.

## 5. Spec: `tests/api/$ARGUMENTS.spec.ts`

One `test.describe('<Entity> API', ...)`. Use relative imports (`../../src/...`), like the existing specs. Every 2xx response body goes through `expectToMatchSchema`.

**Happy path** (only for operations that exist):
- `GET` list: 200, matches the schema, non-empty.
- `GET /:id`: take the id from the list response (data chaining), 200, fields match the list item.
- `POST`: 201 (or whatever the spec documents), echoed fields equal the input.
- `PUT`: 200. A follow-up `GET` shows the change.
- `DELETE`: 204. A follow-up `GET` returns 404.

**Negative cases** (pick the ones the spec documents):
- Unknown id on GET/PUT/DELETE: 404
- Missing or invalid required field on POST/PUT: 422
- Duplicate unique field (for example slug): 409
- Operation marked with `security`, called without a token: 401

**Test data rules (important: the Toolshop API is a shared public server):**
- Never modify or delete seeded records. PUT and DELETE only act on records the test created itself.
- Make created data unique per run, for example `` `qa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` ``, so that parallel workers don't collide.
- Delete created records at the end of the test. If DELETE needs a token the suite doesn't have, leave that as a note rather than skipping silently.
- Never send wrong credentials for the shared `.env` account. Repeated failures lock it (`423 Locked`).
- If an operation needs an admin token: the repo has no admin fixture or admin env variables. Test only the 401-without-token case, and tell the user that the happy path needs an admin fixture. Do not hardcode credentials or add env variables without asking.

## 6. Verify

Run both, and fix any failures caused by the generated code:

```bash
npx tsc --noEmit
npx playwright test tests/api/$ARGUMENTS.spec.ts --project=api
```

Report the results to the user as they are.
- If a test fails because the live API behaves differently from the spec (for example it returns 200 where the spec says 201), don't change the assertion to make the test pass. Report the mismatch and ask whether to follow the real behaviour or mark the test `test.fail()` with a comment.
- Note any records that could not be cleaned up.
- Finish with a list of the files that were changed.
