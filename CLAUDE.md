# [Project Name]

[One-line description of what this project is.]

## Architecture
@docs/ARCHITECTURE.md

## Current Work
@docs/plans/TODO.md

## Build & Test Commands
- Build: `[your build command]`
- Test: `[your test command]`
- Run: `[your run command]`
- Single test: `[your single test command]`

## Conventions
See `.claude/rules/` — rules load automatically when editing matching paths.

## Constraints
- [Hard constraint 1 — things Claude must NEVER do]
- [Hard constraint 2]

## Git Workflow
- Branches: `feature/description`, `fix/description`, `refactor/description` *(enforced by hook)*

## Review Workflow
- Before committing: run architecture-reviewer on changed files *(hook reminder)*
- Before pushing: run security-reviewer on the diff *(hook reminder)*
- After new features: run test-writer for untested code paths

## Safety Guardrails
Hooks block: force push, `git reset --hard`, and non-standard branch names.

## Planning
- `docs/plans/TODO.md` loads at session start *(SessionStart hook)*
- Multi-step features get a plan in `docs/plans/features/`
- Run `/closeout` at end of session

## Workflow
See `docs/WORKFLOW.md` for full development workflow.
