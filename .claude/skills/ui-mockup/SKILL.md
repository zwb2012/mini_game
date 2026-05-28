---
name: ui-mockup
description: "Generate high-fidelity Figma visual prototypes from UX specs. Maps component inventory to Figma components, applies art bible design tokens (colors, typography, spacing), produces per-state frames (Default, Empty, Loading, Error), and saves screenshots as visual reference for implementation. Works with or without an existing Figma design system."
argument-hint: "[screen-name | all | hud]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Task, AskUserQuestion, TodoWrite, use_figma, get_screenshot, create_new_file, get_libraries, search_design_system
model: sonnet
requires-figma: true
---

When this skill is invoked:

## Phase 1: Parse Arguments & Gather Context

### Parse Target

| Argument | Mode |
|----------|------|
| `all` | Batch — iterate all UX specs in `design/ux/[screen-name].md` (excluding hud.md and interaction-patterns.md) |
| `hud` | HUD mockup — reads `design/ux/hud.md` |
| [screen-name] | Single screen — reads `design/ux/[name].md` |
| No argument | Ask user to specify |

If no argument: `AskUserQuestion`:
- "Which screen should I generate a Figma mockup for?"
- Options: list all files matching `design/ux/[name].md` + `[A] All screens` + `[B] HUD`

### Required Reads

Read in parallel:

1. **UX spec** at `design/ux/[target].md`:
   - Layout Specification: Information Hierarchy, Layout Zones, Component Inventory, ASCII Wireframe
   - States & Variants table (Default, Empty, Error, Loading, plus any game-specific states)
   - Interaction Map
   - Events Fired
   - Colors & Typography references if present

