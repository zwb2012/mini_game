# Interaction Pattern Library：[Game Title]

> **Status**: Draft | Stable | Under Revision
> **Author**：[ux-designer]
> **Last Updated**：[Date]
> **Version**：[1.0]
> **Engine**：[Godot 4.6 / Unity 6 / Unreal Engine 5]
> **UI Framework**：[Godot Control nodes / Unity UI Toolkit / Unreal UMG]
> **Related Documents**:
> - `design/art/art-bible.md`— 视觉标准（颜色、版式、图像）
> - `docs/accessibility-requirements.md`— 每个功能的可访问性承诺
> - `docs/ux/ux-spec-[screen].md`— 参考模式的单独屏幕规格

> **Why this document exists**: Every UI screen spec should be able to say
> “使用按钮（主）模式”而不是重新指定悬停状态，
> press animations, focus behavior, keyboard handling, and screen reader
> announcements from scratch. This library is the single source of truth for
> reusable interaction behaviors. When a screen spec references a pattern name,
> the programmer looks it up here. When the behavior changes, it changes here
> and applies everywhere.
>
> 这是一份动态文件。随着新屏幕的设计而添加图案 -
> do not design a new interaction without checking here first. If a new pattern
> is needed, add it here (or propose it to the ux-designer) before writing the
> first screen spec that uses it.
>
> **Status definitions**:
> - **Draft**: Interaction specified but not yet implemented or validated
> - **Stable**: Implemented, tested, and validated in at least one shipped screen
> - **Deprecated**：正在逐步淘汰 - 现有用途将被迁移，不要在新屏幕中使用

---

## How to Use This Library

**If you are designing a screen**: Browse the Pattern Catalog Index below before
inventing new interactions. When a standard pattern fits, reference it by name
在屏幕规范中（e.g.，“确认按钮使用按钮（主）模式”）。
当现有模式不适合时，提出一个新模式 - 将其记录在此处
or before the screen spec that introduces it.

**如果您正在实现屏幕**：当屏幕规范显示“使用[PatternName]
模式”，请在本文档中找到完整的规范。
implementation notes section contains engine-specific guidance. The accessibility
section contains the requirements that are non-negotiable.

**If you are reviewing a screen spec**: Verify that all interactive elements
reference a pattern from this library or include their own full interaction
规格。 “Standard按钮”或“通常方式”不是有效的参考。

**If you are updating a pattern**: Changing a Stable pattern affects every screen
that uses it. Before changing, audit all usages (search screen specs for the
pattern name), determine the impact, get approval from the ux-designer, and
update this document before or simultaneously with any implementation change.

---

## Pattern Catalog Index

> Add a row here every time a new pattern is added to this document.
> “Used In”列是使用情况审计跟踪 - 当新屏幕出现时更新它
> adopt the pattern.

| Pattern Name | Category | Description | Used In (Screens) | Status |
|-------------|----------|-------------|------------------|--------|
| Button (Primary) | Input | Main call-to-action. High visual weight. One per screen. | [Main Menu, Pause Menu, Settings] | Draft |
| Button (Secondary) | Input | Alternative action or cancel. Lower visual weight than Primary. | [All modal dialogs, settings screens] | Draft |
| Button (Destructive) | Input | Irreversible action. Requires confirmation before execution. | [Delete Save, Reset Settings] | Draft |
| Toggle | Input | Binary on/off state selection. | [Accessibility settings, audio settings] | Draft |
| Slider | Input | Continuous value selection. | [Volume controls, brightness, text size] | Draft |
| Dropdown / Select | Input | Selection from a discrete list of options. | [Resolution, language, key binding] | Draft |
| List Item | Layout / Input | Selectable row in a vertical scrollable list. | [Achievements, quest log, settings list] | Draft |
| Grid Item | Layout / Input | Selectable cell in a two-dimensional grid. | [Inventory, ability select, item shop] | Draft |
| Modal Dialog | Feedback / Layout | Blocking overlay requiring explicit player decision. | [Confirmation dialogs, error prompts] | Draft |
| Confirmation Dialog | Feedback / Layout | Specific modal for destructive action confirmation. | [Delete Save, Leave Match, Reset] | Draft |
| Toast / Notification | Feedback | Non-blocking temporary message in a screen corner. | [Achievement unlock, autosave notification] | Draft |
| Tooltip | Feedback | Contextual information on hover or focus. | [Inventory items, ability descriptions, settings] | Draft |
| Progress Bar | Feedback / Layout | Linear progress indicator. | [Loading screen, XP bar, quest progress] | Draft |
| Input Field | Input | Text entry control. | [Player name, search, key binding entry] | Draft |
| Tab Bar | Navigation | Tabbed section navigation within a single screen. | [Character sheet, settings, crafting] | Draft |
| Scroll Container | Layout | Scrollable content region with visible scroll indicator. | [Inventory, lore entries, credits] | Draft |
| Inventory Slot | Game-Specific | Item container in inventory grid (empty, filled, equipped, locked). | [Inventory screen, equipment screen] | Draft |
| Ability / Skill Icon | Game-Specific | Ability button with cooldown, charges, and locked states. | [HUD ability bar, skill tree] | Draft |
| Health / Resource Bar | Game-Specific | Value bar with threshold states and damage flash. | [HUD] | Draft |
| Minimap | Game-Specific | Overview map with player marker and points of interest. | [HUD] | Draft |
| Quest / Objective Tracker | Game-Specific | Active objective display with proximity and completion states. | [HUD] | Draft |
| Dialogue Box | Game-Specific | NPC conversation UI with speaker identification. | [All dialogue sequences] | Draft |
| Context Action Prompt | Game-Specific | 在可交互对象附近出现上下文“按 X 到[action]”提示。 | [World interaction] | Draft |
| Damage Number | Game-Specific | Floating combat feedback number. | [Combat HUD] | Draft |
| Status Effect Icon | Game-Specific | Buff/debuff indicator with duration. | [HUD status bar, enemy health display] | Draft |
| Notification Banner | Game-Specific | Achievement, level up, item acquired notifications. | [Global overlay] | Draft |
| Screen Push | Navigation | Forward navigation with directional animation. | [All menu navigation] | Draft |
| Screen Pop (Back) | Navigation | Back navigation with reversed animation. | [All menu navigation] | Draft |
| Screen Replace | Navigation | Replace current screen without stacking history. | [Main Menu to Loading Screen] | Draft |
| Modal Open / Close | Navigation | Overlay that dims background screen. | [All modal dialogs] | Draft |
| Tab Switch | Navigation | Same-screen content switch between tabs. | [All tabbed screens] | Draft |
| Focus Management | Navigation | Rules for where focus goes when screens open, close, or change. | [All screens] | Draft |
| Escape / Cancel | Navigation | Universal back behavior across platforms and input methods. | [All screens] | Draft |
| Loading State | Feedback | How screens and components indicate loading in progress. | [All loading states] | Draft |
| Empty State | Feedback | How empty lists and grids are presented. | [Empty inventory, no quests, no saves] | Draft |
| Error State | Feedback | How errors are communicated. | [Save failed, network error, invalid input] | Draft |
| Success Confirmation | Feedback | How completed actions are confirmed. | [Settings saved, item crafted, quest turned in] | Draft |
| Optimistic UI | Feedback | Showing assumed success before system confirmation. | [If online features are present] | Draft |

---

## Standard Control Patterns

---

#### Button (Primary)

**Category**: Input
**Status**: Draft
**何时使用**：屏幕上最重要的一个操作。 “开始游戏，”
“确认”、“接受”、“购买”。最多应有一个可见的主按钮
一次。这是“玩家在这里最有可能想做什么？”的答案。
**When NOT to Use**: Alternative or secondary actions; destructive actions that
require confirmation before the consequence is irreversible; any action that is
not the primary intent of the screen.

**Interaction Specification**:

| State | Visual | Input | Response | Duration | Audio |
|-------|--------|-------|----------|----------|-------|
| Default | Full-opacity fill, primary color from art-bible. Label centered. | — | — | — | — |
| Hovered (mouse) | 亮度+15%，细微比例1.03x，光标变为指针 | Mouse over element | Transition from Default | 80ms ease-out | [UI hover sound — see Sound Standards] |
| Focused (keyboard/gamepad) | Focus ring visible (2px, offset 3px, high contrast color). Same brightness as Hovered. | Tab / D-pad navigation | Transition from Default | 80ms ease-out | [UI focus sound — same as hover] |
| Pressed | 比例0.97x，亮度-10% | Click / Enter / A (Xbox) / Cross (PS) | Action fires on press-up, not press-down. Scale on press-down. | 60ms ease-in for press; 80ms ease-out on release | [UI confirm sound] |
| Disabled | 40% 不透明度，无指针光标，无悬停状态 | — | No response | — | — |
| Loading (post-press) | Replace label with spinner. Button remains at pressed scale, disabled state. | — | Prevents double-submission | Duration of async operation | — |

