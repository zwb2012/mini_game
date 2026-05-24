# ADR-0005: 材质破坏管线

## Status
Accepted

## Date
2026-05-22

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Godot 4.6 |
| **Domain** | Physics / Core |
| **Knowledge Risk** | LOW — 材质破坏管线是纯 GDScript 逻辑：消费 HitData signal、查表材质阈值、调用对象池 API。不涉及新的 Godot 引擎 API |
| **References Consulted** | `docs/engine-reference/godot/VERSION.md`, `docs/engine-reference/godot/modules/physics.md`, `docs/engine-reference/godot/breaking-changes.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | 5 种材质破坏阈值的游戏手感测试；1 帧内 50 个碎片请求的 pool 压力测试 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Autoload + Direct Signal) — MaterialDestruction 作为 Autoload 运行；ADR-0003 (物理对象池) — 碎片通过 PhysicsObjectPool.acquire_debris() 获取；ADR-0004 (命中检测) — 通过 HitDetection.hit_detected signal 接收 HitData；ADR-0002 (场景加载) — 房间重置时清空 accumulated_damage |
| **Enables** | ADR-0006 (连锁传播递归) — object_destroyed signal 是连锁传播的入口；ADR-0009 (Boss 身体部件) — Boss 部件使用相同的材质破坏判定逻辑 |
| **Blocks** | Material Destruction Epic, Chain Propagation Epic — 必须先确定破坏管线才能实现连锁传播 |
| **Ordering Note** | 必须在 ADR-0006 之前被 Accepted——连锁传播递归依赖 object_destroyed signal 作为传播入口 |

## Context

### Problem Statement

材质破坏是坍塌禁区"多米诺战场"（Pillar 2）的物理实现核心。当子弹/碎片/爆炸命中一个可破坏物体（PhysicsObject 层 5）时，系统需要判断"这一击是否超过材质的破坏阈值"。关键架构问题：

1. **损伤累积模型**: 低于阈值的冲击力累积在 `accumulated_damage` 中——如何处理同一帧内的多次命中？如何处理对象被销毁后残留的累积数据？
2. **碎片生成时机**: `object_destroyed` signal 应在碎片生成前还是生成后发射？chain-propagation 订阅此 signal 作为连锁入口——它需要知道碎片列表才能开始传播
3. **对象池集成**: 碎片通过 ADR-0003 对象池获取——但碎片数量由材质类型决定（3~10 个），可能超出池容量。如何优雅降级？
4. **房间重置**: 玩家死亡后房间通过 ADR-0002 的 `room_active` signal 重置——所有可破坏物体的 `accumulated_damage` 必须清零，`one_shot=true` 物体如果已被破坏则永久消失
5. **倒塌方向规则**: 5 种方向判定规则（悬空物向下、靠墙物反方向等）需要可靠的空间查询机制

### Constraints
- 5 种游戏材质: wood (threshold=200), metal (500), concrete (1000), organic (300), composite (1500)
- 碎片从对象池获取——池容量 50（ADR-0003），FIFO 回收
- 所有破坏判定必须在 `_physics_process` 上下文中执行（碰撞数据来自物理步进）
- object_destroyed signal 必须传递给 chain-propagation——ADR-0001 要求 Signal-First 通信
- 移动端 60fps——单帧破坏判定 + 碎片生成总耗时 <0.5ms

### Requirements
- 事件驱动的损伤累积——每个 HitData 到达时即时判定，不批量排队
- 碎片在 `object_destroyed` signal 发射前生成完毕（chain-propagation 接收时可查询已存在碎片）
- 房间重置时 accumulated_damage 全部清零
- 倒塌方向遵循 GDD 规则：悬空物向下、靠墙物反方向、被下方击中向上飞散、一般沿 hit_normal 反方向
- 裂纹阶段视觉信号（0/1/2）——MVP 实现可选，但 signal 接口必须预留

## Decision

**采用事件驱动损伤累积模型——MaterialDestruction Autoload 连接 `hit_detected` signal，即时判定破坏阈值，通过对象池获取碎片后在 `object_destroyed` signal 中传递碎片列表。**

### Architecture Diagram

```
HitDetection.hit_detected(hit_data)
         │
         ▼
