# Architecture Overview

> **Status after Phase 4 (CI + docs):** The full MVP stack is wired and
> deployable. Shared runes state (`src/lib/state.svelte.ts`) drives a hash
> router (`src/lib/router.svelte.ts`), an `FcsMatrix` widget, a
> `DevicePresets` picker (built-in + `localStorage`), and three product
> views: `src/routes/Grid.svelte` (default — task×feature matrix with a
> blue fidelity gradient, red cells where a task requirement exceeds the
> selected reference FCS, a hide-exceeding toggle, and copy-as-TSV /
> copy-FCS buttons), `ByTask.svelte`, and `ByDevice.svelte`. `App.svelte`
> hosts the tab nav plus shared T/TP and aircraft-category controls, and
> loads the dataset once on mount. `.github/workflows/pages.yml` runs
> `npm run check`, `npm test` (49/49), and `npm run build` (which invokes
> `check-runtime-deps.sh`) on every push to `main`, then publishes `/dist`
> to GitHub Pages. **Not yet verified:** end-to-end browser smoke-test of
> tab nav, preset load/save, and shareable URL round-trip; first live
> Pages deploy. See `docs/plans/features/fcsifier-mvp.md` for the phased
> plan and `docs/DECISIONS.md` for the ADRs behind the data model,
> toolchain, and URL grammar choices.

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
    App.svelte           # Tab nav, shared T/TP + category controls, dataset loader,
                         #   route host (swaps Grid / ByTask / ByDevice on currentRoute)
    data/
      csv.ts             # Minimal CSV parser (RFC 4180-ish); TS port of earlier csv.js
      loader.ts          # parseDataset() / loadDataset(): joins features + tasks
                         #   + task_fcs + devices into a typed { features, tasks,
                         #   devices } graph; rejects unknown fidelity codes
    domain/
      fcs.ts             # Pure FCS domain: Fidelity/Fcs/Feature/TrainingLevel types,
                         #   compare / rollup / authorizes / parseFcs / formatFcs
    lib/
      state.svelte.ts    # Shared AppState (runes): dataset, selectedTaskIds,
                         #   deviceFcs, level (T|TP), category. Derived: selected
                         #   tasks, requiredFcs rollup, drivingTasksByFeature,
                         #   tasksInCategory, deviceBuckets (authorised / not /
                         #   N/A / no-requirement).
      router.svelte.ts   # Hash router: bidirectional sync between location.hash
                         #   and AppState via $effect.root; encodes ?fcs= / ?tasks=
                         #   / ?level= / ?cat=; history.replaceState on writes.
      FcsMatrix.svelte   # Feature-vector table; mode: 'read' | 'edit'; optional
                         #   driving-task annotation row in read mode.
      DevicePresets.svelte # Load/save/delete device presets; merges
                         #   data/devices.json with localStorage user presets.
    routes/
      Grid.svelte        # Default tab. Task×feature matrix of fidelity requirements
                         #   (tasksInCategory × features) at the active T/TP level.
                         #   Cells use a blue gradient N→G→R→S; when a reference FCS
                         #   is set, cells where task > device render red. Collapsible
                         #   FCS editor (FcsMatrix edit-mode + DevicePresets), search,
                         #   hide-exceeding toggle, and Copy-task-list (TSV) /
                         #   Copy-FCS (labelled) buttons via navigator.clipboard.
      ByTask.svelte      # Searchable multi-select task list + required-FCS matrix
                         #   + N/A and no-requirement buckets.
      ByDevice.svelte    # Editable FCS matrix + preset controls + authorised-task
                         #   list + not-authorised / N/A / no-requirement buckets.
  styles/
    main.css             # Global styles; imported from src/App.svelte
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
  .github/
    workflows/
      pages.yml          # CI: npm ci → check → test → build (runs
                         #   check-runtime-deps.sh) → deploy /dist to
                         #   GitHub Pages on push to main.
  .claude/               # Claude Code config (skills, agents, rules, hooks)
```

## Entry Points

| Entry Point | Command / File | Purpose |
|-------------|----------------|---------|
| Dev server | `npm run dev` (or double-click `dev.bat`) | Vite dev server; serves `index.html`, HMR for `.svelte`/`.ts` |
| Build | `npm run build` | `vite build` + `scripts/check-runtime-deps.sh`; emits `/dist/` |
| Preview build | `npm run preview` | Serves `/dist/` as a static site |
| Tests | `npm test` | `node --import tsx --test "test/*.test.ts"` |
| Type / Svelte check | `npm run check` | `svelte-check --tsconfig ./tsconfig.json` |
| Deploy | Push to `main` | `.github/workflows/pages.yml`: check → test → build → publish `/dist` to GitHub Pages |

## Dependency Graph

```
index.html --> src/app.ts                       (Vite rewrites at build/dev time)
src/app.ts --> svelte (mount)
src/app.ts --> src/App.svelte

src/domain/fcs.ts                               (no imports — pure, framework-free)

