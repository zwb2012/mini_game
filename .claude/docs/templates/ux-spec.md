# UX 规范：[Screen / Flow Name]

> **Status**: Draft | In Review | Approved | Implemented
> **Author**: [Name or agent — e.g., ui-designer]
> **Last Updated**: [Date]
> **Screen / Flow Name**: [Short identifier used in code and tickets — e.g., `InventoryScreen`, `NewGameFlow`]
> **Platform Target**: [PC | Console | Mobile | All — list all that this spec covers]
> **Related GDDs**: [Links to the GDD sections that generated this UI requirement — e.g., `design/gdd/inventory.md § UI Requirements`]
> **Related ADRs**: [Any architectural decisions that constrain this screen — e.g., `ADR-0012: UI Framework Selection`]
> **Related UX Specs**: [Sibling and parent screens — e.g., `ux-spec-pause-menu.md`, `ux-spec-settings.md`]
> **Accessibility Tier**: Basic | Standard | Comprehensive | Exemplary

> **Note — Scope boundary**: 此模板覆盖离散屏幕和流程（菜单、对话框、背包、设置、过场 UI 等）。对于主动游戏过程中持续存在的游戏内覆盖层，请改用 `hud-design.md`。如果某个屏幕是混合体（例如覆盖在游戏世界上的暂停菜单），请将其视为屏幕规范，并在 Navigation Position 中说明覆盖关系。

---

## 1. 目的与玩家需求

> **Why this section exists**: 每个屏幕都必须从玩家视角证明其存在的必要性。从开发者视角设计的屏幕（“显示存档数据”）会产生杂乱、令人困惑的界面。从玩家视角设计的屏幕（“让玩家在放下手柄前确信自己的进度是安全的”）会产生有目的、平静的界面。在触碰任何布局决策前先写本节——它是评估后续每个选择的过滤器。

**What player need does this screen serve?**

[一段话。命名真实的人类需求，而不是系统功能。思考：玩家打开这个屏幕时会说自己想要什么？如果它不起作用，什么会让他们沮丧？这种沮丧描述的就是需求。

示例 — 差：“显示玩家当前物品和装备。”
示例 — 好：“让玩家理解自己携带了什么，并快速决定下一场遭遇要带什么，同时不破坏他们对游戏世界的心智模型。背包是玩家在动作间隙的规划工具。”]

**The player goal** (what the player wants to accomplish):

[一句话。具体到可以为它写验收标准。示例：“在三次按键内找到想找的物品，并在不跳转到单独屏幕的情况下装备它。”]

**The game goal** (what the game needs to communicate or capture):

[一句话。这是系统需要从该交互中得到的内容。示例：“记录玩家的装备选择，并在下一场遭遇加载前传递给战斗系统。”本节防止 UI 看起来好但无法服务其所属系统。]

---

## 2. 玩家到达时的上下文

> **Why this section exists**: 屏幕不是孤立存在的。玩家在战斗中打开背包，与清完地牢后打开背包，其认知和情绪状态完全不同。同样的信息架构在一种上下文中可能显得压迫而复杂，在另一种上下文中却显得轻松简单。记录上下文，让设计决策——先显示什么、隐藏什么、动画化什么、简化什么——校准到实际到达该屏幕的玩家，而不是抽象用户。

| Question | Answer |
|----------|--------|
| What was the player just doing? | [例如，完成战斗遭遇 / 从探索中按下 Esc / 触发剧情过场] |
| What is their emotional state? | [例如，高张力——刚刚险胜 / 平静——在目标之间探索] |
| What cognitive load are they carrying? | [例如，高——正在追踪敌人位置 / 低——没有主动威胁] |
| What information do they already have? | [例如，他们知道刚拾取了一个物品，但还没看过属性] |
| What are they most likely trying to do? | [例如，检查新物品是否优于当前武器——主要用例] |
| What are they likely afraid of? | [例如，遗漏东西、犯下不可逆错误、忘记自己在哪里] |

**Emotional design target for this screen**:

[一句话描述玩家使用该屏幕时应有的感受。示例：“自信且掌控——玩家应感觉自己拥有完整信息和完整选择权，对结果没有歧义。”]

---

## 3. 导航位置

> **Why this section exists**: 不知道自己位于导航层级何处的屏幕，无法定义进入/退出转场、返回按钮行为，或它与游戏暂停状态的关系。导航位置也会及早揭示架构问题——如果该屏幕可从八个不同地方到达，这是复杂度警报，应在设计中解决，而不是留给实现。

