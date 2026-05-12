# Epic: 本地存储

> **Layer**: Foundation
> **GDD**: design/gdd/local-storage.md
> **Architecture Module**: local-storage
> **Status**: Ready
> **Stories**: 3 created

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | IPlatformStorage 接口与双平台适配器 | Integration | Ready | ADR-004 |
| 002 | 存储管理器——数据模型与 CRUD | Logic | Ready | ADR-004 |
| 003 | 写入策略与边界情况 | Logic | Ready | ADR-004 |

## Overview

实现玩家数据的跨会话持久化。基于 ADR-004 定义的 `IPlatformStorage` 接口，在微信环境使用 `wx.setStorageSync/getStorageSync`，Web 预览使用 `cc.sys.localStorage` 回退。以 `nl_` 为 key 前缀命名空间，管理三类数据：关卡进度（levelId 主键，通关同步写入）、设置偏好（静音等，500ms 防抖延迟写）、元数据（会话结束写入）。数据损坏或缺失时返回安全默认值。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-004: 平台适配层 | IPlatformStorage 接口 + WeChat/Web 双实现 | HIGH (微信 API) |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-LS-001 | nl_ 前缀命名空间 — LevelProgress, Settings, Meta | ADR-004 ✅ |
| TR-LS-002 | 通关同步写入 + 设置 500ms 防抖 + 元数据会话结束写 | ADR-004 ✅ |
| TR-LS-003 | 微信 wx.setStorage 优先 + cc.sys.localStorage 回退 | ADR-004 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/local-storage.md` are verified
- All Logic and Integration stories have passing test files in `tests/`

## Next Step

Run `/create-stories local-storage` to break this epic into implementable stories.
