# Epic: 网格连线引擎 (Grid Connection Engine)

> **Layer**: Core
> **GDD**: design/gdd/grid-connection-engine.md
> **Architecture Module**: grid-connection-engine
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories grid-connection-engine`

## Overview

网格连线引擎是数字连线游戏的核心玩法——游戏的"心脏"。它将关卡数据渲染为可玩网格，处理玩家的滑屏连线操作：按数字顺序（1→2→3→…）连接节点、填充途经格子并播放咔嗒音效、支持单步撤销和路径回溯，全部格子填满后触发通关事件。引擎通过 `cc.Graphics` API 纯程序化渲染网格（零纹理资源），采用脏标记机制避免闲置帧重绘，Bresenham 插值确保快速滑动不跳格。对外通过 Push 订阅暴露步数变化和通关事件，通过 Pull 查询暴露网格快照和撤销状态。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-002: 网格渲染策略 | 纯 `cc.Graphics` API + `cc.Label` 组件池（TTF 字体）程序化渲染——零纹理资源，脏标记驱动重绘，6 色色盲友好色板 | MEDIUM-HIGH |
| ADR-003: 数据流模式 | 混合 Push/Pull——步数变化和通关事件 Push（subscribe），网格快照和撤销状态 Pull（getter） | LOW |
| ADR-005: 触控输入管线 | 引擎只接收 `INPUT_MOVE(row, col)`——不关心坐标来源；Bresenham 插值在引擎侧实现，非输入管理器 | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-GCE-001 | 网格初始化 — Cell[][] 创建、节点放置、障碍格标记 | ADR-002 ✅ |
| TR-GCE-002 | 路径追踪 — 按序连接 (1→2→3)、填充格子、到达下一数字切换 currentNumber | ADR-002, ADR-005 ✅ |
| TR-GCE-003 | Bresenham 插值 — 快速滑动填充跳格 | ADR-002 ✅ |
| TR-GCE-004 | 路径回溯 — 滑入当前路径末格=撤销，不可修改已锁定段 | ADR-002 ✅ |
| TR-GCE-005 | 通关检测 — 全部非障碍格 filled=true → LEVEL_COMPLETE | ADR-002, ADR-003 ✅ |
| TR-GCE-006 | 撤销接口 — undo() + canUndo() | ADR-002 ✅ |
| TR-GCE-007 | 3 内部状态 — Idle, Drawing, Dirty | ADR-002 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/grid-connection-engine.md` are verified
- All Logic and Integration stories have passing test files in `tests/`
- All Visual/Feel and UI stories have evidence docs with sign-off in `production/qa/evidence/`

## Next Step

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | 网格初始化与状态机 | Integration | Complete | ADR-002 |
| 002 | 核心路径追踪与序列验证 | Logic | Ready | ADR-002, ADR-005 |
| 003 | Bresenham 跳格插值 | Logic | Ready | ADR-002 |
| 004 | 路径回溯与撤销系统 | Logic | Ready | ADR-002 |
| 005 | 通关检测与事件发射 | Integration | Ready | ADR-002, ADR-003 |
| 006 | 视觉打磨——填充动画、路径渲染与音频同步 | Visual/Feel | Ready | ADR-002 |

## Next Step

Run `/story-readiness production/epics/grid-connection-engine/story-001-grid-init-state-machine.md` then `/dev-story` to begin implementation.
