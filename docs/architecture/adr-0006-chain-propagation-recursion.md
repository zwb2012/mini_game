# ADR-0006: 连锁传播递归架构

## Status
Accepted

## Date
2026-05-22

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Godot 4.6 |
| **Domain** | Core |
| **Knowledge Risk** | LOW — 连锁传播是纯 GDScript 逻辑：消费 signal、调用 query_area()、迭代队列处理。不涉及新 Godot API。2D 物理在 4.4-4.6 无变更 |
| **References Consulted** | `docs/engine-reference/godot/VERSION.md`, `docs/engine-reference/godot/modules/physics.md`, `docs/engine-reference/godot/breaking-changes.md`, `docs/engine-reference/godot/deprecated-apis.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | 20 步连锁的 query_area() 总耗时（最坏情况 20 × 10 objects = 200 次 shape query/帧）；VISUAL_PLAYBACK 期间收到新破坏事件时的 pending 队列行为 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Autoload + Direct Signal) — ChainPropagation 作为 Autoload 运行；ADR-0004 (命中检测) — 消费 hit_detected signal + 调用 query_area() API；ADR-0005 (材质破坏管线) — 消费 object_destroyed signal 作为连锁入口 |
| **Enables** | ADR-0009 (Boss 身体部件) — Boss 部件破坏触发连锁传播；ADR-0010 (评分结算) — 消费 chain_ended signal 的 ChainSummary |
| **Blocks** | Chain Propagation Epic — 必须先确定两阶段处理模型才能实现连锁传播 |
| **Ordering Note** | 必须在 ADR-0004 和 ADR-0005 之后实现——依赖其 signal 契约和 query_area() API |

## Context

### Problem Statement

连锁传播是坍塌禁区 Pillar 2（多米诺战场）的物理收束环节。当 MaterialDestruction 报告物体被破坏，ChainPropagation 必须查询破坏位置周围的物理要素，计算传播力和距离衰减，施加二次冲击，并追踪连锁深度。

核心架构问题：

1. **递归处理模型**: 一次破坏触发二次破坏、二次破坏触发三次破坏——如何安全地处理这个递归链？GDScript 信号处理是同步的——如果在 `object_destroyed` 信号回调中直接触发新的破坏，会导致深度 20 的递归调用栈。如何在不爆栈的前提下完成全部物理判定？

2. **物理确定性 vs 视觉观赏性**: GDD 的 Player Fantasy 要求"看连锁展开才是回报"——多米诺骨牌一步步倒塌的节奏感是核心体验。但如果物理判定也逐帧延迟，会导致帧间物理状态不一致（同帧内其他系统可能读取到中间态）。

3. **去重与安全**: 同一次连锁中同一物体可能被多个传播波前命中（两个碎片从不同方向飞来）。连锁深度达到 max_chain_depth=20 时如何优雅终止？COOLDOWN 期间的新破坏事件如何处理？

4. **两阶段生命周期**: 物理判定结束后连锁结果已确定，但视觉播放仍需 0.5-1s 完成——在此期间收到的新破坏事件不应与当前视觉播放混淆。

### Constraints

- Godot 4.6 + GodotPhysics2D — 2D 物理 API 稳定
- 所有系统间通信走 Signal（ADR-0001）
- query_area() 必须在 `_physics_process` 中调用（ADR-0004 约束）
- max_chain_depth=20（GDD 硬上限）
- propagation_cooldown=0.1s（GDD 配置）
- 移动端 60fps — Phase 1 物理判定必须在单帧内完成，Phase 2 视觉播放不阻塞帧

### Requirements

- Phase 1 物理判定同帧完成——保证物理确定性，不产生中间态
- Phase 2 视觉反馈逐帧分布——每 2-3 帧播放一个传播步骤
- 迭代队列而非递归调用——避免 GDScript 调用栈溢出
- 去重机制——同一物体在同次连锁中只处理一次
- COOLDOWN + pending 队列——连锁间不重叠，不丢失事件
- ChainSummary 输出——连锁终止时向评分系统提供完整数据

## Decision

**采用混合两阶段模型——Phase 1 物理判定同帧迭代队列处理，Phase 2 视觉事件逐帧分布播放。**

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                 ChainPropagation (Autoload)                       │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Phase 1 — 物理判定 (_physics_process, 同帧完成)              │ │
│  │                                                               │ │
│  │ object_destroyed 到达                                         │ │
│  │   │                                                           │ │
│  │   ├─ IDLE → PROPAGATING                                      │ │
│  │   ├─ Push initial event → _propagation_queue                 │ │
│  │   │                                                           │ │
│  │   └─ while queue not empty AND depth < max_depth(20):        │ │
│  │        ├─ Pop event {type, position, material, F_source}     │ │
│  │        ├─ query_area(position, radius, layer_mask)           │ │
│  │        ├─ For each hit (dedup via _processed_in_chain):      │ │
│  │        │    ├─ F_received = F_source × C_type ×              │ │
│  │        │    │              DepthMult(depth) × Attn_dist(d,r) │ │
│  │        │    ├─ PhysicsObject → apply_impulse(F_received)     │ │
│  │        │    ├─ Enemy → emit hit_detected(HitData)            │ │
│  │        │    └─ 若触发破坏 → push new event to queue           │ │
│  │        ├─ Record VisualEvent {pos, type, depth, count}       │ │
│  │        └─ depth += 1                                          │ │
│  │                                                               │ │
│  │ 全部物理判定完成 → State → VISUAL_PLAYBACK                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Phase 2 — 视觉播放 (_process, 逐帧分布)                      │ │
│  │                                                               │ │
│  │ _visual_queue 已填充 N 个 VisualEvent                         │ │
│  │                                                               │ │
│  │ 每 2-3 帧 (≈30-50ms/step):                                   │ │
│  │   ├─ Pop VisualEvent                                          │ │
│  │   ├─ emit chain_step_processed(step_data)                    │ │
│  │   │    ├─ CameraSystem.shake(intensity, 0.15s)               │ │
│  │   │    ├─ 冲击波环视觉 (圆形 Polygon2D + alpha 衰减)          │ │
│  │   │    └─ HUD 更新 "Chain ×N"                                 │ │
│  │   └─ if depth ∈ {3,5,10,15} → emit chain_depth_milestone    │ │
│  │                                                               │ │
│  │ Visual queue 空:                                              │ │
│  │   ├─ emit chain_ended(ChainSummary)                          │ │
│  │   ├─ State → COOLDOWN (0.1s)                                 │ │
│  │   └─ COOLDOWN 结束 → IDLE (若 pending 非空则立即处理)        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

上游 Signals:                      下游 Signals:
  MaterialDestruction                chain_step_processed → CameraSystem, HUD, Audio
  .object_destroyed                  chain_depth_milestone → HUD, Audio
  ──────────────────►               chain_ended → Scoring, HUD
  Shooting/Projectile                chain_started → HUD
  .trigger_explosion
```

