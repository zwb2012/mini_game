# ADR-0012: Boss 身体部件物理架构

## Status
Accepted

## Date
2026-05-23

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Godot 4.6 |
| **Domain** | Physics |
| **Knowledge Risk** | MEDIUM — 2D 物理引擎选择（GodotPhysics2D vs Jolt）需在 spike 前确认。`_integrate_forces` + PinJoint2D 模式在 Godot 4.x 中成熟稳定，但 Boss 尺度（400×600px）和移动端性能需验证 |
| **References Consulted** | `docs/engine-reference/godot/VERSION.md`, `docs/engine-reference/godot/breaking-changes.md`, `docs/engine-reference/godot/deprecated-apis.md`, `docs/engine-reference/godot/modules/physics.md` |
| **Post-Cutoff APIs Used** | `RigidBody2D.freeze_mode` (FREEZE_MODE_KINEMATIC — 4.x 新增), `PinJoint2D.softness` (Jolt 下行为不同于 GodotPhysics2D) |
| **Verification Required** | **BLOCKING**: 确认 Godot 4.6 2D 默认物理引擎 (Project Settings → Physics → 2D)。若为 Jolt，需验证 `add_collision_exception_with()` 双向调用是否仍然必需、PinJoint2D softness 参数行为 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (BossAI 作为 Autoload), ADR-0003 (PhysicsObjectPool — 部件破坏后 debris 管理), ADR-0004 (HitDetection — 部件接收 hit_detected signal), ADR-0005 (MaterialDestruction — 部件材质阈值和破坏判定) |
| **Enables** | Boss AI 系统实现 (boss-ai.md) — 身体部件架构是实现 Boss 5 部件可破坏系统的前提 |
| **Blocks** | Boss AI story (EPIC-BOSS) — 在身体部件架构被验证前不能开始实现 |
| **Ordering Note** | Spike 必须在 Boss AI 实现前完成。本 ADR 的 Accepted 状态取决于 spike 结果——若 spike 失败且方案 B 不可行，本 ADR 需重新评估 |

## Context

### Problem Statement
Boss 需要同时满足三个物理需求：(1) 根节点沿锚点路径精确 kinematic 移动（锚点到锚点，80/30/200 px/s），(2) 5 个身体部件作为独立 RigidBody2D 响应外部物理冲击力（碎片撞击、爆炸 AOE、倒塌 crush），(3) 部件破坏后从 Boss 脱离成为自由 RigidBody2D（掉落动画、连锁传播素材）。这三个需求在 Godot 中互有张力——kinematic 移动和 RigidBody2D 物理响应使用不同的物理路径，直接混合会导致物理状态不一致。

GDD 最初提议 CharacterBody2D 根 + `top_level=true` RigidBody2D 子节点 + 手动 `_physics_process` 位置同步。引擎专家审查发现该模式存在根本性缺陷：手动位置同步每帧覆盖 PhysicsServer 的积分结果，外部 impulse 施加到 RigidBody2D 上仅存活一帧即被擦除——部件永远无法积累有效速度或产生可观偏移。这与 GDD 的核心需求"身体部件正常接受外部冲击力"直接冲突。

### Constraints
- Boss 根节点必须沿锚点路径精确移动（到达精度 < 5px）
- 5 个身体部件必须在破坏前持续响应外部物理冲击力（被击中时抖动、被爆炸推动）
- 部件破坏后必须从 Boss 脱离成为独立 RigidBody2D（自由落体、碰撞检测）
- 移动端 60fps — 6 个 RigidBody2D（1 根 + 5 部件）+ 5 个 PinJoint2D 的物理开销必须在帧预算内
- Boss 尺度 ~400×600px — 关节参数需针对大质量/大尺寸调优
- MVP 前必须通过 spike 原型验证

### Requirements
- 支持 5 个独立可破坏的身体部件（双腿 Concrete ×1000、双臂 Metal ×500、核心 Composite ×1500）
- 每个部件拥有独立碰撞体（碰撞层 5 — PhysicsObject）
- 部件接收外部冲击力后产生物理响应（位置偏移、角速度变化）
- 部件破坏：PinJoint2D 被移除 → 部件 gravity_scale 恢复 → 自由 RigidBody2D
- Boss 根与部件之间、部件与部件之间无自碰撞
- 锚点路径跟随精度 < 5px（到达判断阈值）

