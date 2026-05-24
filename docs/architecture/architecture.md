# 坍塌禁区 (Collapse Zone) — Master Architecture

## Document Status
- **Version**: 1.0
- **Last Updated**: 2026-05-22
- **Engine**: Godot 4.6 (GodotPhysics2D)
- **GDDs Covered**: 18 MVP systems
- **ADRs Referenced**: 0 (none yet — to be created)
- **Technical Director Sign-Off**: 2026-05-22 — SELF-REVIEW (lean mode)
- **Lead Programmer Feasibility**: Pending (lean mode — LP-FEASIBILITY skipped)

## Engine Knowledge Gap Summary

| Risk | Domain | Key Change | Impacted Systems |
|------|--------|-----------|-----------------|
| MEDIUM | Navigation | 4.5 dedicated 2D navigation server | enemy-ai |
| MEDIUM | UI | 4.6 dual-focus system (touch vs keyboard) | touch-control-ui, HUD |
| LOW | GDScript | 4.5 variadic args + @abstract (additive) | All .gd files |
| LOW | Physics 2D | No changes — Jolt is 3D only | physics-config, material-destruction |

## System Layer Map

```
┌─────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                     │
│  #18 HUD · #19 Touch Control UI                         │
├─────────────────────────────────────────────────────────┤
│  FEATURE LAYER                                          │
│  #14 Enemy AI · #15 Boss AI · #16 Level Design Data     │
│  #17 Enemy Spawn & Wave                                 │
├─────────────────────────────────────────────────────────┤
│  CORE LAYER                                             │
│  #5 Hit Detection · #6 Player Controller · #7 Camera    │
│  #8 Shooting/Projectile · #9 Material Destruction       │
│  #10 Weapon System · #11 Chain Propagation              │
│  #12 Health & Damage · #13 Death & Respawn              │
├─────────────────────────────────────────────────────────┤
│  FOUNDATION LAYER                                       │
│  #1 Touch Input · #2 Physics Config · #3 Game State     │
│  #4 Scene Manager                                       │
├─────────────────────────────────────────────────────────┤
│  PLATFORM LAYER                                         │
│  Godot 4.6 · GodotPhysics2D · Android/iOS               │
└─────────────────────────────────────────────────────────┘
```

## Module Ownership

### Foundation Layer

| 模块 | 拥有 | 暴露 | 消费 | Godot API |
|------|------|------|------|-----------|
| **Touch Input** | 原始触摸事件处理、左右区分区逻辑 | `move_direction`, `aim_position`, `shoot_tapped`, `shoot_held`, `is_aiming` | — | `InputEventScreenTouch/Drag` |
| **Physics Config** | 碰撞层定义、碰撞矩阵、物理材质 | 层常量 (LAYER_PLAYER=1, ENEMY=2, PROJECTILE=3, WORLD=4, PHYSICS_OBJECT=5) | — | `PhysicsServer2D` |
| **Game State Machine** | 游戏状态 (MAIN_MENU/PLAYING/PAUSED/DEAD/VICTORY) | `state_changed(old, new)` signal | — | `Node` (Autoload) |
| **Scene Manager** | 场景加载/卸载/重置、过渡动画 | `load_room(id)`, `reset_room(id)`, `unload_room(id)` | Game State Machine, Level Design Data | `ResourceLoader`, `PackedScene`, `SceneTree.change_scene_to_file()` |

### Core Layer

| 模块 | 拥有 | 暴露 | 消费 | Godot API |
|------|------|------|------|-----------|
| **Hit Detection** | 物理查询 (ray/area/point) | `query_area(pos, radius, mask)`, `raycast(from, to, mask)` → HitData[] | Physics Config | `PhysicsRayQueryParameters2D`, `PhysicsDirectSpaceState2D` |
| **Player Controller** | 角色移动、面向方向 | `global_position`, `face_right` | Touch Input, Physics Config | `CharacterBody2D`, `move_and_slide()` |
| **Camera System** | 2D 摄像机边界、震动 | `set_bounds(rect)`, `shake(duration, amplitude)` | Player Controller, Scene Manager | `Camera2D`, `limit_*` properties |
| **Shooting/Projectile** | 子弹创建、弹道物理、命中处理 | `fire(origin, target, bullet_type, source_entity)` | Player Controller, Physics Config, Hit Detection | `RigidBody2D`, `Area2D` |
| **Material Destruction** | 材质破坏阈值、碎片生成、损伤累积 | `object_destroyed(position, material, debris_list)` signal | Physics Config, Hit Detection, Level Design Data | `RigidBody2D` (碎片), 对象池 |
| **Weapon System** | 武器切换、弹药管理 | `weapon_changed(id, name, ammo)`, `fire_current(origin, target)` | Shooting/Projectile | — |
| **Chain Propagation** | 连锁传播逻辑、深度追踪、传播力计算 | `chain_depth_changed(depth)`, `chain_settled(summary)` | Material Destruction, Hit Detection, Level Design Data | `PhysicsDirectSpaceState2D` (AOE 查询) |
| **Health & Damage** | 伤害计算、HP 追踪、死亡宣告 | `health_changed(entity, old, new)`, `entity_died(entity, killer)` | Hit Detection | — |
| **Death & Respawn** | 死亡后流程、重生逻辑 | (触发 Scene Manager 重置) | Health & Damage, Scene Manager, Game State Machine | — |