### Key Interfaces

```gdscript
# ChainPropagation Autoload (Core Layer)
extends Node

# ── State Machine ──

enum State {
    IDLE,              # 等待触发
    PROPAGATING,       # Phase 1 — 物理判定进行中（1 帧）
    VISUAL_PLAYBACK,   # Phase 2 — 视觉事件逐帧播放（N × 30-50ms）
    COOLDOWN           # 连锁结束后冷却（0.1s），阻止立即重复触发
}

var _state: State = State.IDLE
var _propagation_queue: Array[Dictionary] = []   # Phase 1 队列
var _visual_queue: Array[Dictionary] = []         # Phase 2 队列
var _pending_queue: Array[Dictionary] = []        # COOLDOWN/VISUAL_PLAYBACK 期间缓存
var _processed_in_chain: Dictionary = {}           # instance_id → bool 去重集
var _chain_depth: int = 0
var _total_destroyed: int = 0
var _total_damage: float = 0.0
var _trigger_weapon: String = ""
var _visual_timer: int = 0  # 帧计数器——控制 Phase 2 播放节奏

# ── Signals ──

## 连锁开始（HUD 显示连锁 UI）
signal chain_started(trigger_weapon: String, origin: Vector2)

## 单个传播步骤的视觉事件（Phase 2 逐帧消费）
## step_data: {position: Vector2, propagation_type: String, depth: int, affected_count: int}
signal chain_step_processed(step_data: Dictionary)

## 连锁深度达到里程碑（3/5/10/15 步）
signal chain_depth_milestone(depth: int)

## 连锁终止——传递完整 ChainSummary 给评分系统
## summary: {chain_depth: int, total_destroyed: int, total_damage: float,
##           trigger_weapon: String, terminated_by_depth_limit: bool}
signal chain_ended(summary: Dictionary)

# ── 核心方法 ──

## 入口 1: 连接 MaterialDestruction.object_destroyed signal
func _ready() -> void:
    MaterialDestruction.object_destroyed.connect(_on_object_destroyed)
    # 入口 2: trigger_explosion 由 Shooting/Projectile 直接调用

## 入口 1: 物体破坏 → 连锁传播
func _on_object_destroyed(position: Vector2, material: String, debris_list: Array) -> void:
    if _state != State.IDLE:
        _enqueue_pending({
            "type": _propagation_type_for_material(material),
            "position": position,
            "material": material,
            "debris_list": debris_list
        })
        return
    
    var config := _get_propagation_config(material)
    _start_chain(config["type"], position, material, _calc_f_source(material, null))

## 入口 2: 粘弹引爆 → 直接 AOE 传播
func trigger_explosion(position: Vector2, radius: float, force: float) -> void:
    if _state != State.IDLE:
        _enqueue_pending({"type": "explosion", "position": position, "radius_override": radius, "force_override": force})
        return
    
    _start_chain("explosion", position, "", force, radius)

# ── Phase 1: 物理判定（同帧完成）──

func _start_chain(type: String, position: Vector2, material: String, f_source: float, radius_override: float = 0.0) -> void:
    _state = State.PROPAGATING
    _chain_depth = 0
    _total_destroyed = 0
    _total_damage = 0.0
    _processed_in_chain.clear()
    _propagation_queue.clear()
    _visual_queue.clear()
    
    chain_started.emit(_trigger_weapon, position)
    
    _propagation_queue.push_back({
        "type": type,
        "position": position,
        "f_source": f_source,
        "radius_override": radius_override,
        "depth": 0
    })
    
    _process_propagation_queue()

func _process_propagation_queue() -> void:
    while not _propagation_queue.is_empty() and _chain_depth < MAX_CHAIN_DEPTH:
        var event: Dictionary = _propagation_queue.pop_front()
        var depth := event["depth"] as int
        
        var radius: float = event.get("radius_override", _get_radius(event["type"]))
        var layer_mask := LAYER_PHYSICS_OBJECT | LAYER_ENEMY
        
        # 构建 exclude_rids——排除已处理的物体
        var exclude_rids: Array[RID] = []
        for id in _processed_in_chain:
            var obj := instance_from_id(id) if is_instance_id_valid(id) else null
            if obj and obj is PhysicsBody2D:
                exclude_rids.append(obj.get_rid())
        
        # AOE 查询
        var hits: Array[Dictionary] = HitDetection.query_area(
            event["position"], radius, layer_mask,
            "explosion" if event["type"] == "explosion" else "fragment",
            "environment", exclude_rids
        )
        
        var affected_count := 0
        for hit in hits:
            var obj: Node = hit.get("hit_object")
            if not obj or not is_instance_valid(obj):
                continue
            
            var id := obj.get_instance_id()
            if _processed_in_chain.has(id):
                continue  # 去重——已在此链中处理
            _processed_in_chain[id] = true
            
            # 距离衰减计算
            var distance := event["position"].distance_to(hit.get("hit_point", event["position"]))
            var attn := _calc_attenuation(distance, radius, event["type"])
            var depth_mult := _calc_depth_mult(depth + 1)
            var f_received := event["f_source"] * _get_efficiency(event["type"]) * attn * depth_mult
            
            if f_received <= 0:
                continue
            
            affected_count += 1
            _total_damage += f_received
            
            # 对 PhysicsObject 施加冲击力
            if hit.get("hit_layer") == LAYER_PHYSICS_OBJECT:
                if obj is RigidBody2D:
                    var dir := (obj.global_position - event["position"]).normalized()
                    obj.apply_impulse(dir * f_received, obj.global_position - event["position"])
                    _total_destroyed += 1
                    # 注: 若此 impulse 触发破坏，MaterialDestruction 会 emit object_destroyed
                    # 但 ChainPropagation 处于 PROPAGATING 状态 → 进入 _pending_queue
                    # 而非直接递归——避免调用栈溢出
            
            # 对 Enemy 生成 HitData——通过 HitDetection.build_hit_data() 统一构建
            # 注: 连锁传播不直接 emit hit_detected——通过 HitDetection 的工厂方法确保
            # HitData 的 9 字段完整性和一致性。若未来 HitDetection 增加验证/过滤逻辑，
            # 此路径不会绕过。
            elif hit.get("hit_layer") == LAYER_ENEMY:
                var chain_hit_data := HitDetection.build_hit_data(
                    obj, hit.get("hit_point", event["position"]),
                    (obj.global_position - event["position"]).normalized(),
                    f_received, null,
                    "explosion" if event["type"] == "explosion" else "fragment",
                    "environment"
                )
                HitDetection.hit_detected.emit(chain_hit_data)
                    "hit_layer": LAYER_ENEMY,
                    "impulse": f_received,
                    "source_object": null,
                    "source_layer": 0,
                    "damage_type": "explosion" if event["type"] == "explosion" else "fragment",
                    "source_entity": "environment"
                })
        
        # 记录 VisualEvent
        _visual_queue.push_back({
            "position": event["position"],
            "propagation_type": event["type"],
            "depth": depth + 1,
            "affected_count": affected_count
        })
        
        _chain_depth = depth + 1
        
        # 里程碑检查
        if _chain_depth in [3, 5, 10, 15]:
            chain_depth_milestone.emit(_chain_depth)
    
    # Phase 1 完成 → 进入 Phase 2
    _state = State.VISUAL_PLAYBACK
    _visual_timer = 0

# ── Phase 2: 视觉播放（逐帧分布）──

func _process(_delta: float) -> void:
    if _state != State.VISUAL_PLAYBACK:
        return
    
    _visual_timer += 1
    if _visual_timer < VISUAL_STEP_INTERVAL:  # 默认 2-3 帧
        return
    _visual_timer = 0
    
    if _visual_queue.is_empty():
        _finish_chain()
        return
    
    var step: Dictionary = _visual_queue.pop_front()
    chain_step_processed.emit(step)

func _finish_chain() -> void:
    var summary := {
        "chain_depth": _chain_depth,
        "total_destroyed": _total_destroyed,
        "total_damage": _total_damage,
        "trigger_weapon": _trigger_weapon,
        "terminated_by_depth_limit": _chain_depth >= MAX_CHAIN_DEPTH
    }
    chain_ended.emit(summary)
    
    _state = State.COOLDOWN
    await get_tree().create_timer(PROPAGATION_COOLDOWN).timeout  # 0.1s
    _state = State.IDLE
    
    # 处理 pending 队列
    if not _pending_queue.is_empty():
        var next_event := _pending_queue.pop_front()
        if next_event.has("force_override"):
            trigger_explosion(next_event["position"], next_event["radius_override"], next_event["force_override"])
        else:
            _on_object_destroyed(next_event["position"], next_event["material"], next_event.get("debris_list", []))

# ── 公式实现 ──

func _calc_f_source(material: String, hit_data_impulse: float) -> float:
    var threshold := _material_config[material]["threshold"] as float
    var impulse := hit_data_impulse if hit_data_impulse > 0 else threshold  # 默认: 刚好阈值
    return threshold + max(0.0, impulse - threshold) * OVERKILL_COEFFICIENT  # 0.25

func _calc_attenuation(distance: float, radius: float, type: String) -> float:
    if distance >= radius:
        return 0.0
    var exp := _propagation_params[type]["exp"] as float
    return 1.0 - pow(distance / radius, exp)

func _calc_depth_mult(depth: int) -> float:
    if depth >= MAX_CHAIN_DEPTH:
        return 0.0
    return 1.0 - pow(float(depth) / float(MAX_CHAIN_DEPTH), 2.0)

# ── 配置常量 ──

const MAX_CHAIN_DEPTH := 20
const PROPAGATION_COOLDOWN := 0.1
const VISUAL_STEP_INTERVAL := 3  # 帧数——每 3 帧播放一个视觉步骤
const OVERKILL_COEFFICIENT := 0.25
const PENDING_QUEUE_MAX := 5

const LAYER_PHYSICS_OBJECT := 5  # ADR-0004
const LAYER_ENEMY := 2           # ADR-0004

var _propagation_params := {
    "debris":    {"radius": 100, "efficiency": 0.85, "exp": 3.0},
    "explosion": {"radius": 250, "efficiency": 0.70, "exp": 1.5},
    "collapse":  {"radius": 200, "efficiency": 1.00, "exp": 1.0},
}

# ── Pending 队列 ──

func _enqueue_pending(event: Dictionary) -> void:
    if _pending_queue.size() >= PENDING_QUEUE_MAX:
        _pending_queue.pop_front()  # 丢弃最早事件
    _pending_queue.push_back(event)

# ── 材质→传播类型映射 ──

func _propagation_type_for_material(material: String) -> String:
    match material:
        "wood", "organic":
            return "debris"
        "metal", "concrete", "composite":
            return "collapse"
        _:
            return "debris"
```

