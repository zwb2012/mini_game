# DeepSeek Harness Game Studios

Indie game development managed through role-based specialists. Each role owns a
specific domain, enforcing separation of concerns and quality — the same studio
hierarchy the template always intended, now running natively on **DeepSeek
Harness (DSH)** instead of Claude Code.

## Technology Stack

- **Engine**: Godot 4
- **Language**: GDScript
- **Version Control**: Git with trunk-based development
- **Build System**: Godot export (see `docs/engine-reference/godot/VERSION.md`)
- **Asset Pipeline**: Godot `.import` / res:// (see engine reference)

> Engine reference snapshots (pinned) live under `docs/engine-reference/<engine>/`.
> Use the set matching this project's engine.

## Where Things Live (DSH)

| Purpose | Path |
|---|---|
| Workspace instructions (this file) | `AGENTS.md` |
| Detail docs (coordination, standards, templates) | `.claude/docs/` |
| Path-scoped code rules | `.dsh/rules/` |
| Skills (model-invocable, by name) | `.dsh/skills/` |
| Role definitions (for delegation) | `.claude/agents/` |
| Hooks (optional) | `.dsh/hooks/` |

## Coordination Rules

1. **Vertical delegation** — leads delegate to department leads, leaders delegate to
   specialists. Never skip a tier for complex decisions.
2. **Horizontal consultation** — same-tier roles may consult each other but must not
   make binding decisions outside their domain.
3. **Conflict escalation** — disagreements escalate to the common superior. No shared
   superior → design conflicts go to `creative-director`, technical to `technical-director`.
4. **Change propagation** — `producer` coordinates cross-domain design changes.
5. **No unilateral cross-domain changes** — never edit files outside your assigned domain
   without explicit delegation.

See `.claude/docs/coordination-rules.md` for the full protocol and model-tier guidance.

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.** Every task follows:
Question -> Options -> Decision -> Draft -> Approval.

- Ask "May I write this to `<path>`?" before using `write`/`edit`.
- Show drafts or summaries before requesting approval.
- Multi-file changes require explicit approval for the fully changeset.
- No commits without the user instructing.

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for the full protocol and examples.

> **DSH note**: DSH has its own approval model (`ask`/sandbox). Treat the sandbox's
> approval prompts as the authoritative gate; never try to route around a denial.

## Coding Standards

Follow `.claude/docs/coding-standards.md`. Conventions (abbreviated):

- Public API doc comments; data-driven gameplay values (no hardcode).
- Every system gets an ADR in `docs/architecture/`.
- Conventional Commits (`feat:`/`fix:`/`docs:`/`test:`), referencing a story/task id.
- Test evidence per story type (see coding-standards table).

## Context Management

Context is the scarce resource of an agent session. The primary strategy is:
**files are memory, not the conversation.** Maintain `production/session-state/active.md`
as a live checkpoint; write multi-section docs incrementally (skeleton first, then one
approved section at a time). Details in `.claude/docs/context-management.md`.

- **Delegate to subagents** when exploring >2 files or research that would blow the
  context budget. DSH subagents run in their own context and return only a summary.
- **Use `todo_write`** to track implementation steps and `goal` for long-running objectives.

## Skills

DSH skills are loaded by name (model-invocable), not by slash command. A skill's
`description` tells you when to use it. Skills carry no arguments: **determine the mode
from the task**, and when the mode is genuinely ambiguous, use `ask_user_question`
before proceeding. Don't invent argument placeholders.

## Path-Scoped Rules

`.dsh/rules/*.md` apply when you edit files under matching paths (e.g. `src/ai/**`).
Read the relevant rule before editing that area. DSH does not auto-enforce a `paths:`
scope — the rule content is guidance you must read and apply.

## Delegating Roles (DSH)

Roles are defined in `.claude/agents/<role>.md`. To delegate to a role:

1. Pick the role for the task (see `.claude/docs/agent-roster.md`).
2. Read `.claude/agents/<role>.md` and pass its body as the prompt/instructions to the
   `subagent` tool (self-contained prompt; the child has no parent conversation).
3. Use `subagent` in the background when the work is independent; run foreground only
   when your next step depends on its result.
4. For fan-out across many independent units, use `workflow`.

See `.dsh/delegation.md` for the hierarchy and delegation defaults.

## First Session

If the project has no engine configured and no game concept, run the `start` skill to
begin guided onboarding.

## Hooks (Optional)

`hooks-claude-code` bridges `.dsh/hooks.json` to DSH. Enable it in the DSH config with
`configPath` pointing at `.dsh/hooks.json`. See `.dsh/hooks/README.md`.
