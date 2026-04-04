# Claude Code Project Setup Guide
## Universal Reference for Any Project

> **Purpose**: Framework-agnostic reference for setting up any project with Claude Code. Copy and adapt the patterns here for each new project. This guide covers Claude Code's configuration system and workflow principles — not any specific language or framework.

---

## 1. CLAUDE.md Best Practices

The `CLAUDE.md` file is loaded into every Claude session. Keep it **under 200 lines** and focused on things Claude cannot infer from the code alone.

### What to Include
- **Architecture reference**: `@docs/ARCHITECTURE.md` (or wherever yours lives)
- **Current work**: `@docs/plans/TODO.md`
- **Build & test commands**: The exact commands to build, test, and run the project
- **Code conventions**: Naming, patterns, and rules that aren't obvious from reading the code
- **Hard constraints**: Things Claude must never do (e.g., no third-party packages, no network calls)
- **Planning workflow**: Where tasks are tracked, how to create feature plans
- **Git workflow**: Branch naming, commit style

### What NOT to Include
- Things Claude can infer from the code (language, framework, file structure)
- Detailed architecture (put that in a separate file and `@` import it)
- Long lists of files or modules (that's what ARCHITECTURE.md is for)
- Tutorials or explanations aimed at humans (CLAUDE.md is for Claude)

### Template

```markdown
# [Project Name]

## Architecture
@docs/ARCHITECTURE.md

## Current Work
@docs/plans/TODO.md

## Build & Test Commands
- Build: [your build command]
- Test: [your test command]
- Run: [your run command]

## Code Conventions
- [Convention 1]
- [Convention 2]

## Constraints
- [Hard constraint 1]
- [Hard constraint 2]

## Git Workflow
- Branch naming: feature/description, fix/description, refactor/description
- Commit messages: imperative mood, under 72 chars
- One logical change per commit

## Planning
- Active tasks: docs/plans/TODO.md — check at session start
- Before multi-step features, create a plan in docs/plans/features/
- Update TODO.md when completing tasks
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

Create an architecture file (e.g., `docs/ARCHITECTURE.md` or root `ARCHITECTURE.md`) and import it from CLAUDE.md with `@`. This serves as the code map so Claude doesn't waste context crawling the codebase.

### What to Include
- **Dependency graph**: Which modules depend on which
- **Key abstractions**: Important interfaces, base classes, or patterns
- **Data flow**: How data moves through the system
- **Module index**: What lives where (directory → purpose → key files)

### Update Discipline
Update this file whenever you add new modules, entities, services, or change the dependency graph. It's the single source of truth Claude reads to understand the codebase structure.

### Template

```markdown
# Architecture Overview

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

## Module Index
| Directory | Contents | Key Files |
|-----------|----------|-----------|
| [path/] | [description] | [files] |
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

MCP servers can be configured in `.claude/settings.json` or the dedicated `.claude/mcp.json`:

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

- Reference files with `@path/to/file` instead of asking Claude to search
- Use subagents for codebase exploration so findings are summarized, not dumped into context
- Scope investigations: "look at src/Data/" not "find where the database is configured"
- After the second correction on the same issue, `/clear` and rewrite the prompt

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

1. **Bloated CLAUDE.md** — over 200 lines causes Claude to deprioritize rules. Keep it lean; use `@` imports and path-scoped rules for details.
2. **Kitchen-sink sessions** — mixing unrelated tasks in one session pollutes context. Use `/clear` between tasks.
3. **Missing verification** — if Claude can't verify its work (no test command, no build check), it can't catch its own mistakes. Always provide verification commands.
4. **Vague instructions** — "write clean code" is unenforceable. "Use 2-space indentation" and "prefix private methods with underscore" are actionable.
5. **Over-broad hook matchers** — a `.*` matcher fires on every tool call. Scope hooks tightly with `matcher` and `if:` fields.
6. **Secrets in shared settings** — API tokens and credentials go in `.claude/settings.local.json` (gitignored), never in `.claude/settings.json`.

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
- `.claude/agents/` (architecture-reviewer, test-writer)
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
