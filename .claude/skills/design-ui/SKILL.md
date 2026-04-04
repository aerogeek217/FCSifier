---
name: design-ui
description: Generate UI designs using Google Stitch MCP and extract code
disable-model-invocation: true
---
Use Google Stitch to design UI for the given description.

## Prerequisites
- Stitch MCP server must be configured in `.claude/mcp.json` with a valid Stitch project ID
- `STITCH_API_KEY` environment variable must be set (the MCP server runs in direct mode, not proxy)
- At least one Stitch project should exist (create at stitch.withgoogle.com or via `create_project`)

## Workflow

1. **List available projects** using `list_projects` to find the target Stitch project
2. **Generate the screen** using `generate_screen_from_text` with the user's description: $ARGUMENTS
3. **Preview the result** using `get_screen_image` to show the generated design
4. **Extract the code** using `get_screen_code` to get the HTML/CSS
5. **Extract design context** using `extract_design_context` to capture colors, fonts, and layout patterns
6. **Integrate into the project** — adapt the generated HTML/CSS to fit the project's existing patterns and framework

If the user wants multiple screens or a full site, use `build_site` to map screens to routes.

Ask the user to confirm the design before integrating code into the project.
