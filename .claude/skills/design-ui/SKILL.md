---
name: design-ui
description: Generate UI designs using Google Stitch MCP and extract code
disable-model-invocation: true
---
Use Google Stitch to design UI for the given description.

## Prerequisites
- Stitch MCP server must be configured in `.claude/mcp.json` (HTTP direct mode with `STITCH_API_KEY`)
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
3. **Review the result** using `get_screen` to inspect the generated design
4. **Iterate if needed** using `edit_screens` to refine or `generate_variants` for alternatives
5. **Integrate into the project** — adapt the design to fit the project's existing patterns and framework

Ask the user to confirm the design before integrating code into the project.
