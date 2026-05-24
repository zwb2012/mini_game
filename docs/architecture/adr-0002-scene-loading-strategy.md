# ADR-0002: 场景加载策略

## Status
Accepted

## Date
2026-05-22

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Godot 4.6 |
| **Domain** | Core |
| **Knowledge Risk** | LOW — `SceneTree.change_scene_to_file()`, `PackedScene.instantiate()`, `ResourceLoader` 自 Godot 4.0 起稳定，4.4-4.6 无破坏性变更 |
| **References Consulted** | `docs/engine-reference/godot/VERSION.md`, `docs/engine-reference/godot/breaking-changes.md`, `docs/engine-reference/godot/deprecated-apis.md`, `docs/engine-reference/godot/current-best-practices.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | 中端 Android 设备上 4 个房间场景加载时间实测 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Autoload + Direct Signal 架构) — 必须 Accepted。Autoload 的常驻特性是 `change_scene_to_file()` 可行性的前提 |
| **Enables** | ADR-0003 (物理对象池设计), ADR-0008 (2D 导航策略), ADR-0010 (JSON 数据管线) |
| **Blocks** | Scene Manager Epic, Level Design Data Epic — 必须先确定加载策略才能实现 |
| **Ordering Note** | 必须在 ADR-0003 之前被 Accepted——对象池的生命周期与场景加载/卸载绑定 |

## Context

### Problem Statement
坍塌禁区 MVP 包含 4 个房间（3 战斗 + 1 Boss），玩家在房间间线性推进。场景管理器需要在以下场景中加载/卸载/重置房间：
- **顺序推进**: 清空 room_1 → 过渡 → room_2 → room_3 → boss_1
- **死亡重置**: 玩家死亡 → 当前房间恢复到初始状态
- **菜单跳转**: MAIN_MENU → PLAYING（加载 room_1 或指定关卡）

核心约束：场景切换 ≤ 2 秒（移动端中端设备）、过渡动画流畅（300ms 淡入淡出）、死亡重置瞬切（无过渡）。

ADR-0001 已确定所有 18 个系统为 Autoload——这意味着 HUD、Touch Control UI、Game State Machine 等在场景切换期间存活。本 ADR 只决定**房间场景**的加载/卸载策略。

### Constraints
- Godot 4.6 2D 渲染器，移动端（Android/iOS）目标
- 房间是独立 Godot `.tscn` 文件（含 World 地形 + 背景），敌人和物理要素由 LevelDesignData JSON 驱动实例化
- 场景切换期间 Autoload 系统必须持续运行（Signal 连接不丢失）
- 中端设备加载时间 ≤ 2s，过渡动画 300ms
- 单人开发——复杂度管理优先于极致优化

### Requirements
- 支持房间顺序推进（加载下一房间、卸载当前房间）
- 支持死亡重置（当前房间恢复初始状态，敌人重生、物理要素复位）
- 过渡动画：顺序推进有淡入淡出（300ms），死亡重置无过渡（瞬切）
- 加载失败时优雅降级（超时 5s → 错误提示 → 返回主菜单）
- 场景 ID 与 .tscn 文件路径的映射从配置文件读取，无硬编码
- 接口设计预留预加载能力的扩展点（Alpha 阶段可能需要）

## Decision

**采用 `change_scene_to_file()` 作为主场景切换机制 + 房间场景 `reset()` 方法处理死亡重置。**

### 整体策略

```
┌─────────────────────────────────────────────────────────┐
│                     Autoload Layer (常驻)                 │
│  TouchInput  GameStateMachine  PhysicsConfig             │
│  SceneManager  HitDetection  PlayerController            │
│  CameraSystem  ShootingProjectile  MaterialDestruction   │
│  WeaponSystem  ChainPropagation  HealthDamage            │
│  DeathRespawn  EnemyAI  BossAI  LevelDesignData          │
│  EnemySpawnWave  HUD  TouchControlUI                     │
├─────────────────────────────────────────────────────────┤
│              Active Scene (被替换的部分)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  room_1.tscn / room_2.tscn / room_3.tscn /       │   │
│  │  boss_1.tscn / main_menu.tscn                    │   │
│  │  ├─ World (TileMapLayer + 背景)                   │   │
│  │  ├─ Enemies (由 EnemySpawnWave 实例化)            │   │
│  │  ├─ PhysicsObjects (由 SceneManager 实例化)       │   │
│  │  └─ TransitionMarkers (entry/exit)               │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**为什么不用 `PackedScene.instantiate()` + 手动节点管理？**
- ADR-0001 已将 HUD/TouchControlUI 等 UI 层系统设为 Autoload，不需要"持久根场景"来承载它们
- 手动管理房间节点的添加/移除增加了生命周期代码，而 Godot 的 `change_scene_to_file()` 自动处理旧场景的 `queue_free()`
- CanvasLayer Autoload 在场景切换时天然存活——这正好是 Godot 设计的用法