**Accessibility**:
- Keyboard: Tab to focus, Enter or Space to activate. Must be reachable from any other interactive element on screen via Tab sequence.
- Gamepad: D-pad or left stick to navigate focus to button. A (Xbox) / Cross (PS) to activate. Focus must be placed on Primary button by default when screen opens.
- 屏幕阅读器：按钮必须公开与可见标签匹配的可访问名称。作用：“按钮”。状态：禁用时“变暗”。激活公告：“[Label]按钮—[result of action, if known]。”
- Colorblind: Do not rely on color alone to distinguish Primary from Secondary. Primary uses higher visual weight (fill vs. outline, or larger size) in addition to color differentiation.
- Minimum touch target: 44x44pt (iOS HIG) / 48x48dp (Android). Apply even on PC if touch support is possible.

**Implementation Notes**:
[Godot: Extend `Button` control. Override `_draw()` for custom states rather than
修改主题中间状态。使用`focus_mode = FOCUS_ALL`确保键盘
聚焦能力。设置`mouse_default_cursor_shape = CURSOR_POINTING_HAND`。对于
缩放动画，在按钮父级的`scale`属性上使用 Tween
控制 - 缩放按钮本身可以剪辑子项。]

---

#### Button (Secondary)

**Category**: Input
**Status**: Draft
**何时使用**：替代或取消操作。 “返回”、“取消”、“跳过”、“也许
稍后。”视觉重量比 Primary 低——它应该在视觉上后退，而不是竞争。
**When NOT to Use**: Destructive actions (use Button (Destructive)). The most
important action on the screen (use Button (Primary)).

**Interaction Specification**:

| State | Visual | Input | Response | Duration | Audio |
|-------|--------|-------|----------|----------|-------|
| Default | Outlined style (border only, transparent fill), secondary color. Slightly smaller or lower weight than Primary. | — | — | — | — |
| Hovered | 背景填充显示为 15% 不透明度。边框变亮。缩放 1.02 倍。 | Mouse over | Transition from Default | 80ms ease-out | [UI hover sound — softer variant than Primary] |
| Focused | Focus ring, same specification as Primary. | Tab / D-pad | Transition from Default | 80ms ease-out | [UI focus sound] |
| Pressed | 缩放 0.97 倍，填充不透明度增加至 30% | Click / Enter / B (Xbox) / Circle (PS) on focused state | Action fires on press-up | 60ms ease-in | [UI cancel/back sound] |
| Disabled | 40% 不透明度 | — | No response | — | — |

**Accessibility**: Same requirements as Button (Primary). Accessible name must
match visible label. In a dialog with Primary and Secondary buttons, the Secondary
按钮通常也映射到平台“取消”输入（B / Circle / Escape）
as direct focus activation.

**Implementation Notes**：[Same as Button (Primary). Where a Primary and Secondary
一起出现，确保次要位置始终一致 —right/bottom
of Primary on horizontal layouts, or below Primary on vertical layouts. Consistency
across screens is more important than per-screen aesthetic preference.]

---

#### Button (Destructive)

**Category**: Input
**Status**: Draft
**When to Use**: Any action that is irreversible and causes loss of player data or
重大进展：“删除保存文件”、“重置所有设置”、“离开比赛”
“放弃更改。”在玩家施压之前，视觉处理会发出危险信号。
**When NOT to Use**: Actions that can be undone, or actions that are merely
consequential but reversible.

**Interaction Specification**:

| State | Visual | Input | Response | Duration | Audio |
|-------|--------|-------|----------|----------|-------|
| Default | 用破坏性颜色勾勒或填充（通常是不饱和的红色 - 确认可访问性要求中的色盲兼容性）。标签可能包括警告图标。 | — | — | — | — |
| Hovered / Focused | Same behavior as Button (Primary) hover/focus but with destructive color | — | — | 80ms | [UI hover sound] |
| Pressed (first press) | Does NOT execute the action. Instead, opens Confirmation Dialog pattern (see below). The button itself shows a brief pulse animation. | Click / Enter | Trigger Confirmation Dialog | 100ms pulse | [UI warning sound — distinct from standard confirm] |
| — | Confirmation Dialog handles the actual execution | — | — | — | — |
| Disabled | 40% 不透明度 | — | No response | — | — |

> **Critical rule**: A Button (Destructive) NEVER executes its action directly.
> It always triggers a Confirmation Dialog. There are no exceptions. A player
> who presses it by accident must always have one more opportunity to back out.
> Games that skip confirmation on destructive actions generate the most visible
> 任何用户体验失败类型的负面社区情绪。参见：每一个“不小心
> 已删除保存文件”在任何游戏论坛上的投诉。

**无障碍功能**：屏幕阅读器必须宣布破坏性：“[Label]按钮 — 此操作无法撤消。”除了可访问的名称之外，还可以使用`description`属性（如果可用）来添加警告文本。

**实施说明**：[Destructive button triggers a separate Confirmation Dialog scene. Pass the action callback to the dialog — the button itself does not hold the execution logic. This separation prevents accidental execution if the confirmation dialog has a bug.]

---

#### Toggle

**Category**: Input
**Status**: Draft
**When to Use**: Binary on/off settings where both states are equally valid and
当前状态必须一目了然。 “字幕：On/Off”、“瞄准辅助：
On/Off，”“通知：On/Off。”
**When NOT to Use**: Selections from more than two options (use Dropdown). Actions
that happen once rather than representing a persistent state (use Button). Cases
where the consequence of toggling is complex enough to need explanation (show
a description field alongside).

**Interaction Specification**:

| State | Visual | Input | Response | Duration | Audio |
|-------|--------|-------|----------|----------|-------|
| Off / Default | 轨道：静音填充。拇指：最左边的位置。标签：“关闭”或状态标签。 | — | — | — | — |
| Hovered | 轨道增亮 10%。光标：指针。 | Mouse over | Transition | 60ms | [UI hover sound] |
| Focused | 整个切换元素周围的聚焦环（轨道+拇指）。 | Tab / D-pad | — | 60ms | [UI focus sound] |
| Pressed / Activated | 拇指滑向右侧。跟踪填充更改为活动颜色。标签更改为“打开”或活动状态标签。状态持续存在。 | Click / Enter / A / Cross | Toggle state change. Fire onChange event. Persist value. | 150ms ease-in-out for slide | [Toggle ON sound] |
| Pressed / Deactivated | Thumb slides to left. Track reverts to muted fill. | Same inputs | Toggle state change | 150ms ease-in-out | [Toggle OFF sound — subtly different from ON] |
| Disabled | 40% 不透明度。No互动。当前状态仍然可见。 | — | No response | — | — |

**Accessibility**:
- Keyboard/Gamepad：空格或 Enter 进行切换。避免要求方向输入 (left/right) 进行切换 - 有些用户无法预测该行为。
- 屏幕阅读器： 角色：“开关”。状态：“开”或“关”——可访问名称不应包含状态（屏幕阅读器单独宣布状态）。正确：可访问名称“字幕”，状态“打开”。不正确：可访问名称“字幕打开”。
- The toggle label (not just the visual thumb position) must change to show current state for players who cannot reliably distinguish left from right positions.

**Implementation Notes**：[Godot: Use a custom Control or a CheckButton. The
built-in CheckButton provides accessibility role but uses a checkbox-style visual;
a custom slide-toggle animation may be needed for the target art style. Ensure
当运动减少模式处于活动状态时，幻灯片动画会被跳过 - 即
case, snap to final state instantly.]

---

#### Slider

**Category**: Input
**Status**: Draft
**When to Use**: Selecting a value from a continuous range where approximate values
是可以接受的，范围和相对位置很重要。音量 (0–100%)、亮度、
text size. The visual representation of position is itself useful information.
**When NOT to Use**: Precise value entry (use Input Field). Selection from a short
discrete list (use Dropdown). Binary state (use Toggle).

**Interaction Specification**:

| State | Visual | Input | Response | Duration | Audio |
|-------|--------|-------|----------|----------|-------|
| Default | Track (full width). Fill (left of thumb, shows current value). Thumb (draggable handle). Current value label (right of track or above thumb). | — | — | — | — |
| Hovered | Thumb enlarges slightly (1.2x). Track brightens. | Mouse over | — | 60ms | — |
| Focused | Focus ring on thumb. Track brightens. | Tab / D-pad | — | 60ms | [UI focus sound] |
| Dragging (mouse) | Thumb follows cursor. Fill updates in real time. Value label updates in real time. | 单击 + 拖动拇指 | Continuous value update. Fire onChange continuously. | Real time | [Slider adjust sound — subtle, loops while dragging] |
| Keyboard / D-pad adjust | 拇指移动一步（每按一次范围的 5%，或 1 个离散单位）。 | Left/Right arrows or Left/Right D-pad while focused | Step value change. Fire onChange per step. | Instant | [Slider step sound — one click per step] |
| Keyboard fast adjust | 更大的步长（范围的 25%）。 | Page Up / Page Down while focused | Large step value change | Instant | [Same step sound] |
| Released | Value locks. onChange fires final value. | Mouse release | — | — | — |
| Disabled | 40% 不透明度。No互动。价值看得见。 | — | No response | — | — |

