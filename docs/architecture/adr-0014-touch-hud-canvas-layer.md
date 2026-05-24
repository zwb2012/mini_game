# ADR-0014: 触控 UI 与 HUD CanvasLayer 架构

## Status
Accepted

## Date
2026-05-23

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Godot 4.6 |
| **Domain** | UI / Input |
| **Knowledge Risk** | MEDIUM — CanvasLayer API 自 Godot 4.0 起稳定，但 4.6 引入了 dual-focus 系统（mouse/touch focus 与 keyboard/gamepad focus 分离）。本项目为纯触屏移动端游戏——无键盘/手柄焦点，dual-focus 影响为 LOW。需验证点：CanvasLayer 的 `follow_viewport_enabled` 在移动端的触摸坐标转换 |
| **References Consulted** | `docs/engine-reference/godot/VERSION.md`, `docs/engine-reference/godot/modules/ui.md`, `docs/engine-reference/godot/breaking-changes.md` |
| **Post-Cutoff APIs Used** | Godot 4.6 dual-focus（mouse/touch focus 独立于 keyboard/gamepad focus）。本 ADR 明确声明项目仅使用 touch focus 路径——不受 dual-focus 影响 |
| **Verification Required** | CanvasLayer 层间触摸事件透传（TouchControlLayer 消耗射击事件后，HUDLayer 不应再收到）；STUNNED 图标跟随 Boss 的世界→屏幕坐标转换在 Camera2D 移动/缩放/震动时的精度；移动端横屏 1920×1080 下 CanvasLayer 缩放行为 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001（TouchInput 作为 Foundation Autoload——触控 UI 从其 poll 信号），ADR-0009（PlayerController 作为场景节点——触控 UI 与 PlayerController 无直接信号连接），ADR-0010（GameStateMachine Autoload state_changed signal——HUD 和触控 UI 在非 PLAYING 状态下隐藏） |
| **Enables** | Touch Control UI Epic（EPIC-TOUCH-UI）、HUD Epic（EPIC-HUD）——必须先确定 CanvasLayer 架构才能实现 UI 场景结构 |
| **Blocks** | 任何 UI 场景/脚本的创建——在 CanvasLayer 架构确定之前，UI 场景的根节点类型未定 |
| **Ordering Note** | 必须在 TouchInput Autoload（ADR-0001）和 GameStateMachine（ADR-0010）之后实现。与 PlayerController（ADR-0009）并行——两者独立消费 TouchInput 信号 |

## Context

### Problem Statement

触控操控界面（touch-control-ui）和 HUD（hud）是坍塌禁区 Presentation 层的仅有两个系统。它们共享一个关键约束：必须独立于 2D 摄像机渲染——无论摄像机如何移动、缩放或震动，UI 元素应始终固定在屏幕上的同一位置。Godot 的 `CanvasLayer` 节点正是为此设计的——它创建一个独立的 2D 渲染层，不受摄像机变换影响。

核心架构问题：

1. **CanvasLayer 数量**: 触控 UI 和 HUD 共享一个 CanvasLayer，还是各自独立？共享更简单但 z-order 和输入处理混合；独立更清晰但增加节点数。

2. **输入事件处理**: 触控 UI 需要渲染虚拟摇杆/准星/射击脉冲——但它**不采集**原始触屏事件（那是 TouchInput 的职责）。它只消费 TouchInput 的标准化信号做视觉反馈。然而——Godot 的 `Control` 节点默认消费 `InputEventScreenTouch/Drag`。如果触控 UI 的 Control 节点未正确配置 `mouse_filter`，它们会拦截触摸事件，阻止 TouchInput 收到原始事件。

3. **HUD 的输入透传**: HUD 是纯显示层——它订阅上游 signal 并渲染信息。HUD 元素不应消费任何输入事件。但如果 HUD 的 Control 节点在触控 UI 上方（更高 CanvasLayer），它们可能拦截触摸。

4. **世界空间 UI 元素**: HUD GDD 要求 STUNNED 图标"跟随 Boss 位置"——这是世界空间 UI。它不能被 CanvasLayer 固定，也不能作为普通 Sprite2D（因为需要 clamp 到屏幕边缘内侧 16px——这是屏幕空间约束）。

5. **4.6 dual-focus 影响**: Godot 4.6 将 mouse/touch focus 与 keyboard/gamepad focus 分离。本项目纯触屏——无键盘/手柄。dual-focus 是否影响 CanvasLayer 的触摸事件传播？

