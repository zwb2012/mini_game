# Epic: 场景管理器

> **Layer**: Foundation
> **GDD**: design/gdd/scene-manager.md
> **Architecture Module**: scene-manager
> **Status**: Ready
> **Stories**: 2 stories ready for implementation

## Overview

封装 Cocos Creator 的 scene 加载 API，在状态机驱动下切换 MenuScene 和 GameScene。提供 `loadScene(name, params)` 异步接口——优先使用 `director.preloadScene()` 预加载目标场景，降低切换延迟。MVP 阶段瞬切无过渡动画，场景加载失败时回退到 MenuScene。场景参数通过 `params` 传递（如 `{levelId}`），在目标场景 onLoad 中读取。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-001: 游戏状态机架构 | 状态转换驱动场景 loadScene | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-SM-001 | MenuScene + GameScene 状态驱动切换 + 预加载 | ADR-001 ✅ |
| TR-SM-002 | 场景参数传递 levelId → engine 初始化 | ADR-001 ⚠️ (隐式覆盖) |

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | 核心场景加载器 | Logic | Complete | ADR-001 |
| 002 | 守卫子句与错误处理 | Logic | Complete | ADR-001 |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/scene-manager.md` are verified
- All Logic and Integration stories have passing test files in `tests/`

## Next Step

Run `/create-stories scene-manager` to break this epic into implementable stories.
