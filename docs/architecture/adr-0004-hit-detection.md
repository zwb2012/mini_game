# ADR-0004: 命中检测架构

## Status
Accepted

## Date
2026-05-22

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Godot 4.6 |
| **Domain** | Physics / Core |
| **Knowledge Risk** | LOW — `body_entered` signal, `PhysicsDirectSpaceState2D`, `PhysicsRayQueryParameters2D` 自 Godot 4.0 起稳定，4.4-4.6 无破坏性变更 |
| **References Consulted** | `docs/engine-reference/godot/VERSION.md`, `docs/engine-reference/godot/modules/physics.md`, `docs/engine-reference/godot/breaking-changes.md`, `docs/engine-reference/godot/deprecated-apis.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | 中端 Android 设备上 50 个活跃 RigidBody2D 的 `body_entered` 回调延迟实测；AOE `intersect_shape()` 50 物体查询耗时 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Autoload + Direct Signal 架构) — HitDetection 作为 Autoload 运行；ADR-0003 (物理对象池) — 子弹/碎片来自池化 RigidBody2D，碰撞回调由池对象产生 |
| **Enables** | ADR-0005 (材质破坏管线), ADR-0006 (连锁传播递归), ADR-0007 (子弹生命周期) |
| **Blocks** | Hit Detection Epic, Shooting/Projectile Epic, Health & Damage Epic — 必须先确定 HitData 结构和检测方式才能实现碰撞→伤害的完整链路 |
| **Ordering Note** | 必须在 ADR-0005 和 ADR-0007 之前被 Accepted——这两个 ADR 依赖 HitData 的 damage_type 和 source_entity 字段 |

## Context

### Problem Statement

碰撞与命中判定是"射击→命中→反应"链路的中枢。每次子弹命中、碎片撞击、爆炸波及都需要产生结构化的 HitData，供 7 个下游系统（health-damage、material-destruction、chain-propagation、shooting-projectile、enemy-ai、death-respawn、camera-system）消费。当前 hit-detection.md GDD 定义了 HitData 的 7 个基础字段，但缺少两个关键字段：

1. **`damage_type`** — health-damage.md 的 `final_damage = floor(impulse × type_factor × dtc)` 依赖此字段区分 bullet/explosion/fragment/crush，各有不同的 `type_factor`。boss-ai.md 依赖此字段执行 Pillar 4 强制规则（bullet dtc_effective=0.0）。
2. **`source_entity`** — shooting-projectile.md 使用此字段区分 player 子弹（触发 hit-stop）和 enemy 子弹（不触发 hit-stop）。HUD 可能需要此字段过滤显示（如"仅显示玩家受到的伤害"）。

此外，三种不同的碰撞检测方式（RigidBody2D contact signal、PhysicsDirectSpaceState2D AOE query、PhysicsRayQueryParameters2D raycast）需要统一的 HitData 生成入口，确保所有下游系统从同一信号源获取命中信息。

### Constraints
- Godot 4.6 + GodotPhysics2D — 2D 物理 API 在 4.4-4.6 中无变更
- 子弹和碎片来自 PhysicsObjectPool（ADR-0003）— 均为 RigidBody2D，碰撞检测依赖 `body_entered` contact signal
- 活跃 RigidBody2D 硬上限 70（碎片 50 + 子弹 20）— 碰撞回调总调用量可控
- 移动端 60fps（帧预算 16.6ms）— HitData 生成和 signal 发射必须在 <0.1ms 内完成
- ADR-0001 要求所有系统间通信走 Signal — HitDetection 作为 Autoload，通过 `hit_detected` signal 分发

### Requirements
- 统一的 HitData 结构 — 所有检测方式产生相同格式的数据
- `damage_type` 字段 — 供 health-damage 的 type_factor 查表和 boss-ai 的 Pillar 4 强制规则使用
- `source_entity` 字段 — 区分子弹来源（player/enemy/boss/environment）
- 单帧内多命中有序处理 — 按距离排序，最近命中优先
- AOE 查询返回范围内全部碰撞体 — 不排序，不合并
- 所有下游系统通过单一 `hit_detected` signal 消费 — 不直接访问 Godot 碰撞回调

## Decision

**采用统一 HitData 结构 + 三种检测方式 + 集中式 signal 分发。**

HitDetection 作为 Autoload，是所有碰撞事件的唯一翻译层——从 Godot 物理引擎接收原始碰撞数据，填充 HitData，emit `hit_detected` signal。7 个下游系统通过连接此 signal 消费命中信息，不直接访问 Godot 物理 API。

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                  HitDetection (Autoload)                  │
│                                                            │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ _integrate_     │  │ intersect_   │  │ raycast      │ │
│  │ forces()        │  │ shape()      │  │ (enemy-ai    │ │
│  │ (池对象自定义   │  │ (AOE query)  │  │  vision only)│ │
│  │  collision_hit  │  │              │  │              │ │
│  │  signal)        │  │              │  │              │ │
│  └────────┬────────┘  └──────┬───────┘  └──────┬───────┘ │
│           │                  │                  │          │
│           └──────────────────┼──────────────────┘          │
│                              ▼                             │
│                   build_hit_data()                         │
│                   统一填充 HitData                          │
│                              │                             │
│                              ▼                             │
│              emit hit_detected(hit_data)                    │
└──────────────────────┬───────────────────────────────────┘
                       │ 单一 signal
         ┌─────────────┼─────────────┬──────────┬──────────┐
         ▼             ▼             ▼          ▼          ▼
    health-        material-      shooting-   enemy-    death-
    damage         destruction    projectile  ai        respawn
    (伤害计算)     (破坏判定)     (子弹销毁)  (AI 反应) (死亡触发)
         
    chain-         camera-
    propagation    system
    (连锁入口)     (hit-stop/shake)
```

