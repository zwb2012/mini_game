# ADR-0009: 玩家控制器与触摸射击架构

## Status
Accepted

## Date
2026-05-22

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Godot 4.6 |
| **Domain** | Input / Core |
| **Knowledge Risk** | LOW — CharacterBody2D + move_and_slide() 自 Godot 4.0 起稳定。InputEventScreenTouch/Drag 自 4.0 起稳定。2D 物理 4.4-4.6 无变更 |
| **References Consulted** | `docs/engine-reference/godot/VERSION.md`, `docs/engine-reference/godot/modules/physics.md`, `docs/engine-reference/godot/breaking-changes.md`, `docs/engine-reference/godot/deprecated-apis.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | 触屏输入→角色移动的端到端延迟（目标 <33ms, 2 帧）；move_and_slide 在 PhysicsObject 挤压下的推出行为；按住射击时角色移动的帧率稳定性 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Autoload + Direct Signal) — TouchInput 作为 Foundation Autoload；ADR-0007 (子弹生命周期) — ShootingSystem.fire() 接口；ADR-0008 (武器系统) — WeaponSystem.fire_current() 作为射击委托目标；ADR-0002 (场景加载) — 房间重置时 PlayerController 位置/状态重置 |
| **Enables** | ADR-0010 (摄像机系统) — 摄像机跟随 PlayerController 位置和面向方向；ADR-0014 (敌人 AI) — EnemyAI 读取 PlayerController global_position 作为追踪目标 |
| **Blocks** | Player Controller Epic, Touch Input Epic — 必须先确定触屏→角色→射击的信号链路才能实现玩家操控 |
| **Ordering Note** | 必须在 ADR-0007 和 ADR-0008 之后实现——依赖 ShootingSystem.fire() 和 WeaponSystem.fire_current() 接口 |

## Context

### Problem Statement

玩家控制器是"触屏手势"到"角色行为"的翻译器。它每帧从 TouchInput 读取标准化信号（move_direction、aim_position、shoot_tapped、shoot_held），驱动 CharacterBody2D 移动、控制面向方向、触发射击。核心架构问题：

1. **生命周期**: PlayerController 是 Autoload 还是场景节点？如果玩家死亡（ADR-0002 房间重置），角色如何重置？
2. **输入→射击的委托链**: 触屏→PlayerController→WeaponSystem→ShootingSystem→子弹。PlayerController 在哪个环节做 shoot_interval 检查？还是完全委托给 WeaponSystem？
3. **TouchInput 集成方式**: PlayerController 是每帧 poll TouchInput 的属性，还是连接 TouchInput 的 signal？两种方式对响应延迟的影响？
4. **角色碰撞与物理**: CharacterBody2D 的 move_and_slide() 处理与世界/敌人的碰撞——被 PhysicsObject 碎片击中时的推力如何传递？

### Constraints

- PlayerController 是 CharacterBody2D（Godot 标准角色物理）
- 必须通过 TouchInput Autoload 读取输入——不直接处理 `InputEventScreenTouch`
- 射击委托给 WeaponSystem——PlayerController 不做 CD 检查（那是 WeaponSystem 的职责）
- 移动端 60fps——输入→移动响应延迟 ≤ 33ms（2 帧）
- 房间重置时 PlayerController 必须恢复到初始位置和满状态

### Requirements

- 移动：move_direction → velocity → move_and_slide()
- 面向方向：根据 aim_position 相对于角色位置决定 face_right
- 射击：shoot_tapped/shoot_held → WeaponSystem.fire_current()
- 角色碰撞：CharacterBody2D 在 Player 层(1)，碰撞 Enemy(2)/World(4)/PhysicsObject(5)
- 挤压伤害：被 PhysicsObject 和 World 夹住 1 秒后每秒 1 HP
- 房间重置：位置恢复到房间出生点，状态恢复默认

## Decision

**PlayerController 作为场景节点（非 Autoload）——每个房间 .tscn 实例化。输入读取采用每帧 poll TouchInput 属性 + shoot_tapped signal 混合模式。射击 CD 完全委托给 WeaponSystem。**

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                      信号流 (左→右)                                    │
│                                                                        │
│  TouchInput (Autoload)          PlayerController (场景节点)             │
│  ┌───────────────────┐         ┌──────────────────────────┐           │
│  │ move_direction    │────────►│ _physics_process:        │           │
│  │ (poll 每帧)       │         │   velocity = move_       │           │
│  │                   │         │     direction * speed    │           │
│  │ aim_position      │────────►│   move_and_slide()      │           │
│  │ (poll 每帧)       │         │                          │           │
│  │                   │         │ face_right = aim_pos     │           │
│  │ shoot_tapped      │         │   .x > global_pos.x     │           │
│  │ (signal 连接)     │         │                          │           │
│  │                   │         │ _on_shoot_tapped():      │           │
│  │ shoot_held        │         │   WeaponSystem.fire_    │           │
│  │ (poll 每帧)       │────────►│     current(gun_pos,    │           │
│  └───────────────────┘         │     aim_world_pos,       │           │
│                                │     "player")            │           │
│                                │                          │           │
│                                │ _on_shoot_held():        │           │
│                                │   每帧调用 fire_current  │           │
│                                │   (CD 由 WeaponSystem    │           │
│                                │    内部拒绝)              │           │
│                                └──────────────────────────┘           │
│                                                                        │
│  WeaponSystem.fire_current() → ShootingSystem.fire() → bullet         │
└──────────────────────────────────────────────────────────────────────┘

场景生命周期:
  Room.tscn 加载
    ├─ PlayerController 实例化 (CharacterBody2D)
    ├─ Camera2D 跟随 PlayerController
    └─ PlayerController._ready():
         ├─ 连接 TouchInput.shoot_tapped signal
         └─ 记录出生点位置
  
  玩家死亡:
    ├─ HealthDamage → entity_died("player")
    ├─ SceneManager.reset_room()
    └─ room_root.reset():
         ├─ PlayerController.position = spawn_point
         ├─ PlayerController.velocity = Vector2.ZERO
         └─ 其他可破坏物/敌人重置
```

