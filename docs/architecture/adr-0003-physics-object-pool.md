# ADR-0003: 物理对象池设计

## Status
Accepted

## Date
2026-05-22

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Godot 4.6 |
| **Domain** | Physics / Core |
| **Knowledge Risk** | LOW — GodotPhysics2D 在 4.4-4.6 中无变更，对象池是纯 GDScript 模式，不涉及引擎 API 变更 |
| **References Consulted** | `docs/engine-reference/godot/VERSION.md`, `docs/engine-reference/godot/modules/physics.md`, `docs/engine-reference/godot/breaking-changes.md`, `docs/engine-reference/godot/deprecated-apis.md`, `docs/engine-reference/godot/current-best-practices.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | 中端 Android 设备上 50 个活跃 RigidBody2D 碎片的帧时间实测；对象池 FIFO 回收边界测试 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Autoload + Direct Signal 架构) — 对象池系统作为 Autoload 运行，ADR-0002 (场景加载策略) — 池生命周期与 `room_active`/场景切换绑定 |
| **Enables** | ADR-0005 (材质破坏管线), ADR-0007 (子弹生命周期) |
| **Blocks** | Material Destruction Epic, Shooting/Projectile Epic — 必须先确定对象池架构才能实现碎片和子弹的创建/回收逻辑 |
| **Ordering Note** | 必须在 ADR-0005 和 ADR-0007 之前被 Accepted — 这两个 ADR 的接口设计依赖对象池的 acquire/release API |

## Context

### Problem Statement
坍塌禁区有两个系统在运行时高频创建 RigidBody2D 节点：
- **Material Destruction** — 物体破坏时生成 3~10 个碎片 RigidBody2D，连锁传播可能在同一帧内触发多次破坏（最多 ~30 碎片/帧）
- **Shooting/Projectile** — 每次射击创建一个子弹 RigidBody2D，战斗密集期 ~2-3 子弹/秒

在移动端（中端 Android/iOS）上，`PackedScene.instantiate()` 涉及节点分配、资源加载和 `_ready()` 调用——如果在 `_physics_process` 中执行，会造成帧尖峰。预分配对象池将运行时分配开销移到启动阶段，确保游戏帧率稳定。

### Constraints
- 目标平台：中端移动设备 60fps（帧预算 16.6ms）
- Godot 4.6 + GodotPhysics2D（Jolt 不适用——仅 3D）
- 活跃 RigidBody2D 硬上限 70（碎片 50 + 子弹 20）——来自 physics-config GDD 的移动端性能预算
- 对象池必须是 Autoload（ADR-0001）——在场景切换期间存活
- 池内对象预分配在 `_ready()` 中完成——不延迟到首次使用时

### Requirements
- 碎片和子弹从池中获取，不直接 `PackedScene.instantiate()`
- 池耗尽时 FIFO 回收：最早创建的活跃对象被强制回收
- 场景切换时（`room_active` Signal）自动回收所有活跃对象
- 碎片生命周期到期（默认 7s）自动回收；子弹生命周期到期（默认 3s 或 max_distance）自动回收
- 回收的对象状态完全重置（velocity 归零、disable、freeze）
- 池状态可通过 Signal 被 HUD 和 QA 工具观测

## Decision

**采用统一 PhysicsObjectPool Autoload，管理碎片和子弹两个预分配子池，FIFO 回收策略。**

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│              PhysicsObjectPool (Autoload)                  │
│                                                            │
│  ┌─────────────────────┐   ┌─────────────────────┐        │
│  │   debris_pool (50)  │   │ projectile_pool (20)│        │
│  │   RigidBody2D[]     │   │   RigidBody2D[]     │        │
│  │   pre-alloc @_ready │   │   pre-alloc @_ready │        │
│  └───────┬─────────────┘   └───────┬─────────────┘        │
│          │                         │                       │
│  acquire_debris()          acquire_projectile()           │
│  release_debris()          release_projectile()           │
│                                                            │
│  Signals:                                                  │
│    pool_exhausted(type: String)                            │
│    pool_recovered(type: String)                            │
│    pool_stats_changed(type: String, active: int, free: int)│
└──────────────────────────────────────────────────────────┘
         ▲ acquire              ▲ acquire        │ release
         │                      │                │ (auto: lifetime
    ┌────┴────┐           ┌─────┴──────┐         │  expiry / scene
    │Material │           │ Shooting/  │         │  switch)
    │Destruct │           │ Projectile │         │
    └─────────┘           └────────────┘         │
                                          ┌──────┴──────┐
                                          │  Pooled obj │
                                          │  returns to │
                                          │  free list  │
                                          └─────────────┘
```

