# EASA Source Material — Map

The five PDFs in `docs/EASA/` make up EASA Opinion 01/2025 and its draft regulatory material. `docs/EASA/extracted/*.txt` are `pdftotext -layout` dumps used for grepping and for the extraction script.

## What each PDF contains

| File | Pages | What's inside | Relevance to FCSifier |
|------|------:|--------------|-----------------------|
| `appendix_3_…_cs-fstd_for_information_only.pdf` | 508 | Draft CS-FSTD itself: feature definitions, fidelity-level requirements per feature, objective tests, functions & subjective tests. Subparts A–E. | **Primary** — canonical feature list, fidelity level definitions, minimum FCS. |
| `appendix_2_…_draft_amc_and_gm_to_regulations_1178-2011_and_965-2012.pdf` | 153 | Draft AMC & GM to Part-FCL (1178/2011) and Part-ORO (965/2012). Contains the type-rating **training matrices** for aeroplanes and helicopters. | **Primary** — canonical task × feature × fidelity tables. |
| `draft_annexes_…_amending_1178-2011_and_965-2012.pdf` | 59 | Draft regulation text — the black-letter rules that the AMC/GM expand upon. | Secondary — use to cross-check task categories and what training programmes the matrices apply to. |
| `draft_commission_implementing_regulation_…_amending_1178-2011_and_965-2012.pdf` | 11 | Cover regulation with recitals and articles. | Context only. |
| `appendix_1_…_summary_of_comments_received.pdf` | 22 | Rulemaking comment-response summary. | Not useful for data extraction. |

## The feature list (canonical, from Appendix 3)

CS FSTD.GEN.005 defines **14 features** grouped into 3 categories. Codes in parentheses are the short codes used in Appendix 3 Table 1 (`appendix_3…txt` line 493 onward).

**Aircraft simulation**

1. Flight Deck Layout And Structure (FDK)
2. Flight Control Forces And Hardware (CLH)
3. Flight Control Systems Operation (CLO)
4. Aircraft Systems (SYS) — *note: individual aircraft systems may hold different fidelity levels per QB.010(c)*
5. Performance And Handling On Ground (GND)
6. Performance And Handling In Ground Effect (IGE)
7. Performance And Handling Out Of Ground Effect (OGE)

**Cueing simulation**

8. Sound Cueing (SND)
9. Vibration Cueing (VIB)
10. Motion Cueing (MTN)
11. Visual Cueing (VIS)

**Environment simulation**

12. Navigation (NAV)
13. Atmosphere And Weather (ATM)
14. Operating Sites And Terrain (OST)

The training matrix columns in Appendix 2 appear in a specific numbered order. The column headers themselves use the **long names** (rotated 90°, split across lines — "1. Flight deck layout and structure" through "14. Operating Sites and terrain", see `appendix_2…txt` lines 239–270), not the short codes. The short codes come from Appendix 3. Mapping of column-number → code: 1 FDK, 2 CLH, 3 CLO, 4 SYS, 5 GND, 6 IGE, 7 OGE, 8 SND, 9 VIB, 10 MTN, 11 VIS, 12 NAV, 13 ATM, 14 OST. This is the order our `features.json` must preserve.

**Code-letter quirk.** Appendix 3 GM1 Table 1 (line ~520) has one prose bullet listing `MOT` for Motion Cueing. Every other reference in Appendix 3 (TOC, §2.10 heading, the glossary at line 1311, Appendix 2 FCS reporting templates at line 5041) uses `MTN`. We follow the structural/normative usage and code it as `MTN`.

## The fidelity levels (canonical)

CS FSTD.GEN.010, `appendix_3…txt` lines 470–476:

| Code | Name | Meaning |
|------|------|---------|
| `S` | Specific       | Highest fidelity — tuned to the specific aircraft type and variant |
| `R` | Representative | Intermediate — represents the type, may use data from a related variant |
| `G` | Generic        | Lowest positive fidelity — characteristic of an aircraft class or group |
| `N` | None           | Feature not installed/functional; must not be distracting if physically present |

Ordering for comparison: `N < G < R < S`.

The raw matrices use a fifth character — `-` (dash) — which is **not a fidelity level**. It marks tasks that are not performed in an FSTD (e.g., §1.1 Performance calculation, §1.2 External visual inspection, §4.6, §4.9 — per Appendix 2 GM1). An all-`-` row loads as a `null` FCS vector on the task and surfaces in the UI as a separate "N/A" bucket rather than collapsing to all-`N` (which would misleadingly authorise any device).

