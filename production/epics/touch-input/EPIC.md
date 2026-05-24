# Epic: 触屏输入系统 (Touch Input)

> **Layer**: Foundation
> **GDD**: `design/gdd/touch-input.md`
> **Architecture Module**: Touch Input — 原始触摸事件处理、左右分区逻辑
> **Status**: Ready
> **Stories**: 6 stories created — 4 Logic + 1 Integration + 1 Config/Data

## Overview

实现玩家所有操作的唯一入口——将原始触屏事件转化为标准化游戏输入信号。屏幕左半区驱动移动（滑动手势→方向向量），右半区驱动瞄准与射击（点击=单发射击，按住=持续射击+瞄准）。作为 Foundation 层 Autoload，不关心游戏逻辑，只负责准确、低延迟地将触屏原始数据转化为 `move_direction`、`aim_position`、`shoot_tapped` 等标准化信号。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | 触屏输入作为 Autoload，通过 signal 向上层广播输入事件 | LOW |
| ADR-0009: 玩家控制器与触屏射击架构 | 左右分区逻辑、tap vs hold 判别、移动死区参数化 | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-touch-input-001 | 5 个标准化输出信号: move_direction, aim_position, shoot_tapped, shoot_held, is_aiming | ADR-0009 ✅ |
| TR-touch-input-002 | 屏幕分割 split_x = screen_width/2；左=移动，右=瞄准+射击；按下时锁定触摸区域 | ADR-0009 ✅ |
| TR-touch-input-003 | 双指同时支持：1 左（移动）+ 1 右（瞄准/射击）；第 3 指忽略；同区域第 2 指忽略 | ADR-0009 ✅ |
| TR-touch-input-004 | Tap vs hold 判别：duration < tap_threshold(200ms) 且 distance < deadzone → tap；≥ threshold → hold | ADR-0009 ✅ |
| TR-touch-input-005 | 移动死区：offset 长度 < deadzone(默认 20px) → move_direction = Vector2.ZERO | ADR-0009 ✅ |
| TR-touch-input-006 | 游戏状态集成：仅在 PLAYING 状态处理输入；PAUSED/DEAD 抑制；MAIN_MENU 透传给 UI | ADR-0010 ✅ |
| TR-touch-input-007 | 所有调优参数（deadzone, max_radius, tap_threshold, split_x）从配置文件读取 | ADR-0009 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/touch-input.md` are verified
- All Logic and Integration stories have passing test files in `tests/unit/touch-input/`
- All UI stories have evidence docs with sign-off in `production/qa/evidence/`

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | 屏幕分区与触控点生命周期 | Logic | Ready | ADR-0009 |
| 002 | 移动信号生成 | Logic | Ready | ADR-0009 |
| 003 | 瞄准与射击信号生成 | Logic | Ready | ADR-0009 |
| 004 | 多点触控并发 | Logic | Ready | ADR-0009 |
| 005 | 游戏状态集成与焦点管理 | Integration | Ready | ADR-0001, ADR-0010 |
| 006 | 配置驱动参数 | Config/Data | Ready | ADR-0009 |

## Next Step

Run `/story-readiness production/epics/touch-input/story-001-zone-partition.md` — then `/dev-story` to begin implementation.
