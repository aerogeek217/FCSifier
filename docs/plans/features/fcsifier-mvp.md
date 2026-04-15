# Feature: FCSifier MVP — Task ↔ FCS Cross-Reference

**Status**: Draft
**Date**: 2026-04-14

## Goal
Let a user (a) input an FCS (FSTD Capability Signature) and see which training tasks that device authorizes, or (b) input a set of training tasks and see the minimum FCS required, under the new unified CS-FSTD framework introduced by EASA Opinion 01/2025.

## Background — what the framework actually says

Under the new CS-FSTD, an FSTD is no longer graded with a single level (FFS Level D, FTD Level 2, etc.). Instead it carries an **FSTD Capability Signature (FCS)** — a *vector* of fidelity levels across 14 simulation features defined by ICAO Doc 9625 (flight deck, controls, aeroplane systems, ground/aero/engine models, sound, vibration, motion, visual, navigation, atmosphere, observer/instructor station — full canonical list below).

Each fidelity level per feature is one of four tiers, conventionally:

| Code | Name | Meaning (per CS FSTD.GEN.010) |
|------|------|---------------|
| `S`  | Specific       | Highest — tuned to the specific aircraft type and variant |
| `R`  | Representative | Intermediate — represents the type, may use data from a related variant |
| `G`  | Generic        | Lowest positive — characteristic of an aircraft class or group |
| `N`  | None           | Feature not installed/functional; if physically present, must not distract |

**The 14 features are canonical, in this column order** (FDK, CLH, CLO, SYS, GND, IGE, OGE, SND, VIB, MTN, VIS, NAV, ATM, OST — see `docs/reference/easa-sources.md` for full names and categories). Note: Appendix 3 GM1 Table 1 (line 520) has a one-off prose reference to `MOT`; the authoritative code is `MTN` per TOC, §2.10 heading, glossary (line 1311), and the Appendix 2 reporting templates (line 5041).

Training providers identify, **per training task**, the minimum fidelity required for each feature. A device is authorised to deliver a task iff, **for every feature**, the device's fidelity ≥ the task's required fidelity (`S > R > G > N`). This is the matching rule.

For a *set* of tasks, the required FCS is the **per-feature maximum** across the set. This is the "rollup" — there is no single scalar grade.

## Design Decisions