### Key Interfaces

```gdscript
# HitDetection Autoload (Foundation Layer)
extends Node

# ── HitData 结构 ──

## 统一命中数据结构——所有检测方式产出此格式
##
## 字段说明:
##   hit_point:       碰撞点世界坐标 (Vector2)
##   hit_normal:      碰撞面法线方向 (Vector2) — 用于碎片散射方向计算
##   hit_object:      被命中节点引用 (Node) — 下游通过此引用读取 entity metadata
##   hit_layer:       被命中对象所在碰撞层 (int) — 1=Player, 2=Enemy, 3=Projectile, 4=World, 5=PhysicsObject
##   impulse:         碰撞冲量大小 (float) — 来自 Godot 碰撞回调的 impulse 参数
##   source_object:   产生碰撞的源节点 (Node) — 子弹/碎片/爆炸源
##   source_layer:    源节点碰撞层 (int)
##   damage_type:     伤害类型 (String) — "bullet" | "explosion" | "fragment" | "crush" | "environment"
##   source_entity:   来源实体 (String) — "player" | "enemy" | "boss" | "environment"
##
## damage_type 决定下游行为:
##   - health-damage 据此查表 type_factor: bullet=0.20, explosion=0.15, fragment=0.25, crush=0.30
##   - boss-ai 据此执行 Pillar 4: bullet → dtc_effective=0.0 (不扣 HP)
##   - camera-system 据此决定是否触发 hit-stop (仅 player bullet 触发)
##
## source_entity 决定下游行为:
##   - shooting-projectile: "player" → 触发 hit-stop + 销毁子弹; "enemy" → 跳过 hit-stop + Enemy 层碰撞关闭
##   - HUD: "player" → 显示受伤来源方向指示

# HitData 是 Dictionary——不使用自定义 Resource（无序列化需求，Dict 构建更快）
# 示例:
# {
#   "hit_point": Vector2(450, 320),
#   "hit_normal": Vector2(-1, 0),
#   "hit_object": <Node: enemy_soldier_03>,
#   "hit_layer": 2,
#   "impulse": 500.0,
#   "source_object": <Node: bullet_pool_07>,
#   "source_layer": 3,
#   "damage_type": "bullet",
#   "source_entity": "player"
# }

# ── Signal ──

## 每次有效命中时发射（子弹命中、碎片撞击、AOE 波及每个物体各一个 HitData）
## 7 个下游系统连接此 signal 消费
signal hit_detected(hit_data: Dictionary)

# ── 检测方式 ──

## 方式 1: _integrate_forces + 自定义 collision_hit signal（子弹/碎片命中）
## Godot 的 RigidBody2D.body_entered signal 仅传递 body: Node——不提供碰撞位置、
## 法线或冲量。这些数据仅通过 _integrate_forces(state: PhysicsDirectBodyState2D)
## 可获取。每个池化 RigidBody2D 覆盖此方法，检测新接触并 emit 自定义 signal。
##
## HitDetection 在对象从池中取出时连接 collision_hit signal，回收时断开。

## 池化 RigidBody2D 的脚本（附加到所有池对象）:
# extends RigidBody2D
#
# signal collision_hit(body: Node, position: Vector2, normal: Vector2, impulse: float)
#
# var _tracked_colliders: Dictionary = {}  # instance_id → true
#
# func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
#     for i in state.get_contact_count():
#         var collider := state.get_contact_collider_object(i)
#         if not collider:
#             continue
#         var id := collider.get_instance_id()
#         if not _tracked_colliders.has(id):
#             _tracked_colliders[id] = true
#             collision_hit.emit(
#                 collider,
#                 state.get_contact_collider_position(i),
#                 state.get_contact_local_normal(i),
#                 state.get_contact_impulse(i)
#             )
#
# func reset_collision_tracking() -> void:
#     _tracked_colliders.clear()  # 在 release_*() 中调用——为下次使用清除已追踪碰撞体

## 在 PhysicsObjectPool 的 acquire_*() / release_*() 中集成:

# acquire_debris():
#   var bound := HitDetection._on_collision_hit.bind(debris, damage_type, source_entity)
#   debris.collision_hit.connect(bound)
#   debris.set_meta("hit_callback", bound)  # 存储绑定 Callable——用于断开连接
#
# release_debris(node):
#   var bound := node.get_meta("hit_callback") as Callable
#   node.collision_hit.disconnect(bound)     # 必须使用相同的绑定 Callable！
#   node.remove_meta("hit_callback")
#   node.reset_collision_tracking()
#   node.collision_layer = 0  # ADR-0003 — 防止 FREE 状态下触发碰撞

# HitDetection._on_collision_hit(body, position, normal, impulse, source, damage_type, source_entity):
#   var hit_data := build_hit_data(body, position, normal, impulse, source, damage_type, source_entity)
#   emit hit_detected(hit_data)

## 方式 2: AOE 区域查询（爆炸/连锁传播/酸液池）
## 使用 PhysicsDirectSpaceState2D.intersect_shape() + exclude_rids 排除发射源
func query_area(center: Vector2, radius: float, layer_mask: int, damage_type: String, source_entity: String, exclude_rids: Array[RID] = []) -> Array[Dictionary]:
    var space_state := get_world_2d().direct_space_state
    var shape := CircleShape2D.new()
    shape.radius = radius
    var params := PhysicsShapeQueryParameters2D.new()
    params.shape = shape
    params.transform = Transform2D(0, center)
    params.collision_mask = layer_mask
    params.exclude = exclude_rids  # 排除发射源自身——防止爆炸波及源物体
    var results: Array[Dictionary] = space_state.intersect_shape(params)
    var hit_data_array: Array[Dictionary] = []
    for result in results:
        var collider := result.get("collider") as Node
        if not collider:
            continue
        hit_data_array.append(build_hit_data(
            collider,
            result.get("position", center),
            Vector2.ZERO,  # AOE 无法线方向
            _estimate_aoe_impulse(center, result.get("position", center), radius, damage_type),
            null,  # AOE 无源对象引用
            damage_type,
            source_entity
        ))
    return hit_data_array

## 方式 3: 射线查询（仅 enemy-ai 视野检测使用）
## 不通过 hit_detected signal —— 直接返回给 enemy-ai 感知系统
func raycast(from: Vector2, to: Vector2, collision_mask: int) -> Dictionary:
    var space_state := get_world_2d().direct_space_state
    var query := PhysicsRayQueryParameters2D.create(from, to)
    query.collision_mask = collision_mask
    return space_state.intersect_ray(query)
```

