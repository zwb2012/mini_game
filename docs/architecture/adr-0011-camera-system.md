# ADR-0011: 2D 摄像机系统架构

## Status
Accepted

## Date
2026-05-23

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Godot 4.6 |
| **Domain** | Rendering / 2D |
| **Knowledge Risk** | LOW — Camera2D、Tween、Engine.time_scale 自 Godot 3.x 起稳定，4.x 无破坏性变更。`drag_margin` 和 `position_smoothing` 是 Camera2D 内置功能，不依赖 post-cutoff API |
| **References Consulted** | `docs/engine-reference/godot/VERSION.md`, `docs/engine-reference/godot/breaking-changes.md`, `docs/engine-reference/godot/deprecated-apis.md`, `docs/engine-reference/godot/modules/rendering.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | `get_tree().create_timer(process_always=true)` 在 time_scale=0 时的行为（移动端） |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Autoload + Signal 架构 — CameraSystem 是 17 个 Autoload 之一), ADR-0002 (SceneManager 通过 room_active signal 提供场景边界), ADR-0009 (PlayerController 场景节点 — Camera2D 作为其子节点) |
| **Enables** | 无 — CameraSystem 是消费端，不定义其他系统消费的接口 |
| **Blocks** | 无 — CameraSystem 属于 Core Gameplay 层，在其下层系统均已有 ADR |
| **Ordering Note** | 必须在 PlayerController (ADR-0009) 和 SceneManager (ADR-0002) 之后实现。MaterialDestruction (ADR-0005) 和 ChainPropagation (ADR-0006) 连接其 Signal 调用 shake/hit_stop |

## Context

### Problem Statement
坍塌禁区需要 2D 摄像机系统来实现三个核心功能：(1) 平滑跟随玩家（水平超前预览 + 垂直死区避免晃动），(2) 遵守场景边界限制，(3) 在物理破坏事件时提供屏幕震动和 hit-stop 慢动作——这是 Pillar 1 "每一发子弹都有重量"的视觉传达载体。没有统一的摄像机系统，屏幕震动逻辑会分散在多个系统中，导致参数不一致和难以调试的视觉 bug。

### Constraints
- Camera2D 必须存在于场景树中才能渲染——不能是纯 Autoload
- CameraSystem 作为 Autoload 运行（ADR-0001）——提供全局 API（shake、hit_stop）
- PlayerController 是场景节点（ADR-0009）——Camera2D 作为其子节点利用场景树自动跟随
- 移动端 60fps——摄像机更新必须轻量（< 1ms/帧）
- GDD 已定义完整的跟随参数、震动算法和验收标准（AC1-AC8）

### Requirements
- 水平跟随：平滑超前偏移（`look_ahead_offset` 根据面向方向偏移）
- 垂直跟随：死区机制——玩家在死区内垂直移动时摄像机不跟随
- 场景边界限制：从 SceneManager 的 `room_active` signal 读取并设置 Camera2D.limit_*
- 屏幕震动：`shake(intensity, duration)` — 衰减随机偏移，同时多个请求取最大值
- Hit-stop：`hit_stop(duration, time_scale)` — 全局时间缩放 + process_always 恢复
- 所有摄像机参数从配置文件读取（GDD AC8）

## Decision

**采用 Camera2D 作为 PlayerController 子节点 + CameraSystem Autoload 管理全局效果的模式。**

Camera2D 节点放置于 PlayerController 场景（`PlayerController.tscn`）中作为子节点——场景树自动处理主体跟随，Godot 内置的 `position_smoothing` 和 `drag_margin` 处理平滑和死区。CameraSystem Autoload 提供全局 API（shake、hit_stop、set_bounds），通过 group 机制在场景加载后自动发现 Camera2D 节点。自定义代码仅用于内置功能不覆盖的部分：超前偏移量 lerp 和抖动随机化。

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│  CameraSystem (Autoload, Core Gameplay 层)           │
│                                                     │
│  API:                                               │
│    shake(intensity, duration) → void                │
│    hit_stop(duration, time_scale) → void            │
│    set_bounds(limits: Dictionary) → void            │
│                                                     │
│  内部状态:                                           │
│    _current_camera: Camera2D (从 group "camera"      │
│      查找，在 room_active 时刷新)                     │
│    _shake_tween: Tween                               │
│    _active_shake_intensity: float                    │
│                                                     │
│  连接 Signal:                                        │
│    SceneManager.room_active → _on_room_active        │
│    HitDetection.hit_detected → _on_hit               │
│    MaterialDestruction.object_destroyed → _on_shake  │
│    ChainPropagation.chain_step_processed → _on_step  │
│    GameStateMachine.state_changed → _on_state        │
└──────────────┬──────────────────────────────────────┘
               │ group "camera" 查找
               ▼
┌─────────────────────────────────────────────────────┐
│  PlayerController.tscn (场景节点, ADR-0009)           │
│  └─ Camera2D (add_to_group("camera"))                │
│       ├─ position_smoothing_enabled = true           │
│       ├─ position_smoothing_speed = 5.0              │
│       ├─ drag_margin_enabled = true                  │
│       ├─ drag_margin_top = 0.3                       │
│       ├─ drag_margin_bottom = 0.3                    │
│       ├─ limit_* ← 由 CameraSystem 在 room_active     │
│       │   时设置                                       │
│       └─ offset ← 由 CameraSystem.shake() 驱动        │
└─────────────────────────────────────────────────────┘

数据流:
  PlayerController.position
    → [场景树] → Camera2D.global_position (瞬时跟随)
    → [position_smoothing] → 平滑滞后
    → [drag_margin] → 垂直死区抑制
    → [自定义 lerp] → look_ahead_offset (local position.x)
  Camera2D.offset
    → [Tween tween_method] → 每帧随机 offset (shake)
  Engine.time_scale
    → [create_timer process_always=true] → 自动恢复 (hit_stop)
```