**Accessibility**:
- Keyboard: Left/Right arrows to adjust by small step. Page Up/Page Down for large step. Home/End to jump to min/max.
- 屏幕阅读器：角色：“滑块”。可访问的名称：标签（e.g.，“音乐卷”）。每次更改时都会公布当前值：“音乐音量，80%。”Min/max值在首次聚焦时宣布。
- All sliders must show a numeric value alongside the visual position. Relying only on track fill position excludes players who cannot perceive relative position.

**Implementation Notes**：[Godot `HSlider`: set `step` to appropriate increment.
Override keyboard input to add Page Up/Down support via `_input()`. Bind the
`value_changed` signal to update the displayed numeric label. When motion reduction
模式已启用，确保值标签更新是唯一的反馈 - 不要抑制
them. Rumble feedback on gamepad slider adjustment is a nice enhancement for
accessibility.]

---

#### Dropdown / Select

**Category**: Input
**Status**: Draft
**When to Use**: Selection from a discrete list of 3-15 options where only the
selected value needs to be visible at rest. Display resolution, language, window
mode, input preset. The closed state shows only the current selection.
**何时不使用**：二元选择（使用切换）。超过 ~15 个选项（使用
full List pattern or a scrollable Select). When comparing options matters as much
as selecting one (show options visibly, e.g., as a horizontal selector or list).

**Interaction Specification**:

| State | Visual | Input | Response | Duration | Audio |
|-------|--------|-------|----------|----------|-------|
| Closed / Default | Label (left). Current value (right). Chevron-down icon (far right). | — | — | — | — |
| Hovered | 行背景填充为 10% 不透明度 | Mouse over | — | 60ms | — |
| Focused (closed) | Focus ring on entire row. | Tab / D-pad | — | 60ms | [UI focus sound] |
| Opening | Dropdown list appears below (or above if near screen bottom). List items visible. Previously selected item highlighted. Focus moves to selected item inside list. | Click / Enter / A / Cross | Open list | 100ms ease-out (expand) | [UI expand sound] |
| List item hovered/focused | List item highlights | Mouse / D-pad | — | 60ms | [UI hover sound] |
| List item selected | List closes. Closed state shows new value. onChange event fires. | Click / Enter / A / Cross on item | Select value, close list | 80ms ease-in (collapse) | [UI confirm sound] |
| Dismissed without selecting | List closes. Value unchanged. | Escape / B / Circle / click outside | Dismiss | 80ms | [UI cancel sound] |
| Disabled | 40% 不透明度。No互动。 | — | — | — | — |

**Accessibility**:
- Keyboard: Up/Down arrows navigate list items while open. Enter selects. Escape dismisses. First letter of an option jumps focus to first matching item.
- 屏幕阅读器：角色：“组合框”。可访问名称：字段标签。Expanded/collapsed州宣布。聚焦时公布当前值。每个列表项都会宣布其值和位置：“English，1 of 12”。
- 下拉列表绝不能遮盖当前项目或打开它的控件——这是小屏幕上的常见故障。

**Implementation Notes**：[Godot: Custom implementation using a `Button` (the
closed state) and a `PopupMenu` or a `VBoxContainer` revealed by animation. Native
`OptionButton` provides accessibility but limited visual customization. Ensure
the popup positions itself above the control if it would be clipped by the screen
bottom. Close the popup on `_input` detecting click outside its rect.]

---

#### List Item

**Category**: Layout / Input
**Status**: Draft
**When to Use**: A single selectable row in a vertically scrollable list. Achievements,
quest log entries, settings categories, save file slots. The list is the container;
this is the row within it.
**When NOT to Use**: Grid layouts where items exist in two dimensions (use Grid Item).
Non-selectable content rows (remove hover/focus states and the pressed state).

**Interaction Specification**:

| State | Visual | Input | Response | Duration | Audio |
|-------|--------|-------|----------|----------|-------|
| Default | Full-width row. Icon (optional, left). Primary label. Secondary label / metadata (right or below primary). Chevron (right, if navigates deeper). | — | — | — | — |
| Hovered | 行背景以 12% 不透明度突出显示。 | Mouse over | — | 60ms | — |
| Focused | 聚焦环位于行或行背景上，不透明度为 20%（与平台惯例一致）。 | D-pad / Tab | — | 60ms | [UI focus sound] |
| Selected (persistent) | 行背景不透明度为 25%。可能会显示一个选择指示符（左边框、复选标记）。与聚焦状态不同——可以选择一行但不能聚焦。 | — | Rendered state | — | — |
| Pressed / Activated | Brief brightness flash, then navigates or performs action | Click / Enter / A / Cross | Navigation or action | 80ms flash | [UI confirm sound] |
| Disabled | 40% 不透明度。No互动。 | — | — | — | — |

**Accessibility**:
- Keyboard/Gamepad:Up/Down箭头或方向键在列表项之间移动。该列表必须处理焦点循环 - 到达底部应该停止（而不是换行），除非明确设计了换行。
- 屏幕阅读器：角色：“listitem”。父列表角色：“列表”。可访问名称：主要标签内容。元数据（辅助标签）可以选择包含在描述中。宣布位置：“任务日志，12 中的 3。”
- Minimum row height: 44pt / 48dp for touch. For controller-primary platforms, 56px rows are more comfortable.

**Implementation Notes**：[Godot: Use a `VBoxContainer` inside a `ScrollContainer`.
Each row is a custom `Control` or `PanelContainer` with a `_gui_input` override.
For keyboard navigation inside the scroll container, implement custom focus
traversal — Godot 默认 Tab 导航不会滚动容器以保持
focused items in view. Use `ensure_control_visible()` on the scroll container.]

---

#### Grid Item

**Category**: Layout / Input
**Status**: Draft
**When to Use**: A selectable cell in a two-dimensional grid. Inventory slots,
ability select, crafting ingredient selection, character portrait selection. The
grid is the container; this is the cell.
**When NOT to Use**: Single-column content (use List Item). Non-selectable display
cells (remove interactive states).

**Interaction Specification**:

| State | Visual | Input | Response | Duration | Audio |
|-------|--------|-------|----------|----------|-------|
| Empty | Empty slot visual (subtle border or dashed outline). Different from disabled. | — | — | — | — |
| Populated | Item icon fills cell. Stack count (bottom right, if applicable). Quality indicator (border color or icon overlay). | — | — | — | — |
| Hovered | 亮度+15%。工具提示在 400 毫秒延迟后出现。 | Mouse over | — | 60ms | — |
| Focused | Focus ring (2px, offset 2px). Same brightness as hovered. Tooltip appears after 400ms delay or immediately on gamepad. | D-pad navigation | — | 60ms | [UI focus sound] |
| Selected (persistent) | Distinct border (thicker, contrasting color). May show selection checkmark. | Click / Enter / A / Cross | Select item. Can coexist with focused state on a different cell. | Instant | [UI select sound] |
| Pressed | Brief scale 0.95x, then executes action | Double-click / Enter / A / Cross | 行动（装备、使用、检查——由上下文定义） | 80ms | [UI confirm sound] |
| Locked | Padlock overlay icon on populated content. No hover/focus states. | — | No interaction | — | — |
| Drag source | 单元格变暗（50% 不透明度），拖动预览出现在光标处。 | 单击 + 拖动（仅限鼠标） | Begin drag operation | Instant | [UI grab sound] |
| Drop target (valid) | Cell brightens, accepting color indicator | Item dragged over | — | 60ms | — |
| Drop target (invalid) | Red tint or shake animation | Item dragged over invalid slot | — | 60ms | [UI error sound] |

**Accessibility**:
- Keyboard/Gamepad: D-pad or arrow keys navigate cells. The grid must communicate its dimensions to screen readers. Row/column position announced.
- 屏幕阅读器：角色：“gridcell”。父角色：“网格”。可访问名称：项目名称（或空单元格的“空槽”）。状态：选择时为“已选择”，锁定时为“变暗”。位置：“第 2 行，第 3 列。”
- 工具提示必须可以通过键盘访问 - 它们必须在单元格聚焦时出现，而不仅仅是在悬停时出现。

**Implementation Notes**：[Godot: `GridContainer` with fixed column count. Each
cell is a custom `Control`. Implement custom D-pad navigation by overriding
`_gui_input` and calculating the cell to the left/right/above/below based on
index and column count. `GridContainer` does not provide this natively.]

---

#### Modal Dialog

