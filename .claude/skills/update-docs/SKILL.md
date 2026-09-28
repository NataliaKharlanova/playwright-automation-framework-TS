---
name: update-docs
description: Sync README.md, CLAUDE.md, docs/ and TSDoc comments with recent code changes (uncommitted, last commit, or since a git ref). Edits only affected sections and never commits.
argument-hint: "[git-ref]  (default: uncommitted changes, else last commit)"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(git status:*), Bash(git diff:*), Bash(git log:*)
---

# /update-docs $ARGUMENTS

Bring the docs in line with what the code **actually is now**. Every edit needs approval, which is expected. Never commit.

## 1. Determine the change set

Run `git status --porcelain`, then pick the base:

| Situation | Diff command |
|---|---|
| `$ARGUMENTS` is given | `git diff $ARGUMENTS --find-renames --name-status`, then per file `git diff $ARGUMENTS -- <file>` (compares the ref with the working tree, so uncommitted work is included) |
| No argument, tree is dirty | `git diff HEAD --find-renames --name-status`, then per file `git diff HEAD -- <file>` |
| No argument, tree is clean | `git diff HEAD~1 HEAD --find-renames --name-status`, then per file. If `HEAD~1` doesn't exist (first commit), say so and stop. |

- If the ref doesn't resolve, stop and show `git log --oneline -10` so the user can pick one.
- **Untracked files (`??`) don't appear in `git diff`.** In a dirty tree, add them to the change set and read them in full. For an untracked directory, Glob it to list its files.
- Say which base you used in one line, for example "Diffing working tree against HEAD (5 modified, 3 untracked)".

## 2. Read the changes

Read the full diff of every changed file, plus the whole current version of any file whose diff alone isn't enough to understand it. Skip lockfiles (except to confirm a dependency version), `src/types/generated/`, `playwright-report/` and `test-results/`.

## 3. Map changes to docs

Read `README.md`, `CLAUDE.md` and `docs/**` before deciding anything. Use the headings that **actually exist**:

| Change | Update |
|---|---|
| `package.json` `scripts` | README **Running tests** command table (and **Getting started › Install** if setup changed) · CLAUDE.md **Commands** |
| `package.json` dependencies / tooling (new linter, TS version pin) | README **Tech stack** · CLAUDE.md **Commands** / **Conventions** |
| New / renamed / deleted files in `src/`, `tests/`, `spec/` | README **Project structure** tree · CLAUDE.md **Architecture** (only if the big picture changed; CLAUDE.md has no file tree, so don't add one) and **Repo quirks** |
| New public classes, methods or exported functions in `src/` | TSDoc on those symbols: one or two lines in the style of `src/api/ApiClient.ts`. Never edit `src/types/generated/`. |
| `playwright.config.ts`, `.github/` | README **CI/CD** · CLAUDE.md **Architecture** (projects, reporters, retries) |
| `docker/` | README **Running in Docker** · CLAUDE.md **Environment** (Docker notes) |
| New skills in `.claude/skills/`, or hooks in `.claude/settings.json` | README **AI-assisted workflow** (one line per `/command`, taken from its frontmatter `description`) · CLAUDE.md **Conventions** for hooks |
| New convention visible in code (lint rule, fixture pattern, test-data rule) | CLAUDE.md **Conventions** / **Test data rules** |
| `docs/**` content contradicted by the change | That section of the doc |
| A README **Roadmap** item that the diff now implements | Tick it `[x]`, but only if the code fully exists |

**Missing section** (at the time of writing, README had no **CI/CD**, **Running in Docker** or **AI-assisted workflow**): create it only if the diff introduces its content. Place it before **Roadmap**, keep it short, and match the style of the surrounding headings.

## 4. Edit

Edit only the sections identified in step 3, with the smallest change that makes them accurate. Leave everything else byte-for-byte unchanged.

## Rules

- **Only document what exists.** Every sentence must be traceable to code in the repo right now. No planned, "coming soon" or imagined features, except existing Roadmap items that you leave as they are.
- **Commands must match `package.json` exactly.** Copy each script name from `package.json` and check every `npm run <x>` in the docs against it. If a doc lists a script that doesn't exist, fix or remove it and report that.
- Don't rewrite, reorder or restyle sections the diff doesn't touch. Don't "improve" unrelated wording.
- README: English, concise, portfolio tone (states what it does and why, no filler, no emoji beyond what is already there).
- CLAUDE.md: guidance for Claude. Non-obvious facts only, no file listings that are easy to discover.
- Never edit code logic. TSDoc comments are the only allowed change to `.ts` files.
- If nothing needs updating, say "Docs are already in sync with <base>", make no edits and stop.
- Don't commit, stage or push.

## Output

1. A table of the edits made:

   | File | Section | What changed |
   |---|---|---|
   | README.md | Running tests | Added `npm run lint`, `npm run typecheck` |

2. Any mismatches you found but did **not** fix (with the reason), for example a doc command that exists in no script.
3. A suggested commit message, not executed:

   ```
   docs: <short summary of what was synced>
   ```