## Decision

**采用方案 D：RigidBody2D 根节点（非冻结）+ `_integrate_forces` 精确运动控制 + PinJoint2D 子节点。**

Boss 根节点使用 `RigidBody2D`（`gravity_scale=0`, `mass=100`），在 `_integrate_forces(state)` 中通过 `state.linear_velocity` 实现锚点路径跟随。5 个身体部件作为 RigidBody2D 子节点，通过 `PinJoint2D` 与根节点连接——不设置 `top_level`，共享父级物理空间。部件破坏时移除对应的 PinJoint2D 并开启部件重力，使其成为自由 RigidBody2D。

方案 A（CharacterBody2D + top_level + 手动同步）因 engine 层面的根本性缺陷被拒绝——每帧手动位置赋值覆盖 PhysicsServer 积分结果，外部 impulse 仅存活一帧。

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│  BossAI (Autoload, Feature 层)                       │
│  - 状态机 (IDLE→INTRO→COMBAT→STUNNED→VULNERABLE→     │
│    DOWNED→DEAD)                                      │
│  - 攻击选择 (attack_score 公式)                       │
│  - 威胁感知 (Phase 2)                                 │
│  - 锚点路径管理                                       │
└──────────────┬──────────────────────────────────────┘
               │ 控制 (state.linear_velocity via _integrate_forces)
               ▼
┌─────────────────────────────────────────────────────┐
│  BossRigidBody (RigidBody2D, 层 2 — Enemy)           │
│  ├─ gravity_scale = 0                                │
│  ├─ mass = 100                                       │
│  ├─ continuous_cd = true                             │
│  ├─ collision_layer = 2, collision_mask = 1|4|5     │
│  │                                                   │
│  ├─ PinJoint2D → BodyPart_LeftLeg                   │
│  │   └─ RigidBody2D (层 5, Concrete, thresh=1000)    │
│  ├─ PinJoint2D → BodyPart_RightLeg                  │
│  │   └─ RigidBody2D (层 5, Concrete, thresh=1000)    │
│  ├─ PinJoint2D → BodyPart_Core                      │
│  │   └─ RigidBody2D (层 5, Composite, thresh=1500)   │
│  ├─ PinJoint2D → BodyPart_LeftArm                   │
│  │   └─ RigidBody2D (层 5, Metal, thresh=500)        │
│  └─ PinJoint2D → BodyPart_RightArm                  │
│      └─ RigidBody2D (层 5, Metal, thresh=500)        │
└─────────────────────────────────────────────────────┘

物理数据流:
  BossAI._update_anchor_path()
    → 设置 _target_anchor 和 _move_speed
    → _integrate_forces(state):
        state.linear_velocity = direction * speed
    → PhysicsServer 积分根节点位置
    → PinJoint2D 约束自动同步子节点位置
    → 外部 impulse 施加到子节点 → PinJoint2D 弹簧响应
    → 子节点自然晃动/偏移（通过 softness 参数控制）
```

### Key Interfaces

```gdscript
# boss_rigid_body.gd — Boss 根节点 (RigidBody2D)
extends RigidBody2D
class_name BossRigidBody

## 锚点路径移动速度（由 BossAI Autoload 设置）
var _move_speed: float = 0.0
var _target_anchor: Vector2 = Vector2.ZERO

const ARRIVAL_DISTANCE: float = 5.0
const DECELERATION_DISTANCE: float = 50.0

func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
    if _move_speed <= 0.0:
        return
    var to_target := _target_anchor - state.transform.origin
    var distance := to_target.length()
    if distance < ARRIVAL_DISTANCE:
        state.linear_velocity = Vector2.ZERO
        BossAI._on_anchor_reached()
        return
    
    var speed := _move_speed
    if distance < DECELERATION_DISTANCE:
        speed *= distance / DECELERATION_DISTANCE
    state.linear_velocity = to_target.normalized() * speed
```

```gdscript
# boss_body_part.gd — 身体部件 (RigidBody2D 子节点)
extends RigidBody2D
class_name BossBodyPart