## The training matrices (canonical, from Appendix 2)

`extracted/appendix_2…txt` contains the raw, extractable matrices. Each task has **two rows**: `TP` (Training to Proficiency) and `T` (Training — introduction only). 14 fidelity values per row, one per feature.

### Matrix locations

| Matrix | Line range | Sections |
|--------|-----------:|---------|
| **Aeroplanes** — multi-pilot + single-pilot high-performance complex | 234–557 | §1 Flight preparation · §2 Take-offs · §3 Flight manoeuvres & procedures · §3.4 Normal/abnormal systems ops · §3.8 Instrument flight procedures |
| **Helicopters** | 558–860 | §1 Preflight preparations & checks · §2 Flight manoeuvres & procedures · §5 Instrument flight procedures |

### Sample (aeroplane §3, task 3.1 "Manual flight with and without flight directors"):

Data values below are verbatim from `appendix_2…txt` lines 322–324. The short-code header row is synthesised — the raw PDF extraction has the long names rotated 90° and split across blank lines (see lines 239–270), not a tidy header row.

```
                               FDK CLH CLO SYS GND IGE OGE SND VIB MTN VIS NAV ATM OST
Task 3.1 Manual flight …  TP    R   S   S   S   N   N   S   G   R   R   R   N   G   N
                           T    G   R   R   R   N   N   R   N   N   N   G   N   G   N
```

Because the header row is not machine-readable in the extraction, the extractor must hard-code the 14-column order (per the mapping above in "The feature list").

### Notable quirks the extractor must handle

- **T/TP rows are un-labelled on the left** — the task id/text appears only on the first row of the pair. The second row is the `T` continuation.
- **Some tasks have no FCS row** (e.g., §1.1 Performance calculation and §1.2 External visual inspection show all `-`). These are tasks not performed in an FSTD; model them with `null` FCS or skip them.
- **Single-pilot non-complex aeroplanes are out of scope** of the task-to-tool matrices (per GM1 in `appendix_2…txt` around line 904+).
- **Rollup rule is regulation-defined** (`appendix_2…txt` line 3394): *"the minimum FCS required for each module, determined by taking, for each training task and [feature], the maximum fidelity level."* Exactly per-feature max — the plan is correct.
- **Take-off/landing tasks combine with instrument approach tasks** when flown that way — the regulation instructs implementers to `max()` their FCSes together. Our rollup already models this naturally.
- **Two tasks (§4.6 and §4.9) have no assigned FCS** (`appendix_2…txt` line 883). Represent as `null`/blank and flag in the UI.

## Extraction strategy (for `scripts/extract-easa.ts`, run via `tsx`)

1. Run `pdftotext -layout appendix_2….pdf appendix_2.txt` (already done; outputs committed under `docs/EASA/extracted/`).
2. For each matrix range, iterate lines and detect rows matching `^\s*(TP|T)\s+([SRGN\-]\s+){13}[SRGN\-]\s*$` — these are the 14-feature rows.
3. Associate each `TP`/`T` row pair with the nearest preceding task label (look back for a task-number pattern like `\d+(\.\d+)*` and capture the accompanying text, which may span multiple lines).
4. Emit `task_fcs.csv` with columns `task_id, level, FDK, CLH, CLO, SYS, GND, IGE, OGE, SND, VIB, MTN, VIS, NAV, ATM, OST` (level ∈ `T|TP`). Cell values: `S|R|G|N` for real fidelity, or `-` for rows where the task is not performed in an FSTD.
5. Emit `tasks.csv` with `id, section, name, aircraft_category` (aircraft_category ∈ `aeroplane|helicopter`, matching the CS's top-level organisation). MVP does not distinguish mpa vs. sp-hpca within the aeroplane matrix — both map to `aeroplane` because the regulation's matrix is shared between them.
6. Diff against the previous extraction — *the human reviews the diff before committing*. Do not auto-commit.

## Citations

Every task row we seed into `data/task_fcs.csv` must carry a source ref like `"Opinion 01-2025 App.2 §3.4.6 T"` so reviewers can audit back to the regulation. The section numbers in Appendix 2 are stable identifiers for this.