MaterialDestruction._on_hit(hit_data)
         │
         ├─ hit_layer != 5 (PhysicsObject)? → return (非可破坏物，忽略)
         │
         ├─ 读取 hit_object 的 material 属性 (wood/metal/concrete/organic/composite)
         │
         ├─ accumulated_damage[instance_id] += hit_data.impulse
         │
         ├─ if accumulated < threshold:
         │     ├─ 计算裂纹阶段: stage = floor(accumulated / threshold × max_stages)
         │     └─ emit crack_stage_changed(instance_id, stage, material)
         │
         └─ if accumulated >= threshold:
               ├─ 计算倒塌方向 (collapse_direction)
               ├─ 计算碎片数 (debris_count: 3~10, 由材质决定)
               ├─ for i in debris_count:
               │     ├─ PhysicsObjectPool.acquire_debris(material, position, velocity)
               │     └─ 收集到 debris_list[]
               ├─ hit_object.queue_free()  (原节点销毁)
               ├─ emit object_destroyed(position, material, debris_list)
               └─ CameraSystem.shake(intensity, duration)  (可选——根据材质)
```

### Key Interfaces

```gdscript
# MaterialDestruction Autoload (Core Layer)
extends Node

# ── 材质定义 ──

## 5 种游戏材质——材质参数从配置文件读取
## 配置路径: res://assets/data/materials/material_config.json
##
## 示例配置:
## {
##   "wood":      {"threshold": 200,  "crack_stages": 0, "debris_min": 3, "debris_max": 5,  "collapse_bias": "impact_direction"},
##   "metal":     {"threshold": 500,  "crack_stages": 1, "debris_min": 2, "debris_max": 3,  "collapse_bias": "impact_reverse"},
##   "concrete":  {"threshold": 1000, "crack_stages": 2, "debris_min": 5, "debris_max": 8,  "collapse_bias": "gravity_down"},
##   "organic":   {"threshold": 300,  "crack_stages": 0, "debris_min": 1, "debris_max": 2,  "collapse_bias": "impact_direction"},
##   "composite": {"threshold": 1500, "crack_stages": 2, "debris_min": 6, "debris_max": 10, "collapse_bias": "gravity_down"}
## }

var _material_config: Dictionary = {}  # 启动时从 JSON 加载
var _accumulated_damage: Dictionary = {}  # instance_id → float
var _destroyed_one_shots: Array = []  # 已破坏的一次性物体 instance_id 列表

# ── Signals ──

## 物体被破坏（accumulated_damage >= threshold）
## debris_list 包含已生成的碎片节点引用——chain-propagation 可据此开始传播
signal object_destroyed(position: Vector2, material: String, debris_list: Array)

## 裂纹阶段变化（视觉反馈层消费——MVP 可选实现）
## stage: 0=none, 1=微裂, 2=大裂 (仅在 crack_stages > 0 的材质上触发)
signal crack_stage_changed(instance_id: int, stage: int, material: String)

# ── 核心方法 ──

## 连接 HitDetection.hit_detected signal——在 _ready() 中
func _ready() -> void:
    HitDetection.hit_detected.connect(_on_hit)
    SceneManager.room_active.connect(_on_room_reset)

## 命中事件处理——由 hit_detected signal 触发
func _on_hit(hit_data: Dictionary) -> void:
    # 1. 仅处理 PhysicsObject 层 (5)
    if hit_data["hit_layer"] != 5:
        return
    
    var obj: Node = hit_data["hit_object"]
    if not is_instance_valid(obj):
        return
    
    var material: String = _get_material(obj)  # 从 obj 的 metadata 或 group 读取
    if not _material_config.has(material):
        return  # 未知材质——不可破坏
    
    var config: Dictionary = _material_config[material]
    var threshold: float = config["threshold"]
    var impulse: float = hit_data["impulse"]
    var id: int = obj.get_instance_id()
    
    # 2. 累积损伤
    _accumulated_damage[id] = _accumulated_damage.get(id, 0.0) + impulse
    var accumulated: float = _accumulated_damage[id]
    
    # 3. 判定
    if accumulated >= threshold:
        _destroy(id, obj, material, config, hit_data)
    elif config["crack_stages"] > 0:
        var stage := mini(floori(accumulated / threshold * config["crack_stages"]), config["crack_stages"])
        crack_stage_changed.emit(id, stage, material)

