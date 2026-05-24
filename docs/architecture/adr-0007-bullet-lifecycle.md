# ADR-0007: 子弹生命周期架构

## Status
Accepted

## Date
2026-05-22

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Godot 4.6 |
| **Domain** | Core / Physics |
| **Knowledge Risk** | LOW — RigidBody2D CCD（`CD_MODE_CAST_RAY`）、`_integrate_forces`、`apply_impulse` 自 Godot 4.0 起稳定。2D 物理 4.4-4.6 无变更 |
| **References Consulted** | `docs/engine-reference/godot/VERSION.md`, `docs/engine-reference/godot/modules/physics.md`, `docs/engine-reference/godot/breaking-changes.md`, `docs/engine-reference/godot/deprecated-apis.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | CCD 在 bullet_speed=2000px/s 下的穿透率（预期 0 穿透）；粘弹附着到移动 RigidBody2D 后的 parent 跟随行为；20 颗活跃子弹的帧时间 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Autoload + Direct Signal) — ShootingSystem 作为 Autoload；ADR-0003 (物理对象池) — 子弹从 PhysicsObjectPool.acquire_projectile() 获取；ADR-0004 (命中检测) — 子弹使用 `_integrate_forces` + `collision_hit` signal 模式，通过 `hit_detected` signal 传递命中 |
| **Enables** | ADR-0008 (武器系统) — ShootingSystem.fire() 是武器系统的射击委托目标；ADR-0006 (连锁传播) — 粘弹引爆调用 trigger_explosion() |
| **Blocks** | Shooting/Projectile Epic, Weapon System Epic — 必须先确定子弹生命周期才能实现射击和武器切换 |
| **Ordering Note** | 必须在 ADR-0003 和 ADR-0004 之后实现——依赖对象池的 acquire_projectile() 和 _integrate_forces 碰撞检测模式 |

## Context

### Problem Statement

子弹是"扣扳机→命中→冲击力"链路的执行者。每发子弹的生命周期跨越多个系统边界：从对象池获取、赋予初速度、在物理引擎中飞行、检测碰撞、产生 HitData、触发 hit-stop、最终回收到池。同时存在两条不同的生命周期路径——标准弹（命中即销毁）和粘弹（附着→延时→引爆）。

核心架构问题：

1. **职责划分**: 子弹的飞行和碰撞逻辑应该放在哪里？集中式 ShootingSystem（每帧 update 所有子弹）vs 分布式子弹脚本（每个 RigidBody2D 自主飞行）

2. **池集成**: 子弹从 PhysicsObjectPool 获取和回收——如何在 acquire/release 生命周期中正确连接/断开 signal、设置碰撞层、重置状态

3. **两条生命周期路径**: 标准弹和粘弹的销毁时机和方式完全不同——标准弹命中即回池，粘弹附着后延时引爆再回池。如何在同一个脚本中清晰建模

4. **source_entity 行为差异**: 玩家子弹触发 hit-stop、对 Enemy 层有碰撞；敌人子弹不触发 hit-stop、对 Enemy 层关闭碰撞（防止友军伤害）。这些行为差异在哪里实现

5. **粘弹的连锁传播集成**: 粘弹引爆时调用 ChainPropagation.trigger_explosion()——如何在粘弹层不直接依赖 ChainPropagation 的前提下触发连锁

### Constraints

- 子弹必须从 PhysicsObjectPool 获取——禁止 `PackedScene.instantiate()`（ADR-0003 强制）
- 碰撞检测必须使用 `_integrate_forces` + `collision_hit` signal 模式（ADR-0004 强制）
- 池容量 20（ADR-0003）——同一帧活跃子弹数 ≤ 20
- `_integrate_forces` 回调在物理步进中执行——hit-stop 触发的 `Engine.time_scale` 修改不能阻塞物理结算
- 移动端 60fps——单发子弹完整生命周期（创建→飞行→命中→回收）总 CPU <0.1ms
- ADR-0001 Signal-First 通信——ShootingSystem 通过 signal 向外暴露事件

### Requirements

- 子弹作为自主 RigidBody2D 飞行——利用 CCD 和原生物理碰撞，不是代码模拟弹道
- ShootingSystem 管理创建/配置/回收/hit-stop——子弹脚本只负责飞行和碰撞检测
- 标准弹：single-hit → 立即回池
- 粘弹：hit → 附着到命中对象 → fuse_duration 延时 → 引爆（AOE + trigger_explosion）→ 回池
- source_entity 区分玩家/敌人子弹的行为差异
- 超距/超时自动回收——静默销毁，无效果
- 所有子弹属性（speed/mass/impulse 等）从配置文件读取

## Decision

**采用混合架构——ShootingSystem Autoload 作为子弹工厂和生命周期协调者，PooledBullet 脚本赋予每颗子弹自主飞行和碰撞检测能力。**

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                     ShootingSystem (Autoload)                         │
│                                                                        │
│  fire(origin, target, bullet_type, source_entity)                     │
│    │                                                                   │
│    ├─ 1. 验证: bullet_type 存在? 池有空闲? shoot_interval 已过?      │
│    ├─ 2. 加载配置: BulletConfig[bullet_type]                          │
│    ├─ 3. PhysicsObjectPool.acquire_projectile()                       │
│    │      ├─ pool → collision_layer = 3 (Projectile)                  │
│    │      ├─ pool → collision_mask = Enemy|World|PhysicsObject        │
│    │      ├─ pool → CCD_MODE_CAST_RAY                                 │
│    │      └─ pool → 设置 mass, gravity_scale                          │
│    ├─ 4. 计算初速度: (target - origin).normalized() * speed           │
│    ├─ 5. apply_impulse(velocity * mass) 或 set_linear_velocity()      │
│    ├─ 6. 连接 collision_hit signal → _on_bullet_hit()                 │
│    ├─ 7. 设置 bullet meta: bullet_type, source_entity, config         │
│    ├─ 8. 启动 lifetime timer (3-5s)                                    │
│    └─ 9. emit bullet_fired(bullet_type, source_entity)                │
│                                                                        │
│  _on_bullet_hit(bullet, body, position, normal, impulse)              │
│    │                                                                   │
│    ├─ 构建 HitData (通过 HitDetection.build_hit_data)                  │
│    ├─ HitDetection.hit_detected.emit(hit_data)                        │
│    │                                                                   │
│    ├─ source_entity == "player"?                                      │
│    │    ├─ CameraSystem.hit_stop(hit_stop_duration, time_scale=0.1)   │
│    │    └─ 正常处理                                                    │
│    │                                                                   │
│    └─ bullet_type 分支:                                               │
│         ├─ "standard": _release_bullet(bullet)  [立即回池]            │
│         └─ "sticky":   _attach_bullet(bullet, body)  [附着+延时]      │
│                                                                        │
│  _attach_bullet(bullet, body)                                         │
│    ├─ bullet 状态 → ATTACHED                                          │
│    ├─ bullet.reparent(body) 或 global_position 跟踪                   │
│    ├─ bullet.collision_layer = 0  (附着期间不碰撞)                    │
│    ├─ 启动 fuse_timer (1.5s)                                          │
│    └─ fuse 到期:                                                       │
│         ├─ ChainPropagation.trigger_explosion(position, radius, force)│
│         └─ _release_bullet(bullet)                                    │
│                                                                        │
│  _release_bullet(bullet)                                              │
│    ├─ 断开 collision_hit signal                                       │
│    ├─ 取消 lifetime timer                                             │
│    ├─ PhysicsObjectPool.release_projectile(bullet)                    │
│    │     ├─ collision_layer = 0 (ADR-0003 FREE 状态)                  │
│    │     ├─ reset_collision_tracking()                                │
│    │     ├─ linear_velocity = Vector2.ZERO                            │
│    │     └─ freeze = true                                             │
│    └─ emit bullet_destroyed(bullet_type, destroy_reason)              │
└──────────────────────────────────────────────────────────────────────┘

PooledBullet 脚本 (附加到每个池化 RigidBody2D):
  extends RigidBody2D
  
  signal collision_hit(body, position, normal, impulse)
  
  var _tracked_colliders: Dictionary = {}
  var state: int = STATE_FLYING  # FLYING | ATTACHED | EXPIRED
  
  func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
      if self.state != STATE_FLYING:
          return  # ATTACHED 期间不检测碰撞
      for i in state.get_contact_count():
          var collider = state.get_contact_collider_object(i)
          if collider and not _tracked_colliders.has(collider.get_instance_id()):
              _tracked_colliders[collider.get_instance_id()] = true
              collision_hit.emit(collider,
                  state.get_contact_collider_position(i),
                  state.get_contact_local_normal(i),
                  state.get_contact_impulse(i))
  
  func reset_collision_tracking() -> void:
      _tracked_colliders.clear()
```