### 两阶段生命周期

```
     IDLE
      │
      │ object_destroyed / trigger_explosion
      ▼
  PROPAGATING  ◄── 1 帧 ── 物理判定全部完成
      │              • _propagation_queue 迭代处理
      │              • query_area() × N
      │              • apply_impulse / emit hit_detected
      │              • _visual_queue 填充完毕
      ▼
  VISUAL_PLAYBACK  ◄── N × 30-50ms ── 视觉逐帧播放
      │              • chain_step_processed 每 3 帧一次
      │              • CameraSystem.shake()
      │              • HUD "Chain ×N"
      │              • 冲击波环粒子
      ▼
  COOLDOWN  ◄── 0.1s ── 连锁间冷却
      │              • pending 队列积累新事件
      │
      ▼
     IDLE  (若 pending 非空 → 立即处理下一个事件)
```

### 为什么不是纯递归信号链

GDScript 的 signal handler 是同步执行的。如果 `object_destroyed` → chain propagation → apply_impulse → 触发新破坏 → `object_destroyed` → chain propagation → ...，在深度 20 的链中会产生 20 层嵌套 signal 调用栈。每一层都包含 `query_area()` 和 Dictionary 操作——在移动端可能导致帧超时。

迭代队列方案将递归展开为 while 循环，所有物理判定在同一个 `_physics_process` 调用栈帧中完成。`_processed_in_chain` 去重集防止同一物体被多次处理。`_propagation_queue` 的 FIFO 顺序保证了广度优先的传播——符合物理直觉（从爆炸中心向外扩散）。