- **Data model is feature-vectorised, not scalar.** Each task and each (hypothetical) FSTD has one fidelity per feature. We do *not* model a single "level" column. This is the whole point of the new framework and shapes everything downstream.
- **Features are first-class data, not hard-coded.** `data/features.json` lists the 14 canonical ICAO 9625 features (id, name, short description) in the order above. Adding/renaming a feature is a data edit, not a code change.
- **Mappings live in a wide CSV** (`data/task_fcs.csv`): columns are `task_id`, `level` (`T` or `TP` — introduction-only vs. training-to-proficiency), plus one column per feature using the canonical codes `FDK, CLH, CLO, SYS, GND, IGE, OGE, SND, VIB, MTN, VIS, NAV, ATM, OST`. Cell value is `S|R|G|N` for real fidelity requirements, or `-` when the task is not performed in an FSTD (per Appendix 2 GM1). The loader maps an all-`-` row to a `null` FCS vector on the task, which surfaces as a separate "N/A" bucket in the UI. A task may have 0, 1, or 2 rows (both `T` and `TP`). This is the source of truth a human (or a script) maintains. The previous narrow `mappings.csv` is removed — it cannot express per-feature fidelity.
- **Rollup is a one-line reduce** in `src/domain/fcs.ts`: per feature, `max(level)` with the order `N < G < R < S`. Same module exposes `authorizes(deviceFcs, taskFcs)` for the inverse query.
- **Two pages, one data load.** `#/by-task` (pick tasks → required FCS + per-feature breakdown) and `#/by-device` (set device FCS sliders → list of authorised tasks). Both views consume the same in-memory dataset; no per-view fetches. Both honour a shared `T`/`TP` training-level toggle and an aircraft-category filter (`aeroplane` vs `helicopter` — the only two categories in the regulation).
- **T and TP are independent datasets.** A task may have a `TP` row, a `T` row, both, or neither. The shared level toggle picks which set of rows is used. Tasks missing a row at the active level are **dropped from the rollup and flagged** as "no requirement defined at this level" — we never substitute the other level's row as a floor. By-device authorisation treats a missing row at the active level the same way (excluded from the authorised list, shown in a "no requirement at this level" bucket).
- **URL grammar: everything inside `location.hash`.** Route + state co-located; the string after `#` is split on the first `?` into route path and query. Example: `#/by-device?fcs=S,S,R,G,N,G,R,R,R,R,S,R,G,N&level=TP&cat=aeroplane&tasks=t-014,t-022`. The query portion is parsed with `URLSearchParams`. `history.replaceState` on every state mutation so the back button steps between user navigations, not keystrokes.
- **Framework: Svelte 5 + Vite + TypeScript.** Chosen because (a) Svelte compiles its framework code *into* the output bundle, so the deployed site has no runtime external dependencies — Vite emits a self-contained `/dist` that GitHub Pages serves directly; (b) Svelte's reactivity (runes: `$state`, `$derived`) is a natural fit for the editable FCS matrix and cross-view hash state; (c) TypeScript gives us types on the fidelity enum, the feature-vector shape, and the `authorizes`/`rollup` contracts — exactly where correctness matters. The build toolchain (Vite, Svelte compiler, TS, test runner) is dev-time only; nothing external ships to the browser.
- **Data extraction is a separate, optional script** (`scripts/extract-easa.ts`) that parses the EASA appendix PDFs into the CSV/JSON shape. It runs at author time via `tsx`, not at user time. Manual maintenance of the CSV remains the supported path.
- **Source citations on every task row.** Each task carries a `source` field (e.g., `"Opinion 01/2025 App.1, Table A-3, row 14"`) so reviewers can audit a mapping back to the regulation. This is essential for any tool people might rely on for compliance discussions.
- **Device catalogue: canned presets + user-defined.** `data/devices.json` ships a small curated list of example FSTDs (id, name, vendor, aircraft_category, FCS vector, source). The by-device view has a "Load preset" dropdown that populates the editable matrix from the selected preset, and a "Save as preset" action that stores user-defined devices in `localStorage` only (never written to disk, never synced). The legacy `tools.json` is still deleted — it encodes the old single-level model and is schema-incompatible.
- **No login, no server persistence.** Route + selection state live in the URL hash so views are shareable (grammar above). User-defined device presets are the only localStorage usage.

## Runtime Dependency Audit (compile-time vs. runtime)

The "no runtime external dependencies" constraint is that the *deployed site* must not fetch third-party code or assets at runtime. Everything the browser executes must be emitted by the build.

| Concern | Decision |
|---------|----------|
| Svelte runtime | Compiled/tree-shaken into `/dist/assets/*.js` by Vite. No CDN. |
| CSS | Authored in `.svelte` files + `styles/main.css`, bundled by Vite into `/dist/assets/*.css`. |
| Fonts / icons | System font stack only. No Google Fonts, no icon CDNs. If icons are needed, inline SVG in the component. |
| Data (`data/*.{csv,json}`) | Served from the same origin — `/dist/data/` in the built output. Loader uses relative `fetch`. |
| Analytics / telemetry | None. |
| Source maps | Disabled in production build to avoid shipping toolchain metadata. |

Verification step before each release: `grep` the built `dist/index.html` and bundle entries for any `http://` / `https://` references. If anything shows up, fix it.

## Data Model