### Key Interfaces

```gdscript
# PhysicsObjectPool Autoload (Foundation Layer)
extends Node

const DEBRIS_POOL_SIZE := 50
const PROJECTILE_POOL_SIZE := 20
const DEBRIS_DEFAULT_LIFETIME := 7.0
const PROJECTILE_DEFAULT_LIFETIME := 3.0

# ── 碎片池 ──

## 从池中获取一个碎片 RigidBody2D。池耗尽时 FIFO 回收最早活跃碎片。
## material_type: "wood" | "metal" | "concrete" | "organic" | "composite"
## 返回的 RigidBody2D 已设置好 position、linear_velocity、PhysicsMaterial、collision_layer=5
func acquire_debris(material_type: String, position: Vector2, velocity: Vector2) -> RigidBody2D:
    pass

## 回收一个碎片到池中（自动调用——生命周期到期或场景切换时）
func release_debris(node: RigidBody2D) -> void:
    pass

# ── 子弹池 ──

## 从池中获取一颗子弹 RigidBody2D。
## bullet_type: "standard" | "sticky"
## 返回的 RigidBody2D 已设置好 origin、target direction、speed、collision_layer=3、CCD 启用
func acquire_projectile(bullet_type: String, origin: Vector2, target: Vector2, source_entity: Node) -> RigidBody2D:
    pass

## 回收一颗子弹到池中（碰撞/超距/超时后自动调用）
func release_projectile(node: RigidBody2D) -> void:
    pass

# ── 全局操作 ──

## 回收所有活跃对象（场景切换时由 SceneManager.room_active 触发）
func recycle_all() -> void:
    pass

## 获取池统计信息（供 HUD/调试用）
func get_pool_stats() -> Dictionary:
    pass

# ── Signals ──

## 子池耗尽（活跃数 == 容量）——HUD 可显示警告
signal pool_exhausted(type: String)  # "debris" | "projectile"

## 子池从耗尽状态恢复（有可用对象）
signal pool_recovered(type: String)

## 池统计变化（活跃数/空闲数变化时发射，供调试面板消费）
signal pool_stats_changed(type: String, active_count: int, free_count: int)
```

### 对象生命周期状态机

```
         ┌──────────────┐
         │    FREE      │ ← 预分配初始状态
         │ process_mode │
         │   = DISABLED │
         │ freeze=true  │
         │ collision_   │
         │   layer=0    │  ← 关键：关闭碰撞，防止世界原点隐形碰撞墙
         │   mask=0     │
         │ velocity=0   │
         │ visible=false│
         └──────┬───────┘
                │ acquire_*()
                ▼
         ┌──────────────┐
         │   ACTIVE     │ ← 在游戏世界中
         │ enabled      │
         │ collision_   │
         │   layer/mask │  ← 恢复对应碰撞配置
         │   = restored │
         │ freeze=false │
         │ visible=true │
         └──────┬───────┘
                │ trigger: lifetime expiry OR scene switch OR manual release
                ▼
         ┌──────────────┐
         │  RELEASING   │ ← 过渡帧（1 frame）
         │ velocity=0   │
         │ collision_   │
         │   layer=0    │  ← 立即关闭碰撞（本帧内不再参与物理）
         │   mask=0     │
         │ freeze=true  │
         │ visible=false│
         │ process_mode │
         │   = DISABLED │
         └──────┬───────┘
                │ next frame
                ▼
         ┌──────────────┐
         │    FREE      │
         └──────────────┘
```

### 回收策略详解

**常规回收** — 每个从池中获取的对象附带一个 `Timer`（或 `_process` 中检查 `lifetime` 字段）。到期后自动调用 `release()`。

**FIFO 强制回收** — 当 `acquire_*()` 被调用且空闲列表为空：
1. 找到该子池中 `creation_frame` 最早的活跃对象
2. 调用 `release()` 强制回收该对象（该对象在游戏世界中立即消失）
3. 从回收的对象位置获取"新"对象
4. Emit `pool_exhausted(type)`——HUD 可显示"物理对象过多"警告