### 检测方式选择矩阵

| 场景 | 方式 | Godot API | 碰撞数据来源 | 走 hit_detected signal |
|------|------|-----------|-------------|----------------------|
| 子弹命中 | `_integrate_forces` + 自定义 signal | `PhysicsDirectBodyState2D.get_contact_*()` | contact position/normal/impulse — 完整 | 是 |
| 碎片命中 | `_integrate_forces` + 自定义 signal | 同上 | 同上 — 完整 | 是 |
| 爆炸 AOE | Shape query | `PhysicsDirectSpaceState2D.intersect_shape()` + `exclude_rids` | 查询结果 position + 估算 impulse | 是（每个被波及物体一个 HitData） |
| 酸液池 AOE | Shape query | 同上 | 同上 | 是 |
| 敌人视野射线 | Ray query | `PhysicsRayQueryParameters2D.create()` + `intersect_ray()` | intersect_ray 返回值（position, normal, collider） | **否** — 直接返回值，不经 signal |
| Boss 路径检测 | Ray query | 同上 | 同上 — 仅检查是否碰撞 | **否** — 直接返回值 |

> **设计理由 — _integrate_forces 替代 body_entered**: Godot 4.x 的 `RigidBody2D.body_entered(body: Node)` signal 仅提供进入的碰撞体节点引用，不提供碰撞位置、法线或冲量。所有三个字段都是下游系统必需的——health-damage 需要 `impulse` 计算伤害，material-destruction 需要 `hit_normal` 判断倒塌方向，enemy-ai 需要 `hit_point` 计算被击方向。`_integrate_forces(state)` 通过 `state.get_contact_collider_position(idx)`、`state.get_contact_local_normal(idx)` 和 `state.get_contact_impulse(idx)` 提供完整碰撞数据。每个池化 RigidBody2D 覆盖此方法，在检测到新接触时 emit 一个自定义的 `collision_hit(body, position, normal, impulse)` signal。

