---
name: update-template
description: Review and update the Claude Code project template against current best practices
disable-model-invocation: true
---
Perform a best-practices audit of this Claude Code project template.

## 1. Research Current State
- Use the claude-code-guide agent or web search to identify current Claude Code features, configuration options, and recommended patterns
- Focus on: CLAUDE.md conventions, hooks, skills, agents, rules, MCP, settings, memory, and any new features

## 2. Compare Against Template
Read all template files and compare what they document against current best practices:
- `docs/claude-code-setup-guide.md` — is the advice current? Any missing features or deprecated patterns?
- `.claude/settings.json` — are hook patterns up to date?
- `.claude/agents/*.md` — are frontmatter fields and tool lists current?
- `.claude/skills/*/SKILL.md` — are skill features properly documented?
- `.claude/rules/_example.md` — is the rules format current?
- `CLAUDE.md` — does the template structure match current recommendations?

## 3. Report Findings
Summarize what's outdated, missing, or incorrect. Group by:
- **Outdated**: advice that was correct but no longer reflects best practices
- **Missing**: new features or patterns the template doesn't cover
- **Incorrect**: factual errors

## 4. Apply Updates
Update all affected template files. Keep changes focused — don't rewrite sections that are already correct.

$ARGUMENTS
