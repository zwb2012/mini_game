# Epic: 输入管理器

> **Layer**: Foundation
> **GDD**: design/gdd/input-manager.md
> **Architecture Module**: input-manager
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories input-manager`

**Stories**: Not yet created — run `/create-stories input-manager`

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | 坐标映射与输入守卫 | Logic | Ready | ADR-005 |
| 002 | Cocos 触摸事件管线 | Integration | Ready | ADR-005 |

## Overview

实现触屏操作与游戏逻辑之间的输入桥接层。基于 ADR-005 定义的 4 步管线——坐标映射（touch.getUILocation() → 网格行列）→ 死区过滤（4px 阈值）→ 状态守卫（仅 Playing 态激活）→ 事件发布（INPUT_MOVE/INPUT_END）。仅处理第一指（多点触摸忽略），越界坐标丢弃，端到端延迟预算 ≤50ms。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-005: 触控输入管线 | 4 步管线 — 坐标映射 + 死区 + 守卫 + 发布 | MEDIUM |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-IM-001 | TOUCH_START/MOVE/END → 屏幕坐标转网格坐标 | ADR-005 ✅ |
| TR-IM-002 | 滑动阈值 4px + 多点触摸忽略 + 越界丢弃 | ADR-005 ✅ |
| TR-IM-003 | 端到端延迟 ≤50ms, 仅 Playing 态激活 | ADR-005 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/input-manager.md` are verified
- All Logic and Integration stories have passing test files in `tests/`

## Next Step

Run `/create-stories input-manager` to break this epic into implementable stories.