在 PROPAGATING 状态期间触发的二次破坏事件进入 `_pending_queue`——不打断当前链的物理判定。待 VISUAL_PLAYBACK + COOLDOWN 完成后依次出队处理。

### PROPAGATING 期间的二次破坏处理

二次破坏根据命中目标类型走两条不同的路径：

**Enemy 路径（同步——同帧 pending）**:
```
hit_detected.emit(HitData)  [ChainPropagation → HitDetection signal]
  → MaterialDestruction 不处理 Enemy 层 (hit_layer≠5, _on_hit 直接 return)
  → HealthDamage 处理 Enemy 伤害——不产生 object_destroyed
  → 无二次破坏风险
```

**PhysicsObject 路径（异步——跨帧 pending）**:
```
RigidBody2D.apply_impulse()  [Godot Physics 2D——冲量排队]
  → 冲量在当前物理步进中不结算——apply_impulse() 立即返回
  → 下一次物理步进中: 物体移动 → 碰撞检测 → _integrate_forces → collision_hit
  → HitDetection → hit_detected → MaterialDestruction._on_hit()
  → 若超过阈值 → object_destroyed.emit()
  → ChainPropagation._on_object_destroyed()
  → State != IDLE? → _enqueue_pending()  ← 入 pending 队列，不递归
```