### Constraints

- 移动端横屏 1920×1080 设计基准——CanvasLayer 需正确缩放
- HUD 占据屏幕顶部 48px，触控占据其余区域——需要空间协调
- 所有触控视觉元素 opacity ≤ 0.7——物理战场始终可见
- 非 PLAYING 状态下触控元素完全隐藏
- PAUSED 状态下 HUD 元素半透明（opacity=0.4）
- TouchInput 是唯一输入权威——触控 UI 不得绕过它直接处理 `InputEvent`

### Requirements

- 触控 UI（虚拟摇杆/准星/射击脉冲）固定在屏幕上，不随摄像机移动
- HUD（HP 条/武器图标/连锁计数器/Boss 仪表盘）固定在屏幕上，不随摄像机移动
- 触控 UI 的 Control 节点不拦截原始触摸事件（TouchInput 必须能收到）
- HUD 的 Control 节点不拦截任何触摸事件
- STUNNED 图标跟随 Boss 世界位置，但超出屏幕时 clamp 到边缘
- 触控 UI 元素显示在游戏画面之上、HUD 元素之下
- PAUSED/MAIN_MENU/DEAD 状态时 UI 正确显示/隐藏

## Decision

**采用双 CanvasLayer 架构——TouchControlLayer (layer 5) + HUDLayer (layer 10)。两个 CanvasLayer 的 Control 节点全部设置 `mouse_filter = MOUSE_FILTER_IGNORE`（不拦截触摸事件），因为触屏事件采集由 TouchInput 通过 `Input.event()` 在 `_input()` 中处理——不经由 Control 节点的 `_gui_input()`。**

STUNNED 图标作为 HUDLayer 上的 Control 节点，通过 `Camera2D.get_screen_transform().affine_inverse()` 每帧将 Boss 世界坐标转换为屏幕坐标，clamp 到屏幕边缘内侧 16px。

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  Scene Tree (Room.tscn 运行时)                                     │
│                                                                    │
│  root (Node2D)                                                     │
│  ├─ World (Node2D)          ← 游戏世界，受 Camera2D 影响           │
│  │  ├─ PlayerController                                           │
│  │  ├─ Enemies...                                                 │
│  │  ├─ PhysicsObjects...                                          │
│  │  └─ Camera2D                                                   │
│  │                                                                    │
│  ├─ TouchControlLayer (CanvasLayer, layer=5)  ← 独立于摄像机      │
│  │  ├─ VirtualJoystick (Control)               ← mouse_filter=IGNORE│
│  │  │  ├─ OuterRing (ColorRect)                                     │
│  │  │  └─ InnerDot (ColorRect)                                      │
│  │  ├─ Crosshair (Control)                    ← mouse_filter=IGNORE│
│  │  └─ ShootPulse (Control)                   ← mouse_filter=IGNORE│
│  │                                                                    │
│  └─ HUDLayer (CanvasLayer, layer=10)          ← 独立于摄像机       │
│     ├─ PersistentLayer (Control)              ← mouse_filter=IGNORE│
│     │  ├─ HPBar (TextureProgressBar)                                │
│     │  └─ WeaponIcon (TextureRect + Label)                          │
│     ├─ EventLayer (Control)                   ← mouse_filter=IGNORE│
│     │  ├─ ChainCounter (Label)                                       │
│     │  └─ PhaseText (Label)                                          │
│     ├─ BossLayer (Control)                    ← mouse_filter=IGNORE│
│     │  ├─ BossHPBar (TextureProgressBar + Label)                    │
│     │  ├─ PartStatusIcons (5× TextureRect)                          │
│     │  ├─ VulnerableTimer (Label)                                    │
│     │  ├─ CollapseTimer (Label)                                      │
│     │  └─ StunnedIcon (Control)  ← 世界→屏幕坐标每帧转换           │
│     └─ LowHealthOverlay (ColorRect)            ← mouse_filter=IGNORE│
│                                                                    │
│  渲染顺序 (低→高): World → TouchControlLayer(5) → HUDLayer(10)    │
│  触摸事件: 全部穿透 Control 节点 → 由 TouchInput._input() 采集    │
└──────────────────────────────────────────────────────────────────┘

