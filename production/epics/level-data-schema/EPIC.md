# Epic: 关卡数据结构

> **Layer**: Foundation
> **GDD**: design/gdd/level-data-schema.md
> **Architecture Module**: level-data-schema
> **Status**: Ready
> **Stories**: 2 stories ready for implementation
> **Status**: In Progress

## Overview

实现数字连线游戏的关卡数据加载和校验系统。基于 ADR-006 定义的单 JSON + resources.load() 策略，提供 `ILevelDataProvider` 接口——`loadLevels()` 返回全部关卡、`getLevel(id)` 返回单关、`getLevelCount()` 返回总数。构建时对 levels.json 做 schema 校验（JSON Schema），运行时对加载结果做二次校验（节点连续性、坐标合法性），校验失败抛异常由上层处理。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-006: 关卡数据格式与校验策略 | 单 JSON + resources.load() + 构建时+运行时双校验 | MEDIUM (Proposed) |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-LDS-001 | LevelData JSON 格式 — version + levels[] 数组 | ADR-006 ✅ |
| TR-LDS-002 | 单关数据结构 — grid {rows,cols}, nodes[], blockedCells[], optimalSteps | ADR-006 ✅ |
| TR-LDS-003 | 数据校验 — nodes 连续、坐标不重复、grid [3,10]、optimalSteps >= 1 | ADR-006 ✅ |

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | 数据接口与校验逻辑 | Logic | Complete | ADR-006 |
| 002 | 加载器与构建脚本 | Logic | Complete | ADR-006 |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/level-data-schema.md` are verified
- All Logic and Integration stories have passing test files in `tests/`
- All Visual/Feel and UI stories have evidence docs with sign-off in `production/qa/evidence/`

## Next Step

Run `/create-stories level-data-schema` to break this epic into implementable stories.
