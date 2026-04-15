# Architecture Overview

## File Map

```
CS-FSTD/
  index.html          # App entry point — loaded by GitHub Pages
  .nojekyll           # Disables Jekyll on GitHub Pages (serve files as-is)
  src/
    main.js           # App bootstrap; wires loader + views
    data/
      loader.js       # fetch + parse CSV/JSON from data/
      csv.js          # Minimal CSV parser (RFC 4180-ish)
    ui/
      table.js        # Sortable/filterable table rendering
      router.js       # Hash-based view switcher (task view vs tool view)
  styles/
    main.css          # Global styles
  data/
    tools.json        # Tool registry (id, name, description, category)
    tasks.csv         # Task list (id, name, description, category)
    mappings.csv      # Many-to-many task↔tool links (task_id, tool_id)
  test/
    csv.test.js       # CSV parser tests
    loader.test.js    # Loader tests (uses fixtures)
    fixtures/         # Sample data files for tests
  docs/
    plans/            # Task tracking and feature plans
    ARCHITECTURE.md   # This file
    DECISIONS.md      # Architecture decision records (ADRs)
    WORKFLOW.md       # End-to-end development workflow reference
  .claude/            # Claude Code config (skills, agents, rules, hooks)
```

## Entry Points

| Entry Point | File | Purpose |
|-------------|------|---------|
| Web | `index.html` | Loads `src/main.js` as an ES module |
| Tests | `node --test test/` | Runs all `*.test.js` files |

## Dependency Graph

```
index.html --> src/main.js
src/main.js --> src/data/loader.js
src/main.js --> src/ui/table.js
src/main.js --> src/ui/router.js
src/data/loader.js --> src/data/csv.js
src/data/loader.js --> data/*.{csv,json}   (fetched at runtime)
```

No external runtime dependencies. All modules are plain ES modules.

## Key Abstractions

| Abstraction | Location | Purpose |
|-------------|----------|---------|
| `loadDataset()` | `src/data/loader.js` | Fetches and parses a data file, returning an array of rows |
| `parseCsv()` | `src/data/csv.js` | Parses CSV text into `{headers, rows}` |
| `renderTable()` | `src/ui/table.js` | Builds a sortable/filterable HTML table from rows |
| `route()` | `src/ui/router.js` | Maps `#/tasks` and `#/tools` hashes to views |

## Data Flow

1. Browser loads `index.html`, which pulls in `src/main.js` as an ES module.
2. `main.js` calls `loadDataset()` for each file in `data/`.
3. `loader.js` fetches the file (relative URL), parses JSON or CSV, returns rows.
4. `main.js` joins tasks↔tools via `mappings.csv` and hands results to UI modules.
5. `router.js` toggles between task-centric and tool-centric views on hash change.

## Where to Find Things

| To do this... | Look here |
|---------------|-----------|
| Add a new data file | `data/` + update `src/main.js` to load it |
| Change how CSV is parsed | `src/data/csv.js` |
| Add a new view (e.g., category browse) | `src/ui/` + register in `src/ui/router.js` |
| Change table styling | `styles/main.css` |
| Add a task or tool | `data/tasks.csv`, `data/tools.json`, link in `data/mappings.csv` |
| Deploy the site | Push to `main` — GitHub Pages serves from repo root |

---

**Update this file whenever you add new directories, entry points, modules, or navigation targets.**