信号流 (TouchInput → UI 两大消费者):
  TouchInput (Autoload)
  ├─ move_direction, aim_position, is_aiming ──► TouchControlLayer 渲染
  ├─ shoot_tapped signal ─────────────────────► TouchControlLayer 脉冲动画
  ├─ shoot_held ──────────────────────────────► TouchControlLayer 持续脉冲
  │
  └─ (HUD 不直接消费 TouchInput——HUD 订阅上游系统 signal)
     HealthDamage.health_changed ──────────────► HUDLayer HP 条 + 低血量
     WeaponSystem.weapon_changed ──────────────► HUDLayer 武器图标
     ChainPropagation.chain_depth_changed ─────► HUDLayer 计数器
     BossAI.boss_* signals ───────────────────► HUDLayer Boss 仪表盘
     GameStateMachine.state_changed ───────────► 两个 UI 系统显示/隐藏
```

### CanvasLayer 配置

| 参数 | TouchControlLayer | HUDLayer |
|------|-------------------|----------|
| `layer` | 5 | 10 |
| `follow_viewport_enabled` | true | true |
| `follow_viewport_scale` | 1.0 | 1.0 |
| `offset` | Vector2(0, 0) | Vector2(0, 0) |
| `layer_names` | `"touch_controls"` | `"hud"` |

**layer 选择理由**:
- Game world 在 layer 0（默认）
- TouchControlLayer 在 layer 5——在游戏画面之上，HUD 之下
- HUDLayer 在 layer 10——在所有内容之上
- 中间留空（layer 6-9）为未来可能的中间层（如 debug overlay、tutorial overlay）

### 输入事件透传策略

**核心原则**: TouchInput 是唯一输入权威。它通过 `Node._input(event)` 直接接收 `InputEventScreenTouch/Drag`——这些事件由 Godot 引擎分发，不经由 Control 节点的 `_gui_input()` 路径。但 Control 节点默认的 `mouse_filter = MOUSE_FILTER_STOP` 会**阻止**事件继续传播到 `_input()`。

**解决方案**: 所有 TouchControlLayer 和 HUDLayer 上的 Control 节点统一设置：

```gdscript
# 每个 UI Control 节点的 _ready() 或场景默认值:
mouse_filter = Control.MOUSE_FILTER_IGNORE
```

`MOUSE_FILTER_IGNORE` 意味着：
- Control 节点不接收 `_gui_input()` 回调
- 触摸事件穿过该 Control，继续向上传播
- `Node._input(event)` 仍然收到事件——TouchInput 可以正常采集

**为什么不用 MOUSE_FILTER_PASS**: `PASS` 会让 Control 先处理事件再传递——如果 Control 的 `_gui_input()` 中有任何逻辑，可能产生副作用。`IGNORE` 更干净——"这个 Control 对输入完全透明"。

**验证**: TouchInput 不依赖任何 Control 节点——它通过 `InputEventScreenTouch/Drag` 的回调直接读取触摸坐标。设置 `MOUSE_FILTER_IGNORE` 后，Control 节点成为纯视觉元素——渲染但不交互。

### Key Interfaces

```gdscript
# ── TouchControlLayer 根脚本 ──
# res://ui/touch_control_layer.gd
class_name TouchControlLayer
extends CanvasLayer

@onready var joystick: VirtualJoystick = $VirtualJoystick
@onready var crosshair: Crosshair = $Crosshair
@onready var shoot_pulse: ShootPulse = $ShootPulse

func _ready() -> void:
    # 确保所有子 Control 节点不拦截触摸
    _set_mouse_filter_recursive(self, Control.MOUSE_FILTER_IGNORE)
    
    # 连接 shoot_tapped signal（脉冲——不可 poll）
    if not TouchInput.shoot_tapped.is_connected(_on_shoot_tapped):
        TouchInput.shoot_tapped.connect(_on_shoot_tapped)
    
    # 订阅游戏状态
    if not GameStateMachine.state_changed.is_connected(_on_state_changed):
        GameStateMachine.state_changed.connect(_on_state_changed)

func _process(_delta: float) -> void:
    # 仅在 PLAYING 状态下渲染（PAUSED/DEAD/MAIN_MENU → 隐藏）
    if GameStateMachine.current_state != GameStateMachine.State.PLAYING:
        return
    
    # Poll TouchInput 连续值——驱动视觉渲染
    joystick.update_position(TouchInput.move_direction, TouchInput.is_aiming)
    crosshair.visible = TouchInput.is_aiming
    if TouchInput.is_aiming:
        crosshair.position = TouchInput.aim_position
    
    # shoot_held 的视觉反馈（持续脉冲环）
    if TouchInput.shoot_held:
        shoot_pulse.trigger_hold_pulse()