## 执行破坏——生成碎片并发射 object_destroyed
func _destroy(id: int, obj: Node, material: String, config: Dictionary, hit_data: Dictionary) -> void:
    var position := obj.global_position if obj is Node2D else hit_data["hit_point"]
    var collapse_dir := _calc_collapse_direction(obj, hit_data["hit_normal"], config["collapse_bias"])
    var debris_count := randi_range(config["debris_min"], config["debris_max"])
    
    # 4. 从对象池获取碎片（碎片生成在 signal 发射前完成）
    var debris_list: Array[Node] = []
    for i in debris_count:
        var offset := Vector2(randf_range(-20, 20), randf_range(-10, 10))
        var vel := collapse_dir * randf_range(200, 800) + Vector2.DOWN * randf_range(0, 300)
        var debris := PhysicsObjectPool.acquire_debris(material, position + offset, vel)
        if debris:
            debris_list.append(debris)
        # 池耗尽时 acquire_debris 返回 null——降级跳过，不崩溃
    
    # 5. 销毁原节点
    _accumulated_damage.erase(id)
    if obj.has_meta("one_shot") and obj.get_meta("one_shot"):
        _destroyed_one_shots.append(id)
    obj.queue_free()
    
    # 6. 发射 signal（碎片已生成——消费者可查询 debris_list）
    object_destroyed.emit(position, material, debris_list)
    
    # 7. 可选——触发摄像机震动（根据材质冲击力）
    # CameraSystem.shake(clampf(impulse / 2000.0, 0.1, 1.0), 0.3)

## 倒塌方向计算
func _calc_collapse_direction(obj: Node, hit_normal: Vector2, bias: String) -> Vector2:
    match bias:
        "gravity_down":
            return Vector2.DOWN
        "impact_direction":
            return -hit_normal
        "impact_reverse":
            return hit_normal  # 弹开方向
        _:
            return -hit_normal

# ── 房间重置 ──

## 监听 SceneManager.room_active ——清空损伤累积
func _on_room_reset(_room_id: String) -> void:
    _accumulated_damage.clear()
    # one_shot 物体在 level-design-data 的 reset 逻辑中跳过重新实例化——此处仅清空累积数据
```

### 损伤累积生命周期

```
        ┌──────────────┐
        │  INTACT      │ accumulated = 0
        │  crack=0     │
        └──────┬───────┘
               │ hit_detected (impulse > 0)
               ▼
        ┌──────────────┐
        │  DAMAGED     │ 0 < accumulated < threshold
        │  crack=1/2   │ emit crack_stage_changed
        └──────┬───────┘
               │ hit_detected (accumulated >= threshold)
               ▼
        ┌──────────────┐
        │  DESTROYED   │ acquire debris × N
        │              │ queue_free() 原节点
        │              │ emit object_destroyed
        └──────────────┘
               │
        room_active → accumulated damage reset → back to INTACT (new room)
