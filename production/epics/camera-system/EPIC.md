# Epic: 2D 摄像机系统 (Camera System)

> **Layer**: Core
> **GDD**: `design/gdd/camera-system.md`
> **Architecture Module**: Camera System — 跟随、震动、hit-stop
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories camera-system`

## Overview

实现横版关卡中的 2D 摄像机控制——水平平滑跟随玩家（lerp + look_ahead_offset ±100px）、垂直 30% 死区、场景边界限制、屏幕震动和 hit-stop 慢动作效果。Camera2D 作为 PlayerController 子节点，CameraSystem Autoload 通过 Group "camera" 发现机制提供 shake() 和 hit_stop() 接口。shake 使用 Tween + tween_method(randf_range) 实现衰减振荡，hit-stop 通过 Engine.time_scale + create_timer(process_always=true) 恢复。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | CameraSystem 作为 Autoload；Group "camera" 发现 + await process_frame 防御性延迟 | LOW |
| ADR-0011: 2D 摄像机系统架构 | Camera2D 子节点 + 位置平滑 + 垂直死区 + look_ahead_offset；Tween shake + hit-stop time_scale | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-camera-system-001 | 水平跟随: lerp(camera.x, player.x + look_ahead_offset(±100px), follow_speed(5.0) × delta) | ADR-0011 ✅ |
| TR-camera-system-002 | 垂直死区: 屏幕高度 30%；仅当玩家超出死区边界时摄像机 y 才跟随 | ADR-0011 ✅ |
| TR-camera-system-003 | 场景边界限制通过 Camera2D.limit_left/right/top/bottom——从房间配置加载时设置 | ADR-0011 ✅ |
| TR-camera-system-004 | shake(intensity: 0-1, duration: 0-500ms)——衰减振荡；并发 shake: 取最大 intensity | ADR-0011 ✅ |
| TR-camera-system-005 | hit_stop(duration, time_scale: 0.1-0.3)——慢动作效果；并发: 取最小 time_scale 和最大 duration；debounce 50ms | ADR-0011 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/camera-system.md` are verified
- All Logic stories have passing test files in `tests/unit/camera-system/`
- Visual stories: shake + hit-stop 截图证据在 `production/qa/evidence/`

## Next Step

Run `/create-stories camera-system` to break this epic into implementable stories.
