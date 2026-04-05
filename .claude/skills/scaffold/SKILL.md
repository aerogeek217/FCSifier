---
name: scaffold
description: TRIGGER when user asks to set up, start, initialize, or scaffold a new project from this template. Walks through project configuration step by step.
---
Walk the user through setting up a new project from this template. Go step by step, asking questions and waiting for answers before proceeding.

## 1. Project Basics
Ask the user:
- What is the project? (name, one-line description)
- What language/framework?
- Build, test, and run commands?
- Any hard constraints? (e.g., no external dependencies, offline-only)

Update `CLAUDE.md` with their answers.

## 2. Architecture
Ask the user to describe:
- Initial directory layout (fills the **File Map** section)
- Main entry point(s) (fills the **Entry Points** section)
- 3-5 most common files/directories they expect to modify (fills **Where to Find Things**)
- Initial module structure or key components (fills remaining sections)

Fill in `docs/ARCHITECTURE.md` with their answers. It's fine to start minimal — this grows over time.

Also ask about the deployment environment's security posture:
- Will this app run in a tightly-managed IT environment (e.g., corporate network, air-gapped, firewall-restricted)?
- What network/internet access should the app assume? (full, limited outbound, no internet)
- What tolerance is there for external runtime dependencies? (e.g., CDNs, cloud APIs, package registries, telemetry endpoints)

Record the answers in the Constraints section of `CLAUDE.md` and factor them into architecture decisions (e.g., prefer vendored dependencies over CDN imports, avoid phone-home telemetry, bundle assets locally).

## 3. Frontend Design Approach
If the project has a UI, ask the user which frontend design tool they want to use:

- **Claude's native frontend-design skill** — built-in, no setup required. Good for quick prototyping and generating components directly in conversation.
- **Google Stitch (MCP)** — external design tool at stitch.withgoogle.com. Better for visual design iteration with a dedicated UI.

This choice affects MCP server configuration in the next step.

## 4. MCP Servers
The template includes these MCP servers in `mcp.json` (project root). Ask the user **which ones they want active** for this project:

- **GitHub** — issues, PRs, code review. Keep for git-hosted projects.
- **Playwright** — browser automation and testing. Keep for web projects.
- **SQLite** — local database access. Keep for projects with data storage.
- **Google Stitch** — UI design generation. Keep only if user chose Stitch in step 3.

**Remove any servers the user doesn't want.** Don't leave unused servers configured.

### If Stitch is selected:
1. Confirm `STITCH_API_KEY` is set as an OS environment variable (Google AI Studio API key)
2. Create a new Stitch project using `create_project` (or ask the user to create one at stitch.withgoogle.com)
3. Save the Stitch project ID to memory so future sessions know which project to use
4. Note: `list_screens` takes a bare `projectId` (just the number), not the `projects/` prefix format

## 5. Hooks
Review the PostToolUse hook in `.claude/settings.json`. Ask the user what post-edit verification command to use (e.g., `npm run lint --silent`, `cargo check 2>&1`, `python -m py_compile`). Update the hook command.

## 6. Rules
Ask if there are any code conventions or layer-specific rules to set up now. If so, create rule files in `.claude/rules/` scoped to the relevant paths. Delete `_example.md` once real rules exist.

## 7. Initial TODO
Ask if there are any initial tasks to add to `docs/plans/TODO.md`.

## 8. Git Init
If not already a git repo, run `git init` and make the initial commit with the customized template.

## 9. Verify
Start a summary of what was configured and confirm everything looks right.

$ARGUMENTS