### Key Interfaces

```gdscript
# PlayerController (场景节点, extends CharacterBody2D)
# 位置: res://scenes/player/player_controller.tscn
class_name PlayerController
extends CharacterBody2D

# ── 配置 ──
@export var move_speed: float = 400.0        # px/s
@export var squeeze_damage: float = 1.0      # HP/s 挤压伤害
@export var squeeze_delay: float = 1.0       # 挤压判定延迟（秒）

# ── 运行时状态 ──
var face_right: bool = true
var _spawn_point: Vector2
var _squeeze_timer: float = 0.0

# ── _ready ──

func _ready() -> void:
    _spawn_point = global_position
    
    # shoot_tapped 是脉冲 signal——连接而非 poll
    if not TouchInput.shoot_tapped.is_connected(_on_shoot_tapped):
        TouchInput.shoot_tapped.connect(_on_shoot_tapped)

# ── 移动 (_physics_process) ──

func _physics_process(_delta: float) -> void:
    # 1. 读取移动输入（poll TouchInput 属性——每帧更新）
    var move_dir := TouchInput.move_direction  # Vector2, 长度 0~1
    
    # 2. 计算速度
    velocity = move_dir * move_speed
    
    # 3. 物理移动——move_and_slide 处理碰撞/沿墙滑动/推出挤压
    move_and_slide()
    
    # 4. 挤压检测
    var collision_count := get_slide_collision_count()
    if collision_count >= 2 and move_dir == Vector2.ZERO:
        # 被多个碰撞体夹住且未主动移动
        _squeeze_timer += _delta
        if _squeeze_timer >= squeeze_delay:
            _apply_squeeze_damage(_delta)
    else:
        _squeeze_timer = 0.0

# ── 面向方向 ──

func _process(_delta: float) -> void:
    # 面向方向在 _process 中更新（非物理帧——纯视觉）
    _update_facing()

func _update_facing() -> void:
    if TouchInput.is_aiming:
        # 瞄准中——面向随瞄准点
        face_right = TouchInput.aim_position.x > _screen_center_x()
    # else: 保持上次面向方向（不重置）

# ── 射击 (_process 中处理 shoot_held——非物理帧轮询) ──

func _process(_delta: float) -> void:
    _update_facing()
    
    # shoot_held: 按住持续射击——每帧调用 fire_current
    # CD 检查由 WeaponSystem 内部处理——PlayerController 不关心 CD
    if TouchInput.shoot_held:
        _fire()

# ── 射击 (shoot_tapped signal 回调——确保不丢帧) ──

## shoot_tapped 是单帧脉冲 signal——必须用 signal 连接接收
## 如果 poll，可能在两帧之间丢失点击事件
func _on_shoot_tapped() -> void:
    _fire()

func _fire() -> void:
    # gun_pos: 枪口位置——角色前方偏移
    var gun_offset := Vector2(30 if face_right else -30, 0)
    var gun_pos := global_position + gun_offset
    
    # aim_world_pos: 瞄准点的世界坐标
    var aim_world_pos := get_viewport().get_camera_2d().get_screen_transform().affine_inverse() * TouchInput.aim_position
    
    # 委托给 WeaponSystem——CD/ammo/reload 全在 WeaponSystem 层
    WeaponSystem.fire_current(gun_pos, aim_world_pos, "player")

# ── 房间重置 ──

func reset() -> void:
    global_position = _spawn_point
    velocity = Vector2.ZERO
    _squeeze_timer = 0.0
    # face_right 保持——不重置面向方向

# ── 辅助 ──

func _screen_center_x() -> float:
    return get_viewport().get_visible_rect().size.x / 2.0

func _apply_squeeze_damage(delta: float) -> void:
    # 通过 HitDetection 生成环境伤害 HitData
    HitDetection.hit_detected.emit({
        "hit_point": global_position,
        "hit_normal": Vector2.ZERO,
        "hit_object": self,
        "hit_layer": 1,  # Player 层
        "impulse": squeeze_damage * delta,
        "source_object": null,
        "source_layer": 0,
        "damage_type": "crush",
        "source_entity": "environment"
    })
```

