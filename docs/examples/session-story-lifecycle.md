# 示例会话：完整 Story 生命周期 — /story-readiness → Implement → /story-done

**背景：** 独立开发者，处于 mid-production sprint。Movement system GDD 和架构已完成。Movement 核心实现的 story 已由 `/create-stories` 生成。

**起始状态：**
- `design/gdd/movement-system.md` — complete, all 8 sections
- `docs/architecture/movement-adr-001.md` — Status: Accepted
- `production/sprints/sprint-03.md` — lists STORY-MOV-001 in backlog
- `production/stories/STORY-MOV-001.md` — exists but not yet validated
- 尚无 implementation code

**会话时长：** 约 50 分钟
**轮次：** 13
**结果：** Story 验证为 ready，完成实现，并通过 `/story-done` 验证完成

---

## Phase 1: Story Readiness Check

### Turn 1: User 运行 Readiness Check

**User:**
> /story-readiness production/stories/STORY-MOV-001.md

### Turn 2: Agent 验证 Story

**Agent（通过 /story-readiness）:**
> Reading `production/stories/STORY-MOV-001.md`...
>
> **STORY-MOV-001: Implement CharacterBody2D movement with terrain modifiers**
>
> Running 4 validation checks:
>
> **1. Design Completeness**
> - GDD referenced: `design/gdd/movement-system.md` ✅
> - GDD section coverage: Detailed Rules ✅, Formulas ✅, Edge Cases ✅
> - TR-IDs embedded: TR-MOV-001 through TR-MOV-008 ✅
>
> **2. Architecture Completeness**
> - ADR referenced: `docs/architecture/movement-adr-001.md` ✅
> - ADR status: **Accepted** ✅ *(Would be BLOCKED if Proposed)*
> - Control manifest version in story: `2026-03-10` — current manifest is `2026-03-10` ✅
>
> **3. Scope Clarity**
> - Acceptance criteria: 9 items, all measurable ✅
> - Out-of-scope items listed: swimming, climbing ✅
> - Ambiguities found: **1**
>   - ⚠️ Story says "roll direction follows last input direction" but GDD says "roll in movement direction" — these conflict when player stops and immediately rolls. Clarify before pickup.
>
> **4. Definition of Done**
> - Tests required: unit tests for formula functions ✅
> - Integration signal: `on_stamina_event` must fire correctly ✅
>
> ---
> **Verdict: NEEDS WORK**
>
> 实现开始前必须解决一个歧义。你想现在解决它，以便我将 story 标记为 ready 吗？

### Turn 3: User 解决歧义

**User:**
> Roll uses last movement direction. If player is standing still, roll uses facing direction instead.

### Turn 4: Agent 更新 Story

**Agent:**
> Updating the story's Detailed Rules section:
>
> > Roll direction: last movement direction. If velocity is zero at roll input, roll uses current facing direction.
>
> May I write this to `production/stories/STORY-MOV-001.md` and set Status to `ready-for-dev`?

**User:**
> Yes

**Agent writes update. Story status: `ready-for-dev`.**

> **Verdict: READY**
> Story 已可进入实现。准备构建时即可 pick it up。

---

## Phase 2: Implementation

### Turn 5: User 开始实现

**User:**
> Let's implement STORY-MOV-001. I'm ready to start coding.

### Turn 6: Agent 读取 Story 和 ADR

**Agent（gameplay-programmer）:**
> Reading `production/stories/STORY-MOV-001.md`, `design/gdd/movement-system.md`, and `docs/architecture/movement-adr-001.md`...
>
> **Architecture (from ADR-001):**
> - `MovementComponent.gd` — attached to player scene, not a singleton
> - Terrain modifier lookup via `TerrainLayer.get_modifier(tile_position)` helper
> - Stamina events via signal (not direct call to StaminaSystem)
>
> **My proposed file structure:**
> ```
> src/gameplay/movement/
>   movement_component.gd       # CharacterBody2D logic, state machine
>   terrain_modifier_table.gd   # Const table: terrain_type -> {speed_mod, drain_mod}
> tests/unit/
>   test_movement_formulas.gd   # Unit tests for speed/drain calculations
> ```
>
> May I proceed with this structure?

**User:**
> Yes

### Turn 7: Agent 实现并展示关键代码

**Agent:**
> 正在实现 `movement_component.gd`。写入文件前先给你 review 关键片段：
>
> ```gdscript
> class_name MovementComponent
> extends Node
>
> signal stamina_event(type: String, amount: float)
>
> @export var base_walk_speed: float = 120.0
> @export var run_multiplier: float = 1.7
> @export var stamina_drain_walk: float = 2.0
> @export var stamina_drain_run: float = 6.0
> @export var stamina_cost_roll: float = 15.0
>
> var _is_carrying_heavy: bool = false
>
> func _physics_process(delta: float) -> void:
>     var terrain_mod := _get_terrain_modifier()
>     var effective_speed := _calculate_speed(terrain_mod)
>     # ...
> ```
>
> 所有值都是 `@export`——没有 hardcoded values。这是你想要的方向吗？