**Screen hierarchy** (use indentation to show parent-child relationships):

```
[Root — e.g., Main Menu]
  └── [Parent Screen — e.g., Settings]
        └── [This Screen — e.g., Audio Settings]
              ├── [Child Screen — e.g., Advanced Audio Options]
              └── [Child Screen — e.g., Speaker Test Dialog]
```

**Modal behavior**: [Modal (blocks everything behind it, requires explicit dismiss) | Non-modal (game continues behind it) | Overlay (renders over game world, game paused) | Overlay-live (renders over game world, game continues)]

> 如果该屏幕是模态：记录关闭行为。能否按 Back/B 关闭？按 Escape？点击外部？能否关闭，还是玩家必须完成？不可关闭模态摩擦很高——请说明理由。

**Reachability — all entry points**:

| Entry Point | Triggered By | Notes |
|-------------|-------------|-------|
| [e.g., Main Menu → Play] | [Player selects "New Game"] | [Primary entry point] |
| [e.g., Pause Menu → Resume] | [Player presses Start from any gameplay state] | [Secondary entry] |
| [e.g., Game event] | [Tutorial system forces open first time only] | [Systemic entry — must not break if player dismisses] |

---

## 4. 进入与退出点

> **Why this section exists**: 进入和退出定义该屏幕与其余导航系统的契约。每个进入点都必须有对应退出点。未定义的转场会变成 bug——玩家卡住，或游戏状态不一致。实现开始前完整填写此表。空单元格意味着设计工作未完成。

**Entry table**:

| Trigger | Source Screen / State | Transition Type | Data Passed In | Notes |
|---------|----------------------|-----------------|----------------|-------|
| [e.g., Player presses Inventory button] | [Gameplay / Exploration state] | [Overlay push — game pauses] | [Current player loadout, inventory contents] | [Works from any non-combat state] |
| [e.g., Item pickup prompt accepted] | [Gameplay / Item Pickup dialog] | [Replace dialog with full inventory] | [Newly acquired item pre-highlighted] | [The new item should be visually distinguished on open] |
| [e.g., Quest system directs player to inventory] | [Gameplay / Quest Update notification] | [Overlay push] | [Quest-relevant item ID for highlight] | [Screen should deep-link to the relevant item] |

**Exit table**:

| Exit Action | Destination | Transition Type | Data Returned / Saved | Notes |
|-------------|------------|-----------------|----------------------|-------|
| [e.g., Player closes inventory (Back/B/Esc)] | [Previous state — Exploration] | [Overlay pop — game resumes] | [Updated equipment loadout committed] | [Changes must be committed before transition begins] |
| [e.g., Player selects "Equip" on item] | [Same screen, updated state] | [In-place state change] | [Loadout change event fired] | [No navigation, just a state refresh] |
| [e.g., Player navigates to Map from inventory shortcut] | [Map Screen] | [Replace] | [No data] | [Inventory state is preserved if player returns] |

---

## 5. 布局规范

> **Why this section exists**: 布局规范是 UX 设计与 UI 编程之间的交接产物。它不需要像素级精确——它需要传达层级（什么重要）、邻近性（什么归为一组）和比例（什么大、什么小）。ASCII 线框图无需设计软件即可做到这一点。程序员读完本节应能不靠猜测构建正确结构。美术读完应知道视觉重量应集中在哪里。
>
> 以一个标准分辨率绘制布局（例如 1920x1080）。另行说明其他分辨率的适配。

### 5.1 线框图

```
[Draw the screen layout using ASCII art. Suggested characters:
 ┌ ┐ └ ┘ │ ─    for borders
 ╔ ╗ ╚ ╝ ║ ═    for emphasized/modal borders
 [ ]              for interactive elements (buttons, inputs)
 { }              for content areas (lists, grids, images)
 ...              for scrollable content
 ●                for the focused element on open

Example:
┌──────────────────────────────────────────────┐
│  [← Back]        INVENTORY         [Options] │  ← HEADER ZONE
├──────────────────────────────────────────────┤
│ ┌──────────────┐  ┌─────────────────────────┐│
│ │ CATEGORY NAV │  │  ITEM DETAIL PANEL      ││  ← CONTENT ZONE
│ │  ● Weapons   │  │  Item Name              ││
│ │    Armor     │  │  {item icon}            ││
│ │    Consumable│  │  Stats comparison       ││
│ │    Key Items │  │  Description text...    ││
│ ├──────────────┤  └─────────────────────────┘│
│ │ ITEM GRID    │                             │
│ │ {□}{□}{□}{□} │                             │
│ │ {□}{□}{□}{□} │                             │
│ │ ...          │                             │
│ └──────────────┘                             │
├──────────────────────────────────────────────┤
│   [Equip]     [Drop]     [Compare]  [Close]  │  ← ACTION BAR
└──────────────────────────────────────────────┘
]
```

