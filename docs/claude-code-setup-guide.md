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

## 2. Path-Scoped Rules (.claude/rules/)

Rules load **only** when Claude is working on files matching the specified paths. This keeps context lean by not loading irrelevant instructions.

### Format

```markdown
---
paths:
  - "src/data/**"
---
# Data Layer Rules
- [Rule 1]
- [Rule 2]
```

The `paths` field uses glob patterns. Rules fire when Claude reads or edits matching files.

### Guidelines
- One rule file per logical layer or concern (data, UI, testing, etc.)
- Keep each rule file focused — 5-15 rules max
- Rules should be things Claude would otherwise get wrong, not obvious best practices
- Use rules to encode project-specific conventions that differ from defaults

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

---

## 7. Hooks (.claude/settings.json)

Hooks run shell commands automatically in response to Claude's tool use.

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
            "command": "[your verification command]",
            "timeout": 30
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo '{\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"additionalContext\":\"[your reminder message]\"}}'",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### Patterns
- **PostToolUse (Write|Edit)**: Run a quick build/lint check after every file edit so Claude catches errors immediately
- **PreToolUse (Bash)**: Inject constraint reminders before shell commands (e.g., package policy, deployment rules)

### Guidelines
- Keep hooks lightweight and fast (under 30s timeout)
- Hooks that output JSON with `hookSpecificOutput` inject context into Claude's next response
- Heavy operations (full test suites, doc updates) belong in skills, not hooks
- Use `matcher` to scope hooks to specific tools — don't run expensive checks on every tool call

---

## 8. Agents (.claude/agents/)

Agents are specialized subagents that Claude can delegate to for focused tasks.

### Agent Anatomy

```markdown
---
name: agent-name
description: One-line description
tools: Read, Grep, Glob
model: sonnet
---
You are a [role]. Check that:
- [Check 1]
- [Check 2]

Report [what to report] with [what detail level].
```

### Guidelines
- Restrict tools to what the agent actually needs (read-only agents use Read, Grep, Glob)
- Use `model: sonnet` for cost efficiency on review/analysis tasks
- Use `model: opus` only when the agent needs to write complex code
- Common agent types: architecture reviewer, test writer, security reviewer

---

## 9. MCP Servers

MCP (Model Context Protocol) servers give Claude access to external tools and services.

### Configuration

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@scope/package-name", "arg1"]
    }
  }
}
```

Place in `.claude/settings.json` alongside hooks. Use `.claude/settings.local.json` (gitignored) for auth tokens or personal configuration.

### Common MCP Servers
| Server | Purpose |
|--------|---------|
| GitHub (`gh` CLI) | Issues, PRs, code review |
| Google Stitch | AI-powered UI design and code generation |
| SQLite | Direct database querying |
| Memory Graph | Persistent relationship tracking (advanced) |

---

## 10. Session Discipline

1. **Start fresh**: Use `/clear` between unrelated tasks. Context pollution degrades performance.
2. **Explore, then plan, then code**: Use Plan Mode (Shift+Tab) for investigation. Switch to Normal Mode for implementation.
3. **Verify everything**: Always provide Claude a way to verify its work (tests, build, browser check).
4. **Update docs after structural changes**: Keep ARCHITECTURE.md and TODO.md current.

---

## 11. Commands Reference

| Command | When to Use |
|---------|-------------|
| `/init` | First-time CLAUDE.md generation |
| `/clear` | Between unrelated tasks |
| `/compact` | When context is getting full mid-task |
| `/memory` | View/edit auto memory |
| `/hooks` | Browse configured hooks |
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

## 14. Scaffolding Checklist

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
- `.claude/skills/closeout/` skill
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
