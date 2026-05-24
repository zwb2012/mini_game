# ADR-0001: Autoload + Direct Signal 架构

## Status
Accepted

## Date
2026-05-22 (revised 2026-05-22 after /architecture-review — PlayerController exception)

## Revision
ADR-0009 (PlayerController) 决定 PlayerController 作为场景节点而非 Autoload。
本 ADR 已修订：17 个 Autoload + 1 个场景节点（PlayerController）。
PlayerController 作为唯一的场景节点例外——利用 Godot 原生场景生命周期，
简化房间重置和摄像机跟随。PlayerController 仍通过 TouchInput Autoload 的
Signal 进行通信，遵循本 ADR 的 Signal-First 通信规则。

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Godot 4.6 |
| **Domain** | Core |
| **Knowledge Risk** | LOW — Signal/Autoload 系统自 Godot 3.x 起稳定，4.x 无破坏性变更 |
| **References Consulted** | `docs/engine-reference/godot/VERSION.md`, `docs/engine-reference/godot/breaking-changes.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | None |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None |
| **Enables** | ADR-0002 (场景加载策略), ADR-0004 (命中检测), ADR-0006 (连锁传播递归), ADR-0009 (玩家控制器——场景节点方案依赖 TouchInput Autoload) |
| **Blocks** | 所有 Feature 层 Epic — 必须先确定通信方式才能开始实现 |
| **Ordering Note** | 必须在所有其他 ADR 之前被 Accepted |

## Context

### Problem Statement
坍塌禁区有 17 个 MVP 系统跨越 5 个架构层。其中 17 个系统作为 Godot Autoload 运行，1 个系统（PlayerController——见 ADR-0009）作为场景节点。这些系统需要在运行时交换数据——玩家 HP 变化需要通知 HUD、物体破坏需要触发连锁传播、Boss 状态变化需要更新多个 UI 元素。没有统一的通信架构，每个系统会以不同方式连接，导致紧密耦合、调试困难和不可预测的依赖关系。

### Constraints
- 17 个 Autoload + 1 个场景节点（PlayerController），单人开发——复杂度管理优先于极致性能
- Godot 4.6 原生 Signal 系统——不应引入外部消息框架
- 系统按层组织（Foundation → Core → Feature → Presentation）——上层可依赖下层，不可反向
- 移动端 60fps——Signal 调度必须在帧预算内

### Requirements
- 每个系统可独立测试（mock Signal 发送者）
- 系统间依赖关系必须显式声明（不可隐式跨层调用）
- 新增系统不需要修改现有系统代码
- Signal 连接在游戏启动时完成，运行时无动态连接/断开

## Decision

**采用 Godot Autoload 单例 + 直接 Signal 连接模式，PlayerController 为唯一场景节点例外。**

17 个 MVP 系统实现为 Godot Autoload（`res://autoload/[system_name].gd`），在项目设置中注册。PlayerController（ADR-0009）作为场景节点——随房间 .tscn 实例化和销毁，直接读取 TouchInput Autoload 的属性和 Signal。系统之间通过直接连接彼此的 Signal 通信——消费者在 `_ready()` 中声明它订阅哪些 Signal，发送者在状态变化时 emit。

### Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                Autoload Registry (17 systems)          │
│                                                       │
│  TouchInput ──→ [PlayerController] ──→ WeaponSystem   │
│  (Autoload)     (场景节点, ADR-0009)    (Autoload)     │
│       │              │    │                           │
│       └──────────────┼────┼──→ ShootingProjectile     │
│                      │    │         │                 │
│  PhysicsConfig ──────┼────┼─────────┘                 │
│       │              │    │                           │
│  GameStateMachine ───┤    │      ChainPropagation      │
│       │              │    │           ↑                │
│  SceneManager ───────┤    │   MaterialDestruction ─────┘
│       │              │    │           ↑                │
│  LevelDesignData ────┼────┤   HitDetection             │
│                      │    │                            │
│  EnemySpawnWave ─────┼────┤   HealthDamage             │
│       │              │    │      ↑ ↓                   │
│  EnemyAI ────────────┤    │   DeathRespawn ───────────┘
│       │              │    │                            │
│  BossAI ─────────────┤    │   CameraSystem             │
│       │              │    │                            │
│       └──────────────┼────┤   HUD ← 订阅多个 Signal    │
│                      │    │                            │
│                          TouchControlUI                 │
│                                                       │
│  [PlayerController] = 唯一场景节点——随房间 .tscn 实例化 │
└──────────────────────────────────────────────────────┘
```

### Key Interfaces

每个 Autoload 遵循统一模式：

```gdscript
# 示例: health_damage.gd (Autoload 注册为 "HealthDamage")
extends Node

