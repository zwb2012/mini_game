# ADR-0013: 敌人 AI 导航系统架构

## Status
Accepted

## Date
2026-05-23

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Godot 4.6 |
| **Domain** | Navigation |
| **Knowledge Risk** | LOW — NavigationAgent2D / NavigationRegion2D API 自 Godot 4.0 起稳定。4.5 引入专用 NavigationServer2D（不再代理 3D）——纯优化，API 不变 |
| **References Consulted** | `docs/engine-reference/godot/VERSION.md`, `docs/engine-reference/godot/breaking-changes.md`, `docs/engine-reference/godot/deprecated-apis.md`, `docs/engine-reference/godot/modules/navigation.md` |
| **Post-Cutoff APIs Used** | NavigationServer2D 专用 2D 服务器（Godot 4.5+ —— API 不变，仅内部架构优化） |
| **Verification Required** | 15 个 NavigationAgent2D + RVO2 在移动端的 CPU 开销（目标 < 0.5ms/帧）。静态网格在房间破坏下的行为退化程度 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (EnemyAI 作为 Autoload), ADR-0004 (HitDetection — 感知射线使用 PhysicsRayQueryParameters2D，与战斗命中分离) |
| **Enables** | Enemy AI story (EPIC-ENEMY) — 导航是实现敌人移动的前提 |
| **Blocks** | 无 |
| **Ordering Note** | 依赖关卡设计数据系统提供预烘焙 NavigationPolygon。EnemyAI Autoload 需要在 EnemySpawnWave 之前就绪 |

## Context

### Problem Statement
敌人需要在战斗房间中进行路径寻找——避开 World 层障碍物、向玩家移动、避免互相堆叠。GDD 定义了 4 种敌人原型，其中 3 种使用 CharacterBody2D（侦察兵/士兵/重装兵），1 种使用 RigidBody2D（自爆兵/Carrier）。两种物理类型的导航方式不同——CharacterBody2D 通过 `move_and_slide()` 使用速度向量，RigidBody2D 通过 `_integrate_forces()` 使用 `state.linear_velocity`。NavigationAgent2D 的 RVO2 避让机制（`velocity_computed` signal → `safe_velocity`）专为 CharacterBody2D 设计——与 RigidBody2D 的 `_integrate_forces()` 调用栈不兼容。

### Constraints
- 移动端 60fps — 15 个敌人的导航计算必须在 < 0.5ms/帧内完成
- 导航网格在关卡设计时预烘焙——不动态重烘焙（MVP 约束）
- 房间破坏（墙壁倒塌、碎片堵塞通道）可能导致导航网格与实际物理状态不一致
- CharacterBody2D 和 RigidBody2D 敌人需要不同的移动执行路径
- NavigationRegion2D.avoidance_layers 在 Godot 4.3 中已移除——不使用

### Requirements
- 4 种敌人原型的路径寻找和移动执行
- 士兵/侦察兵之间避免堆叠（80-150px 间距）
- 路径重算在目标显著移动或 `is_target_reachable() == false` 时触发——不每帧
- STUNNED 状态下暂停导航（避免 RVO2 与击退物理竞争）
- Carrier（RigidBody2D）不使用 NavigationAgent2D 的 RVO2——用直接移动 + 简单避障

## Decision

**采用 NavigationAgent2D + NavigationRegion2D 作为 CharacterBody2D 敌人的主导航方案。Carrier（RigidBody2D）使用独立的直接移动 + 射线避障策略。**

每个 CharacterBody2D 敌人（侦察兵/士兵/重装兵）包含一个 NavigationAgent2D 子节点。导航网格按房间预烘焙为 NavigationPolygon 资源，附加到房间场景的 NavigationRegion2D 节点。路径重算在目标位置变化超过 50px 或 `is_target_reachable()` 返回 false 时触发——不每帧。士兵和侦察兵启用 RVO2 避让（80-150px 间距），重装兵禁用（碾压障碍物，不需要避让）。Carrier 直接向玩家位置移动，使用 `RayCast2D` 检测正前方墙壁障碍——不使用 NavigationAgent2D。

### Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│  EnemyAI (Autoload, Feature 层)                       │
│  - 状态机 (IDLE→COMBAT→SEARCHING→STUNNED→DEAD)       │
│  - 感知系统 (视野锥 + 3 射线 / 0.2s)                    │
│  - 攻击协调 (射击节奏、随机延迟)                        │
│  - 导航目标分配 (设置每个敌人的 target_position)         │
└──────────────┬───────────────────────────────────────┘
               │
    ┌──────────┼──────────┬──────────────┐
    ▼          ▼          ▼              ▼
  Scout     Soldier    Heavy         Carrier
  (CBody2D) (CBody2D) (CBody2D)     (RBody2D)
    │          │          │              │
    ├─NavAgent ├─NavAgent ├─NavAgent     │  (无 NavAgent)
    │ RVO2=on  │ RVO2=on  │ RVO2=off     │
    │ speed=350│ speed=200│ speed=100    │  speed=300
    │ space=80 │ space=150│ space=N/A    │  space=N/A
    │          │          │              │
    ▼          ▼          ▼              ▼
  move_and_  move_and_  move_and_    _integrate_
  slide()    slide()    slide()      forces() +
                                     RayCast2D

导航数据流:
  房间加载 → NavigationRegion2D (预烘焙 NavigationPolygon)
  EnemyAI._process() → 每 0.5s 更新 target_position
  NavAgent → A* 寻路 (NavigationServer2D, C++ 层)
  _physics_process() → get_next_path_position() → velocity → move
```

### 按原型导航策略

| 原型 | Body 类型 | NavigationAgent2D | RVO2 | 避让间距 | 路径重算触发 | 眩晕时行为 |
|------|----------|-------------------|------|---------|-------------|-----------|
| 侦察兵 (Scout) | CharacterBody2D | 是 | 是 | 80 px | target 移动 > 50px 或 unreachable | 禁用 RVO2，被击退 |
| 士兵 (Soldier) | CharacterBody2D | 是 | 是 | 150 px | 同上 | 同上 |
| 重装兵 (Heavy) | CharacterBody2D | 是 | 否 | N/A | 同上 | 禁用导航更新 |
| Carrier | RigidBody2D | **否** | N/A | N/A | N/A（直接移动） | 禁用移动输入 |

### Key Interfaces

```gdscript
# 路径 A: CharacterBody2D + RVO2 避让（侦察兵/士兵）
# enemy_scout.gd / enemy_soldier.gd
extends CharacterBody2D

@onready var nav_agent: NavigationAgent2D = $NavigationAgent2D

func _ready() -> void:
    nav_agent.avoidance_enabled = true
    nav_agent.radius = 40.0           # 侦察兵 40, 士兵 75
    nav_agent.neighbor_distance = 80.0 # 侦察兵 80, 士兵 150
    nav_agent.max_speed = move_speed
    nav_agent.velocity_computed.connect(_on_velocity_computed)

func _physics_process(_delta: float) -> void:
    if _is_stunned or nav_agent.is_navigation_finished():
        return
    var next_pos := nav_agent.get_next_path_position()
    nav_agent.velocity = global_position.direction_to(next_pos) * move_speed
    # 注意: 不直接设置 self.velocity — RVO2 通过 velocity_computed 回调提供 safe_velocity

func _on_velocity_computed(safe_velocity: Vector2) -> void:
    if not _is_stunned:
        velocity = safe_velocity
        move_and_slide()

func _on_stun_started() -> void:
    nav_agent.avoidance_enabled = false  # 防止 RVO2 与击退物理竞争

func _on_stun_ended() -> void:
    nav_agent.avoidance_enabled = true

func _update_target(target_pos: Vector2) -> void:
    if nav_agent.target_position.distance_to(target_pos) > 50.0:
        nav_agent.target_position = target_pos
