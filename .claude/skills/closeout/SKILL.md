---
name: closeout
description: End-of-session verification and documentation update
---
Perform end-of-session closeout for the current work.

## 1. Build & Test Verification
- Run the project's build command and confirm zero errors
- Run the project's test command
- If any tests fail, report them but do NOT auto-fix (the user decides)
- If no tests exist for new code, note which files lack coverage

## 2. Update docs/plans/TODO.md
- Read the current TODO.md
- Check off any items that were completed this session
- Add any new items discovered during this session (bugs, follow-up work, tech debt)
- Move items between sections as appropriate (Up Next -> In Progress, etc.)

## 3. Update Feature Plan (if applicable)
- If work this session relates to a plan in docs/plans/features/, update its task checklist
- Update the plan's Status field if appropriate (Draft -> In Progress, or In Progress -> Complete)

## 4. Update docs/ARCHITECTURE.md (if structure changed)
- If new modules, entities, services, or interfaces were added, update the Module Index
- If the dependency graph changed, update the Dependency Graph section
- If new key abstractions were introduced, add them

## 5. Summary
- Print a brief summary of what was accomplished and any open issues
- List any files that were modified during closeout