**Category**: Feedback / Layout
**Status**: Draft
**When to Use**: A decision or acknowledgment that must be resolved before the
玩家可以继续。对话框被阻塞 — 背景内容变暗并且
非交互式。 “您确定吗？”，“您的进度将被保存。”，错误状态。
**When NOT to Use**: Non-blocking notifications (use Toast / Notification). Information
that can wait until the player is ready (add it to a persistent help system instead).
Dialogs that should allow the player to continue playing behind them.

**Interaction Specification**:

| State | Visual | Input | Response | Duration | Audio |
|-------|--------|-------|----------|----------|-------|
| Opening | 背景叠加动画从 0 到 60% 不透明度。对话框面板的比例范围为 0.9 到 1.0。对话框从中心进入（而不是从边缘）。 | Triggered by code | Focus moves to first interactive element in dialog (or the Primary button) | 200ms ease-out | [UI modal open sound] |
| Active | Background non-interactive. Dialog has all input focus. Player cannot interact with background. | Keyboard / gamepad navigates within dialog only | — | — | — |
| Dismissing (confirmed) | 对话框面板缩放至 1.1，然后淡出。叠加层淡出至 0%。 | Primary button pressed | Execute action, return focus to trigger element | 180ms | [UI confirm sound] |
| Dismissing (cancelled) | 对话框面板缩放至 0.9，然后淡出。叠加层淡出至 0%。 | Secondary button / Escape / B / Circle | No action, return focus to trigger element | 150ms | [UI cancel sound] |
| Cannot dismiss | If the dialog represents a blocking error, do not provide a cancel path. Provide only resolution options. | — | — | — | — |

> **Focus trap rule**: While a modal dialog is open, Tab and D-pad navigation
> 必须仅在对话框的交互元素内循环。这一定是不可能的
> to navigate focus outside the dialog to the background content. This is both
> an accessibility requirement (WCAG 2.1 SC 2.1.2) and a UX integrity requirement.
> When the dialog closes, focus must return to the element that triggered it,
> not to the top of the page.

**Accessibility**:
- 屏幕阅读器：对话框容器角色：“对话框”。可访问的名称：对话框标题（必需 - 每个对话框都必须有一个标题，即使在视觉上隐藏）。打开时，屏幕阅读器会读出对话框标题和第一个可聚焦元素。焦点陷阱激活。
- Keyboard: Escape key always maps to the cancel/dismiss action (same as Secondary button or close button). Enter always maps to the primary/confirm action.
- Motion reduction: Scale animation replaced with instant appear/disappear. Overlay fade retained at 100ms (faster).

**Implementation Notes**：[Godot: Implement as a `CanvasLayer` with a high layer
值（100+）以确保它呈现在所有游戏内容之上。背景叠加
是黑色不透明度为 60% 的全屏`ColorRect`。使用`grab_focus()`
打开动画完成后对话框的主按钮。覆盖`_input()`到
实现焦点陷阱 - 拦截选项卡导航并重新路由到对话框的
focusable elements.]

---

#### Confirmation Dialog