### HitData 构建流程

```
build_hit_data(hit_body, position, normal, impulse, source_node, damage_type, source_entity) → Dictionary:
  1. 从 Godot 碰撞数据读取:
     - position (来自 _integrate_forces 或 AOE 查询) → hit_point
     - normal (来自 _integrate_forces；AOE 为 Vector2.ZERO) → hit_normal
     - impulse (来自 _integrate_forces；AOE 为估算值) → impulse
  2. 从 hit_body 读取:
     - hit_body (self)                      → hit_object
     - hit_body.collision_layer             → hit_layer
  3. 从 source_node 读取 (若为子弹/碎片；AOE 为 null):
     - source_node (self)                   → source_object
     - source_node.collision_layer          → source_layer
  4. 从调用方传入:
     - damage_type 参数                     → damage_type
     - source_entity 参数                   → source_entity
  5. emit hit_detected(result)
```

### 多命中处理规则

1. **子弹默认 single-hit**: `body_entered` 触发 → 构建 HitData → 发射 `hit_detected` → 子弹回到对象池（release）。子弹不继续飞行——不存在同一子弹的多次命中。

2. **同一帧多物体碰撞**: 碰撞回调按物理引擎顺序触发。每个 `body_entered` 独立处理，各自产生一个 HitData。HitDetection 不合并或丢弃回调——物理引擎保证同一帧内同一对物体只触发一次碰撞。