2. **Art bible** at `design/art/art-bible.md` — if absent:
   > "No art bible found at `design/art/art-bible.md`. Visual decisions will use reasonable defaults (dark theme, Inter font, 8px spacing grid). Colors, typography, and spacing should be validated manually before implementation."
   Continue with defaults (dark theme: #1a1a1a bg, #ffffff text, #3366CC primary, Inter font family, 8px spacing).

3. **Accessibility requirements** at `design/accessibility-requirements.md` — extract tier and contrast requirements

4. **Interaction pattern library** at `design/ux/interaction-patterns.md` — read catalog index for component patterns

5. **Technical preferences** at `.claude/docs/technical-preferences.md` — extract target resolution, platform

6. **Existing Figma file** — check `design/ux/mockups/figma-project.md` for the project's Figma file URL

---

## Phase 2: Component & Token Mapping

Build two tables (in conversation, not written to file yet):

### Table A: Component → Figma Mapping

For each component in the UX spec Component Inventory:

| UX Component | Spec Type | Figma Representation |

Present to user: "I mapped [N] components from the UX spec. Does this look right?" Use `AskUserQuestion`: `[A] Looks good` / `[B] Adjust mapping`

### Table B: Design Tokens from Art Bible

| Token | Art Bible Source | Value | Figma Variable Name |

Extract: primary/secondary/accent colors, background color, text colors (primary/secondary/disabled), spacing unit, corner radius, body font + size + weight, heading font + sizes.

Present to user: "These are the design tokens I extracted from the art bible. Any adjustments?"

---

## Phase 3: Output Directory Setup

```bash
mkdir -p design/ux/mockups/[screen-name]/
```

---

## Phase 4: Figma File & Design Token Setup

### Load Figma Skills

Before any `use_figma` call, load the `figma:figma-use` skill via the Skill tool. Also load `figma:figma-generate-design` for screen building workflow guidance.

### Create or Reuse Figma File

1. Check `design/ux/mockups/figma-project.md` for an existing Figma file URL
2. If absent: call `create_new_file` to create "UI Mockups - [Game Name]". Write the URL to `design/ux/mockups/figma-project.md`
3. If present: use the existing file

### Create Page

Create a page named `[screen-name]` in the Figma file (or navigate to it if it exists).

### Create Variable Collection "Design Tokens"

From Table B, create a Figma variable collection with:
- Color tokens (scoped to FRAME_FILL, SHAPE_FILL, TEXT_FILL)
- Number tokens — spacing unit, corner radii (scoped to GAP, CORNER_RADIUS)
- Text styles — create actual Figma text styles (not variables) for body, heading levels

If the collection already exists, discover and reuse — never recreate.

### Create Component Primitives (if no design system)

Use `get_libraries` + `search_design_system` to check for existing components. If no design system is found, create local components via `use_figma`:
- Button (primary, secondary, ghost — as component set with variants)
- Text input
- Toggle / Checkbox
- Scrollable container
- Modal backdrop
- Basic icon set (close, back, settings — as geometric shapes)

These become local components for reuse across frames.

---

## Phase 5: Frame Generation

For each state in the UX spec States & Variants table, generate one Figma frame. Each frame is a separate `use_figma` call.

### Frame Layout

1. Create frame at target resolution (default 1920×1080)
2. Apply background color from Design Tokens
3. Create zone containers with auto-layout matching the UX spec Layout Zones
4. Populate zones with component instances from Phase 4

### Per-State Modifications

| State | What Changes |
|-------|-------------|
| **Default** | Full component inventory, representative placeholder content |
| **Empty** | Content area → EmptyState component (icon + message + optional action) |
| **Loading** | Content area → skeleton placeholders (rects with 40% opacity fill) |
| **Error** | Content area → error icon + message + retry button; optional dimmed overlay |

After each frame is created:
1. Call `get_screenshot` to capture the frame
2. The screenshot is referenced in the manifest — note the Figma node ID

### HUD Mode

Use the HUD Layout Zones (Section 3.1) and HUD Elements Specification (Section 4) from `design/ux/hud.md`. States are game contexts (Exploration, Combat, Dialogue, Cinematic). Create a dark game-world background frame and overlay HUD elements.

---

## Phase 6: Write Mockup Manifest

Write `design/ux/mockups/[screen-name]/mockup-manifest.md`:

```markdown
# UI Mockup: [Screen Name]

> **UX Spec**: `design/ux/[screen-name].md`
> **Art Bible**: `design/art/art-bible.md`
> **Figma File**: [URL]
> **Generated**: [date]
> **Status**: Draft | Review Ready

## Frames

| Frame | State | Figma Node ID | UX Spec Ref |
|-------|-------|---------------|-------------|
| [name] | Default | [id] | Section 5, 6 |
| [name] | Empty | [id] | Section 6 |
| [name] | Loading | [id] | Section 6 |
| [name] | Error | [id] | Section 6 |

## Component Coverage

| UX Spec Component | Figma Node | Notes |
|-------------------|-----------|-------|
| ... | ... | ... |

## Design Token Usage

| Token | Value | Figma Variable |
|-------|-------|---------------|
| ... | ... | ... |

## Known Deviations

- [none or list]
```

Also write `design/ux/mockups/figma-project.md` if not already present:

```markdown
# Figma Project Reference

**Figma File**: [URL]
**Created**: [date]
```

---

## Phase 7: Handoff

> "Mockup complete for **[screen-name]**. Frames generated: [N] states. Figma file: [URL]"
> "Next: run `/ux-review design/ux/[screen-name].md --with-mockup` to validate the prototype against the spec."

Use `AskUserQuestion`:
- Options:
  - `[A] Validate this mockup — /ux-review [spec] --with-mockup`
  - `[B] Generate another screen — /ui-mockup [next-screen]`
  - `[C] Continue to create epics — /create-epics`
  - `[D] Stop here`

---

## Collaboration Protocol

- Always present component mapping and token extraction for user approval before calling Figma APIs
- Each `use_figma` call should contain ≤10 logical operations
- If a `use_figma` call fails, surface the error immediately — previous frames survive
- Figma screenshots are the definitive visual reference — present them prominently after each frame

## Error Recovery

- **Figma API error**: Retry once. If still failing, skip that frame, flag as FAILED in manifest, continue with remaining frames
- **Missing art bible**: Use defaults, flag as WARNING in manifest
- **Missing UX spec sections**: Generate what you can from available content. Flag missing sections in "Known Deviations"
- **Rate limiting**: Insert delays between `use_figma` calls