### 5.2 区域定义

| Zone Name | Description | Approximate Size | Scrollable? | Overflow Behavior |
|-----------|-------------|-----------------|-------------|-------------------|
| [e.g., Header Zone] | [顶部栏：导航、屏幕标题、全局操作] | [Full width, ~10% height] | [No] | [长屏幕名以省略号截断] |
| [e.g., Category Nav] | [左面板：物品类别标签] | [~25% width, ~75% height] | [Yes — vertical if categories exceed panel] | [列表底部显示滚动指示器] |
| [e.g., Item Grid] | [中心：所选类别的物品图标网格] | [~45% width, ~75% height] | [Yes — vertical] | [分页：4x4 网格，溢出进入下一页] |
| [e.g., Detail Panel] | [右侧：所选物品的属性和描述] | [~30% width, ~75% height] | [Yes — vertical for long descriptions] | [底部淡出，滚动显示] |
| [e.g., Action Bar] | [底部：所选物品的上下文操作] | [Full width, ~15% height] | [No] | [操作少于 4 个时折叠为仅图标] |

### 5.3 组件清单

> 列出该屏幕上的每个离散 UI 组件。此表驱动实现任务列表——每一行都会成为要构建或复用的组件。

| Component Name | Type | Zone | Purpose | Required? | Reuses Existing Component? |
|----------------|------|------|---------|-----------|---------------------------|
| [e.g., Back Button] | [Button] | [Header] | [返回上一屏幕] | [Yes] | [Yes — standard NavButton component] |
| [e.g., Screen Title Label] | [Text] | [Header] | [显示 “INVENTORY” 或上下文名称] | [Yes] | [Yes — ScreenTitle component] |
| [e.g., Category Tab] | [Toggle Button] | [Category Nav] | [按类别过滤物品网格] | [Yes] | [No — new component needed] |
| [e.g., Item Slot] | [Icon + Frame] | [Item Grid] | [表示一个背包格，可为空或已填充] | [Yes] | [No — new component] |
| [e.g., Item Name Label] | [Text] | [Detail Panel] | [显示所选物品名称] | [Yes] | [Yes — BodyText component] |
| [e.g., Stat Comparison Row] | [Compound — label + value + delta] | [Detail Panel] | [显示属性值与当前装备对比] | [Yes] | [No — new component] |
| [e.g., Equip Button] | [Primary Button] | [Action Bar] | [将所选物品装备到适当槽位] | [Yes] | [Yes — PrimaryAction component] |
| [e.g., Empty State Message] | [Text + Icon] | [Item Grid] | [类别无物品时显示] | [Yes] | [Yes — EmptyState component] |

**Primary focus element on open**: [例如，Item Grid 中第一个物品——如果是深链进入，则为高亮物品。如果网格为空，焦点落在第一个 Category Tab 上。]

---

## 6. 状态与变体

> **Why this section exists**: 屏幕不是一张单图——它是一组状态，每个状态都必须显示正确、行为正确。只按“快乐路径”设计的屏幕会带着坏掉的空状态、不可见的加载指示器和缺失数据时的崩溃发布。在实现前记录每个状态。状态表也是 QA 的测试矩阵。