3. **AOE 多命中**: `query_area()` 返回的每个碰撞体独立产生一个 HitData → 依次 emit `hit_detected`。不按距离排序——chain-propagation 和 health-damage 各自独立判断每个 HitData 的影响。

4. **穿透弹（Alpha 预留）**: 穿透弹在销毁前可产生多个 HitData。HitData 中增加可选字段 `penetration_index: int`（0=首次命中, 1=第二次, ...），供 health-damage 应用伤害衰减。

### 与 ADR-0003（对象池）的集成

- 池对象从 `acquire_*()` 返回时，HitDetection 连接其 `collision_hit` signal（绑定 Callable 存储于 meta 中）
- 池对象 `release_*()` 回收时，通过存储的绑定 Callable 断开连接，调用 `reset_collision_tracking()` 清除已追踪碰撞体
- FREE 状态对象的 `collision_layer = 0`（ADR-0003 固定）→ 不会触发碰撞 → 不会产生误 HitData

```gdscript
# PhysicsObjectPool 中:
func acquire_debris(material_type: String, position: Vector2, velocity: Vector2, damage_type: String, source_entity: String) -> RigidBody2D:
    var debris := _free_debris.pop_back()
    # ... 设置 position, velocity, material ...
    # 连接 collision_hit signal——存储绑定 Callable
    var bound := HitDetection._on_collision_hit.bind(debris, damage_type, source_entity)
    debris.collision_hit.connect(bound)
    debris.set_meta("hit_callback", bound)
    return debris

func release_debris(node: RigidBody2D) -> void:
    # 使用存储的绑定 Callable 断开连接——必须匹配！
    var bound := node.get_meta("hit_callback") as Callable
    node.collision_hit.disconnect(bound)
    node.remove_meta("hit_callback")
    node.reset_collision_tracking()
    node.collision_layer = 0  # ADR-0003 —— FREE 对象不参与碰撞
    # ... reset velocity, freeze, visible ...
    _free_debris.append(node)
```

> **Callable 绑定陷阱**: Godot 4.x 中 `signal.connect(callable.bind(x))` 创建的 Callable 不等于 `signal.disconnect(callable)` 中的原始 Callable——绑定参数是 Callable 标识的一部分。必须存储绑定后的 Callable 引用（通过 `set_meta()`），并在 disconnect 时使用相同的绑定 Callable。

## Alternatives Considered

### Alternative A: 每种碰撞类型独立检测方式——不统一 HitData

- **Description**: 子弹命中走 `body_entered`，AOE 走 `intersect_shape()` 直接返回裸 Array，敌人感知走 raycast 返回 Dictionary。三者互不统一——hit-detection 不定义统一 HitData 结构。
- **Pros**: 实现最简——无抽象层，每个调用方直接使用引擎 API 返回值
- **Cons**: 7 个下游系统需要理解 3 种不同的数据格式；新增第 8 个消费者（如 scoring-system）需要再次适配；health-damage 的 `damage_type` 查表逻辑需要从不同来源推断类型
- **Rejection Reason**: 7 个下游系统共享相同的核心需求（命中点、命中对象、冲量、来源）——统一 HitData 的成本（约 50 行代码）远低于 7 个系统各自适配 3 种格式的维护成本

### Alternative B: 所有碰撞检测通过 Area2D 节点