```

### 倒塌方向规则

| 条件 | 方向 | 检测方式 |
|------|------|---------|
| 悬空物（底部无 World 层支撑） | `Vector2.DOWN` | `PhysicsRayQueryParameters2D` 向下射线检测——无碰撞 = 悬空 |
| 靠墙物（一侧有 World 层支撑） | 支撑反方向 | 4 方向射线检测——有碰撞的方向 = 支撑方向，取其反方向 |
| 被下方击中（hit_normal.y < -0.7） | `Vector2.UP` | hit_normal 的 y 分量判断 |
| 一般情况 | `-hit_normal` | 沿碰撞法线反方向散射 |
| `collapse_bias` 覆盖 | 按材质配置 | `gravity_down` / `impact_direction` / `impact_reverse` |

> **MVP 简化**: MVP 阶段倒塌方向统一使用 `collapse_bias` 配置值（不实时射线检测支撑状态）。射线检测方案作为 Alpha 阶段增强。

### 同一帧多命中处理

- 每个 `hit_detected` signal 独立触发 `_on_hit()`——按 signal 发射顺序处理
- 同一帧内多颗子弹命中同一物体: 第一个 HitData 可能触发破坏 → `queue_free()` → 后续 HitData 的 `is_instance_valid(obj)` 检查失败 → 跳过
- 同一帧内多碎片命中同一物体: 同上——第一个触发破坏的 HitData 胜出
- 不需显式加锁——Godot signal 在当前调用栈中同步执行，不存在并发问题

### 与 ADR-0003（对象池）的集成

- `acquire_debris()` 返回的碎片已设置 material-specific PhysicsMaterial（friction/bounce）、collision_layer=5、初始 velocity
- 碎片生命周期由对象池管理（7s 后自动回收）——MaterialDestruction 不跟踪碎片生命周期
- 池耗尽时 `acquire_debris()` 返回 null——`_destroy()` 中跳过（不崩溃），emit `PhysicsObjectPool.pool_exhausted("debris")` 已由对象池内部处理

### 与 ADR-0004（命中检测）的集成

- `hit_detected` signal 的 HitData 包含 `damage_type`——MaterialDestruction 不区分 damage_type（任何类型均可累积损伤）。boss-ai 的 Pillar 4 子弹过滤在 health-damage 层处理，不影响材质破坏判定
- `hit_detected` signal 的 HitData 包含 `hit_normal`——用于倒塌方向计算

## Alternatives Considered

### Alternative A: 帧末批量处理

- **Description**: 收集一帧内所有 `hit_detected` → 在 `_physics_process` 末尾统一判定 → 一次性生成所有碎片
- **Pros**: 同帧多次命中同一物体的总 impulse 自然求和——多颗子弹同时命中不会被"第一个触发破坏后 queue_free 使后续命中丢失"
- **Cons**: 增加一帧延迟——破坏反馈不及时（碰撞→下一帧才看到碎片）；需要队列管理——`_physics_process` 中检查队列 + 排序 + 批量生成；object_destroyed signal 延迟一帧 → chain-propagation 的连锁效应延迟一帧
- **Rejection Reason**: 碎片飞散的即时视觉反馈是 Pillar 2（多米诺战场）的核心体验——延迟一帧会破坏"射击→立即碎裂"的爽感。同一帧多命中同一物体的场景罕见（子弹对同一 PhysicsObject 的命中受限于射速和物理位置），为了这个边缘场景牺牲即时反馈不值得。

### Alternative B: Godot PhysicsMaterial + engine damage system

- **Description**: 使用 Godot 的 PhysicsMaterial 属性控制破坏行为——设置 `bounce`/`friction`/`absorbent` 等参数，依赖引擎的碰撞响应系统自动处理"破坏"
- **Pros**: 无自定义损伤累积代码——完全依赖引擎；PhysicsMaterial 参数在编辑器中可视化调整
- **Cons**: GodotPhysics2D 无内置"破坏阈值"或"累积损伤"概念——PhysicsMaterial 仅控制碰撞响应（弹跳/摩擦），不提供材质破坏逻辑；5 种游戏材质的差异化行为（裂缝阶段、倒塌方向偏好）无法通过 PhysicsMaterial 表达；本质上是把游戏逻辑外包给了没有这个功能的引擎
- **Rejection Reason**: 材质破坏是坍塌禁区的核心玩法差异化特征——5 种材质的行为规则（木材一枪碎、金属两枪凹、混凝土三枪裂）是 Pillar 3（规则可学习）的基础。Godot 的 PhysicsMaterial 无法表达这些规则——这不是"选择引擎功能 vs 自定义代码"，而是"引擎没有这个功能"。

### Alternative C: 材质破坏判定放在 HitData 生成时

- **Description**: 在 HitDetection 的 `build_hit_data()` 中直接判定碰撞是否触发破坏——HitData 增加 `should_destroy: bool` 字段。MaterialDestruction 退化为信号转发器（收到 `should_destroy=true` → 生成碎片 → 转发 object_destroyed）
- **Pros**: 减少一次 signal 跳转——碰撞→破坏的延迟降低；HitDetection 已经知道碰撞双方的信息——不需要额外查表
- **Cons**: HitDetection 的职责是"翻译碰撞事件"——加入破坏判定违反了单一职责；HitDetection 需要知道所有 5 种材质的阈值——数据耦合扩散到 Foundation 层；修改材质阈值需要改动 HitDetection（Foundation 层不应依赖 Feature 层数据）
- **Rejection Reason**: HitDetection 是 Foundation 层系统——它不应知悉"木头阈值 200、金属阈值 500"这类 Gameplay 层知识。保持 HitDetection 的纯净性（仅翻译碰撞 → 统一 HitData）比减少一次 signal 跳转更重要。

## Consequences

### Positive
- 事件驱动模型——射击→碰撞→破坏→碎片→连锁 的链路每步即时响应，无延迟感
- 材质配置外部化——`material_config.json` 中修改阈值/碎片数/倒塌偏好，无需重新编译
- 单一职责清晰——HitDetection 翻译碰撞，MaterialDestruction 判定破坏，PhysicsObjectPool 管理碎片生命周期
- 房间重置干净——accumulated_damage Dictionary 全量清空，无残留状态
- 裂纹阶段 signal 预留——MVP 不需要但接口已就位，Alpha 添加视觉反馈时无需改架构

### Negative
- 每帧多次 Dictionary 查表（accumulated_damage、material_config）——最坏情况 50 次/帧。每次查表 <0.001ms——总开销微不足道
- `_accumulated_damage` Dictionary 在长时间不重置时增长——每个被命中的 PhysicsObject 保留一个条目。正常游戏中上限 = 每房间 PhysicsObject 数量（~15）——实际可忽略
- `collapse_bias` 默认不起作用（MVP 不做实时射线检测）——需要 Alpha 阶段补充实现
- `object_destroyed` signal 不包含 `hit_normal`——如需传播方向信息，chain-propagation 从其自身的 HitData 中获取

### Risks
- **同一帧内物体被破坏后 queue_free 但碰撞体残留**: `queue_free()` 在帧末执行——同帧内后续 HitData 可能命中已标记销毁但碰撞体仍存在的物体。缓解：`_on_hit()` 开头检查 `obj.is_queued_for_deletion()`，已标记销毁的物体跳过
- **accumulated_damage 的 instance_id 在 obj.queue_free() 后复用**: Godot 可能复用已释放的 instance_id。缓解：`_destroy()` 中 `_accumulated_damage.erase(id)` 确保在 queue_free 前清除
- **池耗尽时碎片数不足**: Boss 房间大面积坍塌可能瞬间请求 30+ 碎片。缓解：`acquire_debris()` 返回 null 时跳过该碎片（不崩溃）；每帧实际生成的碎片数可能少于材质定义的 debris_max
- **collapse_bias 的 gravity_down 在侧向视角不正确**: 侧向视角（非俯视）中重力向下倒塌是合理的——但物体被从侧面击中时"向下倒"的视觉效果可能不自然。缓解：Alpha 阶段实现实时支撑检测后，collapse_bias 仅作为"无特殊条件时的默认偏好"

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| material-destruction.md | §1 5 种材质破坏阈值表 | `material_config.json` 外部配置——threshold/debris_count/crack_stages 全部数据驱动 |
| material-destruction.md | §2 破坏判定公式: `accumulated + hit.impulse >= threshold` | `_on_hit()` 中实现——Dictionary 追踪 accumulated_damage，每次命中即时判定 |
| material-destruction.md | §3 损伤累积 + 裂缝阶段 | `crack_stage_changed` signal——根据 accumulated/threshold × max_stages 计算阶段 |
| material-destruction.md | §4 倒塌方向规则（5 种） | `_calc_collapse_direction()` + MVP collapse_bias；Alpha 扩展实时射线检测 |
| material-destruction.md | §5 碎片生成：N 个 RigidBody2D 从对象池 | `PhysicsObjectPool.acquire_debris()`——碎片在 object_destroyed 发射前生成 | 
| material-destruction.md | AC1-AC7: 全部 7 个验收标准 | 参见 Validation Criteria——映射到具体测试场景 |
| material-destruction.md | §6 碎片连锁：碎片飞出命中其他物体 → 二次破坏 | `object_destroyed` signal 传递 debris_list → chain-propagation 订阅此 signal |
| physics-config.md | §4 碰撞矩阵——PhysicsObject(5) | `_on_hit()` 过滤 `hit_layer==5`——仅 PhysicsObject 层触发材质破坏判定 |

## Performance Implications
- **CPU**: `_on_hit()` 每次调用: Dictionary 查表 ×2 (<0.001ms) + 阈值比较 (<0.001ms)。破坏时: `acquire_debris()` × N (<0.01ms × N) + `queue_free()` (deferred)。峰值 10 碎片 × 0.01ms = 0.1ms。总计 <0.2ms/frame
- **Memory**: `_accumulated_damage` Dictionary: ~15 条目 × 16 字节 = ~240 字节/房间。`_material_config`: ~1KB 常驻
- **Load Time**: material_config.json 加载 <1ms（5 材质 × ~100 字节）
- **Network**: N/A

## Migration Plan
本项目尚无代码——此为初始架构决策。实施步骤:
1. MaterialDestruction Autoload 实现 `_on_hit()`、`_destroy()`、`_calc_collapse_direction()`
2. 在 `_ready()` 中连接 `HitDetection.hit_detected` 和 `SceneManager.room_active`
3. 创建 `assets/data/materials/material_config.json` 配置文件
4. 每个可破坏物体（PhysicsObject 子节点）通过 `set_meta("material", "wood")` 标记材质类型
5. 集成测试: 子弹命中 wood 物体 → 验证 accumulated_damage 累积 → 超过 200 → 碎片生成 → object_destroyed signal 发射
6. 压力测试: Boss 房间 10 个 concrete 物体连续破坏 → 验证池容量和 FIFO 回收

## Validation Criteria
- 子弹（impulse=500）命中 wood 物体（threshold=200） → 立即破坏，生成 3-5 碎片 (AC1)
- 子弹（impulse=300）命中 metal 物体（threshold=500） → 不破坏，accumulated=300, crack_stage_changed 发射 (AC2)
- 第二发子弹（impulse=250）命中同一 metal 物体 → 累积 550 ≥ 500 → 破坏 (AC3)
- 倒塌方向: 悬空 concrete 物体 → collapse_dir = Vector2.DOWN (AC4)
- 碎片飞出命中另一 PhysicsObject → 触发二次破坏（chain-propagation 消费 object_destroyed）(AC5)
- 碎片 7s 后自动回收至对象池——由 ADR-0003 验证
- 所有材质参数从 material_config.json 读取 (AC7)
- 房间重置后 accumulated_damage 全部清零——相同物体恢复 INTACT 状态
- one_shot=true 物体破坏后——房间重置时不重新出现
- 连续 60 次碎片请求 → 第 51 次触发 FIFO 回收 (ADR-0003 AC7)

## Related Decisions
- ADR-0001: Autoload + Direct Signal（MaterialDestruction 作为 Autoload）
- ADR-0002: 场景加载策略（房间重置清空 accumulated_damage）
- ADR-0003: 物理对象池（acquire_debris 碎片获取）
- ADR-0004: 命中检测（消费 hit_detected signal）
- ADR-0006: 连锁传播递归（object_destroyed signal 消费者）
- ADR-0009: Boss 身体部件（复用材质破坏判定逻辑）
