# TODO

## In Progress
- [ ] FCSifier MVP — see `docs/plans/features/fcsifier-mvp.md`

## Up Next
- [x] Browser smoke-test Phase 3 UI end-to-end (tab nav, T/TP toggle, category filter, preset load/save, shareable URL round-trip) — Claude could not drive a browser
- [ ] Enable GitHub Pages (Settings → Pages → GitHub Actions source; deploys `/dist` via `.github/workflows/pages.yml`)
- [ ] Verify first live Pages deploy (push to `main`, check the workflow run + the published URL)

## Done (move to BACKLOG.md monthly)
- [x] Scaffold static webapp (6/6 tests passing)
- [x] Phase 0: toolchain — Svelte 5 + Vite + TS scaffold, CSV parser ported to TS (6/6 tests passing)
- [x] Phase 1: domain core — `src/domain/fcs.ts` (compare/rollup/authorizes/parseFcs/formatFcs), `data/features.json`, `data/fidelity.json` (35/35 tests passing)
- [x] Phase 2: data plumbing — EASA extractor, `tasks.csv` (122 tasks) + `task_fcs.csv` (244 rows), `devices.json` (3 presets), `src/data/loader.ts` + fixtures (49/49 tests passing)
- [x] Phase 3: UI — shared runes state (`src/lib/state.svelte.ts`), hash router (`src/lib/router.svelte.ts`), `FcsMatrix` + `DevicePresets` widgets, `ByTask` + `ByDevice` routes, tabbed `App.svelte` wired with loadDataset + T/TP + category filter; `npm run check` + `npm test` (49/49) + `npm run build` clean; `scripts/check-runtime-deps.sh` passes. Browser smoke-test deferred.
- [x] Phase 4: GH Pages CI — `.github/workflows/pages.yml` (checkout → npm ci → check → test → build → upload-pages-artifact → deploy-pages); `ARCHITECTURE.md` status + file map + entry points updated; `DECISIONS.md` + ADR-007 (vectorised FCS model) + ADR-008 (CI/Pages pipeline).