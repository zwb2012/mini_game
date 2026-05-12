# Epic: 音频管理器

> **Layer**: Foundation
> **GDD**: design/gdd/audio-manager.md
> **Architecture Module**: audio-manager
> **Status**: Ready
> **Stories**: 2 stories ready for implementation
> **Status**: In Progress

## Overview

封装 Cocos AudioSource API，管理连线音效(TICK)、完成音效(LEVEL_COMPLETE)和背景音播放。支持静音切换，TICK 同帧防抖合并（多次请求同一帧只播一次），资源缺失时静默降级（console.warn + 不崩溃）。原型验证确认：无 TICK 音频时"划线满足感"明显降级——音频反馈是 Pillar 3 的核心实现。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-004: 平台适配层 | IPlatformStorage 接口 + WeChat/Web 双实现（静音偏好存储） | MEDIUM |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-AM-001 | 音频事件定义 — TICK/LEVEL_COMPLETE 预加载, AMBIENT 延迟加载 | ADR-004 ✅ |
| TR-AM-002 | 播放接口 — play(eventId)、setMuted(bool)、isMuted() | ADR-004 ✅ |
| TR-AM-003 | TICK 同帧防抖 — 同一帧多次请求合并为一次播放 | ❌ No ADR |
| TR-AM-004 | 资源缺失静默降级 — 加载失败 console.warn, 游戏不崩溃 | ❌ No ADR |

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | AudioManager 核心播放 | Logic | Complete | ADR-004, ADR-010 |
| 002 | 同帧防抖与静默降级 | Logic | Complete | ADR-010 |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/audio-manager.md` are verified
- All Logic and Integration stories have passing test files in `tests/`

## Next Step

Run `/create-stories audio-manager` to break this epic into implementable stories.