### 子弹状态机

```
                    ┌──────────┐
           ┌───────│   FREE   │◄────── 标准弹命中 / lifetime 到期 / 粘弹引爆后
           │       │ (池中)   │
           │       └────┬─────┘
           │    acquire  │
           │            ▼
           │       ┌──────────┐
           │       │  FLYING  │  collision_layer=3, CCD active
           │       └──┬───┬───┘
           │          │   │
           │   命中   │   │ lifetime/max_distance 到期
           │          │   │
           │   ┌──────┘   └──────┐
           │   ▼                  ▼
           │ ┌──────────┐   ┌──────────┐
           │ │   HIT    │   │ EXPIRED  │  静默——无 HitData, 无效果
           │ │ (标准弹) │   └────┬─────┘
           │ └────┬─────┘        │
           │      │              │
           │      ▼              │
           │ release_projectile  │
           │      │              │
           │      └──────┬───────┘
           │             ▼
           └───── 回到 FREE (池中, collision_layer=0)

           ┌──────────┐
           │  FLYING  │  粘弹命中
           └────┬─────┘
                │
                ▼
           ┌──────────┐
           │ ATTACHED │  collision_layer=0 (不碰撞)
           │ fuse=1.5s│  parent → 命中对象
           └────┬─────┘
                │ fuse 到期 / 被连锁提前引爆
                ▼
           ┌──────────┐
           │DETONATING│  trigger_explosion(radius=150, force=1000)
           └────┬─────┘
                │
                ▼
           release_projectile → FREE
```