**User:**
> Looks good. Write it.

### Turn 8–9: Agent 写入文件和测试

**Agent writes:**
- `src/gameplay/movement/movement_component.gd`
- `src/gameplay/movement/terrain_modifier_table.gd`
- `tests/unit/test_movement_formulas.gd`

**Agent:**
> Files written. Running available linting checks...
>
> No errors. Tests file created with 6 unit tests covering:
> - Walk speed formula (3 terrain types)
> - Run speed formula
> - Stamina drain calculation
> - Roll stamina cost (with and without zero-velocity edge case)
>
> Manual testing needed for: invincibility frames, slope blocking, terrain integration (requires running scene).

---

## Phase 3: Story Completion

### Turn 10: User 手动测试并运行 /story-done

**User:**
> I've tested it in the scene — everything works. /story-done production/stories/STORY-MOV-001.md

### Turn 11: Agent 运行 Completion Review

**Agent（通过 /story-done）:**
> Reading story, GDD, ADRs...
>
> **Phase 1: Story Located** ✅ `production/stories/STORY-MOV-001.md`
>
> **Phase 2: Acceptance Criteria Verification**
>
> | # | Criterion | Verification | Status |
> |---|-----------|--------------|--------|
> | 1 | Walk speed correct on normal ground | Auto: formula unit tests pass | ✅ AUTO |
> | 2 | Run speed correct | Auto: formula unit tests pass | ✅ AUTO |
> | 3 | Run cancels at stamina 0 | Manual: user confirmed | ✅ MANUAL |
> | 4 | Roll invincibility frames work | Manual: user confirmed | ✅ MANUAL |
> | 5 | Terrain modifiers apply correctly | Manual: user confirmed | ✅ MANUAL |
> | 6 | Heavy carry disables run | Auto: not yet testable (inventory not integrated) | ⏳ DEFERRED |
> | 7 | Stamina signals fire correctly | Auto: integration test pending | ⏳ DEFERRED |
> | 8 | No hardcoded values | Auto: grep for magic numbers → 0 found | ✅ AUTO |
> | 9 | Slopes >45° block movement | Manual: user confirmed | ✅ MANUAL |
>
> **Phase 3: GDD/ADR Deviations**
>
> Scanning implementation against TR-IDs...
>
> - TR-MOV-001 through TR-MOV-007: ✅ Implemented as specified
> - TR-MOV-008 (heavy carry signal): ⚠️ ADVISORY — deferred to inventory integration story. Not a deviation, just unverifiable now.
>
> **Phase 4: Manifest Staleness Check**
>
> Story control manifest version `2026-03-10` matches current manifest `2026-03-10`. ✅
>
> **Phase 5: Code Review Prompt**
>
> Suggest running `/code-review src/gameplay/movement/` before marking complete. Not blocking.
>
> ---
> **Completion Report: COMPLETE WITH NOTES**
>
> Story 已完成。两个 criteria deferred 到 inventory integration——记录为 deferred，而不是 blocked。
>
> May I update the story status to `Status: Complete` and add Completion Notes, and update `production/sprint-status.yaml`?

**User:**
> Yes

### Turn 12: Agent 关闭 Story

**Agent writes:**
- Story `Status: Complete` + Completion Notes（记录 deferred criteria）
- `production/sprint-status.yaml` — STORY-MOV-001 set to `done`

**Agent:**
> STORY-MOV-001 closed.
>
> **Deferred criteria logged**（会在 inventory integration story 中自动浮现）：
> - Heavy carry disables run (requires inventory signal)
> - Stamina signal integration test (requires stamina system)
>
> **Next ready story from sprint:**
> - STORY-MOV-002: Stamina system — this is the logical next story (downstream dep now unblocked)
> - STORY-HUD-001: Movement HUD indicators — also unblocked
>
> Run `/story-readiness` on whichever you pick up next.

---

## 此示例展示了什么

- **Readiness gate catches real issues**：如果没有 `/story-readiness`，roll direction 歧义会导致后期实现决策
- **ADR status is a hard gate**：如果 `movement-adr-001.md` 是 `Proposed` 而不是 `Accepted`，story 会是 `BLOCKED`，实现不会开始
- **Deferred criteria**：不是所有 acceptance criterion 都能在 story close 时验证——`/story-done` 会追踪 deferred items，而不是阻塞完成
- **TR-ID references**：story 存储 `TR-MOV-001` IDs，而不是引用 GDD 原文——避免后续清理 GDD 措辞时产生误报 deviation flags
- **sprint-status.yaml**：sprint state 的单一事实来源，由 `/story-done` 更新，由 `/sprint-status` 读取
- **Manifest version check**：确保 story 的 implementation guidance 没有偏离当前 architecture decisions
