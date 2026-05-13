# 示例会话：使用 /design-system 编写 GDD

**背景：** 独立开发者，项目第 3 周。`/map-systems` 已经运行并生成了 `design/gdd/systems-index.md`。movement system 被列为 MVP tier、Foundation priority。

**起始状态：**
- `design/gdd/game-concept.md` 存在（survival-crafting game、2D、Godot 4.6）
- `design/gdd/systems-index.md` 存在（已识别 15 个系统，movement 是设计顺序中的第一个）
- 尚未编写任何 per-system GDD
- movement 没有上游依赖（它是 foundation）

**会话时长：** 约 60 分钟
**轮次：** 14
**结果：** 完整 `design/gdd/movement-system.md`，所有 8 个必需章节已写入文件，可用于 `/design-review`

---

## Turn 1: User 调用技能

**User:**
> /design-system movement

## Turn 2: Agent 加载上下文并提出计划

**Agent（game-designer，通过 /design-system）:**
> 开始前我正在加载上下文：
>
> - Read `design/gdd/game-concept.md` — survival-crafting、重探索、孤独幸存者滞留异星
> - Read `design/gdd/systems-index.md` — movement 是 **Foundation / MVP**，无上游依赖，下游：combat、exploration、stamina
> - 未找到 movement 的既有 GDD——从头开始
>
> **Technical Feasibility Pre-Check:**
>
> | Domain | Signal |
> |--------|--------|
> | Engine | Godot 4.6 — CharacterBody2D with move_and_slide() is well-supported |
> | Physics | Jolt is now the default in 4.6 — 2D movement unaffected, but note for future 3D work |
> | Downstream risk | Stamina system listed as downstream dep — movement must expose a stamina callback hook |
>
> GDD 模板有 **8 required sections**。我们会逐个处理：
> `Overview → Player Fantasy → Detailed Rules → Formulas → Edge Cases → Dependencies → Tuning Knobs → Acceptance Criteria`
>
> 我会展示每个章节的草稿，你批准或修改，然后我再把它写入文件，之后才进入下一节。
>
> 现在创建带空章节标题的文件骨架——may I write `design/gdd/movement-system.md` with placeholders?

**User:**
> Yes

**Agent writes** `design/gdd/movement-system.md`，包含 8 个空章节标题。

---

## Turn 3: Section 1 — Overview

**Agent:**
> **Section 1 draft — Overview:**
>
> > Movement system 是玩家与世界交互的主要界面。它管理孤独幸存者如何行走、奔跑、翻滚并穿越异星地形。Movement 应具有物理感——这颗星球的重力比地球更强，幸存者也身心疲惫——但仍要足够响应迅速，不妨碍玩家操作。该系统直接影响 exploration pacing、combat positioning 和 stamina system。
>
> 这是否捕捉了你想要的方向？

**User:**
> Good but add something about the terrain — surfaces slow you down or have friction modifiers.

**Agent:**
> Revised:
>
> > Movement system 是玩家与世界交互的主要界面。它管理孤独幸存者如何行走、奔跑、翻滚并穿越异星地形。Movement 应具有物理感——这颗星球的重力比地球更强，幸存者也身心疲惫——但仍要足够响应迅速，不妨碍玩家操作。地形表面会施加摩擦和速度修饰符（slick rock、sand、shallow water），让导航成为有意义的技能。该系统直接影响 exploration pacing、combat positioning 和 stamina system。
>
> May I write this to Section 1 in the file?

**User:**
> Yes

**Agent writes Section 1 to file.**

---

## Turn 4: Section 2 — Player Fantasy

**Agent:**
> **Section 2 draft — Player Fantasy:**
>
> > 玩家应该感觉自己是一个疲惫但有能力的幸存者——不是超级英雄，也不是无助者。早期移动是慎重且耗体力的；玩家会随时间获得流畅感。穿越异星地形时，目标是谨慎导航，同时有紧迫瞬间（逃离威胁、跃过缺口）。幻想是 “I know this terrain”——随着玩家内化 friction system，每种地表类型都会变得可读、可管理。
>
> 批准、修改，还是改变方向？

**User:**
> Love it. Write it.

**Agent writes Section 2 to file.**

---

## Turn 5: Section 3 — Detailed Rules

**Agent:**
> **Section 3 draft — Detailed Rules:**
>
> > **Base States:**
> > - **Walk** (default): Full directional control, moderate speed, low stamina drain
> > - **Run** (hold Shift): Faster, medium stamina drain per second — cancels automatically when stamina hits 0
> > - **Roll/Dodge** (tap Space): Quick burst in movement direction, brief invincibility frames, high stamina cost (flat)
> > - **Idle**: Zero movement input, stamina regenerates at full rate
> >
> > **Terrain Modifiers:**
> > - Normal ground: 1.0x speed multiplier, standard friction
> > - Sand/loose soil: 0.8x speed, 1.1x stamina drain (harder to move)
> > - Slick rock (wet): 1.1x speed, reduced stop friction (player overshoots)
> > - Shallow water (ankle-deep): 0.7x speed, no friction modifier
> > - Deep water: movement disabled, replaced by swimming (separate system, out of scope)
> >
> > **Collision:**
> > - CharacterBody2D + move_and_slide(); wall slide enabled
> > - Slopes up to 45° walked normally; >45° blocked
> > - One-way platforms supported (drop-through with Down + Jump)
>
> 内容很多——你希望我删减或扩展什么吗？

**User:**
> Add that running is disabled when carrying a heavy object (like a large resource chunk).

**Agent:**
> 已添加到 Run 规则：
> > - **Run** (hold Shift): Faster, medium stamina drain per second — cancels automatically when stamina hits 0. **Disabled when carrying heavy objects** (signals broadcast by inventory system).
>
> Write to file?