func _on_shoot_tapped() -> void:
    shoot_pulse.trigger_tap_pulse()  # 单次脉冲 (24→48px, 0.1s)

func _on_state_changed(_old: int, new: int) -> void:
    visible = (new == GameStateMachine.State.PLAYING)

static func _set_mouse_filter_recursive(node: Node, filter: int) -> void:
    if node is Control:
        (node as Control).mouse_filter = filter
    for child in node.get_children():
        _set_mouse_filter_recursive(child, filter)
```

```gdscript
# ── HUDLayer 根脚本 ──
# res://ui/hud_layer.gd
class_name HUDLayer
extends CanvasLayer

@onready var persistent: PersistentHUD = $PersistentLayer
@onready var event_layer: EventHUD = $EventLayer
@onready var boss_layer: BossHUD = $BossLayer
@onready var low_health_overlay: ColorRect = $LowHealthOverlay

func _ready() -> void:
    # HUD 所有 Control 节点不拦截触摸
    TouchControlLayer._set_mouse_filter_recursive(self, Control.MOUSE_FILTER_IGNORE)
    
    # 订阅上游 signal
    HealthDamage.health_changed.connect(_on_health_changed)
    WeaponSystem.weapon_changed.connect(_on_weapon_changed)
    ChainPropagation.chain_depth_changed.connect(_on_chain_depth_changed)
    ChainPropagation.chain_settled.connect(_on_chain_settled)
    BossAI.boss_spawned.connect(_on_boss_spawned)
    BossAI.boss_defeated.connect(_on_boss_defeated)
    BossAI.boss_health_changed.connect(_on_boss_health_changed)
    BossAI.boss_part_damaged.connect(_on_boss_part_damaged)
    BossAI.boss_state_changed.connect(_on_boss_state_changed)
    BossAI.boss_phase_changed.connect(_on_boss_phase_changed)
    GameStateMachine.state_changed.connect(_on_state_changed)

func _process(_delta: float) -> void:
    # STUNNED 图标跟随 Boss 世界位置 → 屏幕坐标
    if boss_layer.stunned_icon.visible and is_instance_valid(_boss_ref):
        var screen_pos := _world_to_screen_clamped(_boss_ref.global_position + Vector2(0, -80))
        boss_layer.stunned_icon.position = screen_pos

func _world_to_screen_clamped(world_pos: Vector2) -> Vector2:
    var camera := get_viewport().get_camera_2d()
    if not camera:
        return world_pos
    var screen_pos := camera.get_screen_transform().affine_inverse() * world_pos
    var viewport_size := get_viewport().get_visible_rect().size
    # Clamp 到屏幕边缘内侧 16px
    screen_pos.x = clampf(screen_pos.x, 16.0, viewport_size.x - 48.0)  # 48 = 图标宽32 + 边距16
    screen_pos.y = clampf(screen_pos.y, 16.0, viewport_size.y - 48.0)
    return screen_pos

func _on_state_changed(_old: int, new: int) -> void:
    match new:
        GameStateMachine.State.PLAYING:
            visible = true
            persistent.modulate.a = 0.85  # 正常显示
        GameStateMachine.State.PAUSED:
            persistent.modulate.a = 0.4   # 半透明
        _:  # MAIN_MENU, DEAD, LEVEL_COMPLETE
            visible = false
```

```gdscript
# ── VirtualJoystick 子组件 ──
# res://ui/virtual_joystick.gd
class_name VirtualJoystick
extends Control

const RING_RADIUS: float = 60.0
const DOT_RADIUS: float = 24.0
const MAX_DRAG: float = 80.0
const FADE_DURATION: float = 0.15

@onready var outer_ring: ColorRect = $OuterRing
@onready var inner_dot: ColorRect = $InnerDot

var _origin: Vector2 = Vector2.ZERO
var _active: bool = false
var _fade_tween: Tween

func _ready() -> void:
    mouse_filter = Control.MOUSE_FILTER_IGNORE
    modulate.a = 0.0
    hide()