- **Description**: 子弹和碎片不使用 RigidBody2D 的 `body_entered`——改为附加 Area2D 子节点，使用 `area_entered` / `body_entered` signal 检测碰撞。AOE 也通过大半径 Area2D 实现。
- **Pros**: 统一的 `area_entered` 回调——代码路径一致；Area2D 的 collision_mask 可以在运行时动态调整；不依赖 RigidBody2D 的碰撞回调（碎片 freeze 时回调仍然有效）
- **Cons**: 每个池对象需要额外 Area2D + CollisionShape2D 子节点 → 70 个 RigidBody2D × 1 Area2D = 额外 140 个节点（~1.5MB 内存）；Area2D 检测可能产生重复事件（两个 Area2D 互相进入产生双回调——需要过滤）
- **Rejection Reason**: RigidBody2D 的 `body_entered` 是 GodotPhysics2D 的标准子弹碰撞检测方式——CCD（`CD_MODE_CAST_RAY`）直接与接触回调配合工作。Area2D 不能利用 CCD——高速子弹使用 Area2D 可能穿透。额外 140 个节点在移动端是显著开销。

### Alternative C: PhysicsDirectSpaceState2D 主动查询替代 body_entered

- **Description**: 每帧调用 `PhysicsDirectSpaceState2D.intersect_ray()` 从上一帧位置到当前帧位置检测碰撞，替代 RigidBody2D 的 `body_entered` 回调。
- **Pros**: 完全控制检测时机和顺序；命中距离排序天然得到"最近命中"；不依赖 Godot 碰撞回调的执行顺序
- **Cons**: 每帧 20 颗活跃子弹 × 1 次 raycast = 20 次额外物理查询；需要手动管理"已命中"状态避免同一物体被重复检测；不兼容 CCD——高速子弹需要手动插值
- **Rejection Reason**: RigidBody2D + CCD_MODE_CAST_RAY 已正确处理高速子弹碰撞——GodotPhysics2D 在物理步进中执行 CCD，比手动逐帧 raycast 更精确且不消耗 CPU 额外查询预算。主动 raycast 重新发明了引擎已有的功能。

## Consequences

### Positive
- 统一的 HitData 格式——7 个下游系统消费同一结构，新增消费者只需连接 `hit_detected` signal
- `damage_type` 和 `source_entity` 字段解决了 health-damage 和 boss-ai 的类型判断需求——不再需要从 source_layer 反推
- 集中式 signal 分发使碰撞路径可追踪——调试时可在一个位置断点观察所有命中事件
- 射线查询（enemy-ai 视野检测）不远走 hit_detected signal——避免 0.2s 频率的感知检查污染战斗命中日志
- 对象池集成清晰——`acquire` 时连接 signal，`release` 时断开——signal 连接数与活跃 RigidBody2D 一致，无泄漏

### Negative
- `body_entered` signal 的 connect/disconnect 需要 PhysicsObjectPool 配合——增加了池和检测系统之间的耦合
- HitData 是 Dictionary（非类型化）——GDScript 4.6 的 `Dictionary` 无编译时字段检查。字段名拼写错误在运行时才暴露
- AOE `intersect_shape()` 的对象数量在 Boss 房间可能达到 50+ ——每个 HitData 单独 emit signal，在极端情况下可能触发 50 次 `hit_detected` 回调

