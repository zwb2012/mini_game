# 示例会话：UX Pipeline — /ux-design → /ux-review → /team-ui

**背景：** 独立开发者，Pre-Production 阶段。HUD 和 inventory screen 是最先要设计的 UI。游戏已有 player journey 文档，以及 inventory 和 combat 的 GDD。

**起始状态：**
- `design/gdd/inventory-system.md` — complete
- `design/gdd/combat-system.md` — complete
- `design/player-journey.md` — complete（已定义 6-phase arc）
- 尚无 UX specs
- `design/ux/` 目录不存在

**会话时长：** 约 90 分钟，跨两个会话（先 HUD design，再 inventory screen）
**轮次：** 16
**结果：** 创建并 review 了 `design/ux/hud.md` 和 `design/ux/screens/inventory.md`；team-ui 已交接给 visual implementation

---

## Part 1: 使用 /ux-design 设计 HUD

### Turn 1: User 开始 HUD Design

**User:**
> /ux-design hud

### Turn 2: Agent 加载上下文并提出方法

**Agent（ux-designer，通过 /ux-design）:**
> Starting HUD design. Loading context...
>
> - `design/player-journey.md` read — key states: Calm Exploration, Tension (threat detected), Crisis (low HP/stamina), Combat
> - `design/gdd/combat-system.md` — HUD needs: HP bar, stamina bar, active ability cooldowns (up to 3), damage numbers
> - `design/gdd/inventory-system.md` — HUD needs: quick slots (4 slots), active item indicator
>
> **HUD Philosophy question:** 玩家在游玩期间的主要注意力焦点是什么？
>
> 这决定 HUD 应该有多强的存在感：
> - **Option A: Diegetic (low presence)** — HP 仅在受伤时显示，stamina 仅在消耗时显示。World-first，HUD 除非紧急否则退到背景。
> - **Option B: Persistent minimal** — HP 和 stamina 始终可见，小而不碍事。无需模式切换即可快速参考。
> - **Option C: Full tactical** — 所有信息始终可见（HP、stamina、cooldowns、map、inventory slots）。玩家始终拥有完整态势感知。
>
> 考虑到你的 survival game 和 “lone survivor” fantasy，A 或 B 最符合该 genre。

**User:**
> B — I want it always there but minimal. The player is always managing resources.

### Turn 3: Agent 起草 HUD Philosophy 章节

**Agent:**
> **HUD Philosophy draft:**
>
> > **Approach: Persistent Minimal**
> > HUD 始终可见，但只占用最小屏幕空间。玩家是资源管理型幸存者——隐藏 HP/stamina 会制造挫败而非紧张。所有关键状态都可一眼读懂，不打断 exploration focus。当元素变得紧急时会提高视觉权重（HP below 30% pulses, stamina at 0 flashes），之后回到 minimal state。
>
> May I write this to `design/ux/hud.md` as the Philosophy section?

**User:**
> Yes

**Agent creates `design/ux/hud.md` and writes Philosophy section.**

*（Turns 4–7 继续 section-by-section HUD authoring：Info Architecture、Zones、Element Specs、State Machine、Visual Budget、Platform Adaptation——每节都先起草、批准，再写入文件。）*

---

**所有章节完成后的 Final HUD structure:**

```
design/ux/hud.md
  - Philosophy: Persistent Minimal
  - Info Architecture: HP (top-left), Stamina (top-left below HP), Quick Slots (bottom-center),
    Ability Cooldowns (bottom-right), Damage Numbers (world-space)
  - Zones: 4 defined (top-left vitals, bottom-center interaction, bottom-right abilities, world-space)
  - Element Specs: 6 elements with dimensions, font sizes, opacity rules
  - State Machine: Calm / Tension / Crisis / Combat (4 states, transition triggers)
  - Visual Budget: Max 8% screen coverage, 3 simultaneous animations
  - Platform Adaptation: Controller (aim reticle added), Mobile (out of scope v1)
```

---

## Part 2: 使用 /ux-design 设计 Inventory Screen

### Turn 8: User 开始 Inventory Screen

**User:**
> /ux-design screen inventory

### Turn 9: Agent 扫描 GDD 和 Player Journey

**Agent:**
> Loading context for inventory screen...
>
> From `design/gdd/inventory-system.md`:
> - Grid inventory, 6×8 slots
> - Items have weight (affects movement) and stack size
> - Player can equip, drop, inspect, split stacks
>
> From `design/player-journey.md`:
> - Inventory opens frequently during Calm Exploration
> - Players should feel "organized and in control" when opening inventory
> - Anxiety moment: "I need to decide what to drop" — should be clear, not panicked
>
> **Player Need（来自 journey）:** *I need to quickly assess what I'm carrying, decide what to keep or drop, and get back into the world.*
>
> **Key design question:** 玩家如何访问 inventory actions？
> - **Option A: Right-click context menu** — hover item → right-click → menu appears (Escape/common)
> - **Option B: Drag-based** — drag to drop zone to drop; drag to equipment slot to equip (Stardew Valley)
> - **Option C: Inspect panel** — click item → details panel appears on right with action buttons

