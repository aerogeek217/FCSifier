# TODO

## In Progress
- [ ] FCSifier MVP — see `docs/plans/features/fcsifier-mvp.md`

## Up Next
- [ ] **Blocker:** confirm ICAO 9625 feature list / codes from EASA Opinion 01/2025 Appendix 1 (drop the PDF into `docs/reference/` or paste the table)
- [ ] Phase 0: toolchain — Svelte 5 + Vite + TS setup, port existing CSV parser to TS
- [ ] Phase 1: domain core (`src/domain/fcs.ts` + tests) — vector compare/rollup/authorizes
- [ ] Phase 2: data plumbing — `features.json`, `fidelity.json`, new `tasks.csv` + `task_fcs.csv`, loader rewrite
- [ ] Phase 3: UI — Svelte components for by-task / by-device views, FCS matrix widget, hash-encoded state
- [ ] Phase 4: extraction script, GH Pages CI workflow, `ARCHITECTURE.md` / `DECISIONS.md` updates
- [ ] Enable GitHub Pages (Settings → Pages → GitHub Actions source; deploys `/dist` via `.github/workflows/pages.yml`)

## Done (move to BACKLOG.md monthly)
- [x] Scaffold stat