### Risks
- **`_integrate_forces` 回调在物理步进中执行**: 如果 `hit_detected` 的回调中修改物理状态（如 `apply_impulse`），可能触发 Godot 物理服务器的重入问题。缓解：所有 `hit_detected` 回调中使用 `call_deferred()` 延迟物理状态修改到下一帧
- **`_tracked_colliders` 内存泄露**: 如果池对象长时间 ACTIVE 但不调用 `reset_collision_tracking()`，追踪字典会无限增长。缓解：`release_*()` 中强制调用 `reset_collision_tracking()`；ACTIVE 对象定期清理无效 collider ID（每 30s 检查 `is_instance_valid()`）
- **AOE 查询在 `_process` 中调用**: `PhysicsDirectSpaceState2D` 的查询依赖当前物理状态——必须在 `_physics_process` 中调用，否则可能读到不一致的碰撞体位置。缓解：`query_area()` 内部检查调用上下文，非物理帧时使用 `push_warning()`
- **HitData Dictionary 无类型安全**: 缓解——编写 `build_hit_data()` 工厂函数作为唯一 HitData 构建入口，CI 中添加单元测试验证工厂函数输出 9 字段完整性和类型正确性
- **大量 AOE HitData 在同一帧 emit**: Boss 房间 DOWNED 阶段 Doom Pulse 全屏冲击波可能波及 30+ 物体 → 30 次 signal emit + 回调。缓解：`query_area()` 使用 `call_deferred()` 批量发射（在下一帧开始时按组 emit），避免阻塞当前物理帧
- **`_integrate_forces` 覆盖需在所有池对象脚本中实现**: 70 个池化 RigidBody2D 共享同一脚本——修改 `_integrate_forces` 逻辑影响全部对象。缓解：脚本在对象池初始化时通过 `GDScript.new()` 统一创建并分配

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| hit-detection.md | AC1: Projectile 命中 Enemy → 产生 HitData + emit hit_detected | `body_entered` signal → `build_hit_data()` → `emit hit_detected` |
| hit-detection.md | AC4: 单帧多碰撞按距离排序取最近 | 子弹默认 single-hit——首个 `body_entered` 触发后子弹销毁，天然保证"最近命中" |
| hit-detection.md | AC6: AOE 查询返回范围内所有物体 | `query_area()` → `intersect_shape()` → 每个物体独立 HitData |
| hit-detection.md | AC10: 下游系统通过 signal 获取 HitData | `hit_detected` signal 统一分发——下游不直接访问 Godot 碰撞回调 |
| health-damage.md | §2 伤害类型系数表（bullet=0.20, explosion=0.15 等） | HitData.damage_type → health-damage 据此查表 type_factor |
| health-damage.md | AC6-AC9: 不同 damage_type 产生不同 final_damage | `damage_type` 字段使此逻辑可直接实现 |
| boss-ai.md | §5 子弹伤害分离规则: bullet dtc_effective=0.0 | HitData 携带 `damage_type="bullet"` + `source_entity="player"` → boss-ai 可精确识别玩家子弹并应用 Pillar 4 规则 |
| shooting-projectile.md | §5 hit-stop 仅对 player 子弹触发 | HitData.source_entity="player" → camera-system 据此判断是否触发 hit-stop |
| shooting-projectile.md | §4 敌人子弹对 Enemy 层关闭碰撞 | ADR 确认碰撞矩阵规则——不在 HitDetection 层处理，由 physics-config 碰撞矩阵保证 |

## Performance Implications
- **CPU**: `body_entered` → `build_hit_data()` → `emit hit_detected`: <0.01ms（Dictionary 构建 + signal emit）。峰值: 20 颗活跃子弹 + 30 碎片 AOE = 50 次/帧 → <0.5ms 总开销
- **Memory**: HitData Dictionary 在 signal emit 后由消费者持有或丢弃——GC 友好。无持续内存开销
- **Load Time**: N/A（HitDetection 无预分配需求——不创建节点）
- **Network**: N/A

## Migration Plan
本项目尚无代码——此为初始架构决策。实施步骤:
1. HitDetection Autoload 实现 `build_hit_data()`、`_on_pooled_body_entered()`、`query_area()`、`raycast()`
2. PhysicsObjectPool 的 `acquire_*()` / `release_*()` 中集成 signal connect/disconnect
3. 7 个下游 Autoload 在 `_ready()` 中连接 `HitDetection.hit_detected`
4. health-damage 实现 `type_factor` 查表（基于 `damage_type`）
5. boss-ai 实现 Pillar 4 子弹过滤（`damage_type=="bullet"` → dtc_effective=0.0）
6. shooting-projectile 实现 hit-stop 条件触发（`source_entity=="player"`）
7. 集成测试: 子弹命中 Enemy → 验证 HitData 全部 9 字段完整 → 验证 health-damage 收到 `hit_detected` → 验证 final_damage 正确

