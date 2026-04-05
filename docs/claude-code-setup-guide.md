# Claude Code Project Setup Guide
## Universal Reference for Any Project

> **Purpose**: Framework-agnostic reference for setting up any project with Claude Code. Copy and adapt the patterns here for each new project. This guide covers Claude Code's configuration system and workflow principles — not any specific language or framework.

---

## 1. CLAUDE.md Best Practices

The `CLAUDE.md` file is loaded into every Claude session. Keep it **under 150 lines** and focused on things Claude cannot infer from the code alone. Question every line: **"Would Claude make a mistake without this?"** If the answer is no, remove it.

### What to Include
- **Architecture reference**: `@docs/ARCHITECTURE.md` (or wherever yours lives)
- **Current work**: `@docs/plans/TODO.md`
- **Build & test commands**: The exact commands to build, test, and run the project
- **Conventions pointer**: Point to `.claude/rules/` — keep conventions in path-scoped rules, not CLAUDE.md
- **Hard constraints**: Things Claude must never do (e.g., no third-party packages, no network calls)
- **Planning workflow**: Where tasks are tracked, how to create feature plans
- **Git workflow**: Branch naming, commit style

### What NOT to Include
- Things Claude can infer from the code (language, framework, file structure)
- Detailed architecture (put that in a separate file and `@` import it)
- Long lists of files or modules (that's what ARCHITECTURE.md is for)
- Tutorials or explanations aimed at humans (CLAUDE.md is for Claude)
- Code conventions that belong in path-scoped rules (they waste always-loaded context)
- Enforcement that belongs in hooks (hooks guarantee execution; CLAUDE.md is guidance)

### Template

```markdown
# [Project Name]

[One-line description]

## Architecture
@docs/ARCHITECTURE.md

## Current Work
@docs/plans/TODO.md

## Build & Test Commands
- Build: [your build command]
- Test: [your test command]
- Run: [your run command]
- Single test: [your single test command]

## Conventions
See `.claude/rules/` — rules load automatically when editing matching paths.

## Constraints
- [Hard constraint 1]
- [Hard constraint 2]

## Git Workflow
- Branches: feature/description, fix/description, refactor/description

## Review Workflow
- Before committing: run architecture-reviewer on changed files
- Before merging: run security-reviewer on the diff
- After new features: run test-writer for untested code paths

## Planning
- Check docs/plans/TODO.md at session start
- Multi-step features get a plan in docs/plans/features/
- Run /closeout at end of session
```

---

## 2. Rules (.claude/rules/)

Rules are markdown files that load alongside CLAUDE.md to provide additional instructions.

### Scoping

**Path-scoped rules** load only when Claude works on files matching the specified paths:

```markdown
---
paths:
  - "src/data/**"
---
# Data Layer Rules
- [Rule 1]
- [Rule 2]
```

**Unconditional rules** (no `paths` field) load at session start for every task.

**User-level rules** in `~/.claude/rules/` apply to all your projects.

### Guidelines
- One rule file per logical layer or concern (data, UI, testing, etc.)
- Keep each rule file focused — 5-15 rules, under 500 lines
- Rules should be things Claude would otherwise get wrong, not obvious best practices
- Use path-scoping to reduce context noise — only load what's relevant
- Glob patterns supported: `src/**/*.ts`, `*.md`, `**/*.test.{ts,tsx}`

---

## 3. Auto Memory

Auto memory is stored at `~/.claude/projects/<project>/memory/`. Claude writes notes to itself as it works: build quirks, debugging patterns, architecture decisions.

Key behaviors:
- First 200 lines of `MEMORY.md` are loaded every session
- Detailed notes live in topic files and are loaded on-demand
- All worktrees in the same git repo share one memory directory
- View or edit with `/memory` in a Claude Code session

No manual setup needed — memory accumulates automatically.

---

## 4. Architecture Documentation

Create an architecture file (e.g., `docs/ARCHITECTURE.md` or root `ARCHITECTURE.md`) and import it from CLAUDE.md with `@`. This is Claude's **codebase map** — the first thing it reads before exploring. A good map eliminates redundant Glob/Grep crawling by telling Claude exactly where things are.

### What to Include (navigation-first order)
- **File Map**: Annotated directory tree — one line per directory with a 5-10 word purpose. This is the single highest-impact section for reducing unnecessary file exploration.
- **Entry Points**: Where execution starts (main, CLI handler, HTTP server, test runner) with exact file paths.
- **Dependency graph**: Which modules depend on which.
- **Key abstractions**: Important interfaces, base classes, or patterns.
- **Data flow**: How data moves through the system.
- **Where to Find Things**: Lookup table mapping common tasks to file paths ("to add an endpoint, look in src/api/routes/").

### Update Discipline
Update this file whenever you add new directories, entry points, modules, or navigation targets. The `/closeout` skill checks for this automatically. A stale map is worse than no map — it sends Claude to the wrong places.

### Template

```markdown
# Architecture Overview

## File Map
[project-root]/
  src/
    [module]/         # [5-10 word purpose]
  docs/
    plans/            # Task tracking and feature plans
    ARCHITECTURE.md   # This file — codebase navigation map
  .claude/            # Claude Code config (skills, agents, rules, hooks)

## Entry Points
| Entry Point | File | Purpose |
|-------------|------|---------|
| [main] | [path/to/main] | [what it starts] |

## Dependency Graph
[Describe or diagram how modules depend on each other]

## Key Abstractions
| Abstraction | Location | Purpose |
|-------------|----------|---------|
| [Name] | [Path] | [What it does] |

## Data Flow
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Where to Find Things
| To do this... | Look here |
|---------------|-----------|
| [common task] | [path/to/dir/] |
```

---

## 5. TODOs and Plans (docs/plans/)

All task tracking and planning documents live in the project repo at `docs/plans/`, committed to git.

### Directory Layout

```
docs/plans/
├── TODO.md              # Active tasks, ordered by priority
├── BACKLOG.md           # Future work, ideas, technical debt
└── features/            # One plan file per feature or epic
    ├── _TEMPLATE.md     # Copy when starting a new plan
    └── 001-feature.md   # Completed or in-progress plans
```

### TODO.md Format

```markdown
# TODO

## In Progress
- [ ] Description (see docs/plans/features/NNN-name.md)

## Up Next
- [ ] Description
- [ ] Description

## Done (move to BACKLOG.md monthly)
- [x] Description
```

Keep this file short — it's the active sprint, not the full project history.

### Feature Plan Template

```markdown
# Feature: [Name]

**Status**: Draft | In Progress | Complete
**Date**: YYYY-MM-DD

## Goal
One sentence describing what this feature does and why.

## Design Decisions
- Decision 1: [choice] because [reason]

## Files to Create/Modify
| File | Action | Purpose |
|------|--------|---------|
| [path] | Create/Modify | [purpose] |

## Tasks
- [ ] Task 1
- [ ] Task 2

## Open Questions
- (list unknowns)

## Completion Criteria
- [criterion 1]
- [criterion 2]
```

### Git Workflow for Plans
Plans are committed to git like any other file. `git log docs/plans/` shows how priorities evolved. Feature plans stay in the repo after completion as lightweight architecture decision records.

---

## 6. Skills (.claude/skills/)

Skills are on-demand workflows invoked with `/skillname` in Claude Code.

### SKILL.md Anatomy

```markdown
---
name: skill-name
description: One-line description of what the skill does
---
[Instructions for Claude to follow when this skill is invoked]

$ARGUMENTS is replaced with whatever the user types after /skill-name
```

Place each skill in `.claude/skills/<name>/SKILL.md`.

### Frontmatter Options

| Field | Purpose |
|-------|---------|
| `name` | Skill identifier (used as `/name`) |
| `description` | One-line description |
| `disable-model-invocation: true` | Only the user can invoke (use for skills with side effects) |
| `user-invocable: false` | Only Claude can use (reference knowledge, not a workflow) |
| `context: fork` | Run in an isolated subagent (protects main context) |
| `paths: ["src/**"]` | Only load when working on matching files |
| `allowed-tools: Bash(git *) Read` | Restrict which tools the skill can use |

### Dynamic Content

- `$ARGUMENTS` — everything the user typed after `/skill-name`
- `$0`, `$1`, `$2` — individual positional arguments
- `` !`command` `` — shell command output injected before the prompt runs
- `${CLAUDE_SKILL_DIR}` — path to the skill's directory (for referencing bundled files)

### Universal Skill: Closeout

Every project benefits from a `/closeout` skill that runs at end of session:
1. Verify the project builds/runs without errors
2. Check off completed items in TODO.md
3. Add newly discovered work items
4. Update architecture docs if structure changed
5. Print a summary of what was accomplished

Adapt the verification steps to your project's toolchain.

### Project-Specific Skills

Design skills around your most common multi-step workflows:
- Adding a new entity/component/module
- Running migrations or deployments
- Generating boilerplate that follows project patterns
- Reviewing/updating project configuration (like this template's `/update-template`)

---

## 7. Hooks (.claude/settings.json)

Hooks run shell commands automatically in response to Claude Code events. They are **deterministic** — unlike CLAUDE.md instructions, hooks guarantee execution every time.

### Hook Events

| Event | When it fires |
|-------|---------------|
| `PreToolUse` | Before a tool runs (can block with exit code 2) |
| `PostToolUse` | After a tool succeeds |
| `PostToolUseFailure` | After a tool fails |
| `SessionStart` | When a session begins or resumes |
| `SessionEnd` | When a session terminates |
| `PreCompact` / `PostCompact` | Before/after context compaction |
| `CwdChanged` | Working directory changed |
| `FileChanged` | A watched file was modified on disk |
| `ConfigChange` | Settings or skills file changed |

### Configuration

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint --silent",
            "timeout": 30
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "if": "Bash(rm *)",
        "hooks": [
          {
            "type": "command",
            "command": "echo '{\"hookSpecificOutput\":{\"additionalContext\":\"Destructive command detected — confirm with user first.\"}}'",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### Key Behaviors
- **Exit code 0** = allow, **exit code 2** = deny (stderr message shown to Claude)
- **`if:` field** — conditional filter using permission rule syntax (e.g., `"if": "Bash(git push *)"`) — hook process only spawns when condition matches
- **`hookSpecificOutput` JSON** — injects context into Claude's next response
- Hooks run **before** permission rules, so they can enforce policy users can't bypass

### Common Patterns
- **PostToolUse (Write|Edit)**: Run lint/typecheck after edits so Claude catches errors immediately
- **PreToolUse (Bash)**: Guard dangerous commands or inject constraint reminders
- **SessionStart**: Re-inject environment variables or sync direnv

### Guidelines
- Keep hooks lightweight and fast (under 30s timeout)
- Heavy operations (full test suites, doc generation) belong in skills, not hooks
- Use `matcher` to scope hooks to specific tools — avoid broad matchers that fire on everything
- Use `if:` to further narrow when hooks spawn processes

---

## 8. Agents (.claude/agents/)

Agents are specialized subagents that Claude can delegate to for focused tasks. Each agent file is a markdown file with YAML frontmatter.

### Agent Anatomy

```markdown
---
name: agent-name
description: One-line description (Claude uses this to decide when to delegate)
tools: Read, Grep, Glob
model: sonnet
---
You are a [role]. Check that:
- [Check 1]
- [Check 2]

Report [what to report] with [what detail level].
```

### Frontmatter Fields

| Field | Purpose |
|-------|---------|
| `name` | Unique identifier (kebab-case) |
| `description` | When Claude should delegate to this agent |
| `tools` | Space-separated list of allowed tools |
| `model` | Model override: `haiku`, `sonnet`, or `opus` |
| `isolation: worktree` | Run in a git worktree (isolated copy of the repo) |
| `background: true` | Run in background (user sees results with Ctrl+F) |
| `preloaded-skills` | Skills to load at agent startup |

### Built-in Agent Types
Claude Code includes built-in agents you can delegate to without creating files:
- **Explore** — read-only codebase investigation (fast, focused)
- **Plan** — design implementation plans (read-only, returns strategy)
- **general-purpose** — full tool access for complex multi-step tasks

### Guidelines
- Restrict tools to what the agent actually needs (read-only agents use Read, Grep, Glob)
- Use `model: haiku` for fast, simple tasks; `model: sonnet` for review/analysis; `model: opus` for complex reasoning or code generation
- Write tight descriptions — Claude uses them to decide when to auto-delegate
- Use `isolation: worktree` for agents that modify files independently

---

## 9. MCP Servers

MCP (Model Context Protocol) servers give Claude access to external tools and services.

### Configuration

MCP servers can be configured in `.claude/settings.json` or the dedicated `mcp.json` in the project root:

```json
{
  "mcpServers": {
    "stdio-server": {
      "command": "npx",
      "args": ["-y", "@scope/package-name"]
    },
    "http-server": {
      "type": "http",
      "url": "https://mcp-server.example.com"
    },
    "sse-server": {
      "type": "sse",
      "url": "http://localhost:3001/sse"
    }
  }
}
```

Use `.claude/settings.local.json` (gitignored) for auth tokens or personal MCP configuration.

### Common MCP Servers
| Server | Purpose |
|--------|---------|
| GitHub | Issues, PRs, code review |
| Postgres | Direct database querying |
| Sentry | Error monitoring and triage |
| Slack | Team messaging |
| Notion | Docs and databases |

### Guidelines
- **Limit active servers to 5-6** — each starts a subprocess; more feels sluggish and adds startup latency.
- Claude Code uses lazy tool discovery, so connecting many servers doesn't bloat context — but each server process still consumes resources.
- Remove servers you don't use for a given project (the `/scaffold` skill handles this during setup).

---

## 10. Session Discipline

1. **Start fresh**: Use `/clear` between unrelated tasks. Context pollution degrades performance.
2. **Explore, then plan, then code**: Use Plan Mode (Shift+Tab) for investigation. Switch to Normal Mode for implementation.
3. **Verify everything**: Always provide Claude a way to verify its work (tests, build, browser check).
4. **Update docs after structural changes**: Keep ARCHITECTURE.md and TODO.md current.
5. **Use worktrees for parallel tasks**: `claude --worktree feature-name` creates an isolated branch and filesystem so you can work on multiple features simultaneously.
6. **Control reasoning effort**: Use `/effort` or Alt+T to toggle extended thinking. Higher effort = better results on complex problems, but slower.
7. **Rewind mistakes**: Press Esc twice to undo Claude's last action and try a different approach.

---

## 11. Commands Reference

| Command | When to Use |
|---------|-------------|
| `/init` | First-time CLAUDE.md generation |
| `/clear` | Between unrelated tasks |
| `/compact` | When context is getting full mid-task |
| `/memory` | View/edit auto memory |
| `/hooks` | Browse configured hooks |
| `/effort` | Control reasoning depth (low/medium/high) |
| `/batch` | Parallel large-scale changes across codebase |
| `/simplify` | Review changed code for quality and efficiency |
| `/loop` | Run a prompt or command on a recurring interval |
| `/agents` | Manage agent teams for complex parallel work |
| `/closeout` | End of session (custom skill) |

---

## 12. Prompting Patterns

### Adding a feature
```
Look at how [existing similar feature] is implemented. Follow the same patterns
to implement [new feature]. Write tests. Run the build when done.
```

### Debugging
```
The [symptom] occurs when [action]. Check [likely location]. Write a failing
test that reproduces the issue, then fix it. Run the full test suite after.
```

### Code review (via subagent)
```
Use the architecture-reviewer agent to check all files changed in this session
for compliance.
```

---

## 13. Context Conservation

- **Clear at 60% context capacity** — performance degrades as context fills. Use `/clear` proactively, not just when things break.
- Reference files with `@path/to/file` instead of asking Claude to search
- Use subagents for codebase exploration so findings are summarized, not dumped into context
- Scope investigations: "look at src/Data/" not "find where the database is configured"
- After the second correction on the same issue, `/clear` and rewrite the prompt
- **Keep ARCHITECTURE.md current** — a good codebase map prevents the most expensive context waste: redundant file crawling

---

## 14. Settings Organization

Claude Code reads settings from multiple locations with a clear precedence order.

### Settings Files

| File | Scope | Git? |
|------|-------|------|
| `~/.claude/settings.json` | All your projects (personal defaults) | No |
| `.claude/settings.json` | This project (shared with team) | Yes |
| `.claude/settings.local.json` | This project (your overrides) | No (gitignored) |

**Precedence**: Organization-managed > Project > User > Defaults. For permissions, more specific denials override broader allows.

### What Goes Where

**`.claude/settings.json`** (shared): hooks the team uses, allowed tools, MCP servers everyone needs, default permission mode.

**`.claude/settings.local.json`** (personal): API tokens, machine-specific paths, personal MCP servers, sandbox overrides.

**`~/.claude/settings.json`** (global): your preferred theme, vim mode, global hooks (e.g., notifications), default model.

### Permission Modes

| Mode | Behavior |
|------|----------|
| `plan` | Read-only analysis, no edits |
| `auto` | Classifier-based approval for common operations |
| `acceptEdits` | Skip permission prompts for file edits |
| `dontAsk` | Only pre-approved tools, no prompts |

---

## 15. Common Mistakes

Pitfalls to watch for when setting up and using Claude Code:

1. **Bloated CLAUDE.md** — over 150 lines causes Claude to deprioritize instructions. Keep it lean; use `@` imports and path-scoped rules for details.
2. **Kitchen-sink sessions** — mixing unrelated tasks in one session pollutes context. Use `/clear` between tasks.
3. **Missing verification** — if Claude can't verify its work (no test command, no build check), it can't catch its own mistakes. Always provide verification commands.
4. **Vague instructions** — "write clean code" is unenforceable. "Use 2-space indentation" and "prefix private methods with underscore" are actionable.
5. **Over-broad hook matchers** — a `.*` matcher fires on every tool call. Scope hooks tightly with `matcher` and `if:` fields.
6. **Secrets in shared settings** — API tokens and credentials go in `.claude/settings.local.json` (gitignored), never in `.claude/settings.json`.
7. **Missing codebase map** — without a File Map and Entry Points in ARCHITECTURE.md, Claude wastes context crawling the repo every session. Keep the map current.
8. **Duplicating enforcement** — if a hook enforces linting, don't also describe linting rules in CLAUDE.md. Hooks guarantee execution; CLAUDE.md is guidance that can be deprioritized under context pressure.

---

## 16. Scaffolding Checklist

This template provides items 2-9 out of the box. When using this template for a new project:

1. Copy this template into your new project directory
2. `git init` and make the initial commit
3. Customize `CLAUDE.md` — fill in project name, build commands, conventions, constraints
4. Customize `.claude/settings.json` — replace `[REPLACE: ...]` placeholders in hooks with real commands
5. Replace `.claude/rules/_example.md` with path-scoped rule files for your project layers
6. Fill in `docs/ARCHITECTURE.md` with your actual module structure
7. Verify: start a new Claude Code session and confirm CLAUDE.md loads correctly

### Already provided by this template
- `.gitignore` (includes `.claude/settings.local.json`)
- `CLAUDE.md` structure with `@` imports
- `.claude/rules/_example.md` placeholder
- `.claude/skills/closeout/` and `/update-template` skills
- `.claude/agents/` (architecture-reviewer, security-reviewer, test-writer)
- `.claude/settings.json` with hook scaffolding
- `docs/ARCHITECTURE.md` template
- `docs/plans/` structure (TODO.md, BACKLOG.md, features/_TEMPLATE.md)
- `docs/DECISIONS.md` for ADRs

---

*Adapted from research on Claude Code documentation and community best practices.*

**Sources:**
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [How Claude Remembers Your Project](https://code.claude.com/docs/en/memory)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Writing a Good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