**User:**
> B — drag-based. I want it tactile.

*（Turns 10–12 继续为 inventory screen spec 进行 section-by-section：Player Need、Layout Zones、States、Interaction Map、Data Requirements、Events Fired、Accessibility、Localization。）*

---

## Part 3: /ux-review

### Turn 13: User 运行 Review

**User:**
> /ux-review design/ux/

### Turn 14: Agent Review 两份文档

**Agent（通过 /ux-review）:**
> Reviewing all UX specs in `design/ux/`...
>
> ---
> **HUD Review (`hud.md`):**
>
> | Check | Status | Notes |
> |-------|--------|-------|
> | GDD alignment — all required elements present | ✅ | HP, stamina, quick slots, cooldowns all specced |
> | State machine coverage | ✅ | All 4 gameplay states covered |
> | Accessibility tier | ⚠️ | No colorblind mode specified for HP/stamina bars (red/yellow convention) |
> | Visual budget | ✅ | 8% screen coverage, within budget |
> | Platform notes | ✅ | Controller variant documented |
>
> **Inventory Screen Review (`screens/inventory.md`):**
>
> | Check | Status | Notes |
> |-------|--------|-------|
> | Player Need stated | ✅ | |
> | All GDD actions covered | ✅ | Equip, drop, inspect, split all in interaction map |
> | Drag-drop interaction fully specified | ⚠️ | Drop target behavior when inventory is full not defined — what happens? |
> | Accessibility: keyboard alternative for drag | ❌ | MISSING — drag-only with no keyboard path fails motor accessibility |
> | Localization: all strings tagged | ✅ | |
> | Data events fired | ✅ | `item_equipped`, `item_dropped`, `stack_split` all mapped |
>
> ---
> **Verdict: NEEDS REVISION**
>
> 在 handoff 给 /team-ui 前，必须解决两个问题：
>
> 1. **BLOCKING (Accessibility):** Inventory screen 没有 drag-drop 的 keyboard alternative。Motor accessibility 要求存在非拖拽交互路径。添加 “press X to pick up / press X again to place” toggle，或带 keyboard-accessible action buttons 的 details panel。
>
> 2. **ADVISORY (HUD):** HP/stamina bars 仅用颜色传达状态。为 colorblind users 添加 secondary indicator（shape、icon 或 pattern）。可在 visual pass 中解决。
> 3. **ADVISORY (Inventory):** Full-inventory drop behavior 未指定。在实现前在 GDD 中解决，或记录为 out-of-scope。

### Turn 15: User 解决 Blocking Issue

**User:**
> For keyboard: press F to pick up item at cursor, press F again on target slot to place it. Add this to the inventory spec.

**Agent:**
> Adding to Interaction Map under "Keyboard / Controller Path":
>
> > Press F (or South button) to pick up item at cursor. Item enters "held" state with visual indicator. Press F again on target slot to place. Press Escape to cancel and return item.
>
> May I write this to `design/ux/screens/inventory.md` and re-run the accessibility check?

**User:**
> Yes

**Agent writes update. Re-checks accessibility — now passes.**

---

## Part 4: Handoff to /team-ui

### Turn 16: User 启动 Team UI

**User:**
> /team-ui

**Agent（通过 /team-ui）:**
> Running UX pipeline context check...
>
> - `design/ux/hud.md` — reviewed ✅
> - `design/ux/screens/inventory.md` — reviewed ✅
> - `/ux-review` verdict: NEEDS REVISION was resolved — current state: APPROVED ✅
>
> Proceeding to **Phase 2: Visual Design**
>
> Handing off to `art-director` for visual spec (color palette, typography, iconography aligned to art bible)...
>
> *(team-ui continues through visual design → layout implementation → accessibility audit → final review)*

---

## 此示例展示了什么

- **Context-driven design**：agent 读取 player-journey.md，用玩家情绪状态来支撑 HUD 决策，而不只是功能列表
- **UX review is a hard gate**：`/team-ui` 在进入 visual design 前会检查是否有通过的 `/ux-review`
- **Accessibility caught early**：缺失 keyboard alternative 被 review 捕捉，而不是到最后一周才由 QA tester 发现
- **Blocking vs. advisory**：缺失 keyboard path 是 BLOCKING（阻止 handoff）；colorblind colors 是 ADVISORY（可在 visual pass 修复）
- **Section-by-section UX authoring**：与 `/design-system` 相同的 incremental pattern——每个章节进入下一步前都会写入文件
- **Separate HUD and screen files**：`design/ux/hud.md` 是全游戏 HUD；per-screen specs 位于 `design/ux/screens/`
- **Pattern library enforced by /team-ui**：本会话后，inventory drag-drop 会成为 `design/ux/interaction-patterns.md` 中的 documented pattern，供所有后续 screens 引用