### 输入读取策略：Poll + Signal 混合

| 输入信号 | 读取方式 | 原因 |
|---------|---------|------|
| `move_direction` | Poll（每 `_physics_process`） | 连续值——需要每帧最新值驱动 velocity |
| `aim_position` | Poll（每 `_process`） | 连续值——面向方向每帧更新 |
| `shoot_tapped` | **Signal 连接** | 单帧脉冲——poll 可能在帧间丢失事件 |
| `shoot_held` | Poll（每 `_process`） | 布尔状态——每帧检查即可 |
| `is_aiming` | Poll（每 `_process`） | 布尔状态——用于面向方向逻辑 |

> **shoot_tapped 为什么用 signal**: `shoot_tapped` 是单帧脉冲——TouchInput 在检测到 tap 的帧将其设为 `true`，下一帧复位为 `false`。如果 PlayerController 的 `_process` 在 TouchInput 的 `_process` 之前执行，poll 方式会在 tap 帧读到 `false`（因还未更新）——丢失该次点击。Signal 连接确保 TouchInput 的 emit 立即回调 PlayerController._on_shoot_tapped()，不受帧序影响。

### PlayerController 为什么不是 Autoload

| 因素 | Autoload | 场景节点 ✓ |
|------|---------|-----------|
| **场景切换** | 在 change_scene_to_file 期间存活 | 随旧场景销毁，新场景重建 |
| **玩家死亡** | 需要手动重置位置+状态 | room_root.reset() 直接重置 |
| **多个 PlayerController** | 不可能（Autoload 是单例） | 自然——每房间一个 |
| **摄像机跟随** | 需要全局查找 Camera2D | 同一场景内直接 `$Camera2D` |
| **碰撞体** | Autoload 可以但反模式 | CharacterBody2D 的标准位置 |

PlayerController 作为场景节点意味着：
- 每个房间 .tscn 包含一个 Player 子场景
- 房间切换时旧 PlayerController 销毁，新房间的 PlayerController 实例化
- 房间重置时（同一房间内玩家死亡）调用 `PlayerController.reset()`——恢复到出生点
- 摄像机作为 PlayerController 的子节点或同场景节点——自然跟随

## Alternatives Considered

### Alternative A: PlayerController 作为 Autoload

- **Description**: PlayerController 在 game 启动时创建，所有房间共享同一个角色实例。场景切换时 PlayerController 的 global_position 更新到新房出生点。
- **Pros**: 角色状态跨房间持久——不需要每次加载房间时重置；HUD 可以直接引用 Autoload 而不需要场景内查找
- **Cons**: `change_scene_to_file()` 会销毁旧场景的所有节点——如果 PlayerController 不是旧场景的子节点，它在场景切换后成为"浮空节点"（无 parent 场景）。需要特殊处理将其 reparent 到新场景——增加了场景加载的复杂度。CharacterBody2D 的物理状态在场景切换时的行为需要额外验证
- **Rejection Reason**: Godot 的 `change_scene_to_file()` 设计为"切换到全新场景"——Autoload 角色需要额外生命周期管理才能在场景切换中存活并正确 reparent。场景节点方案利用 Godot 原生场景生命周期——更简洁、更可靠。

