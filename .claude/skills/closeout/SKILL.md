---
name: closeout
description: End-of-session verification and documentation update
---
Perform end-of-session closeout for the current work.

## 1. Build & Test Verification
- Check CLAUDE.md for the project's build and test commands
- Run the build command and confirm zero errors
- Run the test command and count passing/total tests
- If any tests fail, report them but do NOT auto-fix (the user decides)
- If no tests exist for new code, note which files lack coverage
- **Update the test count in CLAUDE.md** (the `Test count: **[X/X tests passing]**` line)
- **Continue to steps 2-5 even if build/tests fail** — report failures but don't block doc updates

## 2. Update docs/plans/TODO.md
- Read the current TODO.md
- Check off any items that were completed this session
- Add any new items discovered during this session (bugs, follow-up work, tech debt)
- Move items between sections as appropriate (Up Next -> In Progress, etc.)

## 3. Update Feature Plan (if applicable)
- If work this session relates to a plan in docs/plans/features/, update its task checklist
- Update the plan's Status field if appropriate (Draft -> In Progress, or In Progress -> Complete)
- If a plan's status is now **Complete**:
  - Delete any temporary/scratch files created during the plan's execution
  - Ask the user whether they want to remove the plan file itself

## 4. Update docs/ARCHITECTURE.md (if structure changed)
- If new directories were added, update the File Map
- If new entry points were created, update the Entry Points section
- If new modules, entities, services, or interfaces were added, update Key Abstractions
- If the dependency graph changed, update the Dependency Graph section
- If common navigation targets changed, update the Where to Find Things section

## 5. Commit
- Stage all changes from this session (including any doc updates from steps 2-4)
- Create a commit with a clear message summarizing the session's work
- **Include the test count in the commit message**, e.g.: `Add user auth (45/45 tests passing)`
- Follow the git conventions in CLAUDE.md

## 6. Push (ask first)
- Ask the user if they want to push to the remote
- If yes, push the current branch
- If no, skip — do not push

## 7. Summary
- Print a brief summary of what was accomplished and any open issues
- List any files that were modified during closeout
