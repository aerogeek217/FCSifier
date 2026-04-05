---
paths:
  - "src/**"
---
# Code Conventions (rename this file and adjust paths)

<!-- Replace these examples with your project's actual conventions. -->
<!-- Delete this file once you've created real rule files. -->

## Examples of path-scoped rules:
- `api-routes.md` with paths: ["src/api/**"] — endpoint naming, middleware patterns
- `data-layer.md` with paths: ["src/data/**"] — repository patterns, migration rules
- `testing.md` with paths: ["tests/**"] — test structure, mocking guidelines

## Guidelines:
- One file per logical layer or concern
- 5-15 rules per file — focus on things Claude would otherwise get wrong
- Use path scoping so rules only load when editing matching files
- See docs/claude-code-setup-guide.md Section 2 for details
