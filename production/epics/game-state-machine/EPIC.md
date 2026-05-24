# Epic: 游戏状态机 (Game State Machine)

> **Layer**: Foundation
> **GDD**: `design/gdd/game-state-machine.md`
> **Architecture Module**: Game State Machine — 5 状态 + transition_to() + state_changed signal
> **Status**: Ready
> **Stories**: 2 stories

## Overview

实现游戏整体运行状态的管理——MAIN_MENU、PLAYING、PAUSED、DEAD、LEVEL_COMPLETE 五种互斥状态，以及它们之间的合法转换。作为 Foundation 层 Autoload，它是所有其他系统的"总开关"：输入系统在 paused 时忽略触控，物理在 playing 时运行，UI 根据状态切换界面。`transition_to()` 是状态变更的唯一入口，非法转换被拒绝并记录警告。合法转换表从 JSON 加载，硬编码 DEFAULT_TRANSITIONS 作为回退。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | GameStateMachine 作为 Autoload，state_changed(old, new) signal 广播所有状态变更 | LOW |
| ADR-0010: 游戏状态机架构 | GDScript enum + transition_to()，合法转换表从 JSON 加载 + DEFAULT_TRANSITIONS 回退；初始化时不自动发射 state_changed | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-game-state-001 | 5 种互斥状态: MAIN_MENU, PLAYING, PAUSED, DEAD, LEVEL_COMPLETE | ADR-0010 ✅ |
| TR-game-state-002 | transition_to(new_state) 是唯一状态变更方式；禁止直接赋值；每次转换发射 state_changed(old, new) signal | ADR-0010 ✅ |
| TR-game-state-003 | 非法转换拒绝: DEAD→PAUSED, LEVEL_COMPLETE→PAUSED；同状态转换忽略并警告 | ADR-0010 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/game-state-machine.md` are verified
- 所有 Logic 故事有通过的单测在 `tests/unit/game-state-machine/`
- 合法 + 非法转换矩阵全覆盖（5×5 = 25 种组合全部测试）

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | [状态机核心逻辑与转换验证](story-001-core-logic.md) | Logic | Complete | ADR-0010 |
| 002 | [配置驱动转换表与启动验证](story-002-config-driven.md) | Config/Data | Complete | ADR-0010 |
