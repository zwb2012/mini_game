# Hooks (DeepSeek Harness)

These are the template's lifecycle hooks, kept as bash scripts (they run via Git
Bash on Windows, which DSH resolves as its shell executor).

## Enabling

DSH does not enable Claude Code hooks by default. Register the
`@deepseek-ai/dsh-hooks-claude-code` plugin with `configPath` pointing at
`.dsh/hooks.json`:

```yaml
- id: hooks-claude-code
  name: '@deepseek-ai/dsh-hooks-claude-code'
  config:
    configPath: ${PROJECT_DIR}/.dsh/hooks.json   # absolute path to .dsh/hooks.json
    projectDir: ${PROJECT_DIR}                    # optional; sets CLAUDE_PROJECT_DIR
```

`configPath` must be absolute. The bridge substitutes `${CLAUDE_PROJECT_DIR}` in
each command and runs it through the DSH shell (`bash`), so this only works where
a bash interpreter is on `PATH` (Git Bash on Windows).

## Event coverage

The `hooks-claude-code` bridge supports only these events. Hooks on other events
(`Notification`, `PreCompact`, `PostCompact`) are dropped and are documented here
for completeness rather than wired in the active config:

| Script | Event | Matcher |
|---|---|---|
| `session-start.sh` | SessionStart | — |
| `detect-gaps.sh` | SessionStart | — |
| `validate-commit.sh` | PreToolUse | `pwsh` |
| `validate-push.sh` | PreToolUse | `pwsh` |
| `validate-assets.sh` | PostToolUse | `write\|edit` |
| `validate-skill-change.sh` | PostToolUse | `write\|edit` |
| `session-stop.sh` | Stop | — |
| `log-agent.sh` | SubagentStart | — |
| `log-agent-stop.sh` | SubagentStop | — |

Not wired (unsupported by DSH): `notify.sh` (Notification), `pre-compact.sh`
(PreCompact), `post-compact.sh` (PostCompact).

## Matcher note

On Windows DSH the shell tool is `pwsh`. On a bash-first DSH host the tool is
`bash` — change the PreToolUse matcher to `bash` in that case.