**为什么 MVP 不做后台预加载？**
- MVP 4 个房间是小型 2D 场景（<20 个敌人 + <15 个物理要素）——加载时间预估 <1s
- `ResourceLoader.load_threaded_request()` 引入轮询、取消、错误处理等复杂度
- SceneManager 接口在设计上预留 `preload_room(id: String)` 方法签名——Alpha 阶段如需预加载可直接实现

### 场景切换流程

```
SceneManager.load_room(id)
  │
  ├─ 1. FADE_OUT (150ms)
  │     └─ ColorRect 覆盖全屏，alpha 0→1
  │
  ├─ 2. SCENE_SWITCH
  │     ├─ LevelDesignData.load_room_data(id) → 验证 JSON
  │     ├─ get_tree().change_scene_to_file(room_data.scene_path)
  │     └─ 新场景 _ready() → emit scene_loaded(id)
  │
  ├─ 3. ROOM_SETUP
  │     ├─ CameraSystem.set_bounds(room_data.camera_bounds)
  │     ├─ EnemySpawnWave.spawn_room_enemies(id)
  │     └─ 实例化 physics_objects[] 到场景中
  │
  ├─ 4. FADE_IN (150ms)
  │     └─ ColorRect alpha 1→0
  │
  └─ 5. ACTIVE — emit room_active(id)
```

### 死亡重置流程

```
SceneManager.reset_current_room()
  │
  ├─ 1. LevelDesignData.reset_room(current_room_id) → 重新读取 JSON
  │
  ├─ 2. 调用场景根节点的 reset() 方法
  │     ├─ 所有敌人 → 销毁，重新由 EnemySpawnWave 创建
  │     ├─ 物理要素 (one_shot=false) → 恢复到 position 初始值
  │     ├─ 物理要素 (one_shot=true) → 若已破坏，跳过（永久消失）
  │     └─ 玩家位置 → room_transitions.entry
  │
  └─ 3. GameStateMachine DEAD → PLAYING
```

### Key Interfaces

```gdscript
# SceneManager Autoload (Foundation Layer)

extends Node

## 请求加载指定房间
func load_room(room_id: String) -> void:
    # 1. 验证 room_id 存在
    # 2. 播放 FADE_OUT 动画
    # 3. await 动画完成
    # 4. 读取 LevelDesignData 获取 scene_path
    # 5. get_tree().change_scene_to_file(scene_path)
    # 6. 等待新场景 scene_loaded signal
    # 7. 触发房间 setup（摄像机、敌人生成、物理要素）
    # 8. 播放 FADE_IN 动画
    # 9. emit room_active(room_id)

## 重置当前房间（死亡后调用）
func reset_current_room() -> void:
    # 1. 获取当前场景根节点
    # 2. 调用根节点的 reset() 方法
    # 3. GameStateMachine 切换到 PLAYING

## 预加载房间（Alpha 阶段实现——MVP 为空方法）
func preload_room(room_id: String) -> void:
    pass  # 预留接口——Alpha 阶段用 ResourceLoader.load_threaded_request()

## 取消预加载（Alpha 阶段实现）
func cancel_preload(room_id: String) -> void:
    pass

## Signal: 房间加载完成并激活
signal room_active(room_id: String)

## Signal: 房间加载失败
signal room_load_failed(room_id: String, error: String)
```