### 标准弹 vs 粘弹行为差异

| 阶段 | 标准弹 (standard) | 粘弹 (sticky) |
|------|------------------|---------------|
| **创建** | speed=2000, mass=0.5, impulse=500 | speed=1500, mass=1.0, impulse=200 |
| **飞行** | gravity_scale=0.3, CCD=CAST_RAY | gravity_scale=0.5, CCD=CAST_RAY |
| **命中** | 构建 HitData → emit hit_detected → hit-stop → 立即回池 | 构建 HitData → 不触发 hit-stop → 进入 ATTACHED |
| **附着** | N/A | collision_layer=0, reparent 到命中对象, 启动 fuse_timer |
| **引爆** | N/A | trigger_explosion(pos, 150, 1000) → 连锁传播 |
| **超时** | lifetime=3s, max_distance=1500 → EXPIRED | lifetime=5s, max_distance=1200 → EXPIRED |
| **回收** | 命中/超时 → release_projectile | 引爆后 → release_projectile |

### Key Interfaces

```gdscript
# ShootingSystem Autoload (Core Layer)
extends Node

# ── 配置 ──

## 子弹属性从配置文件读取
## 路径: res://assets/data/weapons/bullet_config.json
## {
##   "standard": {"speed": 2000, "mass": 0.5, "impact_force": 500,
##                "gravity_scale": 0.3, "max_distance": 1500, "lifetime": 3.0,
##                "hit_stop_duration": 0.05},
##   "sticky":    {"speed": 1500, "mass": 1.0, "impact_force": 200,
##                "gravity_scale": 0.5, "max_distance": 1200, "lifetime": 5.0,
##                "fuse_duration": 1.5, "explosion_radius": 150, "explosion_force": 1000}
## }

var _bullet_config: Dictionary = {}
var _active_bullets: Dictionary = {}  # instance_id → BulletMeta
var _last_fire_time: float = 0.0

# ── Signals ──

## 子弹创建成功
signal bullet_fired(bullet_type: String, source_entity: String, origin: Vector2)

## 子弹销毁（回池/超时/超距）
## destroy_reason: "hit" | "expired" | "detonated"
signal bullet_destroyed(bullet_type: String, destroy_reason: String)

# ── 核心 API ──

## 射击入口——武器系统通过此方法发射子弹
func fire(origin: Vector2, target: Vector2, bullet_type: String, source_entity: String) -> RigidBody2D:
    # 1. 验证
    var config := _bullet_config.get(bullet_type)
    if not config:
        push_error("ShootingSystem: unknown bullet_type '%s'" % bullet_type)
        return null
    
    # 2. 池获取
    var bullet := PhysicsObjectPool.acquire_projectile()
    if not bullet:
        PhysicsObjectPool.pool_exhausted.emit("projectile")
        return null
    
    # 3. 配置物理属性
    bullet.mass = config["mass"]
    bullet.gravity_scale = config["gravity_scale"]
    bullet.collision_layer = 1 << 2  # Layer 3 = Projectile (0-indexed: 1<<2)
    bullet.collision_mask = (1 << 1) | (1 << 3) | (1 << 4)  # Enemy(2) | World(4) | PhysicsObject(5)
    
    # enemy 子弹对 Enemy 层关闭碰撞——防止友军伤害
    if source_entity == "enemy":
        bullet.collision_mask &= ~(1 << 1)  # 清除 Enemy 层 bit
    
    # 4. 赋予初速度
    var direction := (target - origin).normalized()
    bullet.global_position = origin
    bullet.linear_velocity = direction * config["speed"]
    
    # 5. 存储 meta——供碰撞回调读取
    bullet.set_meta("bullet_type", bullet_type)
    bullet.set_meta("source_entity", source_entity)
    bullet.set_meta("config", config)
    bullet.set_meta("origin", origin)
    
    # 6. 连接碰撞 signal（绑定 Callable 存储——ADR-0004 模式）
    var bound := _on_bullet_hit.bind(bullet)
    bullet.collision_hit.connect(bound)
    bullet.set_meta("hit_callback", bound)
    
    # 7. 追踪
    _active_bullets[bullet.get_instance_id()] = {
        "type": bullet_type,
        "source": source_entity,
        "fire_time": Time.get_ticks_msec(),
        "origin": origin
    }
    _last_fire_time = Time.get_ticks_msec()
    
    # 8. 启动 lifetime timer
    _start_lifetime_timer(bullet, config["lifetime"], config["max_distance"])
    
    bullet_fired.emit(bullet_type, source_entity, origin)
    return bullet

# ── 碰撞回调 ──

func _on_bullet_hit(body: Node, position: Vector2, normal: Vector2, impulse: float, bullet: RigidBody2D) -> void:
    if not is_instance_valid(bullet):
        return
    
    var config: Dictionary = bullet.get_meta("config")
    var bullet_type: String = bullet.get_meta("bullet_type")
    var source_entity: String = bullet.get_meta("source_entity")
    
    # 构建 HitData——通过 HitDetection 工厂方法确保 9 字段完整
    var hit_data := HitDetection.build_hit_data(
        body, position, normal, impulse, bullet,
        "bullet", source_entity
    )
    HitDetection.hit_detected.emit(hit_data)
    
    # hit-stop——仅玩家子弹触发
    # 使用 call_deferred 延迟到物理步进完成后再修改 Engine.time_scale
    # 在 _integrate_forces 回调链中同步修改 time_scale 可能与物理引擎内部状态冲突
    if source_entity == "player":
        call_deferred("_apply_hit_stop", config.get("hit_stop_duration", 0.05))
    
    # 按弹型分支
    match bullet_type:
        "standard":
            _release_bullet(bullet, "hit")
        "sticky":
            _attach_bullet(bullet, body, config)

# ── hit-stop（deferred——确保在物理步进外执行）──

## call_deferred 目标——不直接在 _integrate_forces 回调链中修改 Engine.time_scale
func _apply_hit_stop(duration: float) -> void:
    CameraSystem.hit_stop(duration, 0.1)

# ── 粘弹附着 ──

func _attach_bullet(bullet: RigidBody2D, body: Node, config: Dictionary) -> void:
    # 停止物理
    bullet.collision_layer = 0
    bullet.set_meta("state", "ATTACHED")
    
    # 跟随命中对象——若为 RigidBody2D 则 reparent
    if body is RigidBody2D:
        bullet.reparent(body, false)  # keep_global_transform
        bullet.freeze = true
        # 父对象被提前破坏时——在最后已知位置引爆（不依赖父对象）
        body.tree_exited.connect(func():
            if not is_instance_valid(bullet):
                return
            # bullet 成为孤儿——在当前位置立即引爆
            var det_pos := bullet.global_position
            ChainPropagation.trigger_explosion(
                det_pos,
                config.get("explosion_radius", 150),
                config.get("explosion_force", 1000)
            )
            _release_bullet(bullet, "detonated")
        , CONNECT_ONE_SHOT)
    else:
        # World 层——记录位置，不跟随
        bullet.freeze = true
    
    # 延时引爆
    var fuse_duration := config.get("fuse_duration", 1.5)
    get_tree().create_timer(fuse_duration).timeout.connect(
        func():
            if not is_instance_valid(bullet):
                return
            var det_pos := bullet.global_position
            ChainPropagation.trigger_explosion(
                det_pos,
                config.get("explosion_radius", 150),
                config.get("explosion_force", 1000)
            )
            _release_bullet(bullet, "detonated")
    )

# ── 回池 ──

func _release_bullet(bullet: RigidBody2D, reason: String) -> void:
    if not is_instance_valid(bullet):
        return
    
    # 断开信号
    var bound: Callable = bullet.get_meta("hit_callback", null)
    if bound and bullet.collision_hit.is_connected(bound):
        bullet.collision_hit.disconnect(bound)
    
    # 清理追踪
    _active_bullets.erase(bullet.get_instance_id())
    
    # 释放到池
    PhysicsObjectPool.release_projectile(bullet)
    
    bullet_destroyed.emit(bullet.get_meta("bullet_type", ""), reason)

# ── 超时/超距 ──

## 使用 Tween + set_loops() 替代递归 create_timer——零递归，单 Tween 对象替代 6-10 个 Timer
func _start_lifetime_timer(bullet: RigidBody2D, lifetime: float, max_distance: float) -> void:
    var origin := bullet.global_position
    var max_dist_sq := max_distance * max_distance
    var fire_time := Time.get_ticks_msec()
    
    var tween := create_tween()
    tween.tween_interval(0.5)
    tween.tween_callback(func():
        if not is_instance_valid(bullet):
            tween.kill()
            return
        var elapsed := (Time.get_ticks_msec() - fire_time) / 1000.0
        if elapsed >= lifetime or bullet.global_position.distance_squared_to(origin) >= max_dist_sq:
            _release_bullet(bullet, "expired")
            tween.kill()
    )
    tween.set_loops()  # 每 0.5s 循环检查——直到 bullet 被 release 时 tween.kill()
```

