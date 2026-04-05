# Development Workflow

How to use Claude Code with this project template, end to end.

---

## 1. Session Start

**What happens automatically:**
- The **SessionStart hook** loads `docs/plans/TODO.md` into context, so Claude knows your current work items immediately.

**What to do:**
1. Review what Claude shows from TODO.md
2. Tell Claude what you're working on
3. For multi-step features, ask Claude to create a plan in `docs/plans/features/`

---

## 2. Planning

**Quick tasks** — just describe the work. Claude implements directly.

**Multi-step features:**
1. Ask Claude to create a feature plan in `docs/plans/features/` (uses `_TEMPLATE.md`)
2. Review together: design decisions, files to modify, task breakdown
3. Once aligned, Claude works through tasks sequentially
4. The plan stays in the repo as a lightweight architecture decision record

**Task tracking:**
- `docs/plans/TODO.md` — active work: In Progress, Up Next, Done
- `docs/plans/BACKLOG.md` — deferred: Technical Debt, Deferred Features, Ideas
- `docs/DECISIONS.md` — significant architectural choices (ADR format)

---

## 3. Development

**After every file edit**, the **PostToolUse hook** runs your configured verification command (lint, typecheck, compile check). Claude sees the output and fixes issues before moving on. This hook ships as a placeholder — configure it in `.claude/settings.json` before it takes effect.

> Configure your verification command in `.claude/settings.json` under `PostToolUse`. Examples:
> - `npm run lint --silent`
> - `cargo check 2>&1`
> - `python -m py_compile $CHANGED_FILE`

**Path-scoped rules** in `.claude/rules/` load automatically when Claude edits matching files, enforcing conventions per code layer without cluttering global context.

---

## 4. Branching

Branch names must follow this convention:

| Prefix | Use for |
|--------|---------|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `refactor/` | Code restructuring |

The **branch naming hook blocks** any branch that doesn't match. Example:

```
git checkout -b my-branch        # BLOCKED
git checkout -b feature/my-branch  # allowed
```

---

## 5. Review

Three review agents are available, two enforced by hooks:

### Architecture Review (before commit)
When Claude runs `git commit`, a hook reminds it to run the **architecture-reviewer** agent first. This checks:
- Circular dependencies between modules
- New modules/abstractions missing from `docs/ARCHITECTURE.md`
- Pattern violations (naming, structure, error handling)
- Files placed in wrong directories

### Security Review (before push)
When Claude runs `git push`, a hook reminds it to run the **security-reviewer** agent first. This checks:
- Injection vulnerabilities (SQL, XSS, command injection, path traversal)
- Hardcoded secrets and API keys
- Insecure data handling and auth flaws
- Insecure defaults (permissive CORS, debug mode, weak crypto)

### Test Writing (after features)
After implementing new functionality, ask Claude to run the **test-writer** agent. It:
- Learns your existing test conventions (framework, layout, helpers)
- Generates tests for uncovered code paths
- Covers happy path, edge cases, and error conditions
- Runs tests and fixes failures before reporting done

This one is not hook-enforced — invoke when appropriate.

---

## 6. Committing & Pushing

### Hook Summary

| Action | Hook | Behavior |
|--------|------|----------|
| `git commit` | Commit guard | Soft reminder: run architecture-reviewer |
| `git push` | Push guard | Soft reminder: run security-reviewer |
| `git push --force` | Force push block | **BLOCKED** |
| `git push -f` | Force push block | **BLOCKED** |
| `git reset --hard` | Reset block | **BLOCKED** |
| `git checkout -b <name>` | Branch naming | **BLOCKED** unless `feature/`, `fix/`, or `refactor/` |

**Soft reminders** inject context — Claude sees the reminder and should act on it before proceeding. If the review was already done, it proceeds normally.

**Hard blocks** prevent the command entirely. Claude must use a safe alternative or ask you for guidance.

---

## 7. Session End

Run `/closeout` before ending your session. This skill:

1. **Verifies build & tests** — runs your configured commands, reports failures
2. **Updates TODO.md** — checks off completed items, adds newly discovered work
3. **Updates feature plan** — if work relates to a plan in `docs/plans/features/`
4. **Updates ARCHITECTURE.md** — if project structure changed (new dirs, entry points, modules)
5. **Commits** — stages all session changes including doc updates
6. **Pushes** (asks first) — optionally pushes to remote
7. **Summarizes** — prints accomplishments and open items

---

## Skills Reference

| Skill | When to use |
|-------|-------------|
| `/closeout` | End of every session |
| `/scaffold` | Setting up a new project from this template |
| `/design-ui` | Creating UI designs with Google Stitch |
| `/update-template` | Auditing template against current best practices |

## Agents Reference

| Agent | Purpose | Triggered by |
|-------|---------|-------------|
| architecture-reviewer | Structure, patterns, documentation | Commit guard hook |
| security-reviewer | Vulnerabilities, secrets, auth flaws | Push guard hook |
| test-writer | Generate tests for new code | Manual invocation |

## Hook Configuration

All hooks are defined in `.claude/settings.json`. To customize:

- **Change verification command**: Edit the `PostToolUse` hook's `command` field
- **Adjust branch naming**: Edit `.claude/hooks/pre-bash-guard.sh`
- **Add new guards**: Add entries to the `PreToolUse` array with an `if` filter
- **Disable a hook**: Remove its entry from the array

See `docs/claude-code-setup-guide.md` section 7 for hook syntax reference.