**关键架构事实**: Godot Physics 2D 的 `apply_impulse()` 是延迟的——冲量在**下一次**物理步进中才被结算。这意味着 PhysicsObject 的级联破坏**天然跨帧**。Phase 1 的"同帧完成"承诺仅适用于 `query_area()` 的即时 AOE 查询结果——不适用于 `apply_impulse()` 触发的物理级联。

这确保了：
1. Phase 1 的 AOE 查询不产生嵌套 signal 调用栈（Enemy 不触发二次破坏，PhysicsObject 的冲量延迟结算）
2. Pending 队列在所有非 IDLE 状态下正确缓存级联事件——不丢失也不重叠
3. PhysicsObject 级联破坏作为独立的新连锁在 VISUAL_PLAYBACK + COOLDOWN 后处理

### 与 ADR-0004（命中检测）的集成

- `query_area()` 由 HitDetection Autoload 提供——ChainPropagation 不直接使用 `PhysicsDirectSpaceState2D`
- `exclude_rids` 参数排除 `_processed_in_chain` 中的物体——防止已处理物体被重复命中
- 对 Enemy 的传播伤害通过 `hit_detected` signal 发送（走标准 HitData 路径）

### 与 ADR-0005（材质破坏）的集成

- 监听 `object_destroyed(position, material, debris_list)` signal——不读取 material 内部状态
- 材质→传播类型映射内部维护（wood/organic→debris, metal/concrete/composite→collapse）
- 不对 `accumulated_damage` 做任何假设——仅通过 `apply_impulse()` 施加力，破坏判定由 MaterialDestruction 独立完成

