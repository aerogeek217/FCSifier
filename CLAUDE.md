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
- Branches: `feature/description`, `fix/description`, `refactor/description`

## Review Workflow
- Before committing: run architecture-reviewer on changed files
- Before merging: run security-reviewer on the diff
- After new features: run test-writer for untested code paths

## Planning
- Check `docs/plans/TODO.md` at session start
- Multi-step features get a plan in `docs/plans/features/`
- Run `/closeout` at end of session
