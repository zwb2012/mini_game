# Epic: 游戏状态机

> **Layer**: Foundation
> **GDD**: design/gdd/game-state-machine.md
> **Architecture Module**: game-state-machine
> **Status**: Ready
> **Stories**: 4 created

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | 核心状态机——状态定义与合法转换 | Logic | Complete | ADR-001 |
| 002 | 回调注册与同步执行 | Logic | Complete | ADR-001 |
| 003 | 边界情况守卫 | Logic | Complete | ADR-001 |
| 004 | 微信生命周期集成——切后台自动暂停 | Integration | Complete | ADR-001 |

## Overview

实现数字连线游戏的运行时状态管理。基于 ADR-001 定义的 4 状态事件驱动状态机——Menu → Playing → Paused → LevelComplete，支持 8 条合法状态转换。提供 `getState()`, `transition(event, params)`, `onEnter(state, cb)` / `onExit(state, cb)` 作为公共 API，非法转换静默忽略不做崩溃处理。纯 TypeScript 实现，零 Cocos API 依赖。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-001: 游戏状态机架构 | 事件驱动状态转换，非法静默忽略，微信切后台自动 PAUSE | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-GSM-001 | 4 状态 — Menu, Playing, Paused, LevelComplete | ADR-001 ✅ |
| TR-GSM-002 | 8 条合法转换 — SELECT_LEVEL, PAUSE, RESUME, QUIT_TO_MENU, LEVEL_COMPLETE, NEXT_LEVEL, REPLAY, BACK_TO_MENU | ADR-001 ✅ |
| TR-GSM-003 | onEnter/onExit 回调 — 同步按序执行 | ADR-001 ✅ |
| TR-GSM-004 | 非法转换静默忽略 + 微信切后台自动 PAUSE | ADR-001 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/game-state-machine.md` are verified
- All Logic and Integration stories have passing test files in `tests/`

## Next Step

Run `/create-stories game-state-machine` to break this epic into implementable stories.