@export var part_id: String = ""
@export var material_type: String = ""  # "Concrete", "Metal", "Composite"
@export var destruction_threshold: float = 1000.0
@export var hp_share: float = 0.25

var _accumulated_damage: float = 0.0
var _is_destroyed: bool = false

## 部件被命中——由 HitDetection.hit_detected signal 驱动
func apply_hit(hit_data: Dictionary) -> void:
    if _is_destroyed:
        return
    # 损伤累积委托给 MaterialDestruction 系统
    # 部件 destroy 在阈值达到时触发
    _accumulated_damage += hit_data.impulse * _get_dtc_for_type(hit_data.damage_type)
    if _accumulated_damage >= destruction_threshold:
        _destroy()

func _destroy() -> void:
    _is_destroyed = true
    # 信号通知 BossAI（触发 STUNNED/Phase 转换）
    BossAI.body_part_destroyed.emit(part_id)
    # 移除关节约束 → 部件成为自由 RigidBody2D
    var joint := get_parent() as PinJoint2D
    if joint:
        joint.queue_free()
    gravity_scale = 1.0
    # 加入 PhysicsObject 池或作为 debris 保留
```

**配置驱动**（部件参数从 JSON 加载）：
```json
// assets/data/boss/ruin_colossus_parts.json
{
  "parts": [
    {"id": "left_leg",   "material": "Concrete",  "threshold": 1000, "hp_share": 0.25},
    {"id": "right_leg",  "material": "Concrete",  "threshold": 1000, "hp_share": 0.25},
    {"id": "core",       "material": "Composite", "threshold": 1500, "hp_share": 0.40},
    {"id": "left_arm",   "material": "Metal",     "threshold": 500,  "hp_share": 0.05},
    {"id": "right_arm",  "material": "Metal",     "threshold": 500,  "hp_share": 0.05}
  ],
  "pin_joint_defaults": {
    "softness": 0.2,
    "bias": 0.8
  }
}
```

### 碰撞屏蔽配置

```gdscript
# Boss 根节点与所有身体部件互相禁用碰撞
func _ready() -> void:
    for child in get_children():
        if child is PinJoint2D:
            var part := child.get_node(child.node_b) as RigidBody2D
            if part:
                add_collision_exception_with(part)
```

> **注意**: `add_collision_exception_with()` 的双向调用要求在 GodotPhysics2D 下必须。若项目使用 Jolt 作为 2D 引擎（Godot 4.6 可能默认），碰撞排除机制不同——spike 中必须验证。

### 物理引擎确认要求（BLOCKING — spike 前）

在 spike 开始前，运行以下检查：
```
Project Settings → Physics → 2D → Physics Engine:
  - 若 = "GodotPhysics2D" → 按当前文档实施，add_collision_exception_with() 需双向
  - 若 = "Jolt" → PinJoint2D softness 行为不同（真实弹簧 vs 简单阻尼），碰撞排除 API 可能不同