### source_entity 行为矩阵

| 行为 | source_entity="player" | source_entity="enemy" |
|------|----------------------|---------------------|
| **hit-stop** | 触发 (CameraSystem.hit_stop) | 不触发 |
| **碰撞 Enemy 层** | 开启（子弹可命中敌人） | 关闭（防止友军伤害） |
| **碰撞 Player 层** | 关闭（子弹不命中发射者） | 开启（子弹可命中玩家） |
| **HitData.source_entity** | "player" | "enemy" |
| **ShootingSystem.fire() 调用者** | PlayerController | EnemyAI |

### 与 ADR-0003（对象池）的集成

- 子弹从 `PhysicsObjectPool.acquire_projectile()` 获取——返回预配置的 RigidBody2D（CCD 已启用，collision_layer=3）
- 回池 `PhysicsObjectPool.release_projectile()`——清空 velocity、freeze=true、collision_layer=0、reset_collision_tracking()
- 池容量 20 ——正常射击场景（标准步枪 0.3s 射速 × 子弹 lifetime=3s = 最多 10 颗活跃）绰绰有余
- 粘弹附着期间不占用池的"活跃"槽位（collision_layer=0, freeze=true）——实际仅 3-5 颗标准弹同时飞行

### 与 ADR-0004（命中检测）的集成