```

```gdscript
# 路径 B: CharacterBody2D 无 RVO2（重装兵）
# enemy_heavy.gd
extends CharacterBody2D

@onready var nav_agent: NavigationAgent2D = $NavigationAgent2D

func _ready() -> void:
    nav_agent.avoidance_enabled = false  # 重装兵碾压一切，不避让

func _physics_process(_delta: float) -> void:
    if _is_stunned or nav_agent.is_navigation_finished():
        return
    var next_pos := nav_agent.get_next_path_position()
    velocity = global_position.direction_to(next_pos) * move_speed
    move_and_slide()
```

```gdscript
# 路径 C: RigidBody2D 直接移动 + 射线避障（Carrier）
# enemy_carrier.gd
extends RigidBody2D

@onready var wall_ray: RayCast2D = $WallRay
const WALL_AVOID_SPEED: float = 200.0

func _ready() -> void:
    gravity_scale = 0.0
    wall_ray.target_position = Vector2(60, 0)  # 前方 60px 检测墙壁

func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
    if _is_stunned:
        return
    var to_player := _player_pos - global_position
    var direction := to_player.normalized()

    # 简单墙壁避障: 前方有墙 → 沿墙滑动
    if wall_ray.is_colliding():
        var normal := wall_ray.get_collision_normal()
        direction = (direction - normal * direction.dot(normal)).normalized()
        state.linear_velocity = direction * WALL_AVOID_SPEED
    else:
        state.linear_velocity = direction * move_speed
```

### 导航网格预烘焙

```gdscript
# 每个房间场景配置:
# Room.tscn
# └─ NavigationRegion2D
#     └─ navigation_polygon: NavigationPolygon (预烘焙 .tres 资源)