```

## Alternatives Considered

### Alternative A: CharacterBody2D + top_level RigidBody2D + 手动同步 (GDD 原方案)
- **Description**: Boss 根节点为 CharacterBody2D（`move_and_slide()` 移动）。身体部件为 `top_level=true` RigidBody2D 子节点。`_physics_process` 中手动设置部件 `global_position` = 根节点位置 + 局部偏移。
- **Pros**: `move_and_slide()` 移动精度高；CharacterBody2D 天然免疫外部推力（不会被击飞）；API 熟悉度高
- **Cons**: **根本性缺陷** — 手动位置赋值覆盖 PhysicsServer 积分结果。外部 impulse 施加到 RigidBody2D 后，下一帧 `_physics_process` 的位置同步立即擦除 impulse 位移效果。部件永远无法积累有效速度——表现为微抖动而非可观偏移。RigidBody2D.linear_velocity 被反复清零。社区共识不推荐用于需要可靠物理行为的场景。
- **Rejection Reason**: GDD 核心需求是"身体部件正常接受外部冲击力"——方案 A 无法满足。引擎专家确认这是 PhysicsServer transform 维护与手动 transform 赋值的固有竞争条件，不是 bug 是 API 设计限制。即使 spike 通过表面检查（无视觉抖动），部件也无法产生有意义的物理响应。

### Alternative B: Pure RigidBody2D (freeze=KINEMATIC) + PinJoint2D (GDD 备选)
- **Description**: Boss 根节点为 `freeze_mode = FREEZE_MODE_KINEMATIC` 的 RigidBody2D。`_integrate_forces` 设置 velocity。身体部件通过 PinJoint2D 连接。
- **Pros**: 物理一致性优于 A——部件与根节点共享物理空间，通过关节原生响应外力；PinJoint2D softness 提供自然部件晃动；Jolt 下关节稳定性更好
- **Cons**: `freeze_mode = KINEMATIC` 下根节点不接受外部 impulse——但 Boss 本来就应免疫击飞，所以这是特性而非缺陷。锚点跟随精度依赖 velocity 控制（~3-5px）——对于 Boss 尺度可接受。`_integrate_forces` 对部分工程师不熟悉。
- **Rejection Reason**: 未被拒绝——作为方案 D 的前身。方案 D 在此基础上移除了 freeze 约束，使根节点在保持免疫外部推力的同时更灵活。

### Alternative C: CharacterBody2D + Area2D 子节点 + 破坏时替换
- **Description**: 身体部件使用 Area2D（仅碰撞检测，无物理响应）。部件累积损伤通过 Area2D.body_entered 检测。破坏时 `queue_free` Area2D → 生成独立 RigidBody2D debris。
- **Pros**: 无持续的物理同步问题；Area2D 开销低于 RigidBody2D；实现最简
- **Cons**: 部件在破坏前不是 RigidBody2D——无法被推动、无法响应爆炸冲击力、无法与场景物理对象交互。这与 GDD 需求"身体部件正常接受外部冲击力"直接冲突。手臂横扫时部件无法物理推动场景物体——失去 Pillar 3（规则稳定）的关键交互。
- **Rejection Reason**: 面积换简单——牺牲了"部件是独立物理实体"这一核心设计。Boss 战的卖点在于每个部件的行为像真实物理对象——Area2D 回退为纯碰撞检测，破坏了 Pillar 1 的物理反馈和 Pillar 3 的规则一致性。

## Consequences

### Positive
- PinJoint2D 原生支持部件物理响应——外部 impulse 通过关节约束自然传递，部件产生真实的晃动和偏移
- `_integrate_forces` 提供与 `move_and_slide()` 相当的锚点跟随精度（< 5px 到达判定）
- 部件破坏流程自然——移除 PinJoint2D + 开启重力 → 部件成为自由 RigidBody2D，无需手动位置解耦
- Jolt 物理引擎（若为 4.6 默认）的关节求解器比 GodotPhysics2D 更稳定——PinJoint2D softness 在 Jolt 中表现为真实弹簧行为
- 方案统一：所有 Boss 身体部件使用相同的 RigidBody2D + PinJoint2D 架构——不需要混合 CharacterBody2D/RigidBody2D/Area2D

### Negative
- `_integrate_forces` 替代 `move_and_slide()` — 部分工程师可能不熟悉此 API。缓解：实现复杂度低（~15 行锚点跟随代码），文档完善
- Boss 根节点为 RigidBody2D（非 CharacterBody2D）— 碰撞行为（bounciness、friction）与 CharacterBody2D 不同。缓解：设置 `bounce=0, friction=0` 模拟 CharacterBody2D 行为
- 6 个 RigidBody2D + 5 个 PinJoint2D 的物理开销高于方案 A（1 CharacterBody2D + 5 RigidBody2D）。缓解：spike 中测量移动端 60fps 性能；若超标，可通过减少关节更新频率或降低 softness 迭代次数优化
- 需要 spike 验证——不能直接开始实现。增加约 1 个 session 的技术验证时间

### Risks
- **物理引擎未知**: Godot 4.6 2D 默认物理引擎可能是 Jolt 而非 GDD 假设的 GodotPhysics2D。若为 Jolt，`add_collision_exception_with()` 和 PinJoint2D softness 行为需重新验证。缓解：spike 第一步确认物理引擎配置。
- **移动端性能**: 6 个 RigidBody2D + 5 个 PinJoint2D 在低端移动设备上可能超出物理帧预算（每帧 16.6ms 中物理预算通常 < 5ms）。缓解：spike 在目标设备上测量物理帧时间；若超标，降低 PinJoint2D softness 迭代次数或冻结非关键部件的关节更新。
- **PinJoint2D 稳定性**: Boss 尺度（400×600px, mass=100）下关节的稳定性未经验证。softness 过低 → 部件像钢铁般硬连接（无晃动）。softness 过高 → 部件像果冻般抖动（视觉不可接受）。缓解：spike 中测试 softness 0.1-0.5 范围，找到"有轻微晃动但不抖"的 sweet spot。
- **自碰撞**: 6 个相连 RigidBody2D 在快速移动（200 px/s 冲锋）下可能产生自碰撞抖动。缓解：通过 `add_collision_exception_with()` 双向屏蔽所有 Boss 内部碰撞对。
- **GDD 同步**: GDD 中方案 A 的详细实现描述（第 125-136 行）需更新为方案 D——否则开发者可能实现错误的架构。缓解：ADR Accepted 后更新 boss-ai.md 的对应章节。

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| boss-ai.md §1 | 5 个身体部件：双腿 Concrete (1000)、双臂 Metal (500)、核心 Composite (1500) | PinJoint2D 连接的 RigidBody2D 子节点，各自拥有独立碰撞体、材质属性和破坏阈值 |
| boss-ai.md §1 | 身体部件是独立 RigidBody2D（碰撞层 5 — PhysicsObject），各自拥有碰撞体 | 每个部件为标准 RigidBody2D 子节点，非 top_level，通过关节与根节点物理连接 |
| boss-ai.md §1 | 破坏判定由材质破坏系统统一处理——每个部件独立累积损伤、独立触发 object_destroyed | 部件通过 MaterialDestruction 系统追踪 `_accumulated_damage`；达到阈值时移除 PinJoint2D + 触发 BossAI.body_part_destroyed |
| boss-ai.md §8 | Boss 根节点使用 CharacterBody2D...身体部件实现为独立 RigidBody2D 节点，top_level=true | **修订**: 根节点改用 RigidBody2D + _integrate_forces（方案 D）。top_level=true 模式被拒绝（方案 A 根本性缺陷）。GDD 需同步更新 |
| boss-ai.md §8 | 碰撞例外：根节点（层 2）与身体部件（层 5）之间禁用碰撞 | `add_collision_exception_with()` 双向调用屏蔽根节点与所有部件之间的碰撞 |
| boss-ai.md §8 | 身体部件正常接受外部冲击力 | PinJoint2D 原生支持——外部 impulse 通过关节约束传递，部件产生真实物理响应 |
| boss-ai.md §8 技术风险 | "CharacterBody2D + top_level RigidBody2D 是已知 Godot 脆弱模式" | **已解决**: 方案 D 避免了此脆弱模式——不使用 top_level，不手动同步位置，依赖关节约束 |
| boss-ai.md AC1 | 5 个身体部件子节点——各自向材质破坏系统注册 | 部件在 `_ready()` 中调用 `MaterialDestruction.register_part(part_id, material_type, threshold)` |
| boss-ai.md AC19 | 部件累积损伤达阈值 → DestroyPart 触发 | `apply_hit()` 累积 damage → `_destroy()` 移除关节 + 发射 signal |
| material-destruction.md | Composite 材质 (threshold=1500, collapse_dir=gravity_down, debris=6-10) | 核心躯干部件使用 Composite 材质配置——从 material_config.json 读取 |

## Performance Implications
- **CPU**: 6 个 RigidBody2D + 5 个 PinJoint2D 的物理积分开销。预估 < 2ms/物理帧（中端移动设备）。**spike 验证必需**——若 > 3ms，需优化（降低 softness 迭代、冻结静止部件关节）
- **Memory**: Boss 场景 ~20KB（6 个 RigidBody2D + 5 个 PinJoint2D + 碰撞体）。部件破坏后 debris 由 PhysicsObjectPool（ADR-0003）管理
- **Load Time**: Boss 部件配置 JSON 加载 < 1ms。Boss 场景实例化 < 50ms（6 个 RigidBody2D 创建 + 关节初始化）
- **Network**: N/A（单机游戏）

## Spike Gate: 技术原型验证

在 Boss AI 实现前，必须完成以下技术原型并达到门禁标准：

### Spike 范围
1 个 RigidBody2D 根节点（mass=100, gravity_scale=0） + 1 个 PinJoint2D 连接子节点（RigidBody2D, mass=10）

### Gate Criteria
| # | 测试 | 标准 | 测量方法 |
|---|------|------|---------|
| 1 | 锚点跟随精度 | 到达判定 < 5px（80 px/s 和 200 px/s 两种速度） | 到达目标锚点时测量 `distance(global_position, anchor)` |
| 2 | 视觉抖动 | 60fps 下无可见抖动（Boss 尺度 400×600px） | 目视检查 + frame-by-frame 截图对比 |
| 3 | 子节点物理响应 | 外部 impulse=200 施加后子节点产生 ≥ 5px 偏移 | 施加 impulse 后等待 10 帧，测量子节点偏移量 |
| 4 | 物理状态一致性 | 1000 帧连续模拟中，每 10 帧施加随机 impulse（100-500），子节点位置始终跟踪根节点 offset ± 允许范围 | 脚本化测试，记录 max/min 偏移 |
| 5 | 部件破坏脱离 | 移除 PinJoint2D + gravity_scale=1 → 子节点正确自由落体 | 目视检查 + 验证子节点 global_position.y 递增 |
| 6 | 移动端性能 | 物理帧时间 < 3ms（中端设备: Snapdragon 7 Gen1 或等效） | `Time.get_ticks_usec()` delta，取 p99 over 1000 帧 |

### Spike 判定
- **PASS (所有 6 项)**: 方案 D 验证通过 → 本 ADR 状态可更新为 Accepted → 开始 Boss AI 实现
- **FAIL (1-2 项)**: 根据失败项评估——性能问题可通过优化解决；精度问题考虑方案 B（freeze=KINEMATIC）；物理响应问题需重新评估架构
- **FAIL (3+ 项)**: 方案 D 不适用于此用例 → 本 ADR 降级为 Proposed+Blocked → 重新探索替代架构

## Migration Plan
本项目尚无代码——此为初始架构决策。实施步骤：
1. **确认物理引擎**: 检查 Project Settings → Physics → 2D → Physics Engine
2. **Spike 原型**: 按照上述 Gate Criteria 创建并验证 1 个 Boss 根节点 + 1 个身体部件的原型
3. **Spike 报告**: 记录所有 6 项 gate criteria 的测量结果 → 更新本 ADR 的 Status
4. **若 PASS**: 创建 BossRigidBody 和 BossBodyPart 可复用类 → 实现完整 5 部件 Boss
5. **更新 GDD**: boss-ai.md 第 125-136 行的方案 A 实现细节替换为方案 D

## Validation Criteria
- Spike 全部 6 项 gate criteria 通过
- 5 个身体部件成功与 Boss 根节点通过 PinJoint2D 连接
- 外部 impulse=200 施加后部件产生 ≥ 5px 偏移（不被位置同步擦除）
- 部件破坏：PinJoint2D 移除后部件自由落体，碰撞检测正常
- Boss 根节点与所有部件之间无自碰撞抖动
- 物理引擎配置已确认并记录（GodotPhysics2D vs Jolt）
- `add_collision_exception_with()` 行为已验证（双向 vs 单向）
- GDD boss-ai.md 第 125-136 行已更新为方案 D

## Related Decisions
- ADR-0001: Autoload + Signal 架构（BossAI 作为 Autoload 控制 BossRigidBody 场景节点）
- ADR-0003: PhysicsObjectPool（部件破坏后 debris 由对象池管理）
- ADR-0004: HitDetection（hit_detected signal → 部件 apply_hit() → 损伤累积）
- ADR-0005: MaterialDestruction（部件材质阈值和破坏判定——Composite/Metal/Concrete）
- ADR-0006: ChainPropagation（Boss 攻击触发连锁；连锁波及 Boss 身体部件）
- ADR-0011: CameraSystem（Boss 攻击事件触发屏幕震动和 hit_stop）