**场景切换回收** — SceneManager 发射 `room_active` 时，PhysicsObjectPool 连接此 Signal，调用 `recycle_all()`——所有活跃对象回到 FREE 状态。这确保新房间开始时无上一房间残留的碎片/子弹。

### 预分配策略

在 `_ready()` 中完成全部 70 个 RigidBody2D 的预分配：

```gdscript
func _ready():
    # 连接场景切换回收
    SceneManager.room_active.connect(_on_room_active)

    # 预分配碎片池
    for i in DEBRIS_POOL_SIZE:
        var debris := _create_pooled_rigidbody(PoolType.DEBRIS)
        debris.freeze = true
        debris.process_mode = PROCESS_MODE_DISABLED
        debris.visible = false
        add_child(debris)
        _free_debris.append(debris)

    # 预分配子弹池
    for i in PROJECTILE_POOL_SIZE:
        var proj := _create_pooled_rigidbody(PoolType.PROJECTILE)
        proj.continuous_cd = RigidBody2D.CCD_MODE_CAST_RAY
        proj.freeze = true
        proj.process_mode = PROCESS_MODE_DISABLED
        proj.visible = false
        add_child(proj)
        _free_projectiles.append(proj)
```

所有 70 个 RigidBody2D 在启动时创建完毕——运行时无需任何 `instantiate()` 调用。

### Godot 实现注意事项

1. **`collision_layer = 0` / `collision_mask = 0` 在释放时必须设置** — `freeze = true` 仅停止 RigidBody2D 的物理运动——**碰撞形状仍然注册在物理空间中**。如果 `release_*()` 仅设置 `freeze = true`，50 个冻结碎片将堆在世界原点形成隐形碰撞墙，阻挡玩家和敌人。释放时必须同时将 `collision_layer = 0` 和 `collision_mask = 0`，在 `acquire_*()` 中恢复对应值。

2. **`process_mode = PROCESS_MODE_DISABLED`** — 彻底禁用对象的 `_process`/`_physics_process`/`_input` 回调。比单独 `set_process(false)` 更彻底。

3. **`freeze = true` 而非仅 `sleeping = true`** — `freeze` 使 RigidBody2D 停止所有物理运动。`sleeping` 是引擎管理的自动休眠，可能在受到外力时自动唤醒。但 `freeze` 不关闭碰撞检测——因此必须与 `collision_layer = 0` 配合使用。

4. **`visible = false`** — 释放时隐藏对象，避免 FREE 状态的对象被渲染。

5. **`top_level = true` 的安全防护** — PhysicsObjectPool 继承自 `Node`（非 `Node2D`），其 transform 为 identity 且不会传播给子节点。设置 `top_level = true` 在 `Node` 父节点下无实际效果，但作为安全防护保留——未来如果父类改为 `Node2D` 或移入场景树分支，对象行为不会意外改变。

6. **CCD 仅在子弹上启用** — 碎片速度较低（<1000 px/s），不需要 CCD。子弹速度 1500-2000 px/s，需要 `CCD_MODE_CAST_RAY` 防止穿透。

7. **子节点（CollisionShape2D, Sprite2D）预分配** — 所有 70 个 RigidBody2D 的子节点（CollisionShape2D + Sprite2D placeholder）在 `_ready()` 预分配期间创建完毕。`acquire_*()` 中仅调整形状参数（如碎片使用 CircleShape2D 或 RectangleShape2D）和精灵纹理——不创建新节点。

8. **PhysicsMaterial 资源预加载** — 5 种材质类型（wood/metal/concrete/organic/composite）的 PhysicsMaterial 在 `_ready()` 中通过 `preload()` 缓存为 Dictionary，`acquire_debris()` 中按 material_type 查找并赋值。不在运行时加载资源文件。

### 容量预算

| 子池 | 容量 | 峰值场景 | 内存估算 |
|------|------|---------|---------|
| debris_pool | 50 | Boss 房间大面积坍塌 + 连锁传播 | ~2.5 MB（50 × ~50 KB/RigidBody2D） |
| projectile_pool | 20 | 快速点射 + 粘弹附着未引爆 | ~1.0 MB（20 × ~50 KB） |
| **总计** | **70** | — | **~3.5 MB** |