### Key Interfaces

```gdscript
# camera_system.gd (Autoload: "CameraSystem")
extends Node

## 屏幕震动 — intensity 0~1, duration ms。同时多个请求：取最大 intensity，重新开始计时。
func shake(intensity: float, duration: float) -> void

## Hit-stop 慢动作 — time_scale 目标值, duration ms。
## 恢复使用 create_timer(process_always=true) 确保不受 time_scale 影响。
func hit_stop(duration: float, time_scale: float) -> void

## 设置摄像机边界 — 由 SceneManager.room_active signal 触发
func set_bounds(limits: Dictionary) -> void
```

```gdscript
# Camera2D 配置（PlayerController.tscn 中的节点属性）
# position_smoothing_enabled = true
# position_smoothing_speed = 5.0  (可配置)
# drag_margin_enabled = true
# drag_margin_top = 0.3  (屏幕高度 30%)
# drag_margin_bottom = 0.3
```

**核心实现伪代码**：

```gdscript
# ── 超前偏移量（唯一需要自定义 lerp 的部分）──
func _process(_delta: float) -> void:
    if not _current_camera:
        return
    # 场景树 + position_smoothing 处理主体跟随
    # drag_margin 处理垂直死区
    # 这里只做超前偏移
    var face_dir := _get_player_face_direction()
    var target_offset := _look_ahead_offset if face_dir > 0 else -_look_ahead_offset
    _current_camera.position.x = lerp(_current_camera.position.x, target_offset, _follow_speed * _delta)

# ── 屏幕震动（Tween + 随机化）──
func shake(intensity: float, duration: float) -> void:
    if not _current_camera:
        return
    if _active_shake_intensity > intensity and is_instance_valid(_shake_tween):
        return  # 当前震动更强，忽略弱请求
    if is_instance_valid(_shake_tween):
        _shake_tween.kill()
    _shake_tween = create_tween()
    _shake_tween.tween_method(
        _apply_shake.bind(_current_camera),
        intensity, 0.0, duration
    )
    _shake_tween.tween_callback(func():
        if is_instance_valid(_current_camera):
            _current_camera.offset = Vector2.ZERO
    )

func _apply_shake(magnitude: float, camera: Camera2D) -> void:
    camera.offset = Vector2(
        randf_range(-magnitude, magnitude) * _max_shake_pixels,
        randf_range(-magnitude, magnitude) * _max_shake_pixels
    )

# ── Hit-stop（process_always timer 恢复）──
func hit_stop(duration: float, time_scale: float) -> void:
    Engine.time_scale = time_scale
    # process_always=true 确保 timer 不受 time_scale 影响
    get_tree().create_timer(duration, false, false, true).timeout.connect(
        func(): Engine.time_scale = 1.0
    )

# ── 摄像机发现（group 机制）──
func _on_room_active(_room_id: String) -> void:
    # 清理旧引用
    if is_instance_valid(_shake_tween):
        _shake_tween.kill()
    _current_camera = null
    # 延迟一帧等待新场景的 Camera2D 注册
    await get_tree().process_frame
    var cameras := get_tree().get_nodes_in_group("camera")
    if cameras.size() > 0:
        _current_camera = cameras[0] as Camera2D
```