```
data/features.json
  [
    { "code": "FDK", "name": "Flight Deck",       "doc9625_ref": "..." },
    { "code": "CLH", "name": "Controls — Primary Flight", "doc9625_ref": "..." },
    { "code": "CLO", "name": "Controls — Other",   "doc9625_ref": "..." },
    { "code": "SYS", "name": "Aeroplane Systems",  "doc9625_ref": "..." },
    { "code": "GND", "name": "Ground Handling",    "doc9625_ref": "..." },
    { "code": "IGE", "name": "In-Ground-Effect Aerodynamics", "doc9625_ref": "..." },
    { "code": "OGE", "name": "Out-of-Ground-Effect Aerodynamics", "doc9625_ref": "..." },
    { "code": "SND", "name": "Sound",              "doc9625_ref": "..." },
    { "code": "VIB", "name": "Vibration",          "doc9625_ref": "..." },
    { "code": "MTN", "name": "Motion",             "doc9625_ref": "..." },
    { "code": "VIS", "name": "Visual",             "doc9625_ref": "..." },
    { "code": "NAV", "name": "Navigation",         "doc9625_ref": "..." },
    { "code": "ATM", "name": "Atmosphere / Environment", "doc9625_ref": "..." },
    { "code": "OST", "name": "Observer / Instructor Station", "doc9625_ref": "..." }
  ]

data/tasks.csv
  id, name, phase, aircraft_category, section, source, notes
  t-014, "Engine failure after V1", takeoff, aeroplane, "App.2 §3.4", "Opinion 01/2025 App.2 line 312", ""

  # aircraft_category ∈ {aeroplane, helicopter} — matches how the CS is organised.
  # No aircraft_class column; the regulation's matrices apply to all in-scope classes within a category.

data/task_fcs.csv
  task_id, level, FDK, CLH, CLO, SYS, GND, IGE, OGE, SND, VIB, MTN, VIS, NAV, ATM, OST
  t-014,   TP,    S,   S,   R,   S,   G,   R,   S,   R,   R,   R,   S,   R,   R,   G
  t-014,   T,     R,   R,   R,   R,   G,   G,   R,   G,   G,   G,   R,   G,   G,   G
  t-001,   TP,    -,   -,   -,   -,   -,   -,   -,   -,   -,   -,   -,   -,   -,   -
  t-001,   T,     -,   -,   -,   -,   -,   -,   -,   -,   -,   -,   -,   -,   -,   -

  # 'level' is T (introduction only) or TP (training to proficiency).
  # Cell value: S|R|G|N for a real fidelity requirement, or '-' when the task is not performed in an FSTD.
  # An all-'-' row loads as a null FCS vector on the task (separate "N/A" bucket in the UI).
  # A task may have both rows, one row, or neither.

data/fidelity.json    # the ordered enum, single source of truth
  ["N", "G", "R", "S"]
  # '-' in the raw CSV is NOT a fidelity level — it's the "task not performed in FSTD" marker,
  # handled by the loader (row → null) rather than by the ordering.

data/devices.json     # canned FSTD presets; users may add more via localStorage
  [
    {
      "id": "example-a320-ffs",
      "name": "Example A320 FFS (illustrative)",
      "vendor": "",
      "aircraft_category": "aeroplane",
      "fcs": { "FDK": "S", "CLH": "S", "CLO": "S", "SYS": "S", "GND": "S",
               "IGE": "S", "OGE": "S", "SND": "S", "VIB": "R", "MTN": "S",
               "VIS": "S", "NAV": "S", "ATM": "R", "OST": "R" },
      "source": "illustrative — not a real device"
    }
  ]
```

The canonical 14 feature codes above are the authoritative column order for `task_fcs.csv` and the encoding order for the hash-encoded `?fcs=` query string.