src/data/loader.ts --> src/data/csv.ts
src/data/loader.ts --> src/domain/fcs.ts        (types + isFidelity + FEATURE_CODES)
src/data/loader.ts --> fetch(data/*.{csv,json}) (at runtime, in loadDataset())

src/lib/state.svelte.ts  --> src/domain/fcs.ts, src/data/loader.ts (types only)
src/lib/router.svelte.ts --> src/lib/state.svelte.ts, src/domain/fcs.ts
src/lib/FcsMatrix.svelte --> src/domain/fcs.ts
src/lib/DevicePresets.svelte --> src/data/loader.ts (types), localStorage

src/routes/Grid.svelte     --> src/lib/state.svelte.ts, src/lib/FcsMatrix.svelte,
                               src/lib/DevicePresets.svelte, src/domain/fcs.ts
                               (compare, formatFcs), navigator.clipboard
src/routes/ByTask.svelte   --> src/lib/state.svelte.ts, src/lib/FcsMatrix.svelte
src/routes/ByDevice.svelte --> src/lib/state.svelte.ts, src/lib/FcsMatrix.svelte,
                               src/lib/DevicePresets.svelte

src/App.svelte --> src/data/loader.ts (loadDataset)
src/App.svelte --> src/lib/state.svelte.ts, src/lib/router.svelte.ts
src/App.svelte --> src/routes/Grid.svelte, src/routes/ByTask.svelte,
                   src/routes/ByDevice.svelte
src/App.svelte --> styles/main.css (import)
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
| `AppState`, `appState` | `src/lib/state.svelte.ts` | Singleton runes store; holds `dataset`, `selectedTaskIds`, `deviceFcs`, `level`, `category` and exposes `$derived` buckets used by both views |
| `currentRoute`, `startRouter`, `navigate` | `src/lib/router.svelte.ts` | Hash ↔ state sync via `$effect.root`; initial `readHash()` populates state, `writeHash()` is idempotent so hashchange ↔ state writes don't ping-pong |
| `FcsMatrix` | `src/lib/FcsMatrix.svelte` | Feature-vector table; `mode: 'read' \| 'edit'`; edit mode uses dropdown-per-feature; read mode can annotate with driving tasks |
| `DevicePresets` | `src/lib/DevicePresets.svelte` | Built-in + `localStorage` preset picker (`fcsifier:user-presets`); emits `onLoad(device)` to populate `deviceFcs` |
| `Grid`, `ByTask`, `ByDevice` | `src/routes/` | The three product views; all consume `appState` and share the tabbed shell in `App.svelte`. `Grid` is the default tab and the only view that renders the full task×feature matrix of requirements. |

## Data Flow

1. Browser loads `index.html`; Vite-emitted JS mounts `<App />` into `#app`.
2. `App.svelte` calls `startRouter()` (reads `location.hash` into `appState`) and `loadDataset('./data/')`; the resolved dataset is assigned to `appState.dataset`.
3. Shared `$state` on `appState` drives all three views: `selectedTaskIds`, `deviceFcs`, `level`, `category`.
4. `Grid.svelte` iterates `appState.tasksInCategory`, reads each task's FCS at the active level, and colours each cell via `compare(taskFidelity, deviceFidelity)` (red when >, blue gradient otherwise); `ByTask.svelte` reads `appState.requiredFcs` (per-feature `rollup` of selected tasks at the active level) and `appState.drivingTasksByFeature`; `ByDevice.svelte` reads `appState.deviceBuckets` (partitioned via `authorizes`).
5. The router's `$effect` serialises `appState` back into `location.hash` via `history.replaceState`, so every view (route + selection) is shareable as a URL. `grid` and `by-device` both persist `?fcs=` to the hash; `by-task` persists `?tasks=`.

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
| Change shared selection / filter state or derived buckets | `src/lib/state.svelte.ts` |
| Change the URL grammar or add a new hash param | `src/lib/router.svelte.ts` (`readHash` + `writeHash`) |
| Tweak the FCS matrix layout, colour coding, or dropdowns | `src/lib/FcsMatrix.svelte` |
| Change preset storage (key, shape, built-in vs. user) | `src/lib/DevicePresets.svelte` |
| Change the by-task view (list, search, buckets) | `src/routes/ByTask.svelte` |
| Change the by-device view (layout, buckets, actions) | `src/routes/ByDevice.svelte` |
| Change the grid view (colours, hide-exceeding, copy formats, sticky column) | `src/routes/Grid.svelte` |
| Change the tab nav, shared controls, or the data-load flow | `src/App.svelte` |
| Add / edit FCS domain logic | `src/domain/fcs.ts` (+ `test/fcs.test.ts`) |
| Change the canonical feature list or fidelity order | `data/features.json` / `data/fidelity.json` |
| Add or edit task / device data | `data/{tasks.csv, task_fcs.csv, devices.json}` |
| Re-seed tasks.csv / task_fcs.csv from the EASA PDFs | `node --import tsx scripts/extract-easa.ts` (output is human-reviewed; header lists tasks known to need hand-fixup) |
| Change how tasks + devices are joined | `src/data/loader.ts` (+ `test/loader.test.ts`) |
| Change the deploy pipeline or enable/disable a CI step | `.github/workflows/pages.yml` |

---

**Update this file whenever you add new directories, entry points, modules, or navigation targets.**