```gdscript
# 每个房间场景根节点必须实现的接口
# 示例: room_1.gd (附加到 room_1.tscn 根节点)

extends Node2D

## 由 SceneManager 在死亡重置时调用
func reset() -> void:
    # 1. 移除所有动态创建的敌人节点
    # 2. 重新触发 EnemySpawnWave.spawn_room_enemies(room_id)
    # 3. 遍历 physics_objects，将 one_shot=false 的物体恢复到初始位置/状态
    # 4. 将玩家传送到 room_transitions.entry
    pass
```

### 场景配置文件

房间 ID 到 .tscn 的映射存储在 `assets/data/rooms/room_manifest.json`：

```json
{
  "rooms": [
    { "id": "main_menu", "scene": "res://scenes/rooms/main_menu.tscn", "data": null },
    { "id": "room_1",    "scene": "res://scenes/rooms/room_1.tscn",    "data": "res://assets/data/rooms/room_1.json" },
    { "id": "room_2",    "scene": "res://scenes/rooms/room_2.tscn",    "data": "res://assets/data/rooms/room_2.json" },
    { "id": "room_3",    "scene": "res://scenes/rooms/room_3.tscn",    "data": "res://assets/data/rooms/room_3.json" },
    { "id": "boss_1",    "scene": "res://scenes/rooms/boss_1.tscn",    "data": "res://assets/data/rooms/boss_1.json" }
  ]
}
```

### 错误处理与超时

```
SceneManager.load_room(id) 中：
  ├─ LevelDesignData.load_room_data(id) 返回 null
  │     → emit room_load_failed(id, "JSON parse error")
  │     → 保持在当前场景，不切换
  │
  ├─ scene_path 指向的 .tscn 不存在
  │     → emit room_load_failed(id, "Scene file not found: [path]")
  │     → 保持在当前场景，不切换
  │
  └─ change_scene_to_file() 超时 (>5s)
        → 显示错误 UI（通过 HUD Autoload）
        → 允许玩家返回主菜单
```

## Alternatives Considered

### Alternative A: 纯 `change_scene_to_file()` — 无预加载、重置 = 重新加载

- **Description**: 所有场景操作都用 `change_scene_to_file()`。死亡重置时重新加载同一 .tscn。不使用 `reset()` 方法。
- **Pros**: 最简实现——只有一种场景操作方式；场景状态彻底清理（新场景 = 新状态）；Godot 原生支持，无自定义生命周期代码
- **Cons**: 死亡重置需要重新解析 .tscn + 重新实例化所有节点——比 `reset()` 慢；重复加载同一场景浪费 I/O（移动端尤其明显）；无法保持"一次性"物体的破坏状态（需要额外逻辑记录哪些物体已被破坏）
- **Rejection Reason**: 死亡重置是高频操作（玩家可能在同一个 Boss 房间死 20+ 次）。每次重新加载 .tscn 在移动端可能造成 1-2s 的等待，破坏死亡→重生的流畅感。`reset()` 方法避免了重复 I/O，同时天然支持 `one_shot` 物体的状态保持。

### Alternative B: `PackedScene.instantiate()` + 手动节点管理

- **Description**: 创建一个持久根场景（root.tscn），房间作为子节点通过 `PackedScene.instantiate()` 动态添加/移除。UI 层（HUD/TouchControl）也放在根场景中而非 Autoload。
- **Pros**: 完全控制加载/卸载时机；同一时间可保留多个房间实例（如预加载下一房间）；不依赖 Autoload 机制——减少常驻内存
- **Cons**: 需要手动管理节点生命周期（add_child / queue_free）；HUD/TouchControl 要么作为 Autoload 要么在每次加载房间时重新创建；房间之间的共享状态（如摄像机引用）需要通过 Autoload 传递——本质上又回到了 Autoload 模式；额外代码量 ~200+ 行 vs `change_scene_to_file()` 的 ~50 行
- **Rejection Reason**: ADR-0001 已将 HUD 和 TouchControlUI 设为 Autoload——手动节点管理的"持久 UI"优势不复存在。增加复杂度而不带来实质好处。

### Alternative C: 混合方案 — `change_scene_to_file()` + `ResourceLoader.load_threaded_request()` 预加载