**Camera2D 节点在 `_ready()` 中注册自身**：
```gdscript
# PlayerController.tscn 中的 Camera2D 子节点
func _ready() -> void:
    add_to_group("camera")
```

### 摄像机参数配置文件

```json
// assets/data/camera/camera_config.json
{
  "follow_speed": 5.0,
  "look_ahead_offset": 100,
  "max_shake_pixels": 20,
  "default_zoom": 1.0
}
```

## Alternatives Considered

### Alternative 1: Camera2D 独立节点 + 完全手动跟随
- **Description**: Camera2D 放在每个房间 .tscn 中（而非 PlayerController 子节点）。CameraSystem 每帧手动计算 `global_position = lerp(current, target, speed * delta)`。
- **Pros**: 完全控制跟随行为——不受场景树约束；Camera2D 与 PlayerController 生命周期解耦
- **Cons**: 需要每帧手动 lerp 水平和垂直位置——等效于重新实现 `position_smoothing` 和 `drag_margin`；Camera2D 必须在每个房间场景中手动放置或动态实例化；场景切换时需要额外管理 Camera2D 的创建/销毁
- **Rejection Reason**: Godot 的 Camera2D 已内置平滑跟随和死区功能——手动重新实现会增加 ~50 行代码且引入 bug 风险。子节点模式利用场景树自动跟随——零额外代码处理主体位置跟踪。

### Alternative 2: Phantom Camera 第三方插件
- **Description**: 使用 Godot Asset Library 的 Phantom Camera 插件——提供预设驱动的摄像机行为（跟随、震动、转场）。
- **Pros**: 功能丰富——支持摄像机混合、优先级系统、内置震动和转场；社区维护，bug 修复由上游提供
- **Cons**: 引入第三方依赖——插件更新/兼容性风险（Godot 4.6 支持未知）；增加构建体积；对于 5 个简单功能（跟随、死区、边界、震动、hit-stop）过度设计
- **Rejection Reason**: 项目需求仅涉及 Camera2D 的基本功能——引入插件增加了维护负担但无实质收益。且单人项目优先使用 Godot 内置功能——减少学习成本和调试复杂度。

### Alternative 3: CameraSystem 完全作为场景节点（非 Autoload）
- **Description**: CameraSystem 不作为 Autoload，而是 PlayerController.tscn 中的一个节点。shake/hit_stop API 通过 `get_node()` 或 Signal 暴露给其他系统。
- **Pros**: Camera2D 和 CameraSystem 在同一个场景中——无需 group 查找机制；场景切换时自然清理所有摄像机状态
- **Cons**: 其他系统（MaterialDestruction、ChainPropagation）需要获取 CameraSystem 引用才能调用 shake/hit_stop——通过 `get_node()` 路径或 Signal 间接调用；不符合 ADR-0001 的 Autoload 架构——CameraSystem 已在 Autoload 注册表中定义为全局服务
- **Rejection Reason**: shake 和 hit_stop 是全局效果——多个系统在任何时间点都可能触发。作为 Autoload 提供全局 API 比场景节点更符合"全局服务"语义。ADR-0001 已将 CameraSystem 列为 Autoload——追求架构一致性。

## Consequences

### Positive
- 利用 Godot 内置功能（`position_smoothing`、`drag_margin`）——自定义代码仅 ~80 行，集中在超前偏移和抖动随机化
- 场景树自动跟随——无需手动 lerp 主体位置，减少 CPU 开销
- Group 查找模式解耦 CameraSystem 和 PlayerController——无硬引用，Camera2D 只需 `add_to_group("camera")`
- `process_always=true` timer 确保 hit-stop 恢复可靠——即使 time_scale=0 也能正常恢复
- 震动叠加策略明确（取最大值 + 重新开始）——可预测，不会出现震动爆炸
- 所有参数从 JSON 配置文件读取——符合 GDD AC8