func update_position(move_direction: Vector2, is_active: bool) -> void:
    # move_direction 来自 TouchInput（已归一化）——本组件只负责视觉
    # 注意：摇杆中心位置（_origin）由 TouchInput 的 initial_touch_pos 决定
    # 本组件从 TouchInput 读取 origin
    if not is_active and _active:
        _deactivate()
        return
    if is_active and not _active:
        _activate()
    
    if not _active:
        return
    
    # TouchInput.move_direction 长度 = 0~1，方向 = 拖动方向
    var offset := move_direction * MAX_DRAG
    inner_dot.position = outer_ring.position + offset - Vector2(DOT_RADIUS, DOT_RADIUS)

func set_origin(screen_pos: Vector2) -> void:
    _origin = screen_pos
    outer_ring.position = screen_pos - Vector2(RING_RADIUS, RING_RADIUS)

func _activate() -> void:
    _active = true
    modulate.a = 1.0
    show()
    # scale 0→1 弹出动画 (0.1s)

func _deactivate() -> void:
    _active = false
    # 淡出动画 0.15s → hide
    var tw := create_tween()
    tw.tween_property(self, "modulate:a", 0.0, FADE_DURATION)
    tw.tween_callback(hide)
```

### 为什么 STUNNED 图标放在 HUDLayer 而非 World

| 方案 | 优点 | 缺点 |
|------|------|------|
| **HUDLayer Control + 坐标转换**（选用） | 天然支持屏幕边缘 clamp；z-order 保证在一切之上；Control 节点 API 丰富 | 每帧世界→屏幕坐标转换（<0.001ms） |
| World Sprite2D | 自动跟随世界位置；不需要坐标转换 | 无法 clamp 到屏幕边缘（需要额外逻辑）；z-order 受场景层级影响；Camera2D 震动导致图标抖动 |
| 单独 CanvasLayer (layer 8) | 独立控制；不随 HUD 隐藏 | 过度设计——仅 1 个图标需要世界跟踪 |

### 布局空间协调

```
┌──────────────────────────────────────────┐
│  HUDLayer (layer 10)                      │
│  ┌──────────────────────────────────────┐ │
│  │ HP Bar (16,16)    Chain×3    Weapon  │ │ ← 顶部 48px 留给 HUD
│  ├──────────────────────────────────────┤ │
│  │            (透明——触摸穿透)            │ │
│  │                                      │ │
│  │   TouchControlLayer (layer 5)        │ │
│  │   ┌─────────┐          ┌─────────┐   │ │
│  │   │ 摇杆    │          │ 准星    │   │ │ ← 剩余屏幕空间
│  │   │ (动态)  │          │ (跟随右指)│   │ │
│  │   └─────────┘          └─────────┘   │ │
│  │                                      │ │
│  └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

- HUDLayer 的持久层元素固定在顶部 48px 以内
- TouchControlLayer 的元素在剩余屏幕空间中——两个层不重叠区域
- 两层都设置 `mouse_filter=IGNORE`——触摸事件无阻塞

### 4.6 Dual-Focus 影响评估

Godot 4.6 将 mouse/touch focus 与 keyboard/gamepad focus 分离为两个独立的焦点系统：
- `Control.grab_focus()` 仅影响 keyboard/gamepad focus
- Mouse/touch hover 不再自动转移 keyboard focus
- 两个焦点可以同时存在于不同的 Control 上

**本项目影响**: **无**。坍塌禁区是纯触屏移动端游戏——没有键盘或手柄输入。`grab_focus()` 不会被调用。所有 `mouse_filter=IGNORE` 的配置在 dual-focus 系统下行为一致——Control 节点拒绝 mouse/touch focus（`IGNORE`），同时也自然没有 keyboard/gamepad focus（从未 grab）。

**未来风险**: 如果 Alpha 阶段添加蓝牙手柄支持（ADR-0009 的可选手柄支持），需要重新评估——手柄导航需要在 HUD 元素之间移动焦点。届时 HUD 的 `mouse_filter=IGNORE` 可能需要改为针对手柄的独立配置。此风险记录在下方 Risks 表中。

## Alternatives Considered

### Alternative A: 单 CanvasLayer 共享

- **Description**: 触控 UI 和 HUD 所有 Control 节点放在同一个 CanvasLayer（layer 5）中。通过 Control 的 z_index 或场景树顺序控制渲染顺序。
- **Pros**: 节点数少（1 个 CanvasLayer vs 2 个）；场景树结构简单
- **Cons**: HUD 和触控 UI 的 z-order 竞争在同一层内解决——需要手动管理每个元素的 z_index。非 PLAYING 状态时需要分别隐藏触控元素和 HUD 元素——但它们在同一个父节点下，隐藏逻辑耦合。未来如果需要调整个别元素的层级关系（如低血量 overlay 在触控上方但 Boss HP 条下方），z_index 冲突风险高
- **Rejection Reason**: 双 CanvasLayer 的额外节点开销可忽略（<100 bytes），但换来了清晰的层级分离和独立的显示/隐藏控制。HUD 和触控 UI 的状态生命周期不同（HUD 在 PAUSED 时半透明，触控 UI 完全隐藏）——独立 CanvasLayer 使各自的根节点直接控制 visible/modulate，不需要遍历子节点