## Validation Criteria
- 子弹命中敌人 → `hit_detected` signal 发射，HitData.damage_type="bullet", HitData.source_entity="player"
- 爆炸 AOE → `query_area()` 返回 N 个 HitData，每个 damage_type="explosion"
- health-damage 根据 `damage_type` 正确查表 type_factor（bullet=0.20, explosion=0.15, fragment=0.25, crush=0.30）
- boss-ai Pillar 4 规则: `damage_type=="bullet"` → dtc_effective=0.0（Bullet 不扣减 BossTotalHP）
- camera-system hit-stop: `source_entity=="player"` → 触发 hit_stop(); `source_entity=="enemy"` → 不触发
- 20 颗活跃子弹 × 30 碎片 AOE = 50 次 `hit_detected` → 帧时间增长 <0.5ms
- 对象池 release 后 → 该对象的 `body_entered` 不再触发 `hit_detected`（signal 已断开 + collision_layer=0）

## Implementation Notes (from Engine Specialist Review)

以下内容来自 `godot-specialist` 验证（2026-05-22），已应用于 ADR 修复：

1. **`body_entered` 不提供碰撞数据（BLOCKING — 已修复）**: Godot 4.x 的 `RigidBody2D.body_entered(body: Node)` signal 仅传递碰撞体节点引用，不传递位置、法线或冲量。这些字段仅在 `_integrate_forces(state: PhysicsDirectBodyState2D)` 中通过 `state.get_contact_*()` 方法可用。ADR 已改为使用 `_integrate_forces` + 自定义 `collision_hit` signal 替代 `body_entered`。

2. **Callable 绑定导致 disconnect 失败（BLOCKING — 已修复）**: Godot 4.x 中 `signal.connect(callable.bind(x))` 创建的绑定 Callable 与 `signal.disconnect(callable)` 中的原始 Callable 不相等——绑定参数是 Callable 标识的一部分。必须通过 `set_meta()` 存储绑定 Callable 引用，并在 disconnect 时使用同一引用。ADR 的代码示例已更新。

3. **AOE `intersect_shape()` 缺少自身排除（BLOCKING — 已修复）**: `PhysicsDirectSpaceState2D.intersect_shape()` 默认返回范围内所有碰撞体，包括调用者自身。`PhysicsShapeQueryParameters2D.exclude` 参数（`Array[RID]`）用于过滤特定碰撞体。ADR 的 `query_area()` 函数签名已添加 `exclude_rids` 参数。

4. **AOE 查询线程上下文**: `intersect_shape()` 依赖当前物理状态——必须在 `_physics_process` 中调用。`query_area()` 应使用 `Engine.get_process_physics_step()` 做运行时断言。

5. **HitData Dictionary vs 类型化 Resource**: 当前选择 Dictionary 是正确的——9 字段 × 50 次命中/帧的轻量级结构。若未来需要编译时类型检查，可迁移至 `class_name HitData extends Resource`，构造开销 <5μs/次。

6. **CCD 速度边界**: `CCD_MODE_CAST_RAY` 减少但未消除高速子弹穿透。在 2000px/s 子弹速度 × 60fps = 33px/帧位移 × 最小碰撞体 10px 厚度 → CCD 覆盖此范围。仅在子弹速度 >4000px/s 时需额外注意。

## Related Decisions
- ADR-0001: Autoload + Direct Signal 架构（HitDetection 作为 Autoload，`hit_detected` signal 分发的前提）
- ADR-0003: 物理对象池（池化 RigidBody2D 的 `collision_hit` signal 集成 + Callable 绑定管理）
- ADR-0005: 材质破坏管线（消费 HitData 判断破坏阈值）
- ADR-0006: 连锁传播递归（AOE `query_area()` 的使用方 + `exclude_rids` 确保自身不参与连锁）
- ADR-0007: 子弹生命周期（子弹命中后通过 HitData 触发销毁/回收）