- 子弹 RigidBody2D 使用 ADR-0004 定义的 `_integrate_forces` + `collision_hit` signal 模式
- 命中后通过 `HitDetection.build_hit_data()` 统一构建 9 字段 HitData
- 通过 `HitDetection.hit_detected` signal 发射——下游系统（health-damage, material-destruction 等）消费同一 signal
- `damage_type = "bullet"` ——health-damage 查表 type_factor=0.20, boss-ai Pillar 4 子弹 dtc_effective=0.0

### 与 ADR-0006（连锁传播）的集成

- 粘弹引爆调用 `ChainPropagation.trigger_explosion(position, radius, force)`——ADR-0006 入口 2
- 引爆不直接创建碎片——由 ChainPropagation 的内部 query_area → apply_impulse → MaterialDestruction 链处理
- 粘弹附着对象被提前破坏 → 子弹变为无 parent 状态 → 在最后已知位置引爆（与 chain-propagation GDD AC29 一致）

## Alternatives Considered

### Alternative A: ShootingSystem 集中管理子弹飞行

- **Description**: ShootingSystem 在 `_physics_process` 中遍历所有活跃子弹——手动移动位置、手动 raycast 碰撞检测。子弹不是 RigidBody2D——只是数据包（position, velocity, config）。
- **Pros**: 所有子弹逻辑在单一位置——调试方便；不依赖 Godot 碰撞回调的执行顺序；可以精确控制子弹的每帧行为（如穿透弹的多命中）
- **Cons**: 丧失 CCD——手动 raycast 在 bullet_speed=2000px/s 下每帧位移 33px，可能穿透 10px 厚度的薄物体；丧失物理一致性——子弹推动物体（apply_impulse）是代码模拟而非引擎原生碰撞响应，与碎片推动物体的物理规则走不同路径；每帧 20 颗子弹 × 1 raycast = 额外 CPU 开销
- **Rejection Reason**: Pillar 1 要求"每一发子弹都有重量"——子弹必须是真实的物理实体，有质量、受重力、通过引擎物理碰撞推动物体。手动 raycast 子弹是"数据包"，无法产生玩家能感受到的物理冲击力。而且 ADR-0004 已经为 RigidBody2D 碰撞检测建立了 `_integrate_forces` 模式——不使用它是浪费。

