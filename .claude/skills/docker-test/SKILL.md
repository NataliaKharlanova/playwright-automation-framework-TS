---
name: docker-test
description: Run the Playwright suite inside Docker (docker/ + package.json docker scripts) with pre-flight checks, conditional image rebuild, a result summary and failure diagnosis.
argument-hint: "[ui|api|all]  (default: api)"
disable-model-invocation: true
allowed-tools: Bash(docker info:*), Bash(docker images:*), Bash(df:*)
---

# /docker-test $ARGUMENTS

Run the tests in Docker. Scope = `$ARGUMENTS` if it is `ui`, `api` or `all`. Default to **`api`** when it is empty. For any other value, stop and list the valid options.

Known facts about this repo:
- Compose file: `docker/docker-compose.yml`. Service: `tests`. Image: **`docker-tests`** (compose project name = folder `docker`).
- `docker/Dockerfile` uses `FROM mcr.microsoft.com/playwright:v<X>-noble` and then `COPY . .`. Test code is **baked into the image**. Only `playwright-report/` and `test-results/` are mounted back to the host.
- Compose loads `../.env.${ENV:-qa}` as `env_file` and sets `CI=true` (retries=2, workers=2, `forbidOnly`).

## 1. Pre-flight (stop on any failure. Do not build.)

1. `docker info`. If it errors or hangs for more than ~20 s (use a short Bash timeout), Docker is not running. Tell the user to start Docker Desktop and stop.
2. `df -h /`. Read the **Avail** column. If less than **15 GB** is free, stop and report the number. Do not build or run anything. Mention that Docker Desktop keeps its own VM disk too (`docker system df` shows usage), but **never run `docker system prune` or any other cleanup without the user's explicit approval**.
3. Check that the env file exists: `.env.${ENV:-qa}` in the project root (it is git-ignored). If it is missing, stop and point to `cp .env.example .env.qa`.
4. Check the version. The tag in the Dockerfile `FROM` line must equal the `@playwright/test` version under `"node_modules/@playwright/test"` in `package-lock.json`. If they differ, stop and report both versions. The fix is to bump the Dockerfile tag to match the lockfile.

## 2. Build only when needed

`docker images docker-tests --format '{{.CreatedAt}}'`
- No output: the image doesn't exist, so build.
- Otherwise compare the image creation time with the modification time of `docker/Dockerfile`, `package.json` and `package-lock.json`. If any of them is newer, rebuild.
- Because of `COPY . .`, an image older than `src/`, `tests/` or `playwright.config.ts` runs **stale test code**. Treat newer files there as a reason to rebuild too, and say so. The rebuild is fast because the `npm ci` layer stays cached when the package files haven't changed.
- If none of this applies, say "image up to date, skipping build".

Build with `npm run docker:build`. It needs permission, so ask.

## 3. Run

| Scope | Command |
|---|---|
| `api` | `npm run docker:test:api` |
| `all` | `npm run docker:test` |
| `ui` | `docker compose -f docker/docker-compose.yml run --rm tests npx playwright test --project=chromium --project=webkit` |

Pass through a non-default environment as `ENV=<name> <command>`. Compose uses it to pick the env file.

If scope is `ui` or `all`, check `tests/ui/` first. It currently has no spec files, so Playwright reports "No tests found" (a non-zero exit for `ui`). Tell the user this means there are no UI tests yet, not that something broke.

## 4. Summary

Read the final lines of the `list` reporter (`N passed`, `N failed`, `N flaky`, `N skipped`, duration) and report them briefly:

```
Scope: api   Env: qa   Image: rebuilt | reused
✅ 12 passed   ❌ 1 failed   ⚠️ 1 flaky   (8.3s)
Failed: tests/api/users.spec.ts › GET /users/me … (one line per failure, with the assertion message)
HTML report: playwright-report/index.html   (open with: npm run report)
JUnit:       test-results/junit.xml
```

"Flaky" means passed on retry. With `CI=true` there are up to 2 retries, so name those tests explicitly.

## 5. Diagnose failures

If the build or the run fails, match the output against these causes, report the most likely one with the evidence line, and suggest a fix. Only apply the fix if the user agrees.

| Symptom in the output | Cause | Suggested fix |
|---|---|---|
| `no space left on device`, `failed to register layer` | Disk / Docker VM full | Show `df -h /` and `docker system df`. **Ask** before any `docker image prune` / `docker system prune`. |
| `Executable doesn't exist at /ms-playwright/...`, "Playwright was just updated" | Image tag ≠ `@playwright/test` version | Align the `FROM` tag in `docker/Dockerfile` with `package-lock.json`, then rebuild. |
| `Missing env variable: X (check .env.qa)` | Variable absent from the env file compose loaded | Add `X` to `.env.${ENV:-qa}`. Inside the container the message always says `.env.qa` because `ENV` isn't forwarded, so check the file compose actually used. |
| `env file ... not found` | Env file missing | `cp .env.example .env.<ENV>` and fill it in. |
| `Cannot connect to the Docker daemon` | Docker stopped mid-run | Start Docker Desktop and retry. |
| `ENOTFOUND`, `ECONNREFUSED`, `ETIMEDOUT`, `pull access denied` / registry timeouts | Network, DNS, proxy, or an unreachable registry/API | Check connectivity to `mcr.microsoft.com` and `API_URL` from the host. Retry. Check the VPN/proxy. |
| `npm ci` errors (`lockfile ... out of sync`) | `package.json` and lockfile drifted | Run `npm install` on the host, commit the lockfile, rebuild. |
| `423 Locked` from `/users/login` | Shared test account locked by repeated failed logins | Wait for the lockout to expire. Don't retry in a loop. |
| Assertion failures only | Real test failures | Summarise them (step 4). Don't change tests unless asked. |

Report outcomes as they happened. If a step was skipped (for example the build), say so.