- **Description**: 在 Alternative A 基础上增加后台预加载——玩家进入 room_1 后，SceneManager 在后台线程预加载 room_2 的 PackedScene，清空后立即切换。
- **Pros**: 场景切换可从 300ms-1s 降至 <50ms（预加载完成时）；为 Alpha 阶段更大/更复杂的房间做准备
- **Cons**: 增加 `_process()` 中的轮询逻辑；需要处理预加载取消（玩家死亡 → 重置当前房间 → 预加载的下一房间不再需要）；多线程资源加载在移动端可能有驱动兼容性问题；MVP 4 个小型房间不需要——过度工程化
- **Rejection Reason**: 不是完全拒绝——接口预留了 `preload_room()` / `cancel_preload()`。但 MVP 阶段不实现预加载逻辑。若 Alpha 阶段房间规模增长（20+ 敌人、更大的导航网格），届时可实现 `ResourceLoader.load_threaded_request()` 而不改变外部接口。

## Consequences

### Positive
- 场景切换逻辑简洁——SceneManager Autoload 代码量 <100 行
- `change_scene_to_file()` 是 Godot 的标准场景切换方式——与引擎的节点生命周期完美集成
- Autoload 系统在场景切换期间天然存活——无需手动保存/恢复状态
- `reset()` 方法避免死亡重置时的文件 I/O——比重新加载 .tscn 快 3-5x
- 预加载接口已预留——Alpha 阶段可直接实现，无需重构调用方

### Negative
- 每个房间场景必须实现 `reset()` 方法——增加了房间场景的接口约定
- `one_shot=true` 物体的"永久消失"状态需要 SceneManager 在重置时追踪已破坏物体 ID 集合
- `change_scene_to_file()` 会销毁整个场景树（除 Autoload 外）——如果未来有需要在场景切换间存活的非 Autoload 节点，需要改为 Autoload
- 中端设备上 `change_scene_to_file()` 的阻塞时间尚未实测——需要验证 4 个房间场景的加载时间

### Risks
- **`change_scene_to_file()` 在移动端阻塞主线程时间未知**: 缓解——MVP 第一个房间加载时实测。如果 >1s，在 `room_active` Signal 前增加加载画面
- **`reset()` 方法实现不一致**: 不同房间场景的 `reset()` 可能遗漏状态重置——缓解——定义明确的 `RoomReset` 接口检查清单，CI 中增加重置后状态验证测试
- **加载队列竞态条件**: 玩家快速死亡两次可能触发两个连续的 reset→respawn——缓解——SceneManager 中 `is_loading` guard flag，加载期间忽略额外的 load/reset 请求
- **内存峰值**: `change_scene_to_file()` 在销毁旧场景 + 加载新场景的短暂窗口期内两个场景可能同时存在内存中——缓解——场景本身只含地形和背景，敌人和物理要素由 Autoload 管理，内存峰值 <20MB

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| scene-manager.md | AC1: MAIN_MENU→PLAYING 加载 room_1 | `load_room("room_1")` → `change_scene_to_file("res://scenes/rooms/room_1.tscn")` |
| scene-manager.md | AC2: 清空 room_1 → 加载 room_2 | `load_room("room_2")` → 同上流程 |
| scene-manager.md | AC3: room_2 死亡 → 重置到初始状态 | `reset_current_room()` → 场景根节点 `reset()` 方法 |
| scene-manager.md | AC4: 过渡淡入淡出 300ms | FADE_OUT 150ms + FADE_IN 150ms = 总计 300ms |
| scene-manager.md | AC5: boss_1 通关 → LEVEL_COMPLETE | `load_room("main_menu")` 或结算场景 |
| scene-manager.md | AC6: 场景文件不存在 → 超时 5s 错误提示 | 错误处理表中的错误分支 |
| scene-manager.md | AC7: 加载中第二个请求 → 排队 | `is_loading` guard flag + 请求队列（深度上限 2） |
| scene-manager.md | AC8: 场景加载 ≤ 2s | `change_scene_to_file()` 目标 <1s（小场景），过渡动画 300ms |
| scene-manager.md | AC9: 场景 ID 映射从配置文件读取 | `room_manifest.json` 中的 rooms 数组 |
| level-design-data.md | LOAD/RESET/UNLOAD 生命周期 | SceneManager 调用 `load_room_data()` / `reset_room()` / 场景切换自动 UNLOAD |
| game-state-machine.md | state_changed signal 驱动场景操作 | SceneManager 连接 GameStateMachine.state_changed |

