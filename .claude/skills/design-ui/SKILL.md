---
name: design-ui
description: Generate UI designs using Google Stitch MCP and extract code
disable-model-invocation: true
---
Use Google Stitch to design UI for the given description.

## Prerequisites
- Stitch MCP server must be configured in `mcp.json` at the project root (HTTP direct mode with `STITCH_API_KEY`)
- `STITCH_API_KEY` environment variable must be set (Google AI Studio API key)
- Check memory for the project's Stitch project ID. If not saved, use `list_projects` to find it.

## Available Tools
- `list_projects` / `get_project` — find and inspect projects
- `list_screens` / `get_screen` — browse existing screens (note: `list_screens` takes bare `projectId`, not `projects/` prefix)
- `create_project` — create a new Stitch project
- `generate_screen_from_text` — generate a screen from a text description
- `generate_variants` — create design variations of a screen
- `edit_screens` — modify existing screens
- `create_design_system` / `update_design_system` / `apply_design_system` / `list_design_systems` — manage design systems

## Workflow

1. **Find the project** — check memory for the Stitch project ID, or use `list_projects`
2. **Generate the screen** using `generate_screen_from_text` with the user's description: $ARGUMENTS
3. **Review the full design** — use `get_screen` to retrieve the generated design. Read and analyze ALL of the following:
   - **Layout structure** — how sections are arranged, grid/flex patterns, nesting hierarchy
   - **Component inventory** — every button, input, card, nav element, modal, list, etc.
   - **Spacing and sizing** — padding, margins, gaps, widths, heights
   - **Typography** — font sizes, weights, line heights, heading hierarchy
   - **Colors** — background, text, border, accent, and state colors (hover, active, disabled)
   - **Visual details** — border radius, shadows, dividers, icons, imagery
   - **Responsive hints** — any layout patterns that suggest breakpoint behavior
   - If Stitch returns code/markup, read it thoroughly — don't just skim for colors
4. **Iterate if needed** using `edit_screens` to refine or `generate_variants` for alternatives
5. **Confirm with user** — present a summary of the design decisions you extracted and ask the user to confirm before writing code
6. **Integrate into the project** — translate the FULL design into code, not just the color palette. Map every component, layout pattern, and spacing value from the mockup into the project's framework. Cross-reference the mockup as you build each section to ensure nothing is dropped.

After integration, do a final check: re-read the Stitch screen data and compare it against the code you wrote. Flag any design elements that couldn't be faithfully reproduced.
