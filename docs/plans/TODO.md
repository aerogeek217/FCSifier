# TODO

## In Progress
- [ ] FCSifier MVP — see `docs/plans/features/fcsifier-mvp.md`

## Up Next
- [ ] Phase 2: data plumbing — `devices.json`, new `tasks.csv` + `task_fcs.csv`, extractor run, loader rewrite (features.json / fidelity.json seeded in Phase 1)
- [ ] Phase 3: UI — Svelte components for by-task / by-device views, FCS matrix widget, device presets, hash-encoded state
- [ ] Phase 4: GH Pages CI workflow, `ARCHITECTURE.md` / `DECISIONS.md` updates
- [ ] Enable GitHub Pages (Settings → Pages → GitHub Actions source; deploys `/dist` via `.github/workflows/pages.yml`)

## Done (move to BACKLOG.md monthly)
- [x] Scaffold static webapp (6/6 tests passing)
- [x] Phase 0: toolchain — Svelte 5 + Vite + TS scaffold, CSV parser ported to TS (6/6 tests passing)
- [x] Phase 1: domain core — `src/domain/fcs.ts` (compare/rollup/authorizes/parseFcs/formatFcs), `data/features.json`, `data/fidelity.json` (35/35 tests passing)