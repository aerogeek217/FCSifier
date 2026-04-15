# Architecture Overview

> **Status after Phase 2 (data plumbing):** Svelte 5 + Vite + TypeScript scaffold
> is in place; the pure FCS domain layer (`src/domain/fcs.ts`) and the canonical
> enums (`data/features.json`, `data/fidelity.json`) are done; the full EASA seed
> dataset (`data/tasks.csv` — 122 tasks; `data/task_fcs.csv` — 244 rows;
> `data/devices.json` — 3 illustrative presets) is in place and the loader
> (`src/data/loader.ts`) joins them into a typed `{ features, tasks, devices }`.
> The Svelte app still renders a placeholder; the two product views (by-task /
> by-device) land in Phase 3. See `docs/plans/features/fcsifier-mvp.md` for the
> phased plan.

## File Map

```
CS-FSTD/
  index.html             # Vite entry; references /src/app.ts
  package.json           # Dev-only deps (Vite, Svelte, TS, tsx, svelte-check) + scripts
  vite.config.ts         # Vite config (base: './', publicDir: 'public'); also a
                         #   tiny inline plugin mirrors /data/ into dev + dist
  svelte.config.js       # Svelte compiler opts (runes mode)
  tsconfig.json          # Strict TS; extends @tsconfig/svelte
  public/
    .nojekyll            # Copied into /dist/ by Vite; disables Jekyll on GH Pages
  src/
    app.ts               # Mounts <App /> into #app
    App.svelte           # Top-level component (currently placeholder)
    data/
      csv.ts             # Minimal CSV parser (RFC 4180-ish); TS port of earlier csv.js
      loader.ts          # parseDataset() / loadDataset(): joins features + tasks
                         #   + task_fcs + devices into a typed { features, tasks,
                         #   devices } graph; rejects unknown fidelity codes
    domain/
      fcs.ts             # Pure FCS domain: Fidelity/Fcs/Feature/TrainingLevel types,
                         #   compare / rollup / authorizes / parseFcs / formatFcs
  styles/
    main.css             # Global styles (not yet imported; Phase 3)
  data/
    features.json        # Canonical 14 ICAO 9625 features, canonical column order
    fidelity.json        # Ordered fidelity enum: ["N","G","R","S"]
    tasks.csv            # 122 training tasks (aeroplane + helicopter) extracted
                         #   from EASA Opinion 01/2025 Appendix 2
    task_fcs.csv         # 244 rows: one per (task, T|TP) pair; 14 feature columns
                         #   holding S|R|G|N per feature, or '-' for "not performed
                         #   in an FSTD" (whole-row marker)
    devices.json         # 3 illustrative FSTD presets (aeroplane FFS, aeroplane
                         #   FTD, helicopter FFS); user presets go to localStorage
                         #   only (Phase 3)
  scripts/
    check-runtime-deps.sh  # Greps dist/ for http(s):// refs; build fails if any leak in
    extract-easa.ts      # One-shot PDF→CSV extractor (run via tsx); seeds
                         #   tasks.csv and task_fcs.csv from docs/EASA/extracted/
  test/
    csv.test.ts          # CSV parser tests (6 cases)
    fcs.test.ts          # FCS domain tests (29 cases: compare, rollup, authorizes,
                         #   parseFcs/formatFcs, canonical-enum guards)
    loader.test.ts       # Loader tests (14 cases incl. integration load against
                         #   the committed dataset)
    fixtures/            # Tiny 3-feature / 4-task dataset used by loader tests
  dist/                  # Vite build output (gitignored)
  docs/
    plans/               # Task tracking and feature plans
    ARCHITECTURE.md      # This file
    DECISIONS.md         # Architecture decision records (ADRs)
    WORKFLOW.md          # End-to-end development workflow reference
    EASA/                # Source PDFs (PDFs gitignored) + extracted/ text
    reference/           # Source-to-model mapping notes (easa-sources.md)
  .claude/               # Claude Code config (skills, agents, rules, hooks)
```

## Entry Points

| Entry Point | Command / File | Purpose |
|-------------|----------------|---------|
| Dev server | `npm run dev` | Vite dev server; serves `index.html`, HMR for `.svelte`/`.ts` |
| Build | `npm run build` | `vite build` + `scripts/check-runtime-deps.sh`; emits `/dist/` |
| Preview build | `npm run preview` | Serves `/dist/` as a static site |
| Tests | `npm test` | `node --import tsx --test "test/*.test.ts"` |
| Type / Svelte check | `npm run check` | `svelte-check --tsconfig ./tsconfig.json` |

## Dependency Graph