内存估算基于每个 RigidBody2D ~50 KB（含 CollisionShape2D + Sprite2D + 脚本引用）。总内存 <5 MB——在移动端可接受范围内。

## Alternatives Considered

### Alternative A: 无对象池 — 按需 `PackedScene.instantiate()` + `queue_free()`

- **Description**: 每次需要碎片或子弹时直接 `preloaded_scene.instantiate()`，生命周期结束时 `queue_free()`。无池管理代码。
- **Pros**: 代码最简——无池管理逻辑，无预分配，无回收追踪；碎片和子弹的数量天然无上限；Godot 的标准节点使用模式
- **Cons**: `instantiate()` 在 `_physics_process` 中分配内存——移动端可能造成 1-5ms 帧尖峰；`queue_free()` 延迟释放——对象在内存中停留到帧末，峰值内存不可控；无容量上限——Boss 房间连续坍塌可能瞬间产生 100+ 个 RigidBody2D，导致帧率崩塌
- **Rejection Reason**: physics-config GDD AC7 明确要求对象池，且移动端 60fps 目标无法容忍 `_physics_process` 中的分配尖峰。拒绝此方案但不否定其在 PC 端的可行性——如果未来移植到 PC，此方案可作为备选。

### Alternative B: 两个独立子池（DebrisPool + ProjectilePool 各自作为独立 Autoload）

- **Description**: 碎片和子弹各自由独立的 Autoload 管理——`DebrisPool` 和 `ProjectilePool` 各自预分配、各自回收。
- **Pros**: 关注点分离——碎片和子弹的获取/回收 API 完全独立；某个池的 bug 不影响另一个；未来如需为子弹增加特殊池策略（如按弹型分子池），修改范围局限于 ProjectilePool
- **Cons**: 两个 Autoload 增加启动时间和常驻内存；碎片和子弹共享相同的释放触发条件（场景切换）——需要两个 Autoload 都连接 SceneManager.room_active，逻辑重复；ADR-0001 的 18 个 Autoload 已经接近上限——尽量减少 Autoload 数量
- **Rejection Reason**: 边际收益不足——碎片和子弹的池逻辑高度相似（都是 RigidBody2D acquire/release），分开为两个 Autoload 增加了约 100 行重复代码和 1 个额外 Autoload 的常驻开销。合并为一个 Autoload 的两个子池在代码复用和维护性上更优。

### Alternative C: 静态碎片池 + 子弹按需创建（混合方案）

- **Description**: 仅对碎片进行池化（碎片数量大、频率高），子弹按需 `PackedScene.instantiate()`（子弹并发数低，最多同时 3-5 颗）。
- **Pros**: 减少预分配开销——仅预分配 50 个碎片 RigidBody2D，子弹不占用池空间；子弹创建频率低（2-3 发/秒 = 每 300-500ms 一次），`instantiate()` 尖峰不在关键路径上
- **Cons**: 两类对象的创建路径不一致——碎片走池，子弹走 instantiate——增加代码认知负担；未来如果添加快射速武器（如机枪），子弹路径会暴露 `instantiate()` 尖峰问题；子弹同样需要在场景切换时清理——不一致的回收路径增加遗漏风险
- **Rejection Reason**: 子弹确实是低频创建（shoot_interval 限制了每帧最多 1 颗），但为了一致性——所有运行时 RigidBody2D 走同一路径——池化子弹是边际成本极低的安全网。20 个预分配子弹仅增加 ~1 MB 内存，换来未来武器扩展的灵活性。

## Consequences

### Positive
- 运行时零 `PackedScene.instantiate()` 调用——所有 RigidBody2D 在启动时预分配完毕，帧时间稳定
- FIFO 回收策略天然限制 RigidBody2D 数量——活跃碎片 ≤50、活跃子弹 ≤20——防止性能雪崩
- 场景切换时自动回收——`room_active` Signal 触发 `recycle_all()`，无需每个系统手动清理
- `pool_exhausted`/`pool_recovered` Signal 提供可观测性——HUD 可显示"物理对象过多"，QA 可追踪池压力
- 预分配开销可预测——70 个 RigidBody2D 在 `_ready()` 中分配，与 ADR-0001 的 18 个 Autoload `_ready()` 顺序执行，总启动开销仍 <200ms