### Alternative B: 子弹全部自包含——ShootingSystem 仅调用 fire()

- **Description**: `fire()` 获取子弹、设置属性、赋予速度——此后子弹脚本完全自主管理。碰撞回调、hit-stop、回池都在子弹脚本内部完成。ShootingSystem 不存储 _active_bullets，不参与命中后逻辑。
- **Pros**: 子弹完全自治——新增弹型只需创建新脚本；ShootingSystem 代码极简（<30 行）；符合 Godot 节点独立性的设计哲学
- **Cons**: 子弹脚本需要直接引用 CameraSystem（hit-stop）、HitDetection（build_hit_data）、ChainPropagation（粘弹引爆）——子弹脚本变成了 God Object；粘弹的 fuse_timer 在子弹脚本中——如果子弹在附着期间场景切换（玩家死亡），timer 回调和 scene 生命周期耦合；跨系统的行为差异（player vs enemy 的 hit-stop 和碰撞 mask）分散在子弹脚本中——不如统一在 ShootingSystem 中清晰
- **Rejection Reason**: 子弹脚本的职责应该是"飞行和碰撞检测"——物理层面的自主行为。而 hit-stop、连锁传播触发、source_entity 行为差异是系统级决策——属于 ShootingSystem 的协调职责。将两者塞进子弹脚本违反了单一职责原则。

### Alternative C: 子弹不回收——即时销毁和重新实例化

- **Description**: 子弹命中后直接 `queue_free()`——不回到对象池。下一发子弹从 `PackedScene.instantiate()` 创建。
- **Pros**: 无需对象池——代码最简单；无需追踪 active_bullets；无需 release 的 disconnect 逻辑
- **Cons**: 违反 ADR-0003 的禁止规则 `direct_runtime_rigidbody_instantiation`；`instantiate()` 在移动端造成帧尖峰（1-5ms）；高速射击场景（标准步枪 0.3s 射速 = 3.3 发/秒）每 0.3s 一次 1-5ms 尖峰——60fps 不可接受
- **Rejection Reason**: ADR-0003 已明确建立对象池为子弹创建的强制路径。此方案是已被禁止的反模式——不再讨论。

## Consequences

### Positive
- 子弹是真实物理实体（RigidBody2D + CCD）——与碎片的物理规则完全一致，玩家感受到的冲击力来自引擎原生碰撞响应
- 职责分明——ShootingSystem 管理生命周期和跨系统协调，PooledBullet 脚本管理飞行和碰撞
- 两条生命周期路径（standard/sticky）在 ShootingSystem 的 `_on_bullet_hit()` 分支中清晰建模——新增弹型只需添加新的分支处理
- 对象池集成完整——acquire 时连接 signal，release 时断开+重置（与 ADR-0003/0004 模式一致）
- source_entity 行为矩阵在 fire() 中集中配置——不需要在子弹脚本中做来源判断
- 粘弹引爆通过 ChainPropagation.trigger_explosion() 走标准连锁传播路径——不重复实现 AOE 逻辑

### Negative
- ShootingSystem 同时管理两套生命周期（标准弹命中立即释放 vs 粘弹附着后延时释放）——`_on_bullet_hit()` 中的分支在弹型增多时可能膨胀。Alpha 阶段扩展至 6-8 种弹型时需重构为策略模式或弹型 handler 注册表
- 粘弹的 fuse_timer 回调使用 closure 捕获 bullet 引用——bullet 在附着期间如果场景切换（玩家死亡），timer 回调中的 `is_instance_valid` 保护是最后防线
- lifetime timer 使用递归 `create_timer` 重连（每 0.5s）——简单但不够优雅。可选择 Tween 或 `_process` 中的 delta 累积替代
- `_active_bullets` Dictionary 的 instance_id 在 bullet 回池后可能被 Godot 复用——但 ShootingSystem 在 release 时已 erase，不存在悬垂引用