## Alternatives Considered

### Alternative A: 纯同步递归信号链

- **Description**: `object_destroyed` → 直接调用 `_on_object_destroyed` → query_area → apply_impulse → 若触发新破坏 → 立即递归。State machine 仅为 IDLE → PROPAGATING → COOLDOWN，无 VISUAL_PLAYBACK 阶段。
- **Pros**: 实现最简单——不超过 150 行代码；无需 pending 队列、无需两阶段管理
- **Cons**: 深度 20 的嵌套 signal 调用栈在 GDScript 中风险高（每层约 0.1-0.5ms query_area + Dictionary 操作）；物理判定和视觉反馈混在一起——玩家看到的是瞬间全部碎裂（无多米诺节奏感）；GDD 的"观看连锁展开"Player Fantasy 无法满足
- **Rejection Reason**: GDScript 无尾递归优化——20 层嵌套调用 + 每层 AOE 查询的帧时间不可控。更重要的是，瞬间完成所有破坏违背了 Pillar 2（多米诺骨牌阵列）的核心体验——"看连锁展开才是回报"。

### Alternative B: 纯逐帧分布（物理和视觉都逐帧）

- **Description**: 每帧仅处理一个传播步骤——包括物理判定。State machine 每帧在 PROPAGATING 状态弹出队列中的一个事件，执行一次 query_area，施加一次冲击力，然后 yield 到下一帧。
- **Pros**: 最符合"多米诺骨牌一步步倒塌"的视觉节奏——不需要额外的视觉播放层；每帧计算量恒定（一次 query_area），帧预算完全可控
- **Cons**: 物理判定延迟——步骤 1 的破坏在帧 N，步骤 2 的碎片飞行在帧 N+1 以上。在深度 10 的链中，最后一步的破坏可能在 10 帧后（~166ms）才计算——此时步骤 1 的碎片可能已飞出查询范围。帧间物理状态不一致——同帧内其他系统（如 health-damage）可能只看到部分传播结果
- **Rejection Reason**: 物理判定的逐帧延迟导致传播结果取决于帧率——60fps 和 30fps 设备上连锁结果可能不同。这是确定性游戏逻辑的基本要求——相同输入必须产生相同输出，与帧率无关。

### Alternative C: Area2D 节点替代 query_area()

- **Description**: 在破坏位置动态创建 Area2D 节点，利用 Godot 的 `body_entered`/`area_entered` signal 检测传播范围内的物体，替代 `PhysicsDirectSpaceState2D.intersect_shape()` 查询。
- **Pros**: Area2D 的信号驱动方式与 Godot 节点系统一致；可以利用 Area2D 的 collision_mask 过滤——无需手动 layer_mask
- **Cons**: 动态创建/销毁 Area2D 节点（每个传播步骤一个）增加节点树开销；Area2D 的检测结果在物理步进后才可用——不保证在同一 `_physics_process` 帧内获取结果；深度 20 的链需要 20 个 Area2D 的创建和销毁——额外约 40KB 内存分配
- **Rejection Reason**: ADR-0004 已选定 `intersect_shape()` 作为 AOE 查询的统一 API——连锁传播应复用相同的 API 而非引入新的检测方式。Area2D 的异步检测特性与 Phase 1 同帧完成的需求冲突。

## Consequences

### Positive
- 物理确定性——Phase 1 所有判定同帧完成，结果与帧率无关。60fps 和 30fps 设备上连锁结果一致
- 视觉节奏感——Phase 2 逐帧播放冲击波环，深度 5 链视觉展开约 250ms，深度 10 链约 500ms——完美匹配"多米诺骨牌一步步倒塌"的 Player Fantasy
- 无递归调用栈风险——迭代队列替代嵌套 signal 回调，GDScript 调用栈深度恒定
- 去重安全——`_processed_in_chain` 集保证同一物体在同次连锁中仅处理一次
- Pending 队列防止事件丢失——VISUAL_PLAYBACK + COOLDOWN 期间的新破坏事件缓存后在下一空闲周期处理
- 与已有 ADR 完全兼容——消费 ADR-0004 的 query_area() + hit_detected，消费 ADR-0005 的 object_destroyed，遵循 ADR-0001 的 Signal-First 通信