### Negative
- 预分配 70 个 RigidBody2D 增加启动时间（预估 30-50ms）和常驻内存（~3.5 MB）
- 池容量硬上限——Boss 房间大面积坍塌时如果 50 个碎片全在活跃，新碎片请求会强制回收最早碎片，可能导致"碎片消失"的视觉不一致
- 池对象作为 PhysicsObjectPool 的子节点——`top_level = true` 是必须的，忘记设置会导致 transform 错误
- 启动时的预分配必须在所有 Autoload `_ready()` 之间协调——PhysicsObjectPool 的 `_ready()` 依赖于 PhysicsConfig 先加载（以获取碰撞层常量和 PhysicsMaterial 引用）

### Risks
- **FIFO 回收导致视觉不一致**: Boss 房间坍塌时如果 50 个碎片池全满，新碎片会强制回收最早的活跃碎片——该碎片在游戏中"突然消失"。缓解：`pool_exhausted` Signal 触发时，HUD 可显示警告；在 Boss 房间设计时控制同时破坏的物体数量（通过关卡设计约束，而非代码硬限制）
- **预分配在低端设备上可能超时**: 70 个 RigidBody2D 的创建在低端设备上可能耗时 >100ms。缓解：启动画面覆盖这段时间；如果 profiling 显示启动过长，可考虑延迟分配（Alpha 阶段）
- **`top_level = true` 的 RigidBody2D 碰撞行为**: top_level RigidBody2D 的碰撞响应与场景树中的 RigidBody2D 行为一致——GodotPhysics2D 中已验证。但不同设备的浮点精度可能导致碎片飞出速度的微小差异。缓解：不依赖精确速度值，仅依赖"碎片大致向倒塌方向飞散"
- **场景切换时的回收竞态**: `room_active` Signal 触发 `recycle_all()`，但此时旧场景可能还有正在处理碰撞回调的碎片。缓解：`recycle_all()` 使用 `call_deferred()` 延迟一帧执行，确保当前帧的物理回调全部完成

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| physics-config.md | §7 对象池：碎片 RigidBody2D 池大小 50，FIFO 回收 | `debris_pool` 容量 50，`acquire_debris()` 满时 FIFO 回收最早活跃碎片 |
| physics-config.md | AC7: 连续 60 个碎片请求 → 第 51 个回收最早创建的 | FIFO 回收策略——通过 `creation_frame` 字段追踪，最早活跃对象被优先回收 |
| physics-config.md | §6 physics_ticks_per_second=60, max_physics_steps=8 | 池对象不修改物理步进配置——继承 Godot 默认设置 |
| material-destruction.md | §5 碎片生命周期 5~10 秒后回收 | `DEBRIS_DEFAULT_LIFETIME = 7.0`，可配置 |
| material-destruction.md | §5 碎片碰撞层 = PhysicsObject(5) | `acquire_debris()` 设置 `collision_layer = 5, collision_mask = 1|2|3|4|5` |
| material-destruction.md | AC6: 碎片超时后回收至对象池 | `release_debris()` 重置 velocity + freeze + disable → 回到空闲列表 |
| shooting-projectile.md | §3/§4 子弹 RigidBody2D，CCD 启用，碰撞层=3 | `acquire_projectile()` 设置 CCD_MODE_CAST_RAY, collision_layer=3 |
| shooting-projectile.md | §2/§3 子弹 lifetime=3s, max_distance=1500 | `PROJECTILE_DEFAULT_LIFETIME = 3.0`，`acquire_projectile()` 设置追踪字段 |
| shooting-projectile.md | AC4: 子弹超距/超时自动销毁 | 子弹生命周期到期 → `release_projectile()` 回收 |

## Performance Implications
- **CPU**: `acquire_*()` / `release_*()` 是 O(1) 数组操作（pop/push），<0.01ms/次。最坏情况（FIFO 回收）需遍历活跃列表找最早对象 O(n) ≤ 50 次迭代，<0.05ms
- **Memory**: 70 个预分配 RigidBody2D 常驻 ~3.5 MB。活跃时不变——回收不 free 节点，仅 disable
- **Load Time**: 70 个 RigidBody2D 预分配预估 30-50ms（含 CollisionShape2D + Sprite2D + PhysicsMaterial 资源加载）。总启动时间（18 Autoload `_ready()` + 对象池预分配）<200ms
- **Network**: N/A（无网络依赖）