### Negative
- Camera2D 作为 PlayerController 子节点——如果将来需要摄像机独立于玩家移动（如过场动画），需要重构。当前需求不需要此能力
- Group 查找有一帧延迟（`await get_tree().process_frame`）——在新场景的第一个 `_process` 前完成，不影响视觉
- `Engine.time_scale` 是全局设置——hit_stop 影响所有使用 time_scale 的系统（Tween、Timer、物理）。缓解：物理系统使用 `PhysicsServer2D` 的 `set_active(false)` 而非依赖 time_scale（ADR-0002 的 PhysicsConfig 已处理）

### Risks
- **场景切换时 Camera2D 空隙窗口**: `change_scene_to_file()` 销毁旧 Camera2D → `room_active` 回调 → `await process_frame` → 新 Camera2D 注册。在此窗口期调用 `shake()` 被空值检查拒绝（静默失败）。缓解：非关键——shake 调用来自物理事件，场景切换瞬间不会发生物理碰撞。**引擎专家验证已确认此方案安全。**
- **多个系统同时触发 hit_stop**: MaterialDestruction 和 ChainPropagation 同时调用 hit_stop → 后调用者覆盖前者的 time_scale 和 duration。缓解：当前取"后调用者覆盖"策略——最晚的事件最重要。如果将来需要优先级队列，在 CameraSystem 内部增加 `_hit_stop_stack`。
- **Tween 泄漏**: `_shake_tween` 在场景切换或新震动请求时显式 kill。但如果 CameraSystem Autoload 本身被移除（不应发生），Tween 可能悬垂。缓解：`shake()` 调用前检查 `is_instance_valid(_shake_tween)`。
- **`get_tree().create_timer(process_always=true)` 在移动端的稳定性**: Godot 4.6 中 `process_always` 参数是成熟功能，但移动端 time_scale=0 时的 timer 行为应在目标设备上验证。

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| camera-system.md | 水平跟随：`lerp(position.x, target_x + look_ahead_offset, speed * delta)` | Camera2D 子节点 + `position_smoothing` 处理主体平滑；自定义 `_process()` 仅 lerp `position.x` 偏移量 |
| camera-system.md | 垂直死区：屏幕高度 30%，玩家在死区内垂直移动时摄像机不跟随 | Camera2D 内置 `drag_margin_enabled=true` + `drag_margin_top/bottom=0.3` |
| camera-system.md | 场景边界限制：`camera.limit_left/right/top/bottom` | `set_bounds()` 从 room_active signal 接收边界并设置 Camera2D.limit_* |
| camera-system.md | 屏幕震动：`shake(intensity, duration)` → 衰减随机偏移 | Tween + `tween_method(_apply_shake)` 每帧 `randf_range(-mag, mag) * max_shake_pixels`，tween_callback 重置 offset |
| camera-system.md | 慢动作：`hit_stop(duration, time_scale)` → time_scale 降至 0.1~0.3 | `Engine.time_scale` + `create_timer(process_always=true)` 恢复至 1.0 |
| camera-system.md | 多个震动请求取最大 intensity | `shake()` 检查 `_active_shake_intensity > intensity` → 忽略较弱请求 |
| camera-system.md | AC7: 摄像机更新 ≤ 1ms/帧 | 自定义 `_process()` 仅做一次 lerp + 条件检查；Tween 回调由引擎优化 |
| camera-system.md | AC8: 参数从配置文件读取 | `camera_config.json` — `follow_speed`, `look_ahead_offset`, `max_shake_pixels`, `default_zoom` |
| player-controller.md | PlayerController 场景包含 Camera2D 子节点 | Camera2D 作为 PlayerController.tscn 的 child node，在 `_ready()` 中 `add_to_group("camera")` |
| scene-manager.md | 场景加载时设置摄像机边界 | CameraSystem 连接 `SceneManager.room_active` signal，在回调中调用 `set_bounds()` |

