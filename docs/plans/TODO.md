# TODO

## In Progress
- [ ] FCSifier MVP — see `docs/plans/features/fcsifier-mvp.md`

## Up Next
- [x] Browser smoke-test Phase 3 UI end-to-end (tab nav, T/TP toggle, category filter, preset load/save, shareable URL round-trip) — Claude could not drive a browser
- [ ] Enable GitHub Pages (Settings → Pages → GitHub Actions source; deploys `/dist` via `.github/workflows/pages.yml`)
- [ ] Verify first live Pages deploy (push to `main`, check the workflow run + the published URL)

## Done (move to BACKLOG.md monthly)
- [x] UI visual overhaul + Grid header alignment — "engineering reference / aviation chart" aesthetic (paper-cream + deep navy ink + burnt-amber accents, distinctive serif display in system Iowan/Sitka/Cambria, mono for codes) in `styles/main.css`; `App.svelte` wordmark with italic-amber "ifier", monospace tagline, segmented pill nav; `Grid.svelte` restructured so the Reference FCS editor is inlined into the grid table itself as a single sticky header row — each cell stacks feature-code (dark band on top) over editable FCS dropdown (paper band below), with fixed-height bands + `vertical-align: top` so all 15 columns align perfectly. `ByTask.svelte` / `ByDevice.svelte` / `FcsMatrix.svelte` / `DevicePresets.svelte` restyled to match. No logic / state / router / loader changes; no new runtime deps. (49/49 tests passing, `npm run check` clean, `npm run build` clean.)
- [x] Grid view — new default tab. Task×feature matrix (`src/routes/Grid.svelte`) with blue fidelity gradient N→G→R→S; when a reference FCS is set, cells where the task requirement exceeds the device render red. Inline FCS editor (collapsible, reuses `FcsMatrix` edit-mode + `DevicePresets`), search box, "Hide tasks exceeding FCS" toggle (only visible when an FCS is set), Copy-task-list (TSV, filters applied) and Copy-FCS (labelled vector) buttons via `navigator.clipboard`. Router extended with `grid` route (default) that also persists `?fcs=`. (49/49 tests passing, `npm run check` clean, `npm run build` clean.)
- [x] Scaffold static webapp (6/6 tests passing)
- [x] Phase 0: toolchain — Svelte 5 + Vite + TS scaffold, CSV parser ported to TS (6/6 tests passing)
- [x] Phase 1: domain core — `src/domain/fcs.ts` (compare/rollup/authorizes/parseFcs/formatFcs), `data/features.json`, `data/fidelity.json` (35/35 tests passing)
- [x] Phase 2: data plumbing — EASA extractor, `tasks.csv` (122 tasks) + `task_fcs.csv` (244 rows), `devices.json` (3 presets), `src/data/loader.ts` + fixtures (49/49 tests passing)
- [x] Phase 3: UI — shared runes state (`src/lib/state.svelte.ts`), hash router (`src/lib/router.svelte.ts`), `FcsMatrix` + `DevicePresets` widgets, `ByTask` + `ByDevice` routes, tabbed `App.svelte` wired with loadDataset + T/TP + category filter; `npm run check` + `npm test` (49/49) + `npm run build` clean; `scripts/check-runtime-deps.sh` passes. Browser smoke-test deferred.
- [x] Phase 4: GH Pages CI — `.github/workflows/pages.yml` (checkout → npm ci → check → test → build → upload-pages-artifact → deploy-pages); `ARCHITECTURE.md` status + file map + entry points updated; `DECISIONS.md` + ADR-007 (vectorised FCS model) + ADR-008 (CI/Pages pipeline).