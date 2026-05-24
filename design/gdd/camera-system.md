# 2D 摄像机系统 (Camera System)

> **Status**: In Design
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-20
> **Implements Pillar**: Pillar 1（屏幕震动传达子弹重量）、Pillar 2（视野框定多米诺战场）

## Summary

2D 摄像机系统控制横版关卡中的视角——平滑跟随玩家位置、根据场景边界限制视野范围、在物理破坏事件时触发屏幕震动和慢动作拉焦。它是玩家"看到游戏世界"的窗口，也是 Pillar 1 "每一发子弹都有重量"的视觉传达载体。

> **Quick reference** — Layer: `Core Gameplay` · Priority: `MVP` · Key deps: `玩家控制器, 场景管理器`

## Overview

摄像机系统使用 Godot 的 Camera2D 节点，实现横版跟随逻辑——水平方向追随玩家并施加平滑插值，垂直方向在玩家跳跃/坠落时跟随但保持一定的"死区"避免频繁上下晃动。在关键物理事件（爆炸、结构倒塌）时触发屏幕震动和瞬时慢动作（time-scale 拉焦）。场景边界由场景管理器提供，摄像机不会越界显示关卡外的空白区域。

## Player Fantasy

摄像机是玩家眼睛的延伸。好的摄像机让玩家**忘记摄像机的存在**——它自然、平滑、可预测。但在破坏事件发生时，摄像机的震动和拉焦让玩家**感受到破坏的重量**——这是 Pillar 1 的感官载体。参考：Dead Cells 的平滑跟随 + Teardown 的破坏特写感。

## Detailed Design

### Core Rules

1. **水平跟随**：摄像机 x 位置 = `lerp(camera.x, target.x + look_ahead_offset, follow_speed * delta)`。`look_ahead_offset` 根据玩家面向方向偏移（面向右时摄像机略偏右，提前显示前方内容）。

2. **垂直跟随**：摄像机 y 位置有死区——玩家在死区内垂直移动时摄像机不跟随。玩家超出死区边界时，摄像机以 `follow_speed` 追赶。死区高度 = 屏幕高度的 30%。

3. **场景边界限制**：摄像机四边受场景边界约束——`camera.limit_left/right/top/bottom`。场景加载时从场景管理器读取边界值。

4. **屏幕震动**：提供 `shake(intensity: float, duration: float)` 接口。震动强度 0~1，持续时间 0~500ms。震动在持续时间内衰减至零。其他系统（材质破坏、连锁传播）调用此接口。

5. **慢动作拉焦**：提供 `hit_stop(duration: float, time_scale: float)` 接口。在关键破坏事件（如 Boss 被环境要素击中）时，time_scale 降至 0.1~0.3 持续 100~300ms，然后恢复。MVP 阶段仅对 Boss 击败事件使用。

6. **默认参数**：

| 参数 | 默认值 |
|------|--------|
| follow_speed | 5.0 |
| look_ahead_offset | 100 px |
| vertical_deadzone_ratio | 0.3 |
| default_zoom | 1.0 |

### States and Transitions

无复杂状态。摄像机始终 ACTIVE（PLAYING 状态下）。PAUSED 和 DEAD 状态下冻结（无跟随、无震动）。

### Interactions

| 系统 | 方向 | 交互 |
|------|------|------|
| 玩家控制器 | 上游 | 读取玩家位置、面向方向 |
| 场景管理器 | 上游 | 读取场景边界 |
| 材质破坏系统 | 上游（调用本系统） | 调用 shake() 触发屏幕震动 |
| 连锁传播系统 | 上游（调用本系统） | 调用 hit_stop() 触发慢动作 |

## Formulas

### 水平平滑跟随

```
target_x = player.position.x + (face_right ? look_ahead_offset : -look_ahead_offset)
camera.position.x = lerp(camera.position.x, target_x, follow_speed * delta)
```

### 屏幕震动衰减

```
current_intensity = initial_intensity * (1 - elapsed / duration)
shake_offset = Vector2(randf_range(-1,1), randf_range(-1,1)) * current_intensity * max_shake_pixels
```

| 变量 | 范围 | 说明 |
|------|------|------|
| `max_shake_pixels` | 0~20 | 最大震动像素偏移，默认 20 |
| `initial_intensity` | 0~1 | 调用方传入的震动强度 |

## Edge Cases

- **玩家快速转身时摄像机跳跃**: look_ahead_offset 也使用 lerp 平滑切换，而非瞬切。
- **场景宽度小于屏幕宽度**: 摄像机居中，两边留黑边或不限制。
- **同时多个震动请求**: 取最大 intensity，不叠加（防止震动幅度爆炸）。
- **hit_stop 期间收到新的 hit_stop**: 取较小的 time_scale 和较长的 duration。

## Dependencies

| 系统 | 方向 | 性质 |
|------|------|------|
| 玩家控制器 | 上游 | 硬依赖——跟随目标 |
| 场景管理器 | 上游 | 硬依赖——场景边界 |
| 材质破坏系统 | 上游（调用本系统） | 软依赖——触发 shake |
| 连锁传播系统 | 上游（调用本系统） | 软依赖——触发 hit_stop |

## Tuning Knobs

| 参数 | 默认 | 范围 | 说明 |
|------|------|------|------|
| `follow_speed` | 5.0 | 1~20 | 越大越快锁定玩家，越小越平滑但有延迟感 |
| `look_ahead_offset` | 100 | 0~300 | 前方预瞄距离 |
| `vertical_deadzone_ratio` | 0.3 | 0~0.5 | 垂直死区占屏幕比例 |
| `max_shake_pixels` | 20 | 0~20 | 最大震动像素（提高至 20 以容纳 Boss 事件） |
| `default_zoom` | 1.0 | 0.5~2.0 | 缩放级别 |

## Visual/Audio Requirements

摄像机本身不产生视觉资源，但控制以下全局效果：屏幕震动、hit-stop 慢动作。

## UI Requirements

无。

## Acceptance Criteria

- [ ] **AC1**: GIVEN 玩家向右移动，WHEN 摄像机跟随，THEN 玩家始终在屏幕左半区（look_ahead_offset 偏右）
- [ ] **AC2**: GIVEN 玩家在垂直死区内上下微移，WHEN 检查摄像机 y，THEN 摄像机 y 不变
- [ ] **AC3**: GIVEN 场景边界 = (0,0)~(2000,1000)，WHEN 玩家走到左边缘，THEN 摄像机不显示 x<0 的区域
- [ ] **AC4**: GIVEN shake(0.8, 200ms) 被调用，WHEN 震动播放，THEN 摄像机在 200ms 内偏移振荡并衰减至零
- [ ] **AC5**: GIVEN hit_stop(200ms, 0.1) 被调用，WHEN 执行，THEN time_scale=0.1 持续 200ms 后恢复 1.0
- [ ] **AC6**: GIVEN 两个 shake 同时调用 (intensity 0.5 和 0.9)，WHEN 检查震动，THEN 使用 0.9（取最大值）
- [ ] **AC7**: **性能**: 摄像机更新 ≤ 1ms/帧
- [ ] **AC8**: 所有摄像机参数从配置文件读取

## Open Questions

| 问题 | 负责人 | 目标日期 | 状态 |
|------|--------|---------|------|
| 是否需要摄像机区域锁定（Boss 房间固定视角）？ | game-designer | MVP 前 | MVP 先做自由跟随 |
| 是否需要双指缩放（pinch-to-zoom）？ | game-designer | Alpha 前 | 移动端可能有用但非 MVP |