### Risks
- **CCD 在极端速度下的穿透**: bullet_speed=2000px/s, 60fps = 33px/帧。最小碰撞体厚度约 10px（薄墙）——CCD_MODE_CAST_RAY 覆盖此范围。但在 30fps 设备上位移 67px/帧——需验证 CCD 的 ray 长度是否自动适配帧率。缓解：移动端目标 60fps；若降至 30fps，CCD 仍应生效（Godot 的 CCD 基于物理步进而非渲染帧）
- **粘弹 reparent 到被破坏的物体**: 物体在 ATTACHED 期间被连锁破坏 → `queue_free()` 后 bullet 随父对象一起被释放（reparent 使其成为子节点，非孤儿）。缓解：已在 `_attach_bullet` 中连接 parent 的 `tree_exited` signal（CONNECT_ONE_SHOT）——父对象销毁前在当前位置立即引爆
- **同一帧多颗子弹命中同一目标**: 每颗子弹独立产生 HitData → 分别 emit hit_detected。如果 3 颗标准弹同时命中同一 Enemy，health-damage 收到 3 次伤害——与 ADR-0004 的多命中规则一致。hit-stop 触发 3 次——CameraSystem 应 debounce（拒绝 50ms 内的重复 hit_stop 请求）
- **粘弹 fuse_timer 回调在场景切换后执行**: `create_timer` 的 SceneTreeTimer 在 `change_scene_to_file()` 后仍触发——bullet 已随旧场景被 queue_free。缓解：回调中 `is_instance_valid(bullet)` 检查——不存在的 bullet 静默跳过
- **active_bullets 泄漏**: 如果子弹在未 emit collision_hit 的情况下被 pool 强制回收（如 PhysicsObjectPool 的 FIFO 回收覆盖了正在飞行的子弹），ShootingSystem 的 `_active_bullets` 保留悬垂条目。缓解：`acquire_projectile` 返回前清除 meta（包括 hit_callback）；ShootingSystem 在 release_projectile 中强制 erase

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| shooting-projectile.md | §1 子弹生成: fire(origin, target, bullet_type, source_entity) | ShootingSystem.fire() — 从池获取 → 配置 → 发射 |
| shooting-projectile.md | §2-3 标准弹/粘弹属性表 | bullet_config.json — speed/mass/impulse/gravity_scale 全部数据驱动 |
| shooting-projectile.md | §4 子弹飞行: RigidBody2D + CCD + gravity | PooledBullet 脚本 — RigidBody2D + CD_MODE_CAST_RAY + gravity_scale |
| shooting-projectile.md | §5 标准弹命中: 冲击力 + hit-stop + 销毁 | _on_bullet_hit → build_hit_data → hit_stop → release_projectile |
| shooting-projectile.md | §6 粘弹命中: 附着 → fuse → 引爆 | _attach_bullet → reparent + fuse_timer → trigger_explosion |
| shooting-projectile.md | §7 后坐力 | 不在此 ADR 范围——PlayerController 在调用 fire() 后自行施加反方向 impulse |
| shooting-projectile.md | §8 hit-stop 仅玩家子弹触发 | source_entity == "player" → CameraSystem.hit_stop() |
| shooting-projectile.md | AC1-AC9: 全部 9 个验收标准 | 参见 Validation Criteria |
| weapon-system.md | §4 射击委托: fire_current → fire(bullet_type, source_entity) | ShootingSystem.fire() 是 weapon-system 的委托目标 |
| weapon-system.md | AC1-AC2: standard_rifle + sticky_launcher 分别触发 correct bullet_type | fire(bullet_type, source_entity) — bullet_type 由武器系统传入 |
| physics-config.md | §4 碰撞矩阵: Projectile 层(3) | fire() 中设置 collision_layer=3, collision_mask=Enemy|World|PhysicsObject |
| hit-detection.md | AC1: Projectile 命中 Enemy → 产生 HitData | _on_bullet_hit → build_hit_data → emit hit_detected |
| chain-propagation.md | AC2: trigger_explosion(pos, radius, force) | 粘弹引爆 → ChainPropagation.trigger_explosion() |