## Performance Implications
- **CPU**: `change_scene_to_file()` 是同步操作——小 2D 场景 (<100 节点) 预估 <0.5s。`reset()` 仅涉及节点属性重置，<1ms
- **Memory**: 场景切换期间短暂双场景共存 → 峰值 +10-15MB。稳定状态下只有当前房间场景 + 18 个 Autoload
- **Load Time**: 冷启动 → 第一个房间: 目标 <1.5s。后续房间切换: 目标 <1s（不含过渡动画）。死亡重置: 目标 <0.1s
- **Network**: N/A（无网络依赖）

## Migration Plan
本项目尚无代码——此为初始架构决策。实施步骤：
1. SceneManager Autoload 实现 `load_room()` / `reset_current_room()` / Signal 声明
2. 创建 `assets/data/rooms/room_manifest.json` 配置文件
3. 每个房间 .tscn 的根节点脚本实现 `reset()` 方法
4. 集成测试：依次加载 4 个房间 → 死亡重置 → 验证状态正确
5. 性能测试：中端 Android 设备上测量 `change_scene_to_file()` 耗时

## Validation Criteria
- 4 个房间依次加载成功，过渡动画 300ms 内完成
- 死亡重置后所有敌人重生、所有 `one_shot=false` 物理要素复位
- `one_shot=true` 物体在破坏后、死亡重置时不重新出现
- 负载测试：连续 20 次场景切换无内存泄漏（内存增长 <5MB）
- 连续 10 次死亡重置无状态漂移（敌人位置/HP 与首次加载一致）
- 加载不存在的 room_id → 错误处理触发，不崩溃

## Implementation Notes (from Engine Specialist Review)

以下内容来自 `godot-specialist` 验证（2026-05-22），非阻塞——实现时注意即可：

1. **Fade Overlay 生命周期**: `ColorRect` 淡入淡出覆盖层**不能**是正在被替换的场景的一部分（`change_scene_to_file()` 会销毁旧场景）。覆盖层必须是 SceneManager Autoload 持有的 `CanvasLayer` + `ColorRect`。实现方式：
   ```gdscript
   # SceneManager Autoload 中
   var fade_layer: CanvasLayer
   var fade_rect: ColorRect
   
   func _ready():
       fade_layer = CanvasLayer.new()
       fade_layer.layer = 128  # 最顶层
       add_child(fade_layer)
       fade_rect = ColorRect.new()
       fade_rect.color = Color.BLACK
       fade_rect.modulate.a = 0.0
       fade_layer.add_child(fade_rect)
   ```

2. **`change_scene_to_packed()` 作为 Alpha 预加载路径**: 若 Alpha 阶段需要后台预加载，实现路径为 `ResourceLoader.load_threaded_request()` → 获取 `PackedScene` → `get_tree().change_scene_to_packed(preloaded_scene)`。此 API 已在 Godot 4.0+ 可用，与当前 `load_room()` 接口兼容。

3. **`@abstract` RoomRoot 基类** (Godot 4.5+): 可使用 `@abstract` 装饰器在编译时强制每个房间场景根节点实现 `reset()`：
   ```gdscript
   @abstract
   class_name RoomRoot extends Node2D
   
   @abstract
   func reset() -> void:
       pass
   ```

4. **`scene_loaded` Signal 说明**: `change_scene_to_file()` 是同步调用——新场景的 `_ready()` 在返回前已执行完毕。`scene_loaded` Signal 保留用于可观测性（日志/调试），不用于时序控制。

## Related Decisions
- ADR-0001: Autoload + Direct Signal 架构（场景切换期间系统存活的前提）
- ADR-0003: 物理对象池设计（对象池生命周期与场景加载/卸载绑定）
- ADR-0008: 2D 导航策略（导航网格随房间场景加载）
- ADR-0010: JSON 数据管线（房间数据加载与验证）
