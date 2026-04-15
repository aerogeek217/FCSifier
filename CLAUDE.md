# FCSifier

Task-to-tool and tool-to-task cross-reference for CS-FSTD. Static webapp hosted on GitHub Pages, file-based data (CSV/JSON), no runtime dependencies.

## Architecture
@docs/ARCHITECTURE.md

## Current Work
@docs/plans/TODO.md

## Build & Test Commands
- Dev server: `npm run dev` *(Vite; hot reload)*
- Build: `npm run build` *(emits `/dist/` + runs `scripts/check-runtime-deps.sh`)*
- Preview built site: `npm run preview` *(serves `/dist/`)*
- Test: `npm test` *(Node's built-in test runner via `tsx`, runs `test/*.test.ts`)*
- Type/Svelte check: `npm run check`
- Single test: `node --import tsx --test test/<file>.test.ts`

## Conventions
See `.claude/rules/` — rules load automatically when editing matching paths.

## Testing
- Every feature or bug fix includes tests — tests are a deliverable, not an afterthought
- Test count: **[6/6 tests passing]** *(update this after every test run)*
- Include test count in commit messages, e.g.: `Add CSV loader (12/12 tests passing)`

## Constraints
- **No runtime dependencies** — no npm packages loaded in the browser, no CDN scripts, no external fonts/icons. Vendor anything you need.
- **No server or database** — all data is static files in `data/` (CSV or JSON), fetched client-side.
- **GitHub Pages compatible** — CI builds with Vite, then publishes `/dist/`. `.nojekyll` (now in `public/`, copied into `/dist/`) disables Jekyll processing.
- **Dev dependencies allowed** — Vite, Svelte compiler, TypeScript, `tsx`, test runner. None of this ships to the browser; `scripts/check-runtime-deps.sh` enforces that.

## Git Workflow
- Branches: `feature/description`, `fix/description`, `refactor/description` *(enforced by hook)*

## Review Workflow
- Before committing: run architecture-reviewer on changed files *(hook reminder)*
- Before pushing: run security-reviewer on the diff *(hook reminder)*
- Before committing: run test-writer on new/changed source files *(hook reminder)*

## Safety Guardrails
Hooks block: force push, `git reset --hard`, and non-standard branch names.

## Planning
- `docs/plans/TODO.md` loads at session start *(SessionStart hook)*
- Multi-step features get a plan in `docs/plans/features/`
- Run `/closeout` at end of session

## Workflow
See `docs/WORKFLOW.md` for full development workflow.