### Alternative B: 所有输入通过 signal 连接（不 poll）

- **Description**: PlayerController 连接 TouchInput 的所有 signal（move_direction_changed、aim_position_changed、shoot_held_changed 等），在 signal 回调中更新内部状态，`_physics_process` 中仅执行 `move_and_slide()`。
- **Pros**: 事件驱动——PlayerController 仅在输入变化时执行逻辑；信号连接明确表达了数据依赖
- **Cons**: TouchInput 需要为连续值（move_direction、aim_position）emit 大量 signal（60 次/秒 × 2 指 = 120 signal/秒）。Signal emit 有微小开销（Callable 调用），在高频场景下不如直接读属性；增加了 TouchInput 的复杂度——需要追踪"上次值"以判断是否变化
- **Rejection Reason**: 连续值的 poll 开销可忽略（读一个 Vector2 属性 <0.001ms）。Signal 方式在此场景是过度设计——poll 直接、高效、代码更少。

### Alternative C: shoot_interval CD 在 PlayerController 中实现

- **Description**: PlayerController 追踪 `_last_fire_time`，在 `_fire()` 中检查 CD——未到 CD 则不调用 WeaponSystem。
- **Pros**: PlayerController 可以提前拒绝射击——不做无用的 WeaponSystem.fire_current() 调用；不同武器不同 CD 的复杂性被限制在 PlayerController 内
- **Cons**: PlayerController 需要知道当前武器的 shoot_interval——意味着它需要读取 WeaponSystem 的内部配置。这违反了 ADR-0008 的职责边界（CD 属于 WeaponSystem）；EnemyAI 也需要 shoot_interval——如果 CD 在 PlayerController，EnemyAI 需要重复实现
- **Rejection Reason**: ADR-0008 已经确定 WeaponSystem 是射击 CD 的权威。PlayerController 的职责是"手指做了什么"→"调用射击"——不关心"当前武器允不允许射击"。

## Consequences

### Positive
- 场景节点模式利用 Godot 原生的场景生命周期——PlayerController 随房间自然创建/销毁，不需要特殊生命周期管理
- 输入读取的混合策略（关键脉冲用 signal，连续值 poll）平衡了可靠性和简洁性
- 射击 CD 完全委托给 WeaponSystem——PlayerController 保持简单，不感知武器配置
- 挤压伤害走标准 hit_detected signal——与所有其他伤害类型使用相同通道
- 房间重置简单——`reset()` 方法仅恢复位置和速度

### Negative
- PlayerController 在 `_process` 中 poll shoot_held——每帧调用 fire_current()。如果没有在射击（shoot_held=false），这是浪费的 `_process` 循环。但实际上 `_process` 空循环开销可忽略
- shoot_tapped signal 连接在 `_ready()` 中——如果场景重建（房间切换），需要重新连接。这是场景节点的自然行为，但需要注意 PlayerController 的 `_ready()` 在每次场景加载时执行
- `aim_world_pos` 的坐标转换（screen→world）每帧执行——涉及 `get_camera_2d()` 和逆变换。开销 <0.001ms

