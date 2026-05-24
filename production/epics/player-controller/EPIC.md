# Epic: 玩家控制器 (Player Controller)

> **Layer**: Core
> **GDD**: `design/gdd/player-controller.md`
> **Architecture Module**: Player Controller — CharacterBody2D 移动、面向方向、射击触发
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories player-controller`

## Overview

实现将触屏输入信号转化为角色的移动、瞄准和射击行为。管理 CharacterBody2D 运动（velocity = move_direction × move_speed, 400 px/s）、面向方向（根据 aim_position 自动翻转 sprite）、射击触发（shoot_tapped → WeaponSystem.fire_current()）。作为 Scene Node（非 Autoload），每个房间 .tscn 中实例化，提供 `reset()` 方法用于死亡重生。同时实现挤压伤害检测（被两个碰撞体夹住 1.0s 后每秒扣 1 HP）。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | PlayerController 作为 Scene Node，通过 signal 与 Autoload 交互 | LOW |
| ADR-0009: 玩家控制器与触屏射击架构 | CharacterBody2D + move_and_slide()；Scene Node（非 Autoload）；reset() 方法 | LOW |
| ADR-0011: 2D 摄像机系统架构 | Camera2D 作为 PlayerController 子节点；look_ahead_offset(±100px) 传入摄像机跟随 | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-player-controller-001 | 移动: velocity = move_direction × move_speed(400 px/s)，在 _physics_process 中通过 CharacterBody2D.move_and_slide() | ADR-0009 ✅ |
| TR-player-controller-002 | 面向: face_right = aim_position.x > screen_center_x；look_ahead_offset 用于摄像机；sprite 翻转 | ADR-0009 ✅ |
| TR-player-controller-003 | 射击: shoot_tapped → WeaponSystem.fire_current() 通过 signal；shoot_held → 每帧轮询 → fire_current()（CD 委托给 WeaponSystem） | ADR-0009 ✅ |
| TR-player-controller-004 | Scene node（非 Autoload）——每个房间 .tscn 实例化；reset() 方法: position=spawn_point, velocity=Vector2.ZERO | ADR-0009 ✅ |
| TR-player-controller-005 | 挤压伤害: 当 slide_collision_count ≥ 2 且 move_dir = zero 持续 1.0s → 1 HP/s crush damage 通过 hit_detected | ADR-0004 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/player-controller.md` are verified
- All Logic stories have passing test files in `tests/unit/player-controller/`
- 移动响应延迟 < 1 帧 + 射击触发精度 + 挤压伤害 1.0s 计时测试

## Next Step

Run `/create-stories player-controller` to break this epic into implementable stories.