`tools.json` and `mappings.csv` from the scaffold are deleted — they encode the old single-level model and would mislead.

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `data/features.json`         | Create | ICAO 9625 feature list |
| `data/fidelity.json`         | Create | Ordered fidelity enum |
| `data/tasks.csv`             | Replace | Task catalogue (no fidelity columns) |
| `data/task_fcs.csv`          | Create | Wide table of required fidelity per task per feature |
| `data/devices.json`          | Create | Canned FSTD presets (id, name, vendor, category, FCS vector, source) |
| `data/mappings.csv`          | Delete | Superseded by `task_fcs.csv` |
| `data/tools.json`            | Delete | Schema-incompatible; replaced by `devices.json` + user localStorage |
| `package.json`                | Create | Dev deps: `svelte`, `vite`, `@sveltejs/vite-plugin-svelte`, `typescript`, `svelte-check`, `@tsconfig/svelte`, `tsx` (for the extraction script). Scripts: `dev`, `build`, `preview`, `test`, `check`. |
| `vite.config.ts`              | Create | Svelte plugin; `base: './'` for GH Pages path safety; copy `data/` into `/dist/data/` via `publicDir`. |
| `tsconfig.json`               | Create | Extends `@tsconfig/svelte`; strict mode on. |
| `svelte.config.js`            | Create | Compiler options (runes mode). |
| `src/app.ts`                  | Create | Svelte bootstrap; mounts `<App />` into `#app`. |
| `src/App.svelte`              | Create | Top-level layout: header, tab nav, `<svelte:component this={view} />`. |
| `src/domain/fcs.ts`           | Create | `compare`, `rollup`, `authorizes`, `parseFcs`, `formatFcs`, plus types (`Fidelity`, `Fcs`, `Feature`). Pure functions, framework-free. |
| `src/data/loader.ts`          | Rewrite | Load features + tasks + task_fcs together; typed return shape. |
| `src/data/csv.ts`             | Port    | Existing CSV parser ported to TypeScript; tests kept. |
| `src/routes/ByTask.svelte`    | Create | "Pick tasks → required FCS" view. |
| `src/routes/ByDevice.svelte`  | Create | "Set device FCS → list authorised tasks" view; hosts device preset controls. |
| `src/lib/FcsMatrix.svelte`    | Create | Reusable feature-vector widget; `mode: 'read' \| 'edit'` prop. |
| `src/lib/DevicePresets.svelte`| Create | Load/save device presets; reads `data/devices.json` + `localStorage`. |
| `src/lib/router.ts`           | Create | Hash router; splits `location.hash` on first `?` → route + `URLSearchParams`; parses `?fcs=` / `?tasks=` / `?level=` / `?cat=`. Uses `history.replaceState` on mutations. |
| `src/lib/state.svelte.ts`     | Create | Shared app state (selected tasks, device FCS, active `T`/`TP` level, aircraft-category filter) using Svelte 5 runes. |
| `src/main.js`                 | Delete  | Replaced by `src/app.ts`. |
| `src/ui/`                     | Delete  | Replaced by `src/routes/` and `src/lib/`. |
| `index.html`                  | Modify  | Moves to repo root as Vite entry; references `/src/app.ts`. |
| `styles/main.css`             | Modify  | Matrix table + dropdown styling; imported once from `App.svelte`. |
| `public/.nojekyll`            | Move    | From repo root into `public/` so Vite copies it to `/dist/`. |
| `scripts/extract-easa.ts`     | Create  | PDF → CSV extractor (text already in `docs/EASA/extracted/`); run via `tsx` by maintainer in Phase 2 to seed `task_fcs.csv`. Output is human-reviewed, not auto-committed. |
| `scripts/check-runtime-deps.sh` | Create | Greps `dist/` for `http(s)://` references — fails release if any exist. |
| `test/fcs.test.ts`            | Create  | `compare`, `rollup`, `authorizes` (edges: all `N`, ties, missing feature). |
| `test/csv.test.ts`            | Port    | Existing CSV parser tests, ported to TS. |
| `test/loader.test.ts`         | Create  | New schema, fixture-based. |
| `test/fixtures/`              | Create  | Tiny features + 3-task fixture exercising every fidelity level. |
| `docs/ARCHITECTURE.md`        | Modify  | Update file map, dependency graph, abstractions table, entry points (`npm run dev`, `npm run build`). |
| `docs/DECISIONS.md`           | Append  | Two ADRs: vectorised FCS model; Svelte 5 + Vite choice. |
| `.github/workflows/pages.yml` | Create  | CI: build with Vite, run `check-runtime-deps.sh`, deploy `/dist` to GitHub Pages. |
| `.gitignore`                  | Modify  | Add `dist/`. |
| `CLAUDE.md`                   | Modify  | Update Build/Test/Run commands to the npm scripts. |

## Tasks

**Phase 0 — toolchain (one-shot; no product code yet)**
- [ ] `npm init -y`; add dev deps (`svelte@^5`, `vite@^5`, `@sveltejs/vite-plugin-svelte`, `typescript`, `svelte-check`, `@tsconfig/svelte`, `tsx`)
- [ ] Create `vite.config.ts`, `svelte.config.js`, `tsconfig.json`, minimal `src/app.ts` + `src/App.svelte` that render "hello"
- [ ] Move `index.html` to Vite-entry form (references `/src/app.ts`); move `.nojekyll` into `public/`
- [ ] Confirm `npm run dev` serves the page and `npm run build` produces a self-contained `/dist/`
- [ ] Add `scripts/check-runtime-deps.sh` and wire it into the build flow
- [ ] Update `CLAUDE.md` Build/Test/Run commands; add `dist/` to `.gitignore`
- [ ] Port existing `src/data/csv.js` and its tests to TypeScript (baseline parity; no behaviour change)