**Category**: Feedback / Layout
**Status**: Draft
**When to Use**: The specific case of confirming a destructive action. Always
triggered by Button (Destructive). Always has exactly two options: confirm (labeled
与具体操作，而不是“确定”）并取消。
**When NOT to Use**: Non-destructive confirmations. Errors or notifications that
do not require a decision. Any dialog with more than two actions.

> **Label rule**: The confirm button must be labeled with the specific action,
> 不是通用的“OK”或“Yes”。 “删除保存文件”而不是“确定”。 “离开比赛”不是
> “Yes。”这可以减少难以阅读对话的玩家所犯的错误
> content quickly. The pattern comes from Apple HIG and also validated by decades
> of usability research.

**Structure**:
- 标题：简短，描述动作。 “删除保存文件？”不是“你确定吗？”
- 正文：用一句话说明后果。 “这无法挽回。”
- 确认按钮：按钮（主要）— 标有特定操作。 “删除保存文件。”
- 取消按钮：按钮（辅助）—“取消”。
- 默认焦点：取消（更安全的默认设置 - 减少意外的破坏性操作）。

**Accessibility**: Inherits all Modal Dialog accessibility. Additionally: screen
读者宣布“警报对话框，[title]”来表示破坏性上下文。默认
focus on Cancel is a requirement, not a preference.

**Implementation Notes**：[Confirmation Dialog is a specific instance of Modal
对话框 — 将其实现为子类或参数化场景。默认
focus on Cancel is critical: set `grab_focus()` on the Cancel button, not the
Confirm button, after open animation completes.]

---

#### Toast / Notification

**Category**: Feedback
**Status**: Draft
**When to Use**: Brief, non-blocking information that does not require a player
决定。 “游戏已保存。” “成就已解锁。” “你的库存已满。”玩家
can continue playing; the notification disappears on its own.
**When NOT to Use**: Information that requires a decision (use Modal Dialog).
Errors that require the player to take action. Critical information that the player
must not miss.

**Interaction Specification**:

| State | Visual | Input | Response | Duration | Audio |
|-------|--------|-------|----------|----------|-------|
| Entering | 从屏幕边缘滑入（通常是右下角，远离主要操作区域）。不透明度从 0% 渐变到 100%。 | Triggered by code | — | 200ms ease-out | [Sound matching notification type — see Sound Standards] |
| Displayed | Full opacity. Optional: icon (left), title, body text (optional), dismiss button (X, optional). | Pointer hover pauses auto-dismiss timer | Pause auto-dismiss | — | — |
| Auto-dismiss | 不透明度从 100% 淡化至 0%，滑出 | Timer expires (5 seconds default for one-line; 8 seconds for two-line) | Remove from queue | 200ms ease-in | — |
| Manual dismiss | Fades and slides out immediately | Click/tap X button or swipe on touch | Remove | 150ms | [UI cancel sound, quiet] |
| Queue overflow | New notification pushes oldest out early | New notification triggered while previous is displayed | FIFO queue, max 3 simultaneous | — | — |

**Accessibility**:
- 屏幕阅读器：Toast 必须在不需要焦点的情况下大声朗读。在 HTML 中，这使用`role="status"`或`role="alert"`。在游戏 UI 中，这需要引擎的无障碍功能通知系统。验证引擎参考文档中的引擎支持。
- Motion reduction: Slide animation replaced with fade only.
- Toasts must never be the sole communication channel for information the player needs to act on. If the information requires action, use a persistent UI element in addition to the toast.
- Auto-dismiss timer: 5 seconds is the minimum. Players with cognitive processing differences may need more time. Consider a setting to extend to 10 or 15 seconds.

**Implementation Notes**：[Godot: Manage a queue of `PanelContainer` scenes in a
`VBoxContainer` anchored to a screen corner. Each toast is instantiated, added to
the container, then auto-removed after a timer. The container should be on a high
`CanvasLayer`(50+) 但低于模式对话框 (100+)。使用`Tween`进行动画处理
`modulate.a` and `position.x`. When motion reduction is active, skip the position
animation.]

---

#### Tooltip

**Category**: Feedback
**Status**: Draft
**When to Use**: Contextual information that supplements a visible label. Item
descriptions in inventory. Stat explanations on a character sheet. Setting
descriptions in accessibility options. The player must be able to access this
information or proceed without it.
**何时不使用**：玩家必须阅读才能完成操作的信息 - 放置
that in the label or body text, not a tooltip. Tooltips are not discoverable
on mobile touch without a hover state. On touch-only platforms, use an info button
that opens a description modal instead.

**Interaction Specification**:

| State | Visual | Input | Response | Duration | Audio |
|-------|--------|-------|----------|----------|-------|
| Hidden | — | — | — | — | — |
| Hover trigger | — | Mouse enters element | Begin 400ms delay timer | — | — |
| Gamepad/keyboard trigger | — | Element receives focus | Begin 300ms delay timer (shorter because navigation is intentional) | — | — |
| Appearing | Tooltip panel fades in and scales from 0.95 to 1.0. Positioned near element (prefer above, adjust if near screen edge). | Timer expires | Show tooltip | 120ms ease-out | — |
| Displayed | Tooltip visible. Title (optional). Body text. Max width: 300px. Multiple lines allowed. | — | — | — | — |
| Hiding | Tooltip fades out | Mouse leaves element / focus moves away | Hide tooltip | 80ms ease-in | — |

**Accessibility**:
- Screen reader: Tooltip content must be accessible without hover. The accessible name of the parent element should include the most critical tooltip information. The full tooltip text is optionally in the `description` property. Screen reader reads tooltip content when element is focused.
- 延迟（300-400 毫秒）可防止意外的工具提示显示，并且是必需的 - 即时工具提示会破坏游戏手柄导航。
- Tooltip text must meet the same contrast requirements as body text (4.5:1 minimum).

**Implementation Notes**：[Godot: Attach a custom `TooltipControl` scene as a
child of the trigger element. Show/hide with a `Timer` node. Position the tooltip
using a `CanvasLayer` to ensure it appears above all other UI. For screen edges,
detect if the tooltip rect extends beyond `get_viewport_rect()` and flip the
position to the opposite side.]

---

#### Progress Bar

**Category**: Feedback / Layout
**Status**: Draft
**When to Use**: Linear progress toward a defined endpoint. Loading screens (time
to completion), XP fill toward next level, quest objectives with countable progress
（“击败 10 个敌人中的 3 个”），下载进度。
**When NOT to Use**: Circular or radial progress (use a separate Radial Progress
pattern if needed). Values that fluctuate up and down rapidly (use Health/Resource
Bar pattern). Values with no defined endpoint.

**Interaction Specification**:

| State | Visual | Input | Response | Duration | Audio |
|-------|--------|-------|----------|----------|-------|
| Default | Track (full width, background color). Fill (left to right, value color). Value label (percentage or N/M, outside or inside fill). | — | — | — | — |
| Value increasing | Fill width animates to new value | Value changes | Smooth fill animation | 300ms ease-out | [Context-dependent — XP gain has a sound; loading has none] |
| Value at maximum | Fill reaches full width. Optional: completion animation (pulse, glow). | 价值达到100% | Completion event fires | 200ms | [Completion sound if appropriate] |
| Value at zero | Fill hidden (zero width). Track still visible. | — | — | — | — |
| Indeterminate (unknown duration) | Animated loop (fill segment moves left-to-right, repeat). Used for loading of unknown duration. | — | — | Infinite loop | — |

**Accessibility**:
- 屏幕阅读器：角色：“进度条”。可访问名称：正在进行的内容（e.g.、“经验值”、“正在加载”）。值：当前数值和百分比和最大值。 “经验值，1000点中的450点，45%。”更新重大变化（不是每个像素）。
- Do not rely only on fill color to communicate value. Include a numeric label.
- 不确定的进度条：宣布“正在加载，正在进行中”——不宣布更改，因为值未知。
- 运动减少：不确定的动画被静态“加载”指示器取代。平滑填充动画被即时跳转到新值所取代。

**Implementation Notes**：[Godot: `ProgressBar` built-in with custom theming.
For indeterminate mode, `ProgressBar` does not have a native indeterminate state
在 Godot 4.x 中 — 在填充元素的位置上使用循环`Tween`来实现。
Ensure the Tween is paused when motion reduction mode is active and a static
indicator is shown instead.]

---

#### Input Field

**Category**: Input
**Status**: Draft
**When to Use**: Text entry. Player name on a new save, search within a list,
重新映射按键绑定（特殊情况 - 显示按键，而不是键入的文本），
entering a numeric value precisely.
**When NOT to Use**: Selecting from known options (use Dropdown or List). On
以控制台为主的平台，尽量减少文本输入——它需要虚拟键盘，
which is high friction.

**Interaction Specification**:

| State | Visual | Input | Response | Duration | Audio |
|-------|--------|-------|----------|----------|-------|
| Default | Field border, placeholder text (label-style, muted color), empty input area. | — | — | — | — |
| Hovered | Border brightens slightly | Mouse over | — | 60ms | — |
| Focused | Border brightens fully. Cursor (blinking, 530ms on/530ms off). Placeholder text hidden. | Tab / click | Open virtual keyboard on console/mobile | Instant | [UI focus sound] |
| Typing | Characters appear. Cursor advances. | Keyboard input | Update field value | Immediate | [Subtle keystroke sound, optional] |
| Value present | Field shows typed value. Placeholder hidden. Clear button appears (X, right of field) if value is non-empty. | — | — | — | — |
| Character limit reached | No further input accepted. Optional: brief shake animation and limit indicator changes color. | Input at limit | Reject further characters | 200ms shake | [UI error sound, subtle] |
| Clear | Field empties. Cursor returns. Clear button disappears. | Click X / gamepad clear input | Clear value | Instant | [UI cancel sound, subtle] |
| Validation error | 边框变成错误颜色（红色 - 确保色盲安全）。错误消息出现在字段下方。 | On submit or on blur | Show error | Instant | [UI error sound] |
| Validated / correct | 边框变成成功颜色（绿色 - 确保色盲安全）。成功图标可选。 | On validation pass | — | Instant | — |
| Disabled | 40% 不透明度，无交互。价值依然可见。 | — | — | — | — |

**Accessibility**:
- 键盘：所有标准文本编辑快捷键（Home、End、Ctrl+A、Ctrl+C、Ctrl+V、Ctrl+Z）。
- 屏幕阅读器：角色：“文本框”。可访问的名称：字段标签（不是占位符文本）。当前值已公布。达到字符限制时宣布。验证错误发生后立即公布。
- 占位符文本不得用作唯一标签 - 字段上方或旁边需要可见标签。当玩家打字时，占位符文本会消失，导致有认知或记忆障碍的玩家感到困惑。

**Implementation Notes**：[Godot `LineEdit`: set `placeholder_text` for the hint
但始终包含可见的`Label`节点作为字段的可访问名称。绑定
`text_changed` signal for real-time validation. Bind `text_submitted` for form
输入后提交。在控制台上，`LineEdit.call("_popup_keyboard")`或使用操作系统
虚拟键盘 API — 针对 Godot 4.6 验证engine-reference/godot/
console keyboard API specifics.]

---

#### Tab Bar

**Category**: Navigation
**Status**: Draft
**何时使用**：将单个屏幕的内容划分为离散的部分，其中
only one section is visible at a time. Character sheet tabs (Stats / Equipment /
Skills), settings tabs (Gameplay / Graphics / Audio / Accessibility). Maximum
5-6 tabs before the pattern breaks down and a sidebar navigation should be
considered instead.
**When NOT to Use**: More than 6 tabs. Content that benefits from simultaneous
visibility (use a layout pattern instead). Navigation between different screens
(use Screen Push).

**Interaction Specification**:

| State | Visual | Input | Response | Duration | Audio |
|-------|--------|-------|----------|----------|-------|
| Default (inactive tab) | Tab label. No active indicator. | — | — | — | — |
| Active tab | 选项卡标签。活动指示器（下划线、填充或对比背景）。内容区域显示此选项卡的内容。 | — | — | — | — |
| Hovered (inactive) | Tab background fills slightly | Mouse over | — | 60ms | — |
| Focused (keyboard/gamepad) | Focus ring on tab label. | Tab key (within tab bar) or D-pad left/right on tab row | — | 60ms | [UI focus sound] |
| Activated | Active indicator transitions to this tab. Content area transitions (fade or slide). | Click / Enter / A / Cross | Switch active tab. Content update. | 150ms ease | [UI tab switch sound] |
| Gamepad shoulder button | — | L1/R1 (PS) or LB/RB (Xbox) | Switch to previous/next tab (standard platform convention) | 150ms | [UI tab switch sound] |

**Accessibility**:
- Keyboard: Arrow keys navigate between tabs within the tab bar (left/right). Tab key moves focus into the content area below. This follows the ARIA tab panel pattern.
- 屏幕阅读器： 角色：各个选项卡的“选项卡”。作用：“tablist”为容器。作用：“tabpanel”为内容区域。活动选项卡状态：“已选择”。可访问名称：选项卡标签。 Tabpanel 由其相应的选项卡标记。
- The active tab must be visually distinguishable by more than color alone (underline, fill pattern, or weight change in addition to color).

**Implementation Notes**：[Godot: `TabContainer` built-in. For custom visual
styling, implement manually with a `HBoxContainer` of tab buttons and a
`MarginContainer` for content. The shoulder button shortcut (LB/RB) must be
在屏幕的`_input()`覆盖中实现 - 它没有内置到 Godot 中
tab system. Check platform conventions: Xbox uses LB/RB; PlayStation uses L1/R1;
both are the same physical button, so a single binding works.]

---

#### Scroll Container

**Category**: Layout
**Status**: Draft
**When to Use**: Content that exceeds the visible area of its container. Inventory
lists, lore entry text, credits, long settings lists. The scroll indicator shows
the player that more content exists.
**When NOT to Use**: Content that can be paginated instead (pagination may be
clearer for dense list navigation). Infinite scroll (always provide a loading
state and an end state).

**Interaction Specification**:

| State | Visual | Input | Response | Duration | Audio |
|-------|--------|-------|----------|----------|-------|
| Content fits | No scrollbar visible (or always-visible scrollbar at full height, depending on art direction). | — | — | — | — |
| Scrollable | Scrollbar appears (right edge). Scrollbar thumb size represents viewport vs. content ratio. | — | — | — | — |
| Scrolling (mouse) | Content moves. Scrollbar thumb moves proportionally. | Mouse wheel | Scroll by 3 lines per wheel tick (configurable in OS) | Smooth | — |
| Scrollbar drag | Content moves. Thumb follows pointer. | 单击+拖动滚动条拇指 | Scroll proportionally | Real time | — |
| Keyboard scroll | Content moves one item height per keypress. | Up/Down arrows when container is focused and no child is focused | Scroll by one unit | Immediate | — |
| Gamepad scroll | Content moves to keep focused item in view. | D-pad navigation to items beyond visible area | Auto-scroll to keep focused item visible | Smooth 150ms | — |
| Scroll top / bottom | Content stops. Scrollbar thumb at end. | Content boundary reached | Stop scrolling | — | — |
| Focus follows scroll | When a child element receives focus, scroll container ensures it is fully visible. | Any child receives focus | Scroll to reveal focused element | 200ms ease | — |

**Accessibility**:
- Keyboard/Gamepad：滚动容器本身不应该需要显式的滚动条交互 - 在其中导航列表项应该自动滚动以保持焦点项目在视图中。
- 屏幕阅读器：滚动容器宣布“可滚动”和滚动位置（“显示 30 项中的第 5 项到第 15 项”）。这需要引擎可访问性支持 - 在engine-reference/godot/ 中验证。
- Fade edges (content fading at scroll boundaries to indicate more content exists) are a helpful visual affordance but must not be the only indicator that content exists beyond the visible area. Include a scrollbar.

**Implementation Notes**：[Godot `ScrollContainer`: call `ensure_control_visible()`
on the focused child whenever `gui_focus_changed` fires inside the container.
通过容器的`gui_focus_changed`信号上的递归`connect`将此绑定。
For smooth scroll animation, use a `Tween` on `scroll_vertical` rather than
setting it directly.]

---

## Game-Specific UI Patterns

---

#### Inventory Slot

**Category**: Game-Specific
**Status**: Draft
**When to Use**: Every item container in the inventory grid. Empty slots, populated
slots, equipped slots, locked slots. The slot is the frame; the item icon is the
content.

**States**:

| State | Visual | Notes |
|-------|--------|-------|
| Empty | Subtle slot border, no content. Not the same as disabled. Empty slots are interactable (receive items). | 避免完全看不见的空槽——玩家会忘记网格尺寸 |
| Populated | 项目图标填充槽区域的 80%。右下角的堆栈计数（如果适用）。优质边框（色盲安全 — 图标 + 颜色）。装备徽章（右上角，如果装备的话）。 | |
| Focused | Focus ring. Tooltip appears after 300ms. | |
| Selected | Thicker or contrasting border. Used when multi-select is supported. | |
| Drag source | Slot dims, drag ghost follows pointer. | See Grid Item for full drag spec |
| Locked | 挂锁图标叠加。No互动。可能会在锁定后以 50% 的不透明度显示项目。 | Used for locked loadout slots, DLC content, etc. |
| Highlighted | Animated border glow (pulsing). Used for quest-relevant items or newly acquired items. | 尊重运动减少——用静态徽章代替脉冲 |
| Cooldown overlay | 从 12 点开始，顺时针方向径向填充叠加，随着冷却时间到期而耗尽。 | Only applicable if slots represent active items with cooldowns |

**可访问性**：堆栈计数和质量等级必须具有替代颜色编码的文本或图标。工具提示是主要的可访问性机制 - 确保键盘和屏幕阅读器可以访问它。锁定的插槽必须向屏幕阅读器宣布“已锁定”。

**实施说明**：[Godot: Custom `Control` node. Quality border implemented as a `StyleBoxFlat` swapped based on rarity — avoid using `modulate` color for quality, as it affects the icon color. Drag and drop implemented via `get_drag_data()` and `can_drop_data()` / `drop_data()` override methods.]

---

#### Ability / Skill Icon

**Category**: Game-Specific
**Status**: Draft
**When to Use**: Ability buttons in the HUD ability bar, skill tree nodes, and
any context where an ability must show availability state.

**States**:

| State | Visual | Notes |
|-------|--------|-------|
| Available | Full opacity icon. Keybinding label below. | |
| On cooldown | 径向覆盖从 12 点钟方向顺时针方向逐渐耗尽。当剩余时间 > 2 秒时，剩余时间会在中心显示为数字。 | |
| Charges remaining | 图标下方的收费点指示器（e.g.，3 个实心圆圈 = 3 个收费）。屏幕阅读器的数字替代方案。 | |
| Out of resource | 图标饱和度降低至约 20%。边框变暗。键绑定标签变暗。与冷却时间不同——资源限制，而不是时间限制。 | |
| Locked / not unlocked | Icon silhouette only (no full art visible). Padlock badge. May show unlock condition in tooltip. | |
| Active / channeling | Pulsing border. Radial fill shows channel duration remaining. | |
| Just activated | Brief scale 0.9x then spring to 1.0x (overshoot to 1.05x). | Example: Guild Wars 2 and Path of Exile both use press-depress animations on ability use to confirm activation. Respect motion reduction. |

**Accessibility**: All cooldown/charge information must have a numeric value (screen reader cannot parse radial overlays). The cooldown timer number satisfies this. Ability names and descriptions must be exposed to screen readers via tooltip.

**Implementation Notes**：[Godot: Custom `TextureButton` subclass with overlay
`Control` nodes for cooldown radial and charge pips. The cooldown radial uses a
在`ColorRect`上旋转遮罩的自定义着色器 — 或使用
`ProgressBar` styled as circular if engine supports it. Verify against
engine-reference/godot/ for Godot 4.6 shader support for this pattern.]

---

#### Health / Resource Bar

**Category**: Game-Specific
**Status**: Draft
**When to Use**: Any continuously varying value in the HUD that represents a
critical player resource. Health, mana, stamina, shield, fuel.

**States and behaviors**:

| Event | Visual | Audio | Duration |
|-------|--------|-------|---------|
| Value decrease (damage) | 填充收缩。填充上短暂的“损坏闪光”（白色或红色闪光）。幽灵条在先前的值上徘徊，并在 0.5 秒内消耗到新值（“损坏指示器”）。 | [Damage taken sound — varies by amount] | Instant decrease, 500ms ghost bar drain |
| Value increase (heal) | 填充增长。短暂的治愈颜色闪光（绿色 - 通过icon/glow备份确保色盲安全）。 | [Heal sound] | 300ms ease-in |
| 低于 25% 阈值 | Fill changes color to warning state. Border pulses (or static badge in motion reduction mode). Optional: heartbeat audio cue (paired with visual if audio is sole signal). | [Low health sound — loops until above threshold] | Continuous |
| At zero | Bar empty. Optional: bar shakes briefly. Death/depletion event fires. | [Death/depletion sound] | 200ms shake |
| Maximum | 填充为 100%，短暂发光。 | — | 200ms |
| Overflow (shield) | A separate bar segment appears beyond the natural fill area, in shield color. | [Shield gain sound] | 200ms |

**可访问性**：当前值必须可作为数字访问（工具提示或持久显示，或两者）。颜色编码阈值状态必须有非颜色备份（图标、闪烁或音频视频警告）。 25% 的警告状态必须具有独立于颜色变化的视觉信号。

**Implementation Notes**：[Godot: Two overlapping `ProgressBar` nodes for ghost
栏效果 - 后栏保留先前的值（通过 Tween 排出），前栏保留
current value (updates instantly). Threshold states trigger `StyleBoxFlat` swaps
on the front bar. Ghost bar Tween duration is tunable as a designer parameter.]

---

#### Dialogue Box

**Category**: Game-Specific
**Status**: Draft
**When to Use**: NPC conversation, voiced narrative dialogue, tutorial text
delivered through a character. All dialogue that has a speaker.

**Structure**: Speaker portrait or name tag (top of box or left side). Dialogue text body. Continue/advance prompt (bottom right). Optional: skip-all button, voice acting indicator, subtitle indicator.

**States and behaviors**:

| State | Visual | Input | Response | Duration |
|-------|--------|-------|----------|---------|
| Line entering | Text reveals character-by-character (typewriter effect). Or: text fades in at full speed if accessibility option set. | — | — | Speed: configurable in accessibility settings |
| Revealing | Text animating in. Continue prompt hidden or pulsing at slow opacity. | [Any advance input] | Skip to end of current line instantly (show full line, stop typewriter) | Immediate |
| Line complete | Full line shown. Continue prompt visible and animated. | — | — | — |
| Advancing to next line | Continue prompt hides. Text fades out or wipes. New line begins. | [Any advance input]— Enter / A / Cross / Space / 鼠标单击 | Advance | 100ms transition |
| Choices appearing | Choice buttons appear below dialogue text. Continue prompt hidden. Navigation focus moves to first choice. | D-pad / keyboard to select, Enter / A / Cross to confirm | Select choice | 150ms enter animation |
| Closing | Box fades out | Final line advanced | Return control to player | 200ms |
| Skipping all (if supported) | 简短的确认提示：“跳过对话？” | Dedicated skip button | Skip to post-dialogue state | — |

**无障碍功能**：默认情况下，所有语音对话始终启用字幕。打字机动画速度是用户设置（请参阅可访问性-requirements.md）。对话框不得自动前进——玩家必须控制节奏。始终显示演讲者姓名。所有选择按钮都必须可以通过键盘和游戏手柄进行导航。屏幕阅读器必须能够访问选项并宣布立场。

**Implementation Notes**：[Godot: `RichTextLabel` with `bbcode_enabled` for
formatting. Typewriter effect via `visible_characters` property animated by a
`Timer`. Bind the advance input to a function that either skips typewriter
（设置`visible_characters = -1`）或推进对话状态。演讲者姓名
displayed in a separate `Label` above or beside the box. Dialogue data loaded from
JSON or a dedicated dialogue format (e.g., Dialogic, Yarn Spinner for Godot).]

---

#### Context Action Prompt

**Category**: Game-Specific
**Status**: Draft
**When to Use**: A prompt that appears near an interactable game object indicating
玩家可以做什么。 “按[A]打开宝箱。” “按住[E]即可接听。”出现
when the player enters the interaction zone, disappears when they leave.

**States**:

| State | Visual | Notes |
|-------|--------|-------|
| Appearing | Fades in and rises 8px from object anchor point. | 尊重运动减少——仅淡出，无上升 |
| Idle | 平台正确的按钮图标+操作标签。图标与当前输入法匹配（如果玩家切换则更新）。 | 始终显示平台正确的图标 - 不要为所有平台硬编码“按 A” |
| Holding (for hold inputs) | 按钮图标上的径向填充显示保持进度。标签更改为主动动词（“正在打开...”）。 | |
| Cannot interact (blocked) | 图标变暗。标签显示原因（如果已知）（“太重”、“需要钥匙”）。 | 可选 - 仅当原因对玩家有意义时才显示阻止状态 |
| Disappearing | Fades out. | Triggered when player exits interaction zone |

**无障碍功能**：按钮图标必须附有文本标签 - 不要单独依赖图标（某些玩家使用自定义按钮标签或带有非标准图标的自适应控制器）。提示的位置必须不与角色健康状况或关键 HUD 信息重叠。

**实施说明**：[Godot: Attach as a `Node3D` child (or `Node2D` child in 2D) of the interactable object. Use a `BillboardMesh` or a `SubViewport` with a UI scene for 3D games — this keeps the prompt facing the camera without code. Update the button icon texture based on `Input.get_joy_name()` or keyboard detection via `InputEventKey` vs `InputEventJoypadButton`. Hold progress implemented as an `AnimationPlayer` or `Tween` on a radial mask shader.]

---

#### Damage Number

**Category**: Game-Specific
**Status**: Draft
**When to Use**: Floating feedback numbers above combat participants. Normal
damage, critical damage, healing, miss.

**Variants**:

| Variant | Visual | Notes |
|---------|--------|-------|
| Normal damage | White number, normal weight, medium size. | |
| Critical hit | 更大尺寸 (1.5x)、粗体字重、橙色或黄色 — 验证色盲安全。短暂的规模影响（1.3x → 1.0x 出现）。 | Example: Path of Exile and Diablo IV both use scale-pop for crits to make them immediately recognizable by size alone, independent of color. |
| Healing | 绿色（验证色盲安全 - 使用 + 前缀和向上轨迹作为非颜色备份）。 | |
| Miss / Evade | “MISS”文本，灰色，斜体。以较小的尺寸漂浮。 | |
| Status damage (DoT) | Smaller size, distinct color matching the status effect. | |

**行为**：数字从命中位置向上浮动超过 1.0 秒。最后 0.4 秒内数字从 100% 渐变到 0%。快速点击的多个数字水平交错排列以避免重叠。屏幕上最大同时伤害数：[define per game — typically 8-12 per character]。

**可访问性**：伤害数字纯粹是补充反馈——它们绝不是了解战斗状态的唯一方法。健康棒是权威来源。提供一个选项来完全禁用伤害数字（一些玩家发现它们在视觉上令人难以承受）。禁用后，游戏必须保持完全可玩。

**Implementation Notes**：[Godot: Pool of `Label3D` (3D games) or `Label` (2D games)
instances recycled via an object pool. Each instance is given a random small
生成时的水平偏移（±20px）以减少重叠。浮动动画通过
`Tween` on `position.y` and `modulate.a`. Critical hit scale-pop via Tween
with `EASE_OUT` on scale followed by linear settle.]

---

## Navigation Patterns

---

#### Screen Push / Pop / Replace

**Category**: Navigation
**Status**: Draft

These three patterns define how screens enter and exit the navigation stack.

| Pattern | Trigger | Animation | Stack Behavior | Focus Behavior |
|---------|---------|-----------|---------------|----------------|
| Push | Navigate deeper (open submenu, open detail view) | New screen slides in from right. Previous screen slides left and dims. | Previous screen remains on stack | Focus moves to first interactive element on new screen |
| Pop (Back) | Back button / Escape / B / Circle | Current screen slides right and exits. Previous screen slides in from left and brightens. | Current screen removed from stack | Focus returns to the element that triggered the Push |
| Replace | Navigate to a peer screen (not child, not parent). Loading screen. | Fade out current, fade in new. No directional bias. | Current screen removed. New screen added. | Focus moves to first interactive element on new screen |

**动画持续时间**：Push/Pop：250 毫秒缓入缓出。替换：200ms 淡出 + 200ms 淡入。

**Motion reduction**: All slide animations become fades. Duration reduces to 100ms.

**Implementation Notes**：[Godot: Implement as a `ScreenManager` singleton managing
a stack of `Control` scenes. `push(screen_scene)` instantiates and animates in.
`pop()` animates out and frees. `replace(screen_scene)` calls pop then push without
the intermediate stack state. Use `CanvasLayer` per screen to isolate input handling.
在推送之前存储“返回焦点”元素引用，以便可以在弹出时恢复。]

---

#### Focus Management

**Category**: Navigation
**Status**: Draft

> Focus management is the most common keyboard and gamepad accessibility failure
> in game UIs. These rules must be implemented consistently. A player should
> never be in a state where they cannot see which element is focused, or where
> Tab/D-pad produces no visible result.

| Rule | Description |
|------|-------------|
| Screen open | 焦点放在最符合逻辑的交互元素上 - 通常是主按钮、第一个列表项或最后一个获得焦点的元素（如果之前访问过屏幕）。切勿在非交互式元素上。 |
| Screen close / pop | Focus returns to the element that triggered the navigation (the button that opened the screen, the list item that was selected). If that element no longer exists, focus goes to the nearest preceding interactive element. |
| Modal open | Focus is trapped inside the modal. See Modal Dialog pattern. |
| Modal close | Focus returns to the element that triggered the modal. |
| Element disabled | If the focused element becomes disabled, focus moves to the next available interactive element in the tab order. |
| Element destroyed | If the focused element is removed from the scene, focus moves to the nearest preceding element in the tab order. |
| Screen without interactive elements | Focus management is a no-op. Ensure back/cancel input still works. |
| Tab key (keyboard) | 按文档顺序（从左到右，从上到下）通过交互元素向前移动焦点。 Shift+Tab 向后移动。 |
| D-pad (gamepad) | Moves focus in the spatial direction pressed. Spatial navigation is preferred over strict tab order for gamepad. Never wrap focus between unrelated regions (e.g., Tab bar and content area should be separate navigation regions). |
| Focus is always visible | Focus ring or equivalent focus indicator must ALWAYS be visible when an element is focused via keyboard or gamepad. Never suppress focus indicators. |

---

#### Escape / Cancel

**Category**: Navigation
**Status**: Draft

> “返回”操作是所有菜单系统中最常用的导航输入。
> It must be consistent across every screen with no exceptions.

| Platform | Input | Behavior |
|----------|-------|---------|
| PC (keyboard) | Escape | 关闭最顶层的模式/返回堆栈中的一个屏幕/如果在根屏幕（主菜单），则打开“退出？”确认 |
| PC (gamepad) | B (Xbox layout) / Circle (PS layout) | Same as Escape |
| Xbox | B button | Same as Escape |
| PlayStation | Circle button | Same as Escape |
| Nintendo Switch | B button | 与 Escape 相同（注意：任天堂在某些第一方游戏中使用 B 来确认 - 验证此版本的平台约定并记录决定） |

**规则**：此输入绝不能被覆盖以执行除“返回/取消”之外的其他操作。如果屏幕没有后退操作（e.g.，游戏暂停并且玩家必须做出选择），Escape 不会执行任何操作或显示“您必须选择”消息 - 它不会导航离开。每个屏幕都必须在其 UX 规范中明确定义其 Escape 行为。

---

## Feedback and Loading Patterns

---

#### Loading State

**Category**: Feedback
**Status**: Draft

| Scope | Pattern | Notes |
|-------|---------|-------|
| Full screen (initial load) | Full-screen loading screen with game art, progress bar (determinate if possible), tip text (optional). | Never use an empty black screen. Give the player something to read or look at. |
| Full screen (level transition) | Fade to black, loading screen, fade from black to new scene. | The fade removes the pop of the previous scene disappearing. |
| Component / inline | Spinner or skeleton placeholder replaces the loading component. Component does not shift layout when content loads. | 对于布局较多的内容，骨架占位符（近似内容形状的灰色框）比旋转器更可取 - 它可以防止加载时布局发生变化。 |
| Background / async | No visual indication unless operation exceeds 2 seconds. After 2 seconds, show a small spinner or toast. | 对于在 2 秒内完成的操作，不要显示加载指示器 - 指示器的闪烁比等待更具破坏性。 |

**无障碍功能**：加载状态必须向屏幕阅读器宣布：“[Context]正在加载，请稍候。”完成时必须宣布“[Context]已加载”。对于全屏加载，请确保加载屏幕本身可供屏幕阅读器导航 - 提示文本和任何 UI 元素都必须公开。

---

#### Empty State

**Category**: Feedback
**Status**: Draft

> Empty states are consistently the least-designed parts of game UIs. They are
> 玩家感觉“这是我存放物品的地方”之间的区别
> 以及“为什么这里什么都没有？是不是有什么东西坏了？”每个空列表和网格必须
> 有一个设计的空状态。空状态不是一个错误——它是一个开始
> point.

| Location | Empty State Content | Notes |
|----------|--------------------|----|
| Inventory (no items) | 图标（微妙、大、居中）。消息：“您的库存已空。”子信息：“你在旅途中找到的物品将出现在这里。” | 不要说“找到No项”——“找到”意味着搜索失败。 |
| Quest Log (no active quests) | 图标。消息：“No活跃任务。”子消息：“与标有[quest marker icon]的角色交谈以开始任务。” | Give the player a clear action. |
| Achievements (none earned) | 图标。消息：“No尚未取得成就。”提示成就列表：“尝试[Action]来获得你的第一个成就。” | Gamified motivation, not just emptiness. |
| Search results (no matches) | 图标。消息：“‘[search term]’的No结果。”子消息：“尝试不同的搜索或[browse all]。” | Mirror the search term back at them. Give an alternative action. |

**Rule**: Every empty state must include an icon, a message, and either a sub-message or an action button. A blank container with no explanation is never acceptable.

---

#### Error State

**Category**: Feedback
**Status**: Draft

| Error Type | Pattern | Tone |
|-----------|---------|------|
| Input validation (form field) | Inline error message below the field. Error icon left of message. Red border on field (colorblind-safe with icon). | 中立且具体——“用户名必须为 3-20 个字符。”不是“无效输入”。 |
| Operation failed (save error, network error) | Toast notification for non-critical failures. Modal Dialog for critical failures (save file cannot be written). | 冷静且可操作——“保存失败。请检查存储空间。”不是“致命错误”。 |
| System error (crash, data corruption) | 全屏错误屏幕，包含错误代码、恢复选项（“重新启动游戏”、“加载上次保存的内容”）和支持联系信息。 | 令人安心——承认问题，给予玩家代理权。永远不要责怪玩家。 |
| Soft error (action cannot be performed) | Toast or inline message. | 解释——“黄金不足”而不是“行动不可用”。 |

**原则**：错误信息绝不是玩家的错。它们是告诉玩家发生了什么以及下一步该做什么的游戏。从所有错误消息中删除“无效”一词 - 替换为具体解释。

---

## Animation Standards

> These timing values apply to ALL patterns in this library. When a pattern says
> “150ms escape-out”，缓动函数在这里定义。时间一致性
> makes the UI feel like a single designed system rather than a collection of
> individual decisions.

| Animation Type | Duration (ms) | Easing Function | Notes |
|---------------|--------------|----------------|-------|
| Button hover / focus enter | 80 | ease-out | 快——敏捷，而不是迟缓 |
| Button hover / focus exit | 60 | ease-in | Slightly faster exit than entry |
| Button press scale down | 60 | ease-in | Immediate feedback |
| Button press scale up (release) | 80 | ease-out | Slightly bouncy feel |
| Screen push (enter) | 250 | ease-in-out | Screen slides in from right |
| Screen pop (exit) | 250 | ease-in-out | Screen slides out to right |
| Modal open | 200 | ease-out | Expands from center |
| Modal close | 150 | ease-in | Collapses faster than it opens |
| Toast enter | 200 | ease-out | Slides in from screen edge |
| Toast exit | 200 | ease-in | |
| Tab switch | 150 | ease-in-out | Content cross-fades or slides |
| Tooltip appear | 120 | ease-out | After 300-400ms delay |
| Tooltip disappear | 80 | ease-in | |
| Progress bar fill | 300 | ease-out | Value changes animate smoothly |
| Value flash (damage, gain) | 100 毫秒开启 + 100 毫秒关闭 | linear | Brief, attention-catching |
| Dialogue text reveal (per character) | 30ms per character | linear | Configurable in accessibility settings |
| HUD damage flash | 80 | linear | White or red overlay, immediate |

**运动减少覆盖**：启用运动减少模式时（请参阅无障碍功能 -requirements.md），所有幻灯片和缩放动画都将替换为淡入淡出。淡入淡出持续时间减少 50%。循环动画（不确定的旋转器、脉冲指示器）被替换为静态等效物。

---

## Sound Standards

> Every interactive event should have audio feedback. Sound is a primary feedback
> 渠道，不是装饰品。这里定义的声音是事件类别——
> specific audio assets are defined in `docs/sound-bible.md`. This table maps
> interaction events to sound categories so the sound designer and UI programmer
> use the same vocabulary.

| Interaction Event | Sound Category | Notes |
|------------------|---------------|-------|
| Button hover / focus | UI Hover | 微妙、短（< 80ms）、快速导航时不疲劳。 Hades 使用非常安静、高频的点击，在快速导航时消失在背景中。 |
| Button (Primary) confirm | UI 确认 — 主要 | 比二次确认稍微突出一些。 “是的，我们走吧”的声音。 |
| Button (Secondary) cancel / back | UI Cancel | 音调略微向下。 “回去”的声音响起。 《质量效应》使用干净、独特的旋风进行后退导航。 |
| 按钮（破坏性）——打开确认 | UI Warning | Distinct from standard confirm. Brief attention-catching sound. |
| 确认对话框——确认破坏性 | UI 确认 — 破坏性 | Final, slightly weighted. The action is being taken. |
| Toggle ON | UI Toggle On | 简短、活泼、略显明亮。 Celeste 的辅助开关具有令人满意的点击声音。 |
| Toggle OFF | UI Toggle Off | Same click family, slightly flatter. |
| Slider adjust | UI Slider | Subtle continuous sound while dragging. A single click per D-pad step. Never fatiguing. |
| Dropdown open | UI Expand | Brief, directional (opening feel). |
| Dropdown close / select | UI Select | Confirmation feel. |
| Tab switch | UI Tab | Horizontal movement feel. Distinct from vertical navigation. |
| Modal open | UI Modal Open | 比标准导航更突出——引起注意。 |
| Modal close (cancel) | UI Modal Close | Returns to previous context. |
| 吐司 — 信息性 | UI Notification | Background-level, non-intrusive. |
| 干杯——成就 | UI Achievement | Celebratory but not overlong. The player should feel rewarded, not interrupted. |
| 吐司——警告 | UI 警告 — Toast | Distinct from error. Alert, not alarming. |
| Error state | UI Error | 友好但清晰。不是刺耳的蜂鸣声。 《黑暗之魂》使用微妙的沉闷的撞击声来表示失败的动作——传达“不”而不是刺耳的声音。 |
| Success confirmation | UI Success | Clean and satisfying. |
| Ability activate | 游戏玩法——能力激活 | In-world feel, distinct from pure UI. Part of game feel, not menu feel. |
| Damage received | 游戏玩法——伤害 | See sound-bible.md for full specification. |
| Item pickup | 游戏玩法——物品获取 | Brief, rewarding. |
| Level up / rank up | 游戏玩法——进展 | Celebratory, appropriately prominent. |
| Dialogue advance | UI Dialogue | Subtle, matches typewriter rhythm if typewriter is active. |

---

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| [Does the engine's accessibility node system support screen reader announcements for toast notifications without requiring focus? Verify against engine-reference/godot/ for Godot 4.6.] | [ux-designer] | [Before first menu implementation] | [Unresolved] |
| [What is the platform-correct confirm/cancel button mapping for Nintendo Switch release? Nintendo first-party convention differs from Xbox/PlayStation.] | [producer] | [Before platform certification submission] | [Unresolved] |
| [Should damage numbers be pooled as Label3D nodes or rendered in a SubViewport? Verify performance budget in coordination with technical-director.] | [lead-programmer, ux-designer] | [Before combat HUD implementation] | [Unresolved] |
| [What is the maximum number of simultaneous toast notifications before the queue becomes visually overwhelming? Needs playtesting.] | [ux-designer] | [First playtesting session] | [Unresolved] |
| [Add question] | [Owner] | [Deadline] | [Resolution] |