```
index.html --> src/app.ts                      (Vite rewrites at build/dev time)
src/app.ts --> svelte (mount)
src/app.ts --> src/App.svelte

src/domain/fcs.ts                              (no imports — pure, framework-free)

src/data/loader.ts --> src/data/csv.ts
src/data/loader.ts --> src/domain/fcs.ts        (types + isFidelity + FEATURE_CODES)
src/data/loader.ts --> fetch(data/*.{csv,json}) (at runtime, in loadDataset())

# Not yet wired (Phase 3+):
#   src/App.svelte --> src/routes/*.svelte + src/lib/*.svelte + src/data/loader.ts
```

No external runtime dependencies. The Svelte runtime is compiled into the bundle
by Vite; `check-runtime-deps.sh` enforces that no `http(s)://` reference lands in
`/dist/`.

## Key Abstractions

| Abstraction | Location | Purpose |
|-------------|----------|---------|
| `parseCsv()` | `src/data/csv.ts` | Parses CSV text into `{headers, rows}` |
| `App` | `src/App.svelte` | Placeholder root; replaced in Phase 3 by tab nav + routed view |
| `Fidelity`, `Fcs`, `Feature`, `TrainingLevel` | `src/domain/fcs.ts` | Core types: tiered fidelity enum, per-feature vector, feature row shape, T/TP toggle |
| `compare`, `rollup`, `authorizes` | `src/domain/fcs.ts` | FCS vector algebra: tier ordering (`N<G<R<S`), per-feature max, per-feature ≥ check |
| `parseFcs`, `formatFcs`, `isFidelity` | `src/domain/fcs.ts` | Hash-query codec for `?fcs=S,S,R,…` and runtime validation |
| `parseDataset`, `loadDataset` | `src/data/loader.ts` | Joins `features.json`, `tasks.csv`, `task_fcs.csv`, `devices.json` into a typed `{ features, tasks, devices }`; `parseDataset` is pure (used by tests), `loadDataset` wraps `fetch` |
| `TaskRow`, `Device`, `Dataset`, `AircraftCategory` | `src/data/loader.ts` | Loader-shaped types; each `TaskRow` carries `T?: Fcs \| null` and `TP?: Fcs \| null` (absent = no row; null = "not performed in an FSTD") |
| *(Phase 3)* `FcsMatrix`, `DevicePresets`, hash router | `src/lib/` | FCS vector widget, preset picker, hash-encoded state |

## Data Flow *(target state — Phase 3)*

1. Browser loads `index.html`; Vite-emitted JS mounts `<App />` into `#app`.
2. `loader.ts` fetches `data/{features.json, tasks.csv, task_fcs.csv, devices.json}` and returns a typed `{ features, tasks, devices }` (works today; not yet wired into the UI).
3. A shared `$state` store (Svelte 5 runes) holds selected tasks, device FCS, active `T`/`TP` level, and aircraft category.
4. `ByTask.svelte` derives the required FCS via `rollup()`; `ByDevice.svelte` derives the authorised task list via `authorizes()`.
5. The hash router serialises state into `location.hash` so views are shareable.

## Where to Find Things

| To do this... | Look here |
|---------------|-----------|
| Add or tweak a build/test script | `package.json` scripts |
| Change how CSV is parsed | `src/data/csv.ts` |
| Confirm no third-party URLs leak into the build | `scripts/check-runtime-deps.sh` |
| Tweak Svelte compiler options | `svelte.config.js` |
| Adjust Vite config (base path, publicDir, etc.) | `vite.config.ts` |
| Change TS strictness or path aliases | `tsconfig.json` |
| Static assets that must ship as-is | `public/` (copied verbatim to `/dist/`) |
| Replace the placeholder UI | `src/App.svelte` + (Phase 3) `src/routes/`, `src/lib/` |
| Add / edit FCS domain logic | `src/domain/fcs.ts` (+ `test/fcs.test.ts`) |
| Change the canonical feature list or fidelity order | `data/features.json` / `data/fidelity.json` |
| Add or edit task / device data | `data/{tasks.csv, task_fcs.csv, devices.json}` |
| Re-seed tasks.csv / task_fcs.csv from the EASA PDFs | `node --import tsx scripts/extract-easa.ts` (output is human-reviewed; header lists tasks known to need hand-fixup) |
| Change how tasks + devices are joined | `src/data/loader.ts` (+ `test/loader.test.ts`) |
| Deploy the site | *(Phase 4)* `.github/workflows/pages.yml` will build + publish `/dist/` |

---

**Update this file whenever you add new directories, entry points, modules, or navigation targets.**