**Phase 1 — domain core (do this first after toolchain; everything else depends on it)**
- [ ] Write `src/domain/fcs.ts` with `compare`, `rollup`, `authorizes`, `parseFcs`, `formatFcs`, plus the `Fidelity` (`"N"|"G"|"R"|"S"`), `Fcs`, `Feature`, and `TrainingLevel` (`"T"|"TP"`) types
- [ ] Write `test/fcs.test.ts` covering: ordering (`N < G < R < S`), rollup over empty/singleton/many, authorisation true/false at each tier, missing-feature handling, round-trip parse/format, rejection of unknown fidelity codes
- [ ] Add `data/features.json` (14 canonical codes in order) and `data/fidelity.json` (`["N","G","R","S"]`)

**Phase 2 — data plumbing**
- [ ] Replace `data/tasks.csv` with the new schema (`aircraft_category: aeroplane|helicopter` only; no `aircraft_class`)
- [ ] Create `data/task_fcs.csv` with 16 columns: `task_id`, `level` (`T` or `TP`), and the 14 canonical feature codes in order (FDK, CLH, CLO, SYS, GND, IGE, OGE, SND, VIB, MTN, VIS, NAV, ATM, OST); cell value is `S|R|G|N` or `-` for "not performed in FSTD"
- [ ] Write `scripts/extract-easa.ts` against `docs/EASA/extracted/appendix_2….txt` (aeroplane lines 234–557, helicopter lines 558–860); emit a draft `task_fcs.csv` + `tasks.csv`, diff against any existing file, **human reviews before commit** (not auto-committed)
- [ ] Run the extractor; seed the full set (not a sample) so UX validation is done against real data. Keep at least one null-FCS (`-`-row) task visible (§1.1 Performance calculation) for the N/A bucket
- [ ] Create `data/devices.json` with ~3 illustrative presets covering different FCS profiles (one high-fidelity aeroplane FFS, one mid-tier aeroplane FTD, one helicopter FFS); mark each `source: "illustrative"` — real-device data is out of scope for MVP
- [ ] Rewrite `src/data/loader.ts` to load + join `features.json`, `tasks.csv`, `task_fcs.csv`, `devices.json` into a typed `{ features, tasks, devices }` where each task has `{ T?: Fcs | null, TP?: Fcs | null }` (absent = no row at that level; `null` = row exists but all `-` → task not performed in FSTD)
- [ ] Loader tests against new fixtures in `test/fixtures/` covering: missing row, all-`-` row, mixed valid row, unknown fidelity code rejection

**Phase 3 — UI (Svelte components)**
- [ ] `src/lib/state.svelte.ts` — shared `$state` for selected tasks, device FCS, active training level (`T` vs `TP`), and aircraft category filter; `$derived` rollup / authorised-tasks / N/A-bucket / "no-requirement-at-this-level" bucket
- [ ] `src/lib/router.ts` — hash router that splits `location.hash` on the first `?` into route + `URLSearchParams`; bidirectional sync with shared state; `history.replaceState` on mutations; encodes `?fcs=` / `?tasks=` / `?level=` / `?cat=`
- [ ] `src/lib/FcsMatrix.svelte` — read-only and editable modes via prop; dropdown-per-feature in edit mode; column order driven by `features.json`
- [ ] `src/lib/DevicePresets.svelte` — "Load preset" dropdown reading `data/devices.json` merged with `localStorage`-stored user presets; "Save current as preset" action writing only to `localStorage`
- [ ] `src/routes/ByTask.svelte` — multi-select task list (left), required-FCS matrix (right), per-feature "driving task" annotation, T/TP toggle, dropped-task panel listing any selected tasks with no row at the active level or a null FCS (N/A)
- [ ] `src/routes/ByDevice.svelte` — editable FCS matrix (top) with preset controls, authorised-task list with filter chips (bottom), T/TP toggle, aircraft-category filter, separate N/A and "no-requirement-at-this-level" buckets
- [ ] `src/App.svelte` — tab nav, mounts the current route
- [ ] Verify shareable URLs: open `#/by-device?fcs=S,S,R,G,N,G,R,R,R,R,S,R,G,N&level=TP&cat=aeroplane` in a fresh tab and confirm state restores