### Negative
- 两阶段增加了状态机复杂度——4 状态（vs Alternative A 的 3 状态）
- VISUAL_PLAYBACK 期间物理结果已确定但视觉仍在播放——玩家可能在此期间的 0.5s 内继续射击并触发新破坏。新破坏进入 pending 队列——实际延迟为 VISUAL_PLAYBACK 剩余时间 + COOLDOWN 0.1s，最多约 1.1s
- ChainPropagation 内部维护 5 个数据结构（_propagation_queue, _visual_queue, _pending_queue, _processed_in_chain, _propagation_params）——状态管理比单一递归函数复杂
- `_propagation_type_for_material()` 映射表硬编码了材质→传播类型的对应关系——新增材质类型时需要修改代码（但 5 种 MVP 材质已覆盖）

### Risks
- **Phase 1 同帧 query_area() 峰值**: 深度 20 × 每步 10 objects = 200 次 shape query 结果处理。缓解：max_chain_depth=20 是理论上限，实际游戏中深度 20 的连锁极罕见（需要精心布置的物理布局）。正常游戏场景深度 3-8 步，约 30-80 次命中处理——<1ms
- **VISUAL_PLAYBACK 期间玩家射击新物体触发破坏**: 新破坏进入 pending 队列，最多延迟约 1.1s 才处理。在此期间玩家看不到新连锁的视觉反馈——可能感到"我开枪了为什么没反应"。缓解：VISUAL_PLAYBACK 期间 HUD 显示"Chain ×N"持续可见——暗示连锁仍在进行中；pending 队列达到上限（5 个）时丢弃最早事件——确保不过度堆积
- **COOLDOWN 0.1s 的 `await create_timer` 在场景切换时**: `SceneTree.create_timer()` 创建的 SceneTreeTimer 作为 SceneTree 内部子节点存在——`change_scene_to_file()` 卸载当前场景时不会释放此计时器。计时器正常触发，但 `await` 之后的代码可能在场景过渡中间态执行（新旧场景交替中）。缓解：SceneManager.room_active signal 处理中强制 `_state = State.IDLE` 并清空所有队列——使 `await` 之后的 pending 处理成为安全的 no-op
- **`_processed_in_chain` 的 instance_id 复用**: 同帧内物体被 queue_free 后 instance_id 可能被 Godot 复用。缓解：Phase 1 同帧完成——queue_free 在帧末执行，不会在同帧内造成 ID 复用
- **爆炸传播覆盖 30+ 物体**: 大半径爆炸（250px）在密集房间中可能命中大量物体。缓解：exclude_rids 过滤 + query_area() 结果数量本身受房间物理要素上限限制（level-design-data 约 15 个/房间）

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| chain-propagation.md | §1 三种传播类型 (debris/explosion/collapse) | `_propagation_params` 字典定义各类型参数 (radius/efficiency/exp) |
| chain-propagation.md | §2 传播入口: object_destroyed + trigger_explosion | `_on_object_destroyed()` + `trigger_explosion()` 双入口 |
| chain-propagation.md | §3 传播流程: query_area → 距离衰减 → apply_impulse | Phase 1 `_process_propagation_queue()` 实现完整流程 |
| chain-propagation.md | §4 连锁深度追踪 (chain_depth/total_destroyed/total_damage) | ChainSummary 结构完整追踪 5 个字段 |
| chain-propagation.md | §5 70/30 规则——不主动注入随机数 | ADR 确认传播逻辑完全确定性——"惊喜"来自物理模拟自然偏差 |
| chain-propagation.md | §6 终止条件: 空查询/max_depth/玩家死亡 | Phase 1 循环终止条件 + COOLDOWN + SceneManager 重置 |
| chain-propagation.md | §2 States: IDLE/PROPAGATING/COOLDOWN | 扩展为 4 态——新增 VISUAL_PLAYBACK 中间态 |
| chain-propagation.md | §3 公式: F_source/F_received/DepthMult/Attn_dist | `_calc_f_source()` / `_calc_attenuation()` / `_calc_depth_mult()` 精确实现 GDD 公式 |
| chain-propagation.md | AC1-AC42: 全部 42 个验收标准 | 参见 Validation Criteria——映射到两阶段处理模型 |
| material-destruction.md | §6 碎片连锁——object_destroyed 传递 debris_list | `_on_object_destroyed()` 接收 debris_list，但传播判定基于 query_area 而非 debris_list 遍历 |
| hit-detection.md | AC6: AOE 查询返回范围内所有物体 | 复用 `query_area()` API——不重复实现 AOE 查询 |
| health-damage.md | §2 伤害类型系数——explosion/fragment 类型 | 传播伤害 HitData.damage_type = "explosion" 或 "fragment" |

