# playwright-automation-framework-TS

End-to-end test automation framework built with **Playwright** and **TypeScript**, demonstrating UI and API testing, Page Object Model, custom fixtures, Dockerized execution, and a CI/CD pipeline in GitHub Actions.

Built as a portfolio project: 
clean architecture, environment-driven configuration, and reproducible test runs both locally and in CI.

## Tech stack

- **Playwright** — browser automation and API testing
- **TypeScript** — strict typing across the framework
- **Docker** — containerized, environment-independent test execution
- **GitHub Actions** — CI/CD pipeline with matrix execution across browsers
- **dotenv** — environment-based configuration (local / stg / CI)

## Architecture
src/
pages/ Page Object Model — one class per screen, no raw selectors in tests
api/ Thin wrapper around Playwright's request context for API tests
fixtures/ Custom Playwright fixtures wiring page objects + API tests
utils/ Shared test data and helpers
tests/
ui/ UI specs, consume page objects via fixtures
api/ API specs, consume ApiC via fixtures
docker/
Dockerfile Based on the official Playwright image (browsers preinstalled)
docker-compose.yml
.github/workflows/
playwright.yml CI pipeline — matrix across chromium / firefox / api

### Design decisions

- **Page Object Model** isolates selectors from test logic, so a UI change only requires updating one page class, not every test that touches that screen.
- **Custom fixtures** inject page objects and the API client directly as test parameters, removing manual setup/teardown duplication across spec files.
- **Environment config via `.env`** means the same suite runs against local, stg, or CI targets by changing one file, never the test code.
- **Official Playwright Docker image** ships with all browser binaries preinstalled, keeping container builds fast and CI runs deterministic.

## Getting started

```bash
npm install
npx playwright install
cp .env.example .env

npm test              # run everything
npm run test:ui       # UI specs only
npm run test:api      # API specs only
npm run report        # open the last HTML report
```

## Running in Docker

```bash
npm run docker:build
npm run docker:test
```

## CI/CD

Every push and pull request to `main` triggers a matrix build across Chromium, Firefox, and the API project. HTML reports are uploaded as build artifacts for each matrix leg.

## Roadmap

- [ ] Visual regression verifications
- [ ] Allure reporting
- [ ] Parallel sharding in CI