# Studio Hierarchy & DSH Delegation

Roles are defined under `.claude/agents/<role>.md`. DSH has no file-based agent
registry — delegation uses the `subagent` tool with a self-contained prompt. This
file maps the studio hierarchy and how to delegate each tier.

## Hierarchy

### Tier 1 — Directors
`creative-director` (vision), `technical-director` (architecture), `producer` (production mgmt).

### Tier 2 — Department Leads
`game-designer`, `lead-programmer`, `art-director`, `audio-director`,
`narrative-director`, `qa-lead`, `release-manager`, `localization-lead`.

### Tier 3 — Specialists
Designers (`systems-designer`, `level-designer`, `economy-designer`),
Programmers (`gameplay-programmer`, `engine-programmer`, `ai-programmer`,
`network-programmer`, `tools-programmer`, `ui-programmer`),
Tech art (`technical-artist`, `sound-designer`), Content (`writer`, `world-builder`),
QA & Ops (`qa-tester`, `performance-analyst`, `devops-engineer`, `analytics-engineer`),
UX (`ux-designer`, `prototyper`, `security-engineer`, `accessibility-specialist`,
`live-ops-designer`, `community-manager`).

### Engine Specialists
Pick the set matching the pinned engine (Godot 4 here): `godot-specialist` plus
`godot-gdscript-specialist`, `godot-csharp-specialist`, `godot-shader-specialist`,
`godot-gdextension-specialist`. (Unity/Unreal sets are retained for reference.)

## How to Delegate in DSH

1. **Choose the role** from `.claude/docs/agent-roster.md` (matches task domain).
2. **Read the role file** `.claude/agents/<role>.md`.
3. **Pass its body as the subagent prompt** — the child sees no parent context, so
   include everything it needs (the role instructions + the concrete task + file paths).
4. **Default: background.** Start delegations in the background (`run_in_background: true`)
   and keep working on independent steps. Collect results when they settle.
5. **Foreground only** when your next step depends on the child's answer.
6. **Fan-out** across many independent units with the `workflow` tool.

## Delegation Defaults

- **Morphology**: `one-shot` (single result) — the common case for a role review/generation.
  Use a continuable child when you'll send follow-up work across turns.
- **Provider/model**: inherit the session default (DeepSeek).
- **Prompt shape**: give the role body verbatim, then `--- TASK ---`, then the task with
  explicit inputs and the expected output format. Ask the child to return a concise result.

## Subagent Scope

A delegated subagent runs with a fixed permission scope (no approval prompts inside the
child). If it needs access beyond that, it must *state the limitation* in its reply —
never retry a denied operation. The parent handles anything needing wider access.

## Parallel Protocol

When a skill emits several **independent** subagents (e.g. `review-all-gdds` phases,
`gate-check` director panel), start them all in the background before awaiting any result.
Collect all results, surface BLOCKED prominently, and always produce a partial report
if some complete while others are blocked.
