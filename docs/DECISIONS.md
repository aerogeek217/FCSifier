# Architecture Decision Records

<!-- 
Record significant architectural decisions here. Format:

## ADR-NNN: [Title]
**Date**: YYYY-MM-DD
**Decision**: [What was decided]
**Rationale**: [Why this choice was made]
**Consequences**: [What follows from this decision]
-->

## ADR-001: Feature code for Motion Cueing is `MTN`, not `MOT`
**Date**: 2026-04-14
**Decision**: Code Motion Cueing as `MTN` throughout the app, data, and URL hash.
**Rationale**: EASA Appendix 3 uses `MTN` in every structural location (TOC, §2.10 heading, the terminology glossary at line 1311, and the Appendix 2 FCS reporting templates at line 5041). One prose bullet inside GM1 Table 1 (line ~520) says `MOT`. The structural/normative usage outweighs a single prose inconsistency.
**Consequences**: Anyone reading GM1 Table 1 in isolation will see `MOT` and expect our code to match. We call this out in `docs/reference/easa-sources.md` and in code comments on the features.json entry. If EASA publishes a final rule that settles on `MOT`, this is a one-file rename.

## ADR-002: Fidelity enum is `["N","G","R","S"]`; `-` is a non-enum "not applicable" marker
**Date**: 2026-04-14
**Decision**: The ordered fidelity enum has exactly four members: `N < G < R < S`. The `-` character that appears in Appendix 2 matrices is handled as a separate "task not performed in FSTD" state, materialised as `null` on the task's FCS vector.
**Rationale**: `N` (None) is a real fidelity level — "feature not installed/functional". Collapsing `-` rows to all-`N` would silently authorise any device for those tasks, which is backwards. Keeping `-` as a distinct null state lets the UI show it in a dedicated "N/A" bucket so reviewers notice these tasks exist and can't be FSTD-trained.
**Consequences**: `authorizes(device, null)` is undefined at the type level; callers must filter null-FCS tasks before authorisation checks. The by-task and by-device views both carry a dedicated "not performed in FSTD" bucket.

## ADR-003: `T` and `TP` are independent datasets; no fallback between them
**Date**: 2026-04-14
**Decision**: Tasks in `task_fcs.csv` may have a `T` row, a `TP` row, both, or neither. The UI has a shared level toggle. In rollup and authorisation, tasks with no row at the active level are **dropped and flagged**, never substituted from the other level.
**Rationale**: The regulation treats T (introduction only) and TP (training to proficiency) as meaningfully different requirements for the same task. Falling back from TP to T (or vice versa) would silently change the answer without the user asking for it. Surfacing "no requirement defined at this level" as a visible UX state is more honest.
**Consequences**: The by-task and by-device views both need a "no-requirement-at-this-level" bucket alongside the N/A bucket. State includes both `level` and the set of flagged-tasks derivations.

## ADR-004: URL state lives entirely in `location.hash`
**Date**: 2026-04-14
**Decision**: Route and view-state are colocated in `location.hash`. The router splits the hash on the first `?` into a route path and a query string; the query is parsed with `URLSearchParams`. Mutations use `history.replaceState` so the back button tracks user navigations, not keystrokes.
**Rationale**: A single source of truth for shareability. No server round-trip, works on `file://`, and GitHub Pages doesn't need to interpret the query. `URLSearchParams` handles the after-`?` portion with no custom parser.
**Consequences**: URLs look like `#/by-device?fcs=...&level=TP&cat=aeroplane`. Route-switch is a full state replacement, not a partial merge — callers must encode every relevant param when navigating.

## ADR-005: Svelte 5 + Vite + TypeScript
**Date**: 2026-04-14
**Decision**: Frontend is Svelte 5 (runes mode) compiled by Vite with TypeScript across domain, loader, and router.
**Rationale**: Svelte compiles its framework into the output bundle so the deployed site has no runtime third-party code (satisfies the no-runtime-deps constraint). Runes (`$state`, `$derived`) fit the editable FCS matrix and cross-view hash state naturally. TS types on the fidelity enum, FCS vector shape, and `authorizes`/`rollup` contracts catch exactly the kind of bugs that would silently wrong-answer a compliance-adjacent tool.
**Consequences**: Build toolchain (Vite, Svelte compiler, TS, tsx) is dev-only; nothing external ships to the browser. `scripts/check-runtime-deps.sh` greps the built `/dist` for `http(s)://` references as a release gate.

## ADR-006: Canned device presets ship in `data/devices.json`; user-defined presets are localStorage-only
**Date**: 2026-04-14
**Decision**: A small curated set of illustrative FSTD presets ships in `data/devices.json`. The by-device view can save user-edited devices as presets, which live in `localStorage` only — never written to disk, never synced, never shared via URL.
**Rationale**: First-run usability: picking "high-fidelity aeroplane FFS" as a starting point is faster than dialling 14 sliders. Keeping user presets in localStorage avoids a persistence backend and keeps the "no server" constraint. The legacy `tools.json` from the scaffold is schema-incompatible and is deleted.
**Consequences**: Shipped presets must carry `source: "illustrative"` until we have permission to ship real-device data. Loader merges `data/devices.json` with localStorage at runtime; the user's presets persist across sessions on the same browser but not across devices.