### Alternative B: 不使用 CanvasLayer——Control 直接放在场景树中

- **Description**: HUD 和触控 UI 的 Control 节点直接作为 scene root 的子节点，不使用 CanvasLayer。依赖 Control 节点自身的锚点系统保持屏幕定位。
- **Pros**: 最少的额外节点——不需要 CanvasLayer；Control 节点的 anchor 系统天然支持屏幕定位
- **Cons**: Control 节点在场景树中受 Camera2D 影响——`anchor_left/anchor_right` 等属性虽然可以定位到屏幕边缘，但 `rect_position` 基于父节点坐标系。如果父节点是 Node2D 子节点且受 Camera2D 影响，Control 的屏幕位置会随摄像机移动。Godot 官方文档明确推荐使用 CanvasLayer 进行 HUD 渲染
- **Rejection Reason**: CanvasLayer 是 Godot 设计用于 HUD 的标准方案——明确表达"这个 UI 独立于摄像机"的意图。直接使用场景树中的 Control 节点虽然技术上可行（用 anchor 全屏），但在有 Camera2D 移动/缩放/震动的场景中，行为需要额外验证——增加了不确定性

### Alternative C: 三 CanvasLayer（触控 layer 5 + HUD layer 10 + Overlay layer 15）

- **Description**: 增加第三个 CanvasLayer (layer 15) 专用于全屏 overlay（低血量脉冲、死亡淡出、加载过渡）。
- **Pros**: 全屏 overlay 始终在最顶层——不受 HUD 或触控元素的 z-order 影响；overlay 的显示/隐藏逻辑完全独立
- **Cons**: 额外的 CanvasLayer 节点——目前只有 1 个全屏 overlay（低血量脉冲），为它单建一层过度设计；死亡淡出和加载过渡由 SceneManager 管理——不在 HUD 职责范围内
- **Rejection Reason**: MVP 阶段低血量 overlay 作为 HUDLayer 的最后一个子节点（z_index 最高）即可满足需求。如果 Alpha 阶段 overlay 类型增加到 3+ 个且出现 z-order 冲突，再拆分第三层。保持 MVP 简洁

## Consequences

### Positive
- 双 CanvasLayer 提供清晰的职责分离——TouchControlLayer 管理输入视觉反馈，HUDLayer 管理信息显示
- `MOUSE_FILTER_IGNORE` 统一策略消除了触屏事件被 Control 节点拦截的风险——TouchInput 始终能收到原始事件
- STUNNED 图标通过坐标转换放在 HUDLayer——天然支持屏幕边缘 clamp，不受 Camera2D 震动影响
- 独立的 visible 控制——PAUSED 状态下 TouchControlLayer 完全隐藏（不可交互），HUDLayer 半透明（仍可见）
- CanvasLayer 的 `follow_viewport_enabled` 确保 UI 在移动端不同分辨率/旋转下正确缩放
- 中间 layer 号留空（6-9）为未来 tutorial overlay、debug overlay 等预留

### Negative
- 每个 `_process` 中 STUNNED 图标需要世界→屏幕坐标转换（`camera.get_screen_transform().affine_inverse()`）——额外 <0.001ms/帧。Boss 战时才执行（99% 时间不执行）
- 两个 CanvasLayer 意味着 UI 的 root 有两个——代码组织上需要在 `res://ui/` 下维护两个独立场景，而非单一 `ui_root.tscn`
- `MOUSE_FILTER_IGNORE` 的递归设置需要可靠执行——如果新 UI 元素忘记设置，会在运行时拦截触摸。缓解：`_set_mouse_filter_recursive` 作为 static 工具函数 + CI lint 规则（检查所有 .tscn 中 Control 节点的 mouse_filter 默认值）

### Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Control 节点的 `MOUSE_FILTER_IGNORE` 未生效，拦截触摸事件 | 中——新 UI 元素可能遗漏 | 高——玩家触摸无响应 | CI lint 规则：检查 .tscn 中所有 Control 节点的 mouse_filter 属性。TouchControlLayer._ready() 中递归设置作为运行时兜底 |
| 世界→屏幕坐标转换在 Camera2D 震动时出现抖动 | 低——震动偏移 <5px，且 Tween 回调在 `_process` 后执行 | 低——视觉瑕疵，不影响功能 | 对 STUNNED 图标位置做低通滤波（lerp 平滑） |
| 手柄支持时 HUD `mouse_filter=IGNORE` 阻止手柄导航 | 低——MVP 无手柄支持 | 中——Alpha 添加手柄时需要重构 | 手柄支持时 HUD 元素的 `focus_mode` 独立于 `mouse_filter`——可以在 `mouse_filter=IGNORE` 的同时设置 `focus_mode=FOCUS_ALL`。记录在 ADR 中供 Alpha 参考 |
| CanvasLayer 在 Android 设备上的触摸坐标缩放 | 低——`follow_viewport_enabled` + `follow_viewport_scale` 处理缩放 | 中——不同设备可能有边缘情况 | 在 3 种分辨率设备上验证（720p/1080p/1440p） |

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| touch-control-ui.md §1 | 屏幕分区（横屏 1920×1080 设计基准）——触控元素全部位于 HUD 下方、HUD 顶部 48px | CanvasLayer 层级保证渲染顺序（TouchControls layer 5 < HUD layer 10）。HUD 持久层元素固定在顶部 48px 内，不与触控重叠 |
| touch-control-ui.md §2 | 虚拟摇杆——动态中心、外环 60px、内点 24px、MAX_DRAG 80px | VirtualJoystick Control 节点在 TouchControlLayer 上，`update_position()` 接收 TouchInput.move_direction 驱动视觉 |
| touch-control-ui.md §3 | 瞄准准星——24×24px 十字，跟随右指位置，无触摸时隐藏 | Crosshair Control 节点在 TouchControlLayer 上，`visible` 绑定 `TouchInput.is_aiming`，`position` 绑定 `TouchInput.aim_position` |
| touch-control-ui.md §4 | 射击反馈——点击脉冲（24→48px, 0.1s）+ 按住持续脉冲 | ShootPulse Control 节点——`shoot_tapped` signal 触发单次脉冲，`shoot_held` poll 驱动持续脉冲 |
| touch-control-ui.md §5 | 布局协调——触控与 HUD 无重叠；暂停时触控完全隐藏 | 双 CanvasLayer 独立 visible 控制。PAUSED→TouchControlLayer visible=false, HUDLayer modulate.a=0.4 |
| touch-control-ui.md AC10 | PAUSED 状态触控元素立即隐藏 | `_on_state_changed()` — `visible = (new == PLAYING)` |
| touch-control-ui.md AC11 | 触控与 HUD 元素无重叠 | HUD 持久层限制在顶部 48px——通过 HUDLayer PersistentLayer Control 的 anchor 和 margin 设置。其余屏幕空间为触控区域 |
| hud.md §1 | 3 层信息层级——持久层/事件层/Boss 层 | HUDLayer 内 3 个子 Control：PersistentLayer / EventLayer / BossLayer——各自独立控制 visible 和 modulate |
| hud.md §2 | 10 个 MVP HUD 元素的布局——位置、尺寸、signal 来源 | 每个 HUD 元素是 HUDLayer 子 Control 下的具体节点。布局从 `hud_layout.json` 配置加载 |
| hud.md §3 | Signal 订阅注册表——HUD 通过配置声明 signal→UI 元素映射 | HUDLayer._ready() 中连接所有上游 signal。Alpha 阶段扩展为配置文件驱动的注册表 |
| hud.md §4 | 低血量边缘脉冲——HP ≤ 30% 时红色 overlay 0.5Hz | LowHealthOverlay (ColorRect) 作为 HUDLayer 最顶层子节点（z_index 最高）——由 `health_changed` signal 触发脉冲动画 |
| hud.md §5 | STUNNED 提示跟随 Boss 位置，超出屏幕时 clamp 到边缘内侧 16px | StunnedIcon Control 在 HUDLayer 上——`_process()` 中通过 `camera.get_screen_transform().affine_inverse()` 转换世界坐标，clamp 到屏幕边缘 |
| hud.md §3 Open Q5 | HUD 使用 Godot CanvasLayer 还是 Control 节点直接放置？ | 本 ADR 给出最终决策——CanvasLayer 2 层架构 |
| hud.md AC13 | PAUSED 状态 HUD 元素半透明（opacity=0.4） | `_on_state_changed()` — `modulate.a = 0.4` |
| hud.md AC14 | MAIN_MENU/DEAD 状态 HUD 隐藏 | `_on_state_changed()` — `visible = false` |
| hud.md AC15 | STUNNED 图标 clamp 到屏幕边缘内侧 16px | `_world_to_screen_clamped()` — clampf 到 `[16, viewport_size - 48]` |

