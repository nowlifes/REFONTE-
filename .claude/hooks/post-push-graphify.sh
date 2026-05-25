#!/bin/bash
# Runs after every Bash tool call. If the command was a git push, update graphify.
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('tool_input', {}).get('command', ''))" 2>/dev/null)

if echo "$COMMAND" | grep -q "git push"; then
  cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || true
  python3 -m graphify update . >/dev/null 2>&1
fi

exit 0
