#!/bin/bash
# Pre-Bash guard hook
# Reads tool input JSON from stdin, extracts the command, applies safety checks.
# Exit 0 = allow (stdout injected as context), Exit 2 = block (stderr shown).

INPUT=$(cat)

# Extract the command from JSON input.
# Tool input looks like: {"tool_input":{"command":"git ..."}}
# Strip to just the command start (before first \n) to avoid matching on
# arguments like commit messages that may contain git keywords.
CMD=$(echo "$INPUT" | tr -d '\n' | sed 's/.*"command"[[:space:]]*:[[:space:]]*"//;s/\\n.*//' | head -c 200)

# If we can't parse the command, allow it
if [ -z "$CMD" ]; then
  exit 0
fi

# --- Hard blocks (exit 2) ---

# Block force push
if echo "$CMD" | grep -qE 'git push .*(--force|-f\b)'; then
  echo "BLOCKED: Force push is destructive and rewrites shared history." >&2
  exit 2
fi

# Block git reset --hard
if echo "$CMD" | grep -qE 'git reset --hard'; then
  echo "BLOCKED: git reset --hard discards all uncommitted changes. Use git stash or target specific files." >&2
  exit 2
fi

# Enforce branch naming convention
if echo "$CMD" | grep -qE 'git (checkout -b|switch -c) '; then
  BRANCH=""
  if echo "$CMD" | grep -q 'checkout -b'; then
    BRANCH=$(echo "$CMD" | grep -o 'checkout -b [^ "\\]*' | awk '{print $NF}')
  elif echo "$CMD" | grep -q 'switch -c'; then
    BRANCH=$(echo "$CMD" | grep -o 'switch -c [^ "\\]*' | awk '{print $NF}')
  fi
  if [ -n "$BRANCH" ]; then
    case "$BRANCH" in
      feature/*|fix/*|refactor/*) ;;
      *)
        echo "BLOCKED: Branch '$BRANCH' does not follow naming convention. Use: feature/, fix/, or refactor/" >&2
        exit 2
        ;;
    esac
  fi
fi

# --- Soft reminders (exit 0 with context) ---

# Remind about architecture-reviewer and test-writer before git commit
if echo "$CMD" | grep -qE 'git commit'; then
  echo '{"hookSpecificOutput":{"additionalContext":"REVIEW WORKFLOW: Before committing: (1) Run test-writer on new/changed source files to generate tests. (2) Run architecture-reviewer on changed files. If already done, proceed."}}'
fi

# Remind about security-reviewer before git push
if echo "$CMD" | grep -qE 'git push'; then
  echo '{"hookSpecificOutput":{"additionalContext":"REVIEW WORKFLOW: Run security-reviewer on the diff before pushing. If already done, proceed."}}'
fi

exit 0