## Performance Implications
- **CPU**: TouchControlLayer._process() — poll TouchInput 属性 + joystick/crosshair 更新 <0.01ms/帧。HUDLayer._process() — STUNNED 坐标转换（仅 Boss 战时执行）<0.001ms/帧。两个 CanvasLayer 的渲染由 Godot 引擎处理——不增加 draw call 数量（CanvasLayer 内 Control 节点合批）
- **Memory**: TouchControlLayer 场景 ~5KB（3 个 Control + ColorRect 子节点 + 脚本）。HUDLayer 场景 ~20KB（10+ 个 HUD 元素 + 脚本）。总计 ~25KB
- **Load Time**: 两个 CanvasLayer 场景加载 <3ms（简单 Control 节点 + 脚本）
- **Network**: N/A（单机游戏）

## Migration Plan
本项目尚无代码——此为初始架构决策。实施步骤：
1. 创建 `res://ui/touch_control_layer.tscn` — CanvasLayer (layer=5) + VirtualJoystick + Crosshair + ShootPulse
2. 创建 `res://ui/hud_layer.tscn` — CanvasLayer (layer=10) + PersistentLayer + EventLayer + BossLayer + LowHealthOverlay
3. TouchControlLayer 脚本实现 `_process()` poll TouchInput + `_on_shoot_tapped()` signal 回调 + `_on_state_changed()`
4. HUDLayer 脚本实现所有上游 signal 连接 + `_on_state_changed()` + `_world_to_screen_clamped()`
5. 每个房间 .tscn 中包含两个 CanvasLayer 子场景实例
6. 所有 Control 节点的默认 `mouse_filter` 设为 `MOUSE_FILTER_IGNORE`（场景级别 + 运行时递归兜底）
7. `hud_layout.json` 配置文件——定义每个 HUD 元素的 signal、position、size、animation
8. CI 添加 lint 规则：验证所有 .tscn 中 Control 节点 `mouse_filter` 不为默认值（`STOP`）

## Validation Criteria
- 触控 UI 元素（摇杆/准星/脉冲）在屏幕上固定——Camera2D 移动/缩放/震动时位置不变
- HUD 元素（HP 条/武器图标/连锁计数器/Boss 仪表盘）在屏幕上固定——Camera2D 移动/缩放/震动时位置不变
- 触摸事件在 TouchControlLayer 和 HUDLayer 的 Control 节点上正常穿透——TouchInput._input() 收到完整的 InputEventScreenTouch/Drag
- HUD 渲染在触控 UI 之上（layer 10 > layer 5）——HUD 元素永不与触控元素重叠
- PAUSED 状态：TouchControlLayer 完全隐藏，HUDLayer 半透明（opacity=0.4）
- MAIN_MENU/DEAD 状态：两个 CanvasLayer 均隐藏
- STUNNED 图标跟随 Boss 世界位置——Boss 移动时图标平滑跟随；Boss 在屏幕外时图标 clamp 到屏幕边缘内侧 16px
- STUNNED 图标在 Camera2D 震动（shake）期间不抖动——位置稳定
- 移动端横屏 1920×1080 设计基准下所有 UI 元素正确缩放和定位
- GDD touch-control-ui AC1-AC11 全部满足
- GDD hud AC1-AC16 全部满足

## Related Decisions
- ADR-0001: Autoload + Signal 架构（TouchInput 作为 Foundation Autoload——触控 UI 从其 poll 信号）
- ADR-0009: PlayerController 触屏射击（触控 UI 与 PlayerController 无直接信号连接——两者独立消费 TouchInput）
- ADR-0010: 游戏状态机（state_changed signal——两个 CanvasLayer 订阅此信号控制显示/隐藏）
- ADR-0011: 摄像机系统（Camera2D 震动不影响 CanvasLayer——验证 shake 期间 STUNNED 图标坐标转换的稳定性）