## Performance Implications
- **CPU (Phase 1)**: 每步 query_area() <0.05ms + 命中处理 (5 objects × 0.01ms) = 0.1ms/步。深度 10 = 1.0ms，深度 20 = 2.0ms。移动端最坏情况 <2ms——在 16.6ms 帧预算内安全
- **CPU (Phase 2)**: 每 3 帧一次 chain_step_processed emit + CameraSystem.shake() = <0.01ms——微不足道
- **Memory**: 5 个内部数据结构——_propagation_queue (max 20), _visual_queue (max 20), _pending_queue (max 5), _processed_in_chain (max ~50), _propagation_params (3 条目常驻)。总计 <5KB
- **Load Time**: _propagation_params 硬编码——无配置加载。若未来移至 JSON 配置，加载 <1ms
- **Network**: N/A

## Migration Plan
本项目尚无代码——此为初始架构决策。实施步骤:
1. ChainPropagation Autoload 实现 Phase 1 物理判定（`_process_propagation_queue()` + 公式函数）
2. 实现 Phase 2 视觉播放（`_process()` + `chain_step_processed` signal emit）
3. 实现 pending 队列和状态机转换
4. `_ready()` 中连接 `MaterialDestruction.object_destroyed`
5. SceneManager.room_active 处理中添加强制 IDLE 重置
6. 集成测试: 木材物体破坏 → 验证连锁传播 → 验证 chain_ended signal 的 ChainSummary
7. 压力测试: 20 步连锁的帧时间 + VISUAL_PLAYBACK 期间新事件的 pending 队列行为

## Validation Criteria
- 木材物体破坏（threshold=200）→ chain_started → PROPAGATING → query_area(100px) → 范围内物体收到 apply_impulse → VISUAL_PLAYBACK 逐帧播放 → chain_ended (AC1, AC4-AC6)
- 粘弹引爆 trigger_explosion(pos, 250, 1000) → 使用 explosion 参数 (c_type=0.70, exp=1.5) (AC2)
- 支撑结构破坏 → collapse 参数 (c_type=1.00, exp=1.0) (AC3)
- F_source 公式: wood(D_threshold=200) + impulse=500 → F_source=275 (AC7)
- F_received 公式: debris F_source=275, d=50, r=100 → Attn_dist=0.875, F_received≈204.53 × DepthMult (AC10)
- DepthMult(5) = 0.9375, DepthMult(20) = 0 (AC13-AC14)
- 木材 accumulated=0, F_received=250 → will_destroy=true (AC16)
- 同帧两物体同时破坏 → 按时间戳顺序排队 (AC21)
- 同物体被两次 AOE 命中 → processed_in_chain 去重 (AC22, AC25)
- chain_depth=20 → 立即 SETTLED, terminated_by_depth_limit=true (AC24)
- COOLDOWN 期间 7 个新事件 → pending 保留最新 5 个 (AC28)
- 玩家死亡 → 连锁立即终止, 队列清空 (AC41)
- Phase 1 20 步连锁 → 帧时间 <2ms
- Phase 2 深度 10 视觉播放 → 总耗时约 500ms

## Related Decisions
- ADR-0001: Autoload + Direct Signal（ChainPropagation 作为 Autoload）
- ADR-0004: 命中检测（消费 hit_detected signal + query_area() API）
- ADR-0005: 材质破坏管线（消费 object_destroyed signal）
- ADR-0009: Boss 身体部件（Boss 部件破坏的连锁传播入口）
- ADR-0010: 评分结算（消费 chain_ended signal 的 ChainSummary）