# 导航参数配置 (assets/data/navigation/navigation_config.json)
{
  "agent_defaults": {
    "path_desired_distance": 5.0,
    "target_desired_distance": 20.0,
    "path_max_distance": 1500.0
  },
  "path_recalc_distance_threshold": 50.0,
  "path_recalc_interval_idle": 1.0,
  "path_recalc_interval_combat": 0.5,
  "unreachable_retry_interval": 2.0
}
```

## Alternatives Considered

### Alternative A: 手动 A* 栅格寻路
- **Description**: 自定义 GDScript A* 实现——将房间划分为栅格（如 32×32 px 单元），手动计算路径。
- **Pros**: 完全控制寻路逻辑——可在破坏后动态更新栅格；不受 Godot 导航系统约束；RigidBody2D 和 CharacterBody2D 统一处理
- **Cons**: GDScript A* 在 15 个敌人上的性能远低于 C++ NavigationServer2D（预估 3-5ms vs <0.1ms）；栅格精度 vs 性能的权衡需要调参；增加 ~200 行自定义寻路代码，维护负担高
- **Rejection Reason**: Godot 的 NavigationAgent2D 已提供 A* 寻路 + RVO2 避让——在 C++ 层执行，性能远优于 GDScript。自定义 A* 仅当需要动态网格更新时才值得——该需求在 MVP 中明确排除。

### Alternative B: 纯 Physics Steering Behaviors
- **Description**: 不使用路径寻找。敌人通过力的组合（向玩家吸引 + 障碍物排斥 + 友军分离）移动——类似 boids 群体行为。
- **Pros**: 零导航基础设施——不需要 NavigationRegion2D 或预烘焙网格；与 RigidBody2D 天然兼容；代码量少（~50 行）
- **Cons**: 复杂障碍物（U 形墙、窄走廊）下敌人会卡住或抖动；无法保证到达目标——敌人可能在局部最优解中徘徊；不适合需要精确路径的战术移动（掩体选择、包抄）
- **Rejection Reason**: GDD 要求敌人能在复杂房间中可靠导航到玩家位置——steering behaviors 无法保证。且 GDD 的掩体选择机制需要精确了解"障碍物后方"位置——纯力驱动无法实现。

### Alternative C: NavigationAgent2D 统一用于所有敌人（含 Carrier）
- **Description**: Carrier 也使用 NavigationAgent2D + RVO2 避让。在 `_integrate_forces()` 外部设置 `velocity_computed` signal → 缓存 safe_velocity → `_integrate_forces()` 中应用。
- **Pros**: 所有敌人使用统一导航模式——代码复用
- **Cons**: **引擎层面不兼容** — `velocity_computed` signal 在 `_integrate_forces()` 调用栈外触发。缓存 safe_velocity 到成员变量 → `_integrate_forces()` 读取 → 存在竞态（物理步进期间 signal 可能收到新值）。RigidBody2D 的 `linear_velocity` 与 RVO2 的 avoidance force 叠加 → 导致抖动。
- **Rejection Reason**: 引擎专家确认 NavigationAgent2D RVO2 + RigidBody2D._integrate_forces() 是已知的不兼容模式。Carrier 的简单行为（冲向玩家 + 爆炸）不需要 A* 路径寻找——直接移动 + 射线避障即可满足 GDD 需求，同时避免 API 不兼容。

## Consequences

### Positive
- NavigationAgent2D 在 Godot C++ 层执行 A* 寻路——15 个敌人 < 0.1ms/帧（与 GDScript A* 的 3-5ms 对比）
- RVO2 自动处理友军间隔——无需显式协调敌人位置
- 导航网格预烘焙——房间加载时零运行时开销
- NavigationAgent2D 作为子节点——在编辑器中按原型配置（radius、speed、layers），无需 create-by-code
- Godot 4.5 专用 2D 导航服务器——更小的导出体积，无 3D 代理开销
- Carrier 的独立策略避免了 NavigationAgent2D + RigidBody2D 的 API 不兼容问题

### Negative
- CharacterBody2D 和 RigidBody2D 敌人使用不同移动代码——不能共享单一导航基类。缓解：两种模式代码量都小（~20 行 each）
- 静态导航网格在破坏后不更新——墙壁倒塌后敌人仍走原路径（更长的绕路），碎片堵塞通道后敌人可能卡住。缓解：`is_target_reachable() == false` 时触发路径重算（每 2s）；若玩家可见则保持 COMBAT 原地射击
- RVO2 参数（radius、neighbor_distance）需要按原型调参——不合理的值导致抖动或堆叠。缓解：配置文件中暴露参数，`/balance-check` 验证

### Risks
- **静态网格 + 破坏导致的敌人卡住**: 被碎片堵塞的通道中 `is_target_reachable()` 返回 false → 敌人原地战斗。若数量 > 房间敌人的 20%，游戏可玩性受影响。缓解：`unreachable_retry_interval=2.0s` 重试；若连续 3 次 unreachable → 切换到"可见即战斗"模式（不移动但继续射击）
- **RVO2 与击退物理竞争**（已在眩晕时禁用——验证此修复在移动端有效）
- **NavigationPolygon 烘焙遗漏**: 关卡设计师忘记在新增房间中烘焙导航网格 → 敌人无法移动。缓解：CI 添加检查——所有房间 .tscn 必须包含非空 NavigationPolygon
- **Carrier 的简单避障不够**: Carrier 的射线仅检测前方墙壁——复杂走廊中可能卡在凹角。缓解：Carrier 设计为"冲向玩家并爆炸"——精确导航不是其战术角色的核心。若测试发现高频卡住 → 增加第二根侧面射线（±30°）

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| enemy-ai.md §3 | NavigationAgent2D + NavigationRegion2D 路径寻找 | CharacterBody2D 敌人使用 NavigationAgent2D 子节点 + 房间 NavigationRegion2D 预烘焙网格 |
| enemy-ai.md §3 | 每个战斗房间 NavigationPolygon 在关卡数据中预烘焙 | NavigationPolygon .tres 资源附加到房间 .tscn 的 NavigationRegion2D——关卡设计数据系统管理 |
| enemy-ai.md §3 | 移动通过 CharacterBody2D + move_and_slide() | 路径 A（RVO2）/ 路径 B（无 RVO2）均使用 velocity → move_and_slide() |
| enemy-ai.md §3 | 协同推进：同组士兵保持 80-150px 间距 | RVO2 + neighbor_distance=150px（士兵）/ 80px（侦察兵）自动维持间距 |
| enemy-ai.md §5 | Carrier 使用 RigidBody2D，被击中时物理级击飞 | 路径 C：直接移动 + 射线避障——不使用 NavigationAgent2D 或 RVO2。与 ADR-0012（Boss _integrate_forces）一致 |
| enemy-ai.md §5 | 被冲击力击中 → STUNNED + 击退方向 | STUNNED 状态禁用 NavigationAgent2D.avoidance + 暂停 velocity 更新，让物理击退生效 |
| enemy-ai.md AC34 | 15 个敌人 AI 更新 < 2ms | NavigationAgent2D A* 在 C++ 层执行；路径重算仅 target 变化时触发——不每帧 |
| physics-config.md | CharacterBody2D 敌人 + RigidBody2D 变体 | 分别对应路径 A/B（CharacterBody2D）和路径 C（RigidBody2D） |
| level-design-data.md | 关卡设计数据包含 NavigationPolygon 预烘焙 | 每个房间 .tscn 包含 NavigationRegion2D + baked NavigationPolygon .tres |

## Performance Implications
- **CPU**: NavigationAgent2D 寻路在 C++ NavigationServer2D 上执行——15 个代理 < 0.1ms/帧（仅 target 变化时重算）。RVO2 避让 = O(n²) pairs——15 代理 = 225 pairs < 0.1ms。总导航 CPU < 0.5ms/帧
- **Memory**: NavigationPolygon .tres（每房间 1 个）≈ 10-50KB each。15 个 NavigationAgent2D 子节点 ≈ 15 × ~2KB = 30KB
- **Load Time**: NavigationPolygon 加载 < 1ms（小 .tres 文件）
- **Network**: N/A（单机游戏）

## Migration Plan
本项目尚无代码——此为初始架构决策。实施步骤：
1. 创建 `assets/data/navigation/navigation_config.json` 配置文件
2. 在 Enemy 场景中为 CharacterBody2D 类型添加 NavigationAgent2D 子节点
3. 每个房间 .tscn 添加 NavigationRegion2D + 预烘焙 NavigationPolygon
4. Carrier 场景添加 RayCast2D 子节点（前方碰撞检测）
5. 实现三种导航路径（A/B/C）分别对应 RVO2 / 无 RVO2 / RigidBody2D 直接移动
6. CI 添加导航网格完整性检查（所有房间 .tscn 有非空 NavigationPolygon）

## Validation Criteria
- 士兵在 80-150px 间距内协同移动（不堆叠、不重叠）
- 侦察兵通过 NavigationAgent2D 路径绕开 World 层障碍物
- Carrier 直接向玩家移动，简单墙壁避障有效（不穿透墙壁）
- STUNNED 状态下所有敌人导航暂停、RVO2 禁用——击退物理不被对抗
- 15 个 NavigationAgent2D + RVO2 的导航 CPU < 0.5ms/帧（中端移动设备）
- `is_target_reachable() == false` 时敌人回退到"可见即战斗"模式（不移动但可射击）
- 所有房间 .tscn 包含预烘焙 NavigationPolygon（CI 强制检查）
- GDD AC34（15 个敌人 AI < 2ms）在导航部分满足 < 0.5ms
- GDD 开放问题 #2（破坏后动态网格更新）——MVP 范围内明确排除，Alpha 阶段重新评估

## Related Decisions
- ADR-0001: Autoload + Signal 架构（EnemyAI 作为 Autoload 管理所有敌人导航分配）
- ADR-0004: HitDetection（感知射线使用 PhysicsRayQueryParameters2D + intersect_ray()——与战斗命中分离）
- ADR-0012: Boss 身体部件架构（Boss 移动使用锚点路径而非 NavigationAgent2D——与普通敌人不同）