**Phase 4 — CI, docs**
- [ ] `.github/workflows/pages.yml` — build, run `check-runtime-deps.sh`, deploy `/dist` to GitHub Pages
- [ ] Update `docs/ARCHITECTURE.md` (file map, dependency graph, "where to find things" rows; add devices.json and preset flow)
- [ ] Add ADRs to `docs/DECISIONS.md`: (1) vectorised FCS model with `T`/`TP` dimension; (2) Svelte 5 + Vite toolchain choice; (3) `MTN` vs `MOT` — Appendix 3 GM1 Table 1 uses `MOT` in prose but all structural/normative references use `MTN`, we follow the structural usage
- [ ] Update `docs/reference/easa-sources.md`: correct `MOT` → `MTN`, note the GM1 Table 1 discrepancy, correct the "matrix columns use short codes" claim (matrix columns use long names; codes come from Appendix 3)

## Resolved from Source PDFs (2026-04-14)

The EASA PDFs dropped into `docs/EASA/` have been mapped end-to-end — details in `docs/reference/easa-sources.md`:

- **Feature list confirmed:** 14 features (FDK, CLH, CLO, SYS, GND, IGE, OGE, SND, VIB, MTN, VIS, NAV, ATM, OST) in that exact column order from Appendix 2's training-matrix header and `CS FSTD.GEN.005` / Appendix 3 Table 1.
- **Fidelity levels confirmed:** `S > R > G > N`. The earlier working guess of `–` for the "not used" tier was wrong — the regulation uses `N` (None). Update `data/fidelity.json` to `["N","G","R","S"]`.
- **Training matrices located:** Appendix 2 holds two complete matrices — aeroplane (`extracted/appendix_2…txt` lines 234–557, ≈80 tasks across §§1, 2, 3, 3.4, 3.8) and helicopter (lines 558–860, similar structure). Each task has `TP` (Training to Proficiency) and `T` (Training — introduction only) rows; each row is 14 S/R/G/N values.
- **Rollup is regulation-defined** ("per-feature maximum across selected tasks", Appendix 2 AMC guidance ~line 3394). The plan's `rollup` function is correct.
- **No cross-feature compensation** — strict per-feature ≥ matching. `authorizes` stays as-is.
- **`TP` vs `T` is a modelled dimension, not two separate datasets.** The 14-value row pair per task means the CSV needs a `level` column (`T` or `TP`) and the UI needs a toggle for "introduction only vs. to proficiency".

## Open Questions (post-source-review)

- **Aircraft-system granularity.** `CS FSTD.QB.010(c)` allows individual aircraft systems within the SYS feature to hold different fidelity levels. MVP models SYS as one dimension; a sub-system breakdown is a later revision.
- **Tasks with no FCS row** (e.g., §1.1 Performance calculation, §4.6, §4.9 per Appendix 2 GM1). Represent as `null` fidelity vector and label "not performed in an FSTD" — do not collapse to all-`N`.
- **Take-off/landing + instrument-approach combinations.** The regulation expects these to be combined; the rollup handles it naturally, but the by-task view should expose the combination intent explicitly.
- **"Driving task" UX.** When rollup is `S` on one feature because of one task and `G` on another because of another, annotate each per-feature requirement with the task(s) that forced it. Trivial given the data shape.
- **Versioning.** Tag each `task_fcs.csv` row with `regulation_version` (e.g., `opinion-01-2025-draft`) so future EASA revisions don't silently overwrite history.
- **Single-pilot non-complex aeroplanes** are explicitly out of scope of the task-to-tool matrices per Appendix 2 GM1 — surface this in the aircraft-class picker.

## Completion Criteria

- All tests pass (`npm test`), including edge cases for the rollup and authorisation rules
- `npm run check` (svelte-check + tsc) passes with zero errors
- `npm run build` succeeds and `/dist` runs from a static server with no console errors
- `scripts/check-runtime-deps.sh` passes against the built `/dist/` (no `http(s)://` references in emitted JS/HTML/CSS)
- Both views work end-to-end against the seed dataset; shareable URLs round-trip correctly; `T` vs `TP` toggle produces distinct results
- GitHub Pages workflow deploys `/dist` successfully on push to `main`
- `ARCHITECTURE.md` reflects the new file layout, toolchain, and data model
- A non-author can read `docs/plans/features/fcsifier-mvp.md` + `ARCHITECTURE.md` and add a new task without asking questions

## Out of Scope (for MVP)

- Authentication, multi-user, or saved device profiles
- Importing FSTD qualification certificates from operators
- Sub-system fidelity breakdown within the SYS feature (modelled as a single dimension for now)
- Single-pilot non-complex aeroplanes (regulation excludes them from the matrices)
- Anything related to legacy CS-FSTD(A) / CS-FSTD(H) single-level qualifications