## Performance Implications
- **CPU**: 自定义 `_process()` — 一次 lerp + 一次条件检查 < 0.001ms。Tween 回调 — 两次 `randf_range` + Vector2 构造 < 0.001ms。总帧开销 < 0.01ms（GDD 预算 ≤ 1ms）
- **Memory**: CameraSystem Autoload（~2KB）+ Camera2D 节点（引擎管理，~1KB）。配置文件缓存 ~200 bytes
- **Load Time**: JSON 配置文件加载 < 1ms。Group 查找有一帧延迟但非阻塞——不增加加载时间
- **Network**: N/A（单机游戏）

## Migration Plan
本项目尚无代码——此为初始架构决策。实施步骤：
1. 创建 `assets/data/camera/camera_config.json` 配置文件
2. 在 `PlayerController.tscn` 中添加 Camera2D 子节点——配置 `position_smoothing`、`drag_margin`、`add_to_group("camera")`
3. 创建 `res://autoload/camera_system.gd` — 实现 shake() + hit_stop() + set_bounds()
4. 在 Project Settings → Autoload 中注册为 `CameraSystem`
5. CameraSystem 在 `_ready()` 中连接 `SceneManager.room_active`、`HitDetection.hit_detected`、`MaterialDestruction.object_destroyed`、`ChainPropagation.chain_step_processed`、`GameStateMachine.state_changed`
6. CI 添加摄像机单元测试：验证 shake 衰减曲线、hit_stop 恢复时间、边界设置正确

## Validation Criteria
- Camera2D 在场景加载后 1 帧内被 CameraSystem 发现（group "camera" 非空）
- 玩家水平移动时摄像机平滑跟随（`position_smoothing` 生效，无瞬跳）
- 玩家在垂直死区内移动时摄像机 y 不变（`drag_margin` 生效）
- `shake(0.8, 200)` — 摄像机在 200ms 内偏移振荡并衰减至零
- `hit_stop(200, 0.1)` — time_scale 降至 0.1，200ms 后恢复 1.0
- 两个 shake 同时调用 (intensity 0.5 和 0.9) — 使用 0.9
- 场景切换后旧 Camera2D 引用不悬垂（空值检查生效）
- time_scale=0 时 hit_stop 仍能正常恢复（`process_always=true` timer 验证）
- 所有 8 条 GDD 验收标准可追踪到具体测试用例

## Implementation Notes (from Engine Specialist Review)

1. **position_smoothing 与自定义 lerp 不冲突**: `position_smoothing` 作用于 global_position（场景树层级），自定义 lerp 作用于局部 `position.x`（超前偏移量）。两者应用顺序：场景树 → position_smoothing → drag_margin → 自定义 lerp。
2. **超前偏移量方向切换平滑**: 玩家转身时 `target_offset` 正负切换——现有 lerp 会平滑过渡（因为 lerp 每帧只移动差值的一部分）。不需要额外的方向切换处理。
3. **Group 查找延迟**: `await get_tree().process_frame` 等待一帧确保新场景的所有 `_ready()` 执行完毕。如果 Camera2D 的 `_ready()` 在 room_active signal 处理器之前执行，group 已包含新 Camera2D——此时立即读取即可。`await` 是防御性编程。
4. **Shake 叠加策略为 "最大强度 + 重新开始计时"**: 当前震动强度大于请求强度时忽略（重新开始计时策略的最简实现）。如果将来需要更复杂的优先级系统（如"Boss 击杀震动不可被覆盖"），可在 shake() 中增加 priority 参数。
5. **Zoom 预留**: 当前 ADR 不包含缩放功能（GDD 未要求），但 API 设计预留了扩展空间——Camera2D.zoom 属性可直接由 CameraSystem 在未来设置。

## Related Decisions
- ADR-0001: Autoload + Signal 架构（CameraSystem 是 17 个 Autoload 之一）
- ADR-0002: 场景加载策略（room_active signal 驱动边界设置 + 摄像机重新发现）
- ADR-0004: 命中检测（hit_detected signal → CameraSystem 触发 hit_stop + shake）
- ADR-0005: 材质破坏（object_destroyed signal → CameraSystem 触发 shake）
- ADR-0006: 连锁传播（chain_step_processed signal → CameraSystem 触发每步 shake）
- ADR-0009: 玩家控制器（Camera2D 作为其场景子节点——利用场景树跟随）
- ADR-0010: 游戏状态机（state_changed signal → PAUSED/DEAD 时冻结摄像机更新）