## Migration Plan
本项目尚无代码——此为初始架构决策。实施步骤：
1. PhysicsObjectPool Autoload 实现 `acquire_debris()` / `release_debris()` / `acquire_projectile()` / `release_projectile()` / `recycle_all()`
2. MaterialDestruction Autoload 中：破坏逻辑调用 `PhysicsObjectPool.acquire_debris()` 替代 `PackedScene.instantiate()`
3. ShootingProjectile Autoload 中：射击逻辑调用 `PhysicsObjectPool.acquire_projectile()` 替代 `PackedScene.instantiate()`
4. 连接 `SceneManager.room_active` → `PhysicsObjectPool.recycle_all()`
5. 集成测试：验证碎片获取→使用→回收→再获取的完整生命周期
6. 压力测试：连续 60 次 `acquire_debris()` 验证 FIFO 回收正确触发

## Validation Criteria
- 70 个 RigidBody2D 在 `_ready()` 中预分配成功（无错误/警告）
- `acquire_debris()` 返回的碎片具有正确的 collision_layer=5 和 PhysicsMaterial
- `acquire_projectile()` 返回的子弹具有 CCD_MODE_CAST_RAY 和 collision_layer=3
- 池耗尽测试：连续 55 次 `acquire_debris()` → 第 51 次触发 FIFO 回收 + `pool_exhausted("debris")` Signal
- 场景切换测试：`room_active` → 所有活跃对象回到 FREE 状态（`get_pool_stats()` 验证）
- 回收后对象状态：velocity = Vector2.ZERO, freeze = true, visible = false, process_mode = PROCESS_MODE_DISABLED
- 内存测试：10 次场景切换后常驻内存增长 <2MB（确保无泄漏）
- `pool_exhausted` 后当活跃数降到容量以下时，`pool_recovered` Signal 正确发射

## Implementation Notes (from Engine Specialist Review)

以下内容来自 `godot-specialist` 验证（2026-05-22），非阻塞——实现时注意即可：

1. **`freeze` 不关闭碰撞（BLOCKING —— 已修复）**: GodotPhysics2D 中 `freeze = true` 停止运动但保留碰撞形状注册。释放对象时如果仅 freeze 而不清零 collision_layer/mask，所有 FREE 状态的 RigidBody2D 将堆在世界原点 (0,0) 形成隐形碰撞墙。此问题已在 Godot 实现注意事项 #1 和生命周期状态机中修复——`release_*()` 必须设置 `collision_layer = 0; collision_mask = 0`。

2. **子弹 `collision_mask` 待定**: `acquire_projectile()` 的 bullet collision_mask 未在此 ADR 中定义——碎片 mask 为 `1|2|3|4|5`（与所有层碰撞），但子弹可能需要不同的 mask（例如不碰撞 Player 层 1，或粘弹不碰撞其他子弹层 3）。此决定推迟到 ADR-0007（子弹生命周期）。

3. **`creation_frame` 追踪实现**: FIFO 回收需要按 `creation_frame` 排序活跃对象。建议在 RigidBody2D 上通过 `set_meta("creation_frame", frame_id)` 存储，获取时由 PhysicsObjectPool 递增帧计数器。不创建并行数组——`get_meta()` 比字典查找更快且无额外内存开销。

4. **子节点生命周期明确化**: 所有 CollisionShape2D 和 Sprite2D 子节点在预分配期间创建。获取时按需调整形状尺寸/类型（碎片可能用 CircleShape2D 或 RectangleShape2D），但节点本身不新建。这保证了 ADR 中"运行时零 instantiate()"的性能声明成立。

5. **PhysicsMaterial 预加载**: 5 种材质 PhysicsMaterial（.tres 资源）在 `_ready()` 中通过 `preload()` 一次性加载到 Dictionary 中，`acquire_debris()` 通过 material_type 键取值并赋值 `physics_material_override`。不在运行时加载资源。

## Related Decisions
- ADR-0001: Autoload + Direct Signal 架构（PhysicsObjectPool 作为 Autoload 运行的前提）
- ADR-0002: 场景加载策略（池回收与 `room_active` Signal 绑定）
- ADR-0005: 材质破坏管线（消费碎片池 API）
- ADR-0007: 子弹生命周期（消费子弹池 API）