| State Name | Trigger | What Changes Visually | What Changes Behaviorally | Notes |
|------------|---------|----------------------|--------------------------|-------|
| [Loading] | [Screen is opening, data not yet available] | [Item Grid shows skeleton/shimmer placeholders; Action Bar buttons disabled] | [No interactions possible except Close] | [Should not be visible >500ms under normal conditions; if it is, investigate data fetch performance] |
| [Empty — no items in category] | [Player switches to a category with zero items] | [Item Grid replaced by EmptyState component: icon + "Nothing here yet."] | [Action Bar shows no item actions; Drop/Equip/Compare all hidden] | [Do not show disabled buttons — remove them. Disabled buttons with no tooltip are confusing.] |
| [Populated — items present] | [Category has at least one item] | [Item Grid fills with item slots; first slot is auto-focused] | [All item actions available for selected item] | [Default and most common state] |
| [Item Selected] | [Player navigates to an item slot] | [Detail Panel populates; selected slot has focus ring; Action Bar updates to item's valid actions] | [Equip/Drop/Compare enabled based on item type] | [Equip is disabled if item is already equipped — show a "Equipped" badge instead] |
| [Confirmation Pending — Drop] | [Player selects Drop action] | [Confirmation dialog overlays the screen] | [All background interactions suspended until dialog resolves] | [Use a modal confirmation, not an inline toggle. Items cannot be recovered after dropping.] |
| [Error — data load failed] | [Inventory data could not be retrieved] | [Item Grid shows error state: icon + "Couldn't load items." + Retry button] | [Only Retry and Close are available] | [Log the error; do not expose technical details to player] |
| [Item Newly Acquired] | [Screen opened from item pickup deep-link] | [Newly acquired item has a visual "New" badge; Detail Panel pre-populated with that item] | [Same as Item Selected but with badge until player navigates away] | [Badge persists until the player manually navigates off that slot once] |

---

## 7. 交互地图

> **Why this section exists**: 本节是该屏幕上每种输入行为的事实来源。它迫使设计师思考每种输入方式（鼠标、键盘、手柄、触摸）和每种交互状态（悬停、焦点、按下、禁用）。表中的缺口就是等待发生的 bug。交互地图也是无障碍审计的输入——如果某个操作只能用鼠标触达，它就会在键盘和手柄列失败。

### 7.1 导航输入

| Input | Platform | Action | Visual Response | Audio Cue | Notes |
|-------|----------|--------|-----------------|-----------|-------|
| [Arrow keys / D-Pad] | [All] | [Move focus within active zone] | [Focus ring moves to adjacent element] | [Soft navigation tick] | [Wrap at edges within zone; do not cross zones with arrows alone] |
| [Tab / R1] | [KB / Gamepad] | [Move focus to next zone (Category → Grid → Detail → Action Bar)] | [Focus ring jumps to first element in next zone] | [Distinct zone-change tone] | [Shift+Tab / L1 goes backward] |
| [Mouse hover] | [PC] | [Show hover state on interactive elements] | [Highlight / underline / color shift] | [None] | [Hover does NOT move focus — only click does] |
| [Mouse click] | [PC] | [Select and focus the clicked element] | [Pressed state flash, then selected/focused] | [Soft click] | [Right-click opens context menu if applicable; otherwise no-op] |
| [Touch tap] | [Mobile] | [Select and activate in one gesture] | [Press ripple] | [Soft click] | [Treat tap as click + confirm for low-risk actions; require explicit confirm for destructive actions] |

### 7.2 操作输入

| Input | Platform | Context (What must be focused) | Action | Response | Animation | Audio Cue | Notes |
|-------|----------|-------------------------------|--------|----------|-----------|-----------|-------|
| [Enter / A button / Left click] | [All] | [Item slot focused] | [Select item → populate Detail Panel] | [Detail panel slides in or updates in place] | [Panel fade/slide in, 120ms] | [Soft select tone] | [If item already selected: no-op] |
| [Enter / A button] | [All] | [Equip button focused] | [Equip selected item] | [Button animates press; item badge updates to "Equipped"; previously equipped item loses badge] | [Badge swap, 80ms] | [Equip success sound] | [Fires EquipItem event to Inventory system] |
| [Triangle / Y button / Right-click] | [All] | [Item slot focused] | [Open item context menu] | [Context menu appears adjacent to item slot] | [Popover, 80ms] | [Menu open sound] | [Context menu contains: Equip, Drop, Inspect, Compare] |
| [Square / X button] | [Gamepad] | [Item slot focused] | [Quick-equip without opening detail] | [Equip animation plays inline on slot] | [Slot flash, 80ms] | [Equip success sound] | [Convenience shortcut; does not change screen state] |
| [Esc / B button / Back] | [All] | [Any, screen level] | [Close screen and return to previous state] | [Screen exit transition plays] | [Slide out, 200ms] | [Back/close tone] | [Commits all changes before closing. No discard — inventory is not a draft.] |
| [F / L2] | [KB / Gamepad] | [Any] | [Toggle filter panel] | [Sort/filter overlay opens] | [Slide in from right, 200ms] | [Panel open tone] | [If no items in category, filter is disabled] |

### 7.3 特定状态行为

| State | Input Restriction | Reason |
|-------|------------------|--------|
| [Loading] | [All item and action inputs disabled] | [没有可操作数据；防止竞态条件] |
| [Confirmation dialog open] | [Only Confirm and Cancel inputs active] | [Modal — background is locked] |
| [Error state] | [Only Retry and Close active] | [没有可导航数据] |

---

## 8. 数据需求

> **Why this section exists**: UI 与游戏状态之间的分离是游戏 UI 系统最重要的架构边界。UI 读取数据；它不拥有数据。UI 发出事件；它不直接写状态。本节定义该屏幕到底需要显示哪些数据、数据来自哪里、更新频率如何。在实现前填写此表可防止两种常见失败模式：(1) UI 开发者伸手进入不该触碰的系统，(2) 系统直到 UI 已经半成品才知道自己需要暴露数据。

| Data Element | Source System | Update Frequency | Who Owns It | Format | Null / Missing Handling |
|--------------|--------------|-----------------|-------------|--------|------------------------|
| [e.g., Item list] | [Inventory System] | [On screen open; on InventoryChanged event] | [InventorySystem] | [Array of ItemData structs: id, name, icon_path, category, stats, is_equipped] | [Empty array → show Empty State. Never null — system must return array.] |
| [e.g., Equipped loadout] | [Equipment System] | [On screen open; on EquipmentChanged event] | [EquipmentSystem] | [Dict mapping slot_id → item_id] | [Unequipped slot has null value — UI shows empty slot icon] |
| [e.g., Item stat comparisons] | [Stats System] | [On item selection change] | [StatsSystem] | [Dict mapping stat_name → {current, new, delta}] | [If no item selected, detail panel shows placeholder. Stats system must handle this gracefully.] |
| [e.g., Player currency] | [Economy System] | [On screen open only — inventory does not show live currency] | [EconomySystem] | [Int — gold pieces] | [If currency system not active for this game mode, hide the currency row entirely] |
| [e.g., Newly acquired item flag] | [Inventory System] | [On screen open] | [InventorySystem] | [Array of item_ids flagged as new] | [If empty array, no badges shown] |

> **Rule**: 该屏幕绝不能直接写入上方列出的任何系统。所有玩家操作都会发出事件（见第 9 节）。系统更新自己的数据并通知 UI。

---

## 9. 触发事件

> **Why this section exists**: 这是 UI/系统边界的另一半。第 8 节定义 UI 读取什么，本节定义 UI 向游戏传达什么。在设计阶段指定事件可防止 UI 程序员编写游戏逻辑，也防止游戏程序员对 UI 行为感到意外。每个破坏性或改变状态的玩家操作都必须出现在此表中。

| Player Action | Event Fired | Payload | Receiver System | Notes |
|---------------|-------------|---------|-----------------|-------|
| [Player equips an item] | [EquipItemRequested] | [{item_id: string, target_slot: string}] | [Equipment System] | [Equipment System validates the action and fires EquipmentChanged if successful; UI listens for EquipmentChanged to update its display] |
| [Player drops an item] | [DropItemRequested] | [{item_id: string, quantity: int}] | [Inventory System] | [Fires only after player confirms the drop dialog. Inventory System removes the item and fires InventoryChanged.] |
| [Player opens item compare] | [ItemCompareOpened] | [{item_a_id: string, item_b_id: string}] | [Analytics System] | [No game-state change — analytics event only. Compare view is purely local UI state.] |
| [Player closes screen] | [InventoryScreenClosed] | [{session_duration_ms: int}] | [Analytics System] | [Fires on every close regardless of reason. Used for engagement metrics.] |
| [Player navigates between categories] | [InventoryCategoryChanged] | [{category: string}] | [Analytics System] | [Analytics only. No game state change.] |

---

## 10. 转场与动画

> **Why this section exists**: 转场不是装饰——它传达层级和因果。屏幕从右侧滑入暗示玩家向前移动。淡入淡出暗示上下文断裂。不一致的转场会让导航即使技术上正确也感觉破碎。本节确保转场被有意指定，而不是留给开发者自由裁量，并且从一开始就规划无障碍设置（减少动态效果）。

| Transition | Trigger | Direction / Type | Duration (ms) | Easing | Interruptible? | Skipped by Reduced Motion? |
|------------|---------|-----------------|--------------|--------|----------------|---------------------------|
| [Screen enter] | [Screen pushed onto stack] | [Slide in from right] | [250] | [Ease out cubic] | [No — must complete before interaction is enabled] | [Yes — instant appear at 0ms] |
| [Screen exit — Back] | [Player presses Back] | [Slide out to right] | [200] | [Ease in cubic] | [No] | [Yes — instant disappear] |
| [Screen exit — Forward] | [Player navigates to child screen] | [Slide out to left] | [200] | [Ease in cubic] | [No] | [Yes — instant] |
| [Detail panel update] | [Player selects a new item] | [Cross-fade content] | [120] | [Linear] | [Yes — if player navigates quickly, previous animation cancels] | [Yes — instant swap] |
| [Loading → Populated] | [Data arrives after load] | [Skeleton shimmer fades out, content fades in] | [180] | [Ease out] | [No] | [Yes — instant reveal] |
| [Action Bar button press] | [Player activates a button] | [Scale down 95% on press, return on release] | [60 down / 60 up] | [Ease out / ease in] | [Yes — if released early, returns to normal] | [No — this is tactile feedback, not decorative motion] |
| [Confirmation dialog open] | [Player initiates destructive action] | [Background dims 60% opacity; dialog scales up from 95%] | [150] | [Ease out] | [No] | [Yes — instant appear, no scale] |
| [New item badge appear] | [Screen opens with newly acquired item] | [Badge pops from 0% to 110% to 100% scale] | [200 total] | [Ease out back] | [No] | [Yes — instant appear at 100% scale] |

---

## 11. 输入方式完整性检查清单

> **Why this section exists**: 输入完整性不是可选项——它是主机平台认证要求，也是多个市场无障碍法律的风险区域。标记规范为 Approved 前填写此检查清单。任何未勾选项都会阻塞实现开始。

**Keyboard**
- [ ] 所有交互元素仅使用 Tab 和方向键即可到达
- [ ] Tab 顺序遵循视觉阅读顺序（每个区域内从左到右、从上到下）
- [ ] 鼠标可完成的每个操作也可由键盘完成
- [ ] 焦点始终可见（没有焦点环消失的元素）
- [ ] 屏幕打开时焦点不会逃出屏幕（模态使用焦点陷阱）
- [ ] Esc 键关闭或取消（且不会从屏幕内退出游戏）

**Gamepad**
- [ ] 所有交互元素可用 D-Pad 和左摇杆到达
- [ ] 面键映射已记录，并与平台惯例一致（见 Section 7.2）
- [ ] 没有任何操作需要无法用 D-Pad 复现的摇杆精度
- [ ] 如使用扳机和肩键快捷键，已记录
- [ ] 屏幕打开时手柄断开连接可优雅处理

**Mouse**
- [ ] 所有交互元素都定义了悬停状态
- [ ] 可点击命中目标至少 32x32px（优先 44x44px）
- [ ] 右键行为已定义（上下文菜单或 no-op——不能未定义）
- [ ] 所有可滚动区域的滚轮行为已定义

**Touch (if applicable)**
- [ ] 所有触摸目标至少 44x44px
- [ ] 滑动手势不与系统级滑动导航冲突
- [ ] 竖屏方向下所有操作可单手完成
- [ ] 如使用长按行为，已定义

---

## 12. 屏幕级无障碍需求

> **Why this section exists**: 无障碍需求必须在设计阶段指定，因为事后补做昂贵且通常在架构上不切实际。本节记录该屏幕特有的需求。项目级标准位于 `docs/accessibility-requirements.md`——填写本节前先查阅它，避免重复或与项目级承诺冲突。
>
> 本项目中的 Accessibility Tiers：
> - Basic: WCAG 2.1 AA 文本对比度、可键盘导航、没有仅靠运动传达的信息
> - Standard: Basic + 屏幕阅读器支持、色盲安全、焦点管理
> - Comprehensive: Standard + 减少动态效果支持、文本缩放、高对比模式
> - Exemplary: Comprehensive + 认知负荷管理、AAA 等效、已认证

**Text contrast requirements for this screen**:

| Text Element | Background Context | Required Ratio | Current Ratio | Pass? |
|--------------|-------------------|---------------|---------------|-------|
| [e.g., Item name in Detail Panel] | [Dark panel background ~#1a1a1a] | [4.5:1 (WCAG AA normal text)] | [TBD — verify in implementation] | [ ] |
| [e.g., Category tab label — inactive] | [Mid-grey tab background] | [4.5:1] | [TBD] | [ ] |
| [e.g., Category tab label — active] | [Accent color background] | [4.5:1] | [TBD] | [ ] |
| [e.g., Action button label] | [Button color (varies by state)] | [4.5:1] | [TBD] | [ ] |
| [e.g., Stat comparison delta (positive)] | [Detail panel] | [4.5:1 — do NOT rely on green color alone] | [TBD] | [ ] |

**Colorblind-unsafe elements and mitigations**:

| Element | Colorblind Risk | Mitigation |
|---------|----------------|------------|
| [e.g., Stat delta indicators (red/green for worse/better)] | [红绿色盲（Deuteranopia）——最常见类型] | [除颜色外，添加箭头图标（↑ / ↓）和 +/- 前缀。颜色是冗余指标，不是唯一指标。] |
| [e.g., Item rarity color coding (grey/green/blue/purple/orange)] | [多种类型——稀有度颜色是常见行业失败点] | [在图标下添加稀有度名称文本标签。颜色仅作补充。] |

**Focus order** (Tab key sequence, numbered):

[e.g.,
1. Back button (Header)
2. Options button (Header)
3. Category Tab 1 — Weapons
4. Category Tab 2 — Armor
5. Category Tab 3 — Consumables
6. Category Tab 4 — Key Items
7. Item Slot [0,0]
8. Item Slot [0,1] ... (grid traverses left-to-right, top-to-bottom)
9. Last item slot
10. Equip button (Action Bar)
11. Drop button (Action Bar)
12. Compare button (Action Bar)
13. Close button (Action Bar)
→ Cycles back to Back button

焦点不进入 Detail Panel——它是由物品焦点驱动的显示面板，不可独立导航。]

**Screen reader announcements for key state changes**:

| State Change | Announcement Text | Announcement Timing |
|--------------|------------------|---------------------|
| [Screen opens] | ["Inventory screen. [N] items. [Active category] selected."] | [On screen focus settle] |
| [Player focuses an item slot] | ["[Item name]. [Category]. [Rarity]. [Key stats summary]. [Equipped / Not equipped]."] | [On focus arrival] |
| [Player equips an item] | ["[Item name] equipped to [slot name]."] | [After EquipmentChanged event confirmed] |
| [Player drops an item] | ["[Item name] dropped."] | [After InventoryChanged event confirmed] |
| [Category changes] | ["[Category name]. [N] items."] | [On category tab focus] |
| [Empty state shown] | ["No items in [category name]."] | [When empty state renders] |

**Cognitive load assessment**:

[估算玩家使用该屏幕时同时追踪的信息流数量。对于此屏幕：(1) 物品网格位置，(2) 物品详情属性，(3) 用于对比的当前装备负载，(4) 可用操作，(5) 物品类别。共 5 条并发信息流——处于标准 7±2 限制内，但偏高。缓解：详情面板在导航时自动更新，玩家无需手动检索物品信息。通过自动显示属性对比来减少主动决策。]

---

## 13. 本地化考虑

> **Why this section exists**: 未考虑本地化的 UI 会在首次翻译时破裂。德语文本通常比英语长 30–40%。阿拉伯语和希伯来语需要从右到左布局镜像。日语和中文文本可能显著短于英语，造成尴尬留白。这些问题在规划时成本低，布局构建并发布后修复成本高。每个文本元素都应有明确最大字符数和溢出方案。

**General rules for this screen**:
- 所有文本元素必须容忍相对英语基准至少 40% 的扩展
- RTL 布局（阿拉伯语、希伯来语）：必须镜像布局——记录哪些元素镜像，哪些不镜像
- CJK 语言（日语、韩语、中文）：文本可能短 20-30%——验证文字更少时布局不会看起来损坏
- 不要在图片中使用文本——所有文本必须来自本地化字符串

| Text Element | English Baseline Length | Max Characters | Expansion Budget | RTL Behavior | Overflow Behavior | Risk |
|--------------|------------------------|----------------|-----------------|--------------|-------------------|------|
| [e.g., Screen title "INVENTORY"] | [9 chars] | [16 chars] | [78%] | [Mirror to right, or center — acceptable] | [Truncate with ellipsis — title is not critical content] | [Low] |
| [e.g., Item name] | [~15 chars avg, max ~35 "Enchanted Dragon Scale Gauntlets"] | [50 chars] | [43%] | [Right-align in RTL layouts] | [Truncate with tooltip showing full name on hover/focus] | [Medium — long fantasy item names are common] |
| [e.g., Item description] | [~80–120 chars] | [200 chars] | [67%] | [Right-align, wrap normally] | [Scroll within Detail Panel — no truncation] | [Low — panel is scrollable] |
| [e.g., Action button "Equip"] | [5 chars] | [14 chars] | [180%] | [Button layout mirrors; text right-aligns] | [Shrink font to 90% minimum, then truncate] | [Medium — "Ausrüsten" in German is 9 chars] |
| [e.g., Category tab "Consumables"] | [11 chars] | [18 chars] | [64%] | [Mirror tab position] | [Abbreviate: "Consum." — define abbreviations per language in loc file] | [High — long localized tab labels are a known problem] |

---

## 14. 验收标准

> **Why this section exists**: 验收标准是“完成”的契约定义。没有它们，实现完成时间由开发者说了算。有了它们，实现完成时间由 QA 测试者能否验证此列表中的每一项决定。编写测试者可独立验证、无需询问设计师含义的标准。每条标准都应是二元的——通过或失败，而不是主观的。

**Performance**
- [ ] 屏幕在最低配置硬件上触发后 200ms 内打开（首帧可见）
- [ ] 屏幕在最低配置硬件上触发后 500ms 内完全可交互（所有数据加载完成）
- [ ] 物品间导航不会产生可感知掉帧（维持目标帧率 ±5fps）

**Layout & Rendering**
- [ ] 屏幕在最低支持分辨率 [specify] 下正确显示（无重叠、无裁切、无溢出）
- [ ] 屏幕在最高支持分辨率 [specify] 下正确显示
- [ ] 如果目标为 PC，屏幕在 4:3、16:9、16:10 和 21:9 宽高比下正确显示
- [ ] 在定义的最大字符边界内，英语无文本溢出或截断
- [ ] 在最长翻译语言 [specify — typically German] 中无文本溢出或截断
- [ ] 所有状态（Loading, Empty, Populated, Error, Confirmation）都正确渲染
- [ ] 所有物品槽填满时，物品网格滚动平滑且无掉帧

**Input**
- [ ] 所有交互元素仅用 Tab 和方向键即可通过键盘到达
- [ ] 所有交互元素仅用 D-Pad 和面键即可通过手柄到达
- [ ] 所有交互元素可不借助键盘而通过鼠标到达
- [ ] 没有操作需要 Section 7 未记录的同时输入
- [ ] 键盘和手柄导航时焦点始终可见
- [ ] 屏幕打开时焦点不会逃出屏幕

**Events & Data**
- [ ] Section 9 中所有事件在所有退出路径上都以正确 payload 触发（用 debug logging 验证）
- [ ] 屏幕不直接写入任何游戏系统（验证：无直接状态变更调用）
- [ ] 背包变更在屏幕关闭并重新打开后正确持久化
- [ ] 屏幕打开期间能处理其他系统触发的 InventoryChanged 事件且不崩溃

**Accessibility**
- [ ] 所有文本通过 Section 12 指定的最低对比度
- [ ] 属性对比不把颜色作为唯一区分方式
- [ ] 屏幕阅读器在焦点上宣布物品名称和关键属性（用平台屏幕阅读器验证）
- [ ] 减少动态效果设置会导致即时转场（无动画转场）
- [ ] 高对比模式（如适用于 Accessibility Tier）渲染无视觉破损

**Localization**
- [ ] 任何支持语言中无文本元素溢出容器
- [ ] RTL 布局正确渲染（如果 RTL 是目标语言）
- [ ] 所有文本元素由本地化字符串驱动——无硬编码显示文本

---

## 15. 未决问题

> 在这里跟踪未解决的设计问题。每个问题都应有明确负责人和截止日期。Approved 规范必须有零个未决问题——要么转为决策，要么明确记录延期理由。

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| [e.g., Should item comparison be automatic (always showing equipped stats) or player-triggered (press Compare)?] | [ui-designer] | [Sprint 4, Day 3] | [Pending] |
| [e.g., Do we support controller cursor (free aim) in the item grid, or d-pad-only grid navigation?] | [lead-programmer + ui-designer] | [Sprint 4, Day 3] | [Pending — depends on ADR-0015 input model decision] |
| [e.g., What is the game's item drop policy — permanent loss or drop-to-world?] | [systems-designer] | [Requires GDD update] | [Blocked on inventory GDD Edge Cases section] |
| [e.g., Maximum inventory size — does the grid have a hard cap or is it infinite-scroll?] | [economy-designer] | [Sprint 3, Day 5] | [Pending] |
