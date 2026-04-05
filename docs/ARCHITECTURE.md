# Architecture Overview

## File Map
<!-- Annotated directory tree. One line per directory/key file. -->
<!-- Update when adding new directories or moving files. -->

```
[project-root]/
  src/
    [module]/         # [5-10 word purpose]
  docs/
    plans/            # Task tracking and feature plans
    ARCHITECTURE.md   # This file — codebase navigation map
    DECISIONS.md      # Architecture decision records (ADRs)
    WORKFLOW.md       # End-to-end development workflow reference
  .claude/            # Claude Code config (skills, agents, rules, hooks)
    hooks/            # Pre/post tool-use guard scripts
```

## Entry Points

| Entry Point | File | Purpose |
|-------------|------|---------|
| [main] | [path/to/main] | [what it starts] |

## Dependency Graph

[Describe or diagram how modules depend on each other]

```
[Module A] --> [Module B]
[Module A] --> [Module C]
[Module B] --> (no dependencies)
[Module C] --> [Module B]
```

## Key Abstractions

| Abstraction | Location | Purpose |
|-------------|----------|---------|
| [Name] | [path/to/file] | [What it does] |

## Data Flow

1. [Step 1: Entry point]
2. [Step 2: Processing]
3. [Step 3: Output]

## Where to Find Things

| To do this... | Look here |
|---------------|-----------|
| [add a new API endpoint] | [src/api/routes/] |
| [change the database schema] | [src/data/migrations/] |
| [modify build configuration] | [path/to/config] |

---

**Update this file whenever you add new directories, entry points, modules, or navigation targets.**