## Performance Implications
- **CPU**: fire() 单次调用（不含物理结算）: pool acquire + config 设置 + velocity 赋予 <0.02ms。_on_bullet_hit() 每次: build_hit_data + signal emit + hit-stop <0.02ms。20 颗活跃子弹峰值（罕见）: 全部飞行中仅消耗 RigidBody2D 的 _integrate_forces 开销——由 Godot 物理引擎内部处理，不在 GDScript 层
- **Memory**: _active_bullets Dictionary: 最多 20 条目 × ~100 字节 = ~2KB。bullet_config: 2 弹型 × ~200 字节 = ~400 字节常驻
- **Load Time**: bullet_config.json 加载 <1ms
- **Network**: N/A

## Migration Plan
本项目尚无代码——此为初始架构决策。实施步骤:
1. ShootingSystem Autoload 实现 fire()、_on_bullet_hit()、_attach_bullet()、_release_bullet()
2. PooledBullet 脚本实现 _integrate_forces + collision_hit signal + reset_collision_tracking()
3. 创建 `assets/data/weapons/bullet_config.json` 配置文件
4. PhysicsObjectPool 中实现 acquire_projectile() / release_projectile()
5. CameraSystem 中实现 hit_stop() 方法（含 50ms debounce）
6. 集成测试: fire() → 验证子弹从池获取 → _integrate_forces 检测碰撞 → hit_detected signal 发射 → 标准弹 release
7. 粘弹集成测试: fire(sticky) → 命中 → ATTACHED → 1.5s → trigger_explosion → detonated → release

## Validation Criteria
- fire("standard") → RigidBody2D 以 2000px/s 飞行，CCD 启用，collision_layer=3 (AC1)
- 标准弹命中 World → hit_detected emit, hit-stop 50ms, 子弹 release (AC2)
- 标准弹命中 Enemy → HitData.damage_type="bullet", source_entity 正确 (AC3)
- 标准弹飞行 >1500px → EXPIRED, 静默 release (AC4)
- 粘弹命中 PhysicsObject → ATTACHED, collision_layer=0, 1.5s 后 trigger_explosion(150, 1000) (AC5)
- 粘弹引爆 → 范围内 PhysicsObject 和 Enemy 受到 AOE 冲击力 (AC6)
- source_entity="enemy" 子弹 → 不触发 hit-stop, Enemy 层碰撞关闭 (AC8 扩展)
- 20 颗活跃子弹峰值 → shooting-system 帧时间 <0.1ms（不含物理引擎内部开销）
- 所有子弹属性从 bullet_config.json 读取 (AC9)
- 池 release 后 → 子弹 collision_layer=0, velocity=Vector2.ZERO, freeze=true

## Implementation Notes (from Engine Specialist Review)

以下内容来自 `godot-specialist` 验证（2026-05-22），已应用于 ADR 修复：

1. **`_integrate_forces` 中修改 `Engine.time_scale`（BLOCKING — 已修复）**: `_on_bullet_hit` 在 `_integrate_forces` → `collision_hit` signal 回调链中执行——此时仍在物理步进内。直接调用 `CameraSystem.hit_stop()` 修改 `Engine.time_scale` 可能与物理引擎内部状态竞争。修复：`call_deferred("_apply_hit_stop", duration)` 将 time_scale 修改延迟到物理步进完成后。

2. **递归 `create_timer` 替代（minor — 已修复）**: 每颗子弹在 3-5s 生命周期中递归创建 6-10 个 `SceneTreeTimer` 节点。改用 `Tween + set_loops()`——单 Tween 对象每 0.5s 循环检查，零递归，bullet 被 release 时 `tween.kill()` 自动清理。

3. **粘弹 parent 销毁时的孤儿 bullet（minor — 已修复）**: 父 RigidBody2D 被 `queue_free` 时 bullet 随父对象一起被释放（reparent 使其成为子节点）。已在 `_attach_bullet` 中连接 `tree_exited` signal（CONNECT_ONE_SHOT）——父对象销毁前在当前位置立即引爆，同时清理 `_active_bullets`。

4. **`create_timer` + closure 场景切换安全性**: `SceneTreeTimer` 在 `change_scene_to_file()` 后仍触发（挂载在 root 下），但 closure 中的 `is_instance_valid(bullet)` 检查使已释放的 bullet 静默跳过——无内存泄漏。

## Related Decisions
- ADR-0001: Autoload + Direct Signal（ShootingSystem 作为 Autoload）
- ADR-0003: 物理对象池（acquire_projectile / release_projectile）
- ADR-0004: 命中检测（_integrate_forces 碰撞模式 + build_hit_data + hit_detected signal）
- ADR-0006: 连锁传播递归（粘弹引爆 → trigger_explosion）
- ADR-0008: 武器系统（fire_current → fire 委托）