### Risks
- **`move_and_slide()` 在极端挤压下的行为**: 两个 RigidBody2D 从两侧同时挤压 PlayerController——`move_and_slide()` 的推出方向取决于碰撞顺序。缓解：`move_and_slide()` 的默认推出行为在大多数情况下正确；挤压伤害提供了兜底（1 秒后被卡住开始扣血→玩家死亡→重置）
- **场景切换时 shoot_tapped signal 连接**: 旧场景的 PlayerController 在 `_exit_tree()` 时应断开 signal——否则悬垂连接。缓解：在 `_exit_tree()` 中 `TouchInput.shoot_tapped.disconnect(_on_shoot_tapped)`，或在连接时使用 `CONNECT_ONE_SHOT`（不适合——shoot_tapped 需要持久连接）
- **shoot_tapped 和 shoot_held 同帧**: PlayerController GDD 说"shoot_tapped 优先，忽略 shoot_held"。但 shoot_tapped 是 signal 回调（可能在不同时机），shoot_held 是 poll。缓解：在 `_on_shoot_tapped()` 中设置 `_just_tapped = true`，`_process()` 中检查——如果 `_just_tapped`，跳过 shoot_held 处理。下一帧清除标记。
- **房间重置后 PlayerController 的碰撞状态**: `move_and_slide()` 在重置后的第一帧可能仍然报告 `is_on_wall()` 或 `is_on_floor()`（因为碰撞体在重置帧末才更新）。缓解：重置时设置 `velocity = Vector2.ZERO` 且 `global_position = _spawn_point`——Godot 在下一物理帧重新计算碰撞状态

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| player-controller.md | §1 移动: move_direction × move_speed → velocity | `_physics_process` — velocity = move_direction * move_speed |
| player-controller.md | §2 面向方向: aim_position 相对于角色位置决定 face_right | `_update_facing()` — 瞄准点在右→face_right=true |
| player-controller.md | §3 射击: shoot_tapped + shoot_held → WeaponSystem.fire_current | `_on_shoot_tapped()` + `_process()` poll shoot_held → `_fire()` |
| player-controller.md | §4 射击冷却: CD 委托给 WeaponSystem | ADR-0008 — PlayerController 不检查 CD |
| player-controller.md | §5 移动射击: 移动和射击可同时进行 | `_physics_process` 移动 + `_process` 射击——两个独立循环 |
| player-controller.md | §6 角色碰撞: Player 层(1), 碰撞 Enemy/World/PhysicsObject | CharacterBody2D collision_layer=1, collision_mask=Enemy|World|PhysicsObject |
| player-controller.md | AC1-AC10: 全部 10 个验收标准 | 参见 Validation Criteria |
| touch-input.md | §7 标准化输出信号: 5 个信号 + is_aiming | 混合 poll + signal 连接——全覆盖 |
| touch-control-ui.md | §2-4 虚拟摇杆/准星/射击反馈 | PlayerController 不依赖 TouchControlUI——两者独立消费 TouchInput |
| touch-control-ui.md | §5 信号架构: touch-input → player-controller (直连) | ADR 确认——PlayerController 直连 TouchInput，不经 TouchControlUI 中转 |

## Performance Implications
- **CPU**: `_physics_process`: move_and_slide() 是 Godot 引擎内部开销（C++层），velocity 赋值 <0.001ms。`_process`: poll TouchInput 属性 + facing 判断 + fire_current 调用 <0.005ms
- **Memory**: PlayerController 场景节点 ~2KB（CharacterBody2D + CollisionShape2D + Sprite2D）
- **Load Time**: player_controller.tscn 加载 <5ms（简单场景——1 个 CharacterBody2D + 2 个子节点）
- **Network**: N/A

## Migration Plan
本项目尚无代码——此为初始架构决策。实施步骤:
1. 创建 `res://scenes/player/player_controller.tscn` — CharacterBody2D + CollisionShape2D + Sprite2D
2. PlayerController 脚本实现 `_physics_process()`, `_process()`, `_on_shoot_tapped()`, `_fire()`, `reset()`
3. 实现 shoot_tapped + shoot_held 同帧去重（`_just_tapped` 标记）
4. 实现挤压伤害逻辑
5. 每个房间 .tscn 中实例化 Player 子场景
6. room_root.gd 的 reset() 中调用 `$Player.reset()`
7. 集成测试: 触摸→move_direction→角色移动→端到端延迟测量

## Validation Criteria
- move_direction=(1,0) → 角色以 400px/s 向右移动 (AC1)
- move_direction=(0,0) → velocity=(0,0) (AC2)
- 瞄准点在右侧 → face_right=true (AC3)
- shoot_tapped → WeaponSystem.fire_current 被调用一次 (AC4)
- shoot_held=true 持续 1s → 约 3-4 次 fire_current（CD 由 WeaponSystem 限制）(AC5)
- 角色站在 World 层地板上 → is_on_floor()=true (AC6)
- 角色面向右→瞄准点移到左侧→face_right=false + sprite 翻转 (AC7)
- 被 PhysicsObject 和 World 夹住 1 秒 → 每秒 squeeze_damage HP (AC8)
- 触摸→移动响应延迟 ≤ 33ms（2 帧, 60fps）(AC9)
- move_speed 从配置文件读取 (AC10)
- 房间重置 → PlayerController 位置恢复到出生点, velocity=Vector2.ZERO

## Related Decisions
- ADR-0001: Autoload + Direct Signal（TouchInput 作为 Foundation Autoload）
- ADR-0002: 场景加载策略（房间重置 → PlayerController.reset()）
- ADR-0007: 子弹生命周期（ShootingSystem.fire() 接口）
- ADR-0008: 武器系统与弹药管理（WeaponSystem.fire_current() 委托）
- ADR-0010: 摄像机系统（摄像机跟随 PlayerController）
- ADR-0014: 敌人 AI（EnemyAI 读取 PlayerController 位置）