### Feature Layer

| 模块 | 拥有 | 暴露 | 消费 | Godot API |
|------|------|------|------|-----------|
| **Enemy AI** | AI 状态机、感知模型、掩体选择、射击决策 | `state_changed(from, to)`, `activate()` / `deactivate()` | Player Controller, Physics Config, Health & Damage, Shooting/Projectile, Level Design Data, Enemy Spawn | `NavigationAgent2D` ⚠️ 4.5 专用 2D 导航服务器, `CharacterBody2D`/`RigidBody2D` |
| **Boss AI** | Boss 状态机、阶段系统、身体部件、攻击选择、威胁感知 | `boss_health_changed`, `boss_part_damaged`, `boss_state_changed`, `boss_phase_changed`, `boss_spawned`, `boss_defeated` | Enemy AI (继承), Material Destruction, Chain Propagation, Level Design Data, Health & Damage | `CharacterBody2D` (根节点), `RigidBody2D` (部件, top_level=true) |
| **Level Design Data** | 房间 JSON schema、数据验证 | `load_room_data(id)` → RoomData | — (纯数据层) | `JSON.parse_string()`, `ResourceLoader.exists()` |
| **Enemy Spawn & Wave** | 敌人生成队列、stagger 逻辑、房间清空检测 | `spawn_room_enemies(id)`, `activate_boss(id, config)`, `all_enemies_spawned`, `room_cleared` | Level Design Data, Enemy AI, Boss AI, Health & Damage | `PackedScene.instantiate()` |

### Presentation Layer

| 模块 | 拥有 | 暴露 | 消费 | Godot API |
|------|------|------|------|-----------|
| **HUD** | HP 条、武器图标、连锁计数器、Boss 仪表盘、低血量脉冲 | — (纯显示) | Health & Damage, Weapon System, Chain Propagation, Boss AI, Enemy Spawn, Game State Machine | `CanvasLayer` (layer=10) ⚠️ 4.6 dual-focus, `Control` nodes (mouse_filter=IGNORE) — ADR-0014 |
| **Touch Control UI** | 虚拟摇杆、瞄准准星、射击反馈、屏幕分区 | (纯视觉反馈——消费 TouchInput 信号) | Touch Input | `CanvasLayer` (layer=5) ⚠️ 4.6 dual-focus, `Control` nodes (mouse_filter=IGNORE) — ADR-0014 |

## Data Flow

### 1. Frame Update Path
```
Touch Input → Player Controller → CharacterBody2D.move_and_slide()
                                → Camera2D (follow player)
                                → Weapon System.fire_current() → Shooting/Projectile
```

### 2. Combat Resolution Path
```
Shooting/Projectile.fire() → bullet RigidBody2D → collision →
  Hit Detection.raycast() → HitData {impulse, type, position} →
    Material Destruction (if PhysicsObject hit) → object_destroyed signal →
      Chain Propagation.query_area() → recursive propagation →
        Health & Damage (if Enemy hit) → health_changed → HUD update
                                        → entity_died → Death & Respawn
```

### 3. Room Lifecycle Path
```
Scene Manager.load_room(id) →
  Level Design Data.load_room_data(id) → validate JSON →
    Enemy Spawn.spawn_room_enemies(id) → stagger instantiation →
      Enemy AI.activate() → IDLE/PATROL →
    Camera System.set_bounds(room.camera_bounds) →
  Scene Manager: all_enemies_spawned → ACTIVE state
```

### 4. Boss Fight Path
```
Enemy Spawn.activate_boss(id, config) → Boss AI instantiate →
  Boss INTRO (2.0s) → COMBAT(P1) →
    HUD: Boss HP bar + part status →
    Boss attacks → Material Destruction → Chain Propagation →
    Leg destroyed → STUNNED(2s) → VULNERABLE(5s) → HUD countdown →
    Phase 2 → new attacks unlocked →
    Second leg destroyed → DOWNED (permanent VULNERABLE + 20s collapse timer) →
    Boss HP=0 → DEAD → boss_defeated → Scene Manager → next room
```

## API Boundaries

### 关键 Signal 契约