## Signal: 任何实体 HP 变化时发射
signal health_changed(entity: Node, old_hp: int, new_hp: int)

## Signal: 实体 HP 降至 0 时发射
signal entity_died(entity: Node, killer_source: String)

var _hp_map: Dictionary = {}  # entity_id → current_hp

func apply_damage(entity: Node, hit_data: HitData) -> void:
    # 计算伤害 → 更新 HP → emit health_changed / entity_died
    pass
```

消费者在 `_ready()` 中连接：

```gdscript
# 示例: hud.gd
func _ready():
    HealthDamage.health_changed.connect(_on_health_changed)
    BossAI.boss_state_changed.connect(_on_boss_state_changed)
    ChainPropagation.chain_depth_changed.connect(_on_chain_depth_changed)
```

### 层间通信规则

| 规则 | 说明 |
|------|------|
| **向下依赖** | 上层可连接下层 Signal（如 HUD 连接 HealthDamage） |
| **向上禁止** | 下层不可连接上层 Signal（如 HealthDamage 不可连接 HUD） |
| **同层可通** | 同层系统可互相连接（如 ChainPropagation 连接 MaterialDestruction） |
| **禁止跨两层** | Presentation 层不可直接连接 Foundation 层 Signal（必须经过 Core/Feature） |

## Alternatives Considered

### Alternative A: 集中式 EventBus
- **Description**: 单一 `EventBus` Autoload 作为消息路由中心。所有系统通过 `EventBus.emit("topic", data)` 发布消息，通过 `EventBus.subscribe("topic", callback)` 订阅。
- **Pros**: 系统间完全解耦，新增系统无需修改任何现有系统代码，易于添加日志/重放/调试中间件
- **Cons**: 字符串 topic 无类型安全，Signal 参数无编译时检查；所有消息经过单一 Autoload 增加调用栈深度；Godot 原生 Signal 系统被绕过
- **Rejection Reason**: 17 个系统不需要集中式路由的完全解耦能力——直接 Signal 连接在单人项目中更简单、更可调试、性能更好。且 Godot 的 Signal 系统已提供强类型参数检查，EventBus 的字符串 topic 反而降低了类型安全性。

### Alternative B: 纯场景树 Signal 冒泡
- **Description**: 不使用 Autoload。系统作为节点放置在场景树中，Signal 通过 `get_tree().root` 冒泡。跨系统通信通过 `get_node("/root/[system]")` 获取引用。
- **Pros**: 无 Autoload 开销——减少启动时间和常驻内存；Signal 冒泡与 Godot UI 事件模型一致
- **Cons**: 场景切换时节点被移除 → Signal 连接断开 → 需要每次加载场景重新连接；跨分支通信需要经过 root，路径脆弱；每个使用处需要 `get_node()` 字符串路径，重构易出错
- **Rejection Reason**: 房间制关卡需要频繁切换场景（每个房间一个场景），纯场景树 Signal 在场景切换时会断开全部连接。Autoload 的常驻特性正好解决这个问题——系统在场景切换期间存活。

### Alternative C: 最少 Autoload + 手动依赖注入
- **Description**: 仅 3-5 个 Foundation 层系统作为 Autoload。Core/Feature 层系统作为 `PackedScene` 动态实例化，通过构造函数或 `configure()` 方法接收依赖引用。
- **Pros**: Autoload 数量最少——启动快；依赖关系在构造时验证，缺失依赖立即报错；易于单元测试（mock 注入）
- **Cons**: 每个实例化处需要手动传递所有依赖——样板代码多；Feature 层系统需要被多个场景复用，依赖注入增加场景加载复杂度
- **Rejection Reason**: 17 个系统中大部分是全局单例（同一时间只有一个 HUD、一个 Enemy AI 管理器）。将这些作为场景实例化反而不自然——Godot 的 Autoload 就是为全局单例设计的。

## Consequences

### Positive
- 系统间依赖在 `_ready()` 的 `signal.connect()` 调用中显式可见——新开发者可直接阅读代码理解数据流
- Godot 原生 Signal 参数有编译时类型检查——连接不匹配会在启动时报错
- Autoload 在场景切换期间存活——房间切换时系统状态不丢失
- 每个 Autoload 可独立测试：测试脚本加载 Autoload，emit Signal，验证响应

### Negative
- 17 个 Autoload 增加启动时间（每个 `_ready()` 顺序执行）。预估额外启动开销 < 100ms——在目标范围内
- Autoload 之间可能产生隐式循环依赖（如 A._ready() 中连接 B 的 Signal，B._ready() 中又调用 A 的方法）。缓解：`_ready()` 中只做 Signal 连接，不做业务逻辑调用
- 所有 Autoload 常驻内存——17 个 Autoload 预估内存占用 ~5-10MB（Acceptable）

### Risks
- **循环 Signal 风险**: A emit → B 的回调中 emit → A 的回调中 emit → 无限循环。缓解：所有可能触发回传的 Signal 处理中使用 guard flag
- **Autoload 初始化顺序**: 如果 A 的 `_ready()` 在 B 之前执行但 A 需要 B 的 Signal，A 的连接在 B 注册 Signal 之前生效（Godot Signal 可以在发送者 `_ready()` 之前连接）。缓解：利用 Godot 的 Autoload 注册顺序（Project Settings → Autoload 列表从上到下）

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| health-damage.md | `health_changed` signal 供 HUD 消费 | HUD Autoload 在 `_ready()` 中 `HealthDamage.health_changed.connect()` |
| material-destruction.md | `object_destroyed` signal 供 Chain Propagation 消费 | ChainPropagation Autoload 连接 MaterialDestruction.object_destroyed |
| boss-ai.md | 6 个 Boss 状态 signal 供 HUD + Enemy Spawn 消费 | HUD/EnemySpawn 在 `_ready()` 中连接对应 BossAI signal |
| chain-propagation.md | `chain_depth_changed` signal 供 HUD 消费 | HUD 连接 ChainPropagation.chain_depth_changed |
| scene-manager.md | 场景切换期间系统状态不丢失 | Autoload 常驻内存——不受 `change_scene_to_file()` 影响 |
| player-controller.md | PlayerController 通过 TouchInput Autoload 读取输入信号 | PlayerController 是场景节点，直连 TouchInput 属性和 Signal——不经过 TouchControlUI 中转（ADR-0009） |

## Performance Implications
- **CPU**: Signal emit + 回调开销 < 0.01ms 每个连接（Godot Signal 为直接函数调用，无动态分发）。17 个系统 × 平均 3 个连接 = ~54 个连接，总开销 < 0.5ms/frame
- **Memory**: 17 个 Autoload 常驻 ~5-10MB（每个 Autoload 仅持有配置引用和少量运行时状态）
- **Load Time**: 17 个 `_ready()` 顺序执行，预估 < 100ms 额外启动时间

## Migration Plan
本项目尚无代码——此为初始架构决策。实施步骤：
1. 在 Project Settings → Autoload 中按层顺序注册所有系统（Foundation → Core → Feature → Presentation）
2. 每个 Autoload 在 `_ready()` 中声明 Signal 连接（仅向下或同层连接）
3. CI 添加启动测试：验证所有 Autoload 初始化成功，所有 Signal 连接无运行时错误

## Validation Criteria
- 所有 17 个 Autoload 成功注册并初始化（无启动时错误）
- 上层系统不包含对下层系统的直接引用（仅通过 Signal 消费）
- 每个 Signal emit 在消费者端产生预期响应（手动测试或集成测试验证）
- 场景切换 5 次后无 Signal 连接泄漏（内存占用不增长）

## Related Decisions
- ADR-0002: 场景加载策略（Autoload 使 `change_scene_to_file` 成为可能——系统状态在切换期间存活）
- ADR-0004: 命中检测架构（HitData 通过 Signal 传递）
- ADR-0006: 连锁传播递归（递归 Signal 处理的安全性）
- ADR-0009: 玩家控制器（唯一的场景节点例外——通过 TouchInput Autoload 进行 Signal 通信）