**User:**
> Yes

**Agent writes Section 3 to file.**

---

## Turn 6: Section 4 — Formulas

**Agent:**
> **Section 4 draft — Formulas:**
>
> 我先定义变量，再给出公式：
>
> | Variable | Type | Description |
> |----------|------|-------------|
> | `base_walk_speed` | float | Base walk speed in px/s (tunable) |
> | `run_multiplier` | float | Run speed = walk × this |
> | `terrain_speed_mod` | float | Per-terrain multiplier (0.7–1.1) |
> | `stamina_drain_walk` | float | Stamina units/sec while walking |
> | `stamina_drain_run` | float | Stamina units/sec while running |
> | `stamina_cost_roll` | float | Flat stamina cost per roll |
> | `terrain_drain_mod` | float | Per-terrain stamina drain multiplier |
>
> **Effective Speed:**
> ```
> effective_speed = base_walk_speed × run_multiplier (if running, else 1.0) × terrain_speed_mod
> ```
>
> **Stamina Drain (per second):**
> ```
> drain_per_sec = stamina_drain_walk (or stamina_drain_run if running) × terrain_drain_mod
> ```
>
> **Roll Stamina Cost (flat):**
> ```
> stamina_after_roll = current_stamina - stamina_cost_roll
> (clamped to 0 — roll still executes, but player lands with 0 stamina)
> ```
>
> 批准，还是调整变量名/公式？

**User:**
> Looks right. Write it.

**Agent writes Section 4 to file.**

---

## Turn 7–9: Sections 5, 6, 7

*（这些章节遵循同样模式——agent 起草，user 批准或请求小调整，agent 在进入下一节前将每节写入文件。此处简写。）*

**Section 5 — Edge Cases** covered:
- Player rolls into a wall (animation completes, no movement bonus)
- Stamina hits 0 mid-run (transitions to walk, no lurch)
- Two terrain types overlapping (lower multiplier wins)
- Roll on slick rock (still applies slick friction to stopping, not to the roll itself)

**Section 6 — Dependencies** covered:
- **Stamina system** (downstream): movement exposes `on_stamina_event(type: String, amount: float)` signal
- **Inventory system** (downstream): listens to `carrying_heavy_object_changed(is_heavy: bool)` signal
- **Input system**: movement direction from `InputMap` — standard Godot action names (`ui_left`, `ui_right`, etc.)
- **Terrain layer**: tile metadata drives terrain modifier lookup

**Section 7 — Tuning Knobs** covered:
- `base_walk_speed` (default: 120 px/s)
- `run_multiplier` (default: 1.7)
- Per-terrain speed and drain modifiers (table of 4 terrain types)
- `stamina_drain_walk`, `stamina_drain_run`, `stamina_cost_roll`

---

## Turn 10: Section 8 — Acceptance Criteria

**Agent:**
> **Section 8 draft — Acceptance Criteria:**
>
> 以下是证明该系统完成的可测试条件：
>
> - [ ] Player walks at `base_walk_speed` on normal ground (measured with debug overlay)
> - [ ] Player runs at `base_walk_speed × run_multiplier` on normal ground
> - [ ] Run automatically cancels when stamina reaches 0, no input required
> - [ ] Roll executes with correct invincibility frames (verify via hitbox debug mode)
> - [ ] Each terrain type applies the correct speed modifier (QA table in sprint plan)
> - [ ] Carrying heavy object disables run (test with inventory integration)
> - [ ] Stamina system receives `on_stamina_event` signals during walk, run, and roll
> - [ ] All movement values come from exported variables — no hardcoded numbers in code
>
> 这是否覆盖了你对 “done” 的定义？

**User:**
> Add one for slopes — make sure >45 degree slopes block movement.

**Agent:**
> 已添加：
> - [ ] Slopes ≤45° traversed normally; slopes >45° block movement (player slides back)
>
> Write to file?

**User:**
> Yes. Write it.

**Agent writes Section 8 to file.**

---

## Turn 11: Completion Summary

**Agent:**
> 所有 8 个章节已写入 `design/gdd/movement-system.md`。
>
> **GDD Status:**
> - ✅ Overview
> - ✅ Player Fantasy
> - ✅ Detailed Rules
> - ✅ Formulas
> - ✅ Edge Cases
> - ✅ Dependencies (exposes 2 signals: stamina_event, carrying_heavy)
> - ✅ Tuning Knobs
> - ✅ Acceptance Criteria
>
> **Key decisions made:**
> - Terrain modifiers as tile metadata (not code constants)
> - Rolling has a flat stamina cost (not per-second)
> - Heavy carry disables run (signal-driven, not hardcoded check)
>
> **Recommended next step:** Run `/design-review design/gdd/movement-system.md` before moving to the next system in your queue (stamina is next in dependency order, per systems-index).
>
> Review 会验证完整性、内部一致性，并在你基于该 GDD 构建前捕捉需要修订的问题。

---

## 此示例展示了什么

- **Incremental file writing**：每个章节在批准后立即写入磁盘——会话崩溃最多只会丢失一个进行中的章节
- **Template population**：GDD 模板的 8 个章节通过对话变成具体内容，而不是一次性批量生成
- **Dependency signaling**：agent 在 Dependencies 章节主动暴露下游 signal contracts（stamina、inventory）
- **Technical feasibility pre-check**：agent 在设计开始前提示 Jolt physics 变化，而不是等实现失败后才发现
- **Section-by-section cycle**：不会一次倾倒完整草稿——每个章节都是小而可审阅的单元
- **Recovery**：如果会话崩溃，agent 重启后重新读取文件，并从第一个空章节继续