| Signal | 发出者 | 参数 | 消费者 |
|--------|-------|------|--------|
| `state_changed(old, new)` | Game State Machine | String, String | Scene Manager, HUD, Touch Control UI |
| `health_changed(entity, old_hp, new_hp)` | Health & Damage | Node, int, int | HUD, Enemy AI (低血量检测) |
| `entity_died(entity, killer_source)` | Health & Damage | Node, String | Death & Respawn, Enemy Spawn (清空检测), Chain Propagation (中断) |
| `object_destroyed(position, material, debris_list)` | Material Destruction | Vector2, String, Array | Chain Propagation (连锁入口) |
| `fire(origin, target, bullet_type, source_entity)` | Shooting/Projectile (函数) | Vector2, Vector2, String, Node | Player Controller, Enemy AI |
| `chain_depth_changed(new_depth)` | Chain Propagation | int | HUD (计数器) |
| `boss_state_changed(new_state)` | Boss AI | String | HUD (VULNERABLE 倒计时/STUNNED/崩塌) |
| `boss_spawned(boss_id)` | Enemy Spawn | String | HUD (展开 Boss 层) |

## ADR Audit

**14 ADRs created (ADR-0001 through ADR-0014).** All original Required ADRs from the architecture blueprint have been addressed. See `docs/architecture/adr-*.md` for full decision records.

### ADR Index

| ADR | Title | Systems | Status |
|-----|-------|---------|--------|
| ADR-0001 | Autoload + Signal 架构 | 全部 18 系统 | Accepted |
| ADR-0002 | 场景加载策略 | Scene Manager, Level Design Data | Accepted |
| ADR-0003 | 物理对象池设计 | Material Destruction, Shooting, Physics Config | Accepted |
| ADR-0004 | 命中检测架构 | Hit Detection, Shooting, Health & Damage | Accepted |
| ADR-0005 | 材质破坏管线 | Material Destruction, Chain Propagation | Accepted |
| ADR-0006 | 连锁传播递归策略 | Chain Propagation, Material Destruction | Accepted |
| ADR-0007 | 子弹生命周期 | Shooting/Projectile, Hit Detection | Accepted |
| ADR-0008 | 武器系统与弹药管理 | Weapon System, Shooting | Accepted |
| ADR-0009 | 玩家控制器与触屏射击架构 | Player Controller, Touch Input | Accepted |
| ADR-0010 | 游戏状态机架构 | Game State Machine | Accepted |
| ADR-0011 | 2D 摄像机系统架构 | Camera System, Player Controller | Accepted |
| ADR-0012 | Boss 身体部件物理架构 | Boss AI, Material Destruction | Accepted |
| ADR-0013 | 敌人 AI 导航系统架构 | Enemy AI, Level Design Data | Accepted |
| ADR-0014 | 触控 UI 与 HUD CanvasLayer 架构 | Touch Control UI, HUD | Accepted |

> **Note**: All ADRs are currently **Accepted**. Before stories can reference them, they must be moved to **Accepted**. Run `/architecture-review` to validate the complete set and identify any remaining gaps.

## Architecture Principles

1. **Signal-First Communication** — 系统间通过 Signal 通信，非 Signal 的直接调用仅限无状态查询。每个模块通过 Signal 声明自己的状态变更，由消费者决定如何响应。

2. **Data-Driven Design** — 所有游戏数值（HP、dtc、破坏阈值、材质参数）从外部配置文件读取，不硬编码。关卡设计师和平衡设计师可以不重新编译即可调整游戏。

3. **Physics As Gameplay** — 物理模拟不是"画面效果"——它是核心玩法机制。每个 RigidBody2D 碎片、每次碰撞冲量、每条传播链都是玩家决策的直接结果。

4. **Mobile Performance First** — 所有架构决策以中端 Android 设备 60fps 为性能目标。活跃 RigidBody2D 上限 50、AI 帧预算 2ms、场景加载 ≤ 2s。

5. **Single Source of Truth** — 每个数据事实有且仅有一个拥有模块。其他模块通过 Signal 订阅变更，不自行存储副本。

## Open Questions

| # | 问题 | 影响范围 | 优先级 |
|---|------|---------|--------|
| QQ-01 | Autoload 数量——每个系统一个 Autoload 还是按需最少？Godot Autoload 过多会增加启动时间和内存占用 | ADR-0001 | HIGH |
| QQ-02 | NavigationAgent2D 在移动端的实际性能——低端设备上 15 个 agent 的每帧 cost 未知 | ADR-0008, Enemy AI | HIGH |
| QQ-03 | Boss 身体部件架构的技术验证——`top_level=true` RigidBody2D + CharacterBody2D 根节点方案在 Jolt（未使用）/GodotPhysics2D 下的稳定性 | ADR-0009, Boss AI | HIGH |
| QQ-04 | JSON 向 .tres 的迁移时间点——Alpha 需要可视化房间编辑器吗？还是手写 JSON 可支持全部 4 关？ | Level Design Data | MEDIUM |
| QQ-05 | 触屏坐标的屏幕适配方案——设计基准 1920×1080 横屏 vs 移动端竖屏，运行时缩放策略？ | Touch Control UI, Level Design Data | MEDIUM |
