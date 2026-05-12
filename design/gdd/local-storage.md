# 本地存储

> **Status**: In Design
> **Author**: cocos-specialist
> **Last Updated**: 2026-05-10
> **Last Verified**: —
> **Implements Pillar**: Pillar 4（越简单越好）

## Summary

本地存储系统封装微信小游戏 `wx.setStorage` / `cc.sys.localStorage` API，持久化玩家进度（关卡完成状态、星级评分）、设置偏好（静音开关）和游戏元数据。以 level.id 为主键索引关卡进度，通关进度同步写入（确保不丢档），设置变更延迟写入（500ms 防抖），元数据会话结束时写入。

> **Quick reference** — Layer: `Foundation` · Priority: `MVP` · Key deps: `None`

## Overview

本地存储系统封装微信小游戏平台的 KV 存储 API，为其他系统提供统一的进度读写接口。存储数据分为三类——关卡进度（每个 level.id 对应一条记录：完成状态 + 星级 + 最佳步数）、用户设置（静音偏好）、游戏元数据（最后游玩关卡、总游戏时长）。在微信环境中使用 `wx.setStorageSync/getStorageSync`，在 Web 预览环境回退到 `cc.sys.localStorage`。

## Player Fantasy

纯基础设施——玩家感知不到存储系统。但它直接影响"再玩一关"的动机：进度丢失会立即破坏玩家的投入感。存储可靠性 = 玩家信任。

## Detailed Design

### Core Rules

**规则 1：存储数据模型**

```
// Key: "level_{id}"
LevelProgress = {
  completed: boolean,      // 是否通关
  stars: number,           // 获得星级 [0, 3]
  bestSteps: number,       // 最佳步数
  firstCompletedAt: string // 首次通关时间 ISO8601
}

// Key: "settings"
Settings = {
  muted: boolean,          // 静音状态
  lastPlayedLevelId: number // 最后游玩的关卡 ID
}

// Key: "meta"
Meta = {
  totalPlayTime: number,   // 总游戏时长（秒）
  totalLevelsCompleted: number, // 累计通关数
  installDate: string      // 首次启动日期 ISO8601
}
```

**规则 2：存储键命名**
- 所有 key 使用前缀 `nl_`（numberlink 缩写）避免与其他小程序数据冲突
- 实际 key: `nl_level_1`, `nl_settings`, `nl_meta`

**规则 3：写入策略**
- 关卡通关后**立即同步写入**（确保即使微信被杀进程也不丢进度）
- 设置变更延迟写入（500ms 防抖）
- 元数据每次会话结束时写入

**规则 4：存储容量管理**
- 微信单个 key 数据限制 1MB，总存储限制 10MB
- 150 关进度估算：150 × 200 bytes ≈ 30KB，远低于限制
- 若写入失败（存储满）→ console.error，不崩溃，不影响游戏

### States and Transitions

无状态——纯读写接口。

### Interactions with Other Systems

| 系统 | 方向 | 数据流 |
|------|------|--------|
| 关卡选择界面 | 读取 level 进度 | getLevelProgress(id) → 显示星级/解锁状态 |
| 步数评分系统 | 写入 level 进度 | saveLevelProgress(id, stars, steps) |
| 音频管理器 | 读写静音偏好 | getSettings().muted / setMuted(bool) |
| 游戏启动流程 | 读取元数据 | getMeta() → 恢复最后游玩状态 |

## Formulas

不适用。

## Edge Cases

| 场景 | 预期行为 |
|------|----------|
| 存储空间满 | console.error + 游戏正常运行，本次进度不保存 |
| 读取不存在的 key（新玩家首次启动） | 返回默认值：completed=false, stars=0, bestSteps=0 |
| 同一关重复通关（重玩刷星） | 仅在新星级 > 旧星级或新步数 < 旧步数时更新 |
| 微信存储 API 不可用（旧版本微信） | 回退到内存存储——游戏可玩但进度不持久化 |
| 存储数据被用户手动清除（微信设置中） | 下次启动返回默认值，静默重置——不弹窗不报错 |

## Dependencies

| 系统 | 方向 | 依赖性质 |
|------|------|----------|
| 关卡选择界面 | 界面依赖本系统 | 硬依赖——读取进度来渲染关卡列表 |
| 步数评分系统 | 评分写入本系统 | 硬依赖——通关后必须保存星级和步数 |

## Tuning Knobs

| 参数 | 当前值 | 安全范围 | 效果 |
|------|--------|----------|------|
| 设置写入防抖延迟 (ms) | 500 | [100, 2000] | 越短越可靠但写入频率越高 |
| 存储键前缀 | `nl_` | 任意 2-5 字符 | 避免与其他小程序存储冲突 |

## Visual/Audio Requirements

不适用。

## UI Requirements

不适用。

## Cross-References

| This Document References | Target GDD | Specific Element Referenced | Nature |
|--------------------------|-----------|----------------------------|--------|
| level.id 为存储 key | `design/gdd/level-data-schema.md` | Level.id 字段 | Data dependency |
| 静音偏好读写 | `design/gdd/audio-manager.md` | setMuted / isMuted 接口 | Data dependency |
| 星级数据写入 | `design/gdd/step-scoring.md` | 1-3 star output | Data dependency |

## Acceptance Criteria

- **GIVEN** 玩家首次启动游戏，**WHEN** 读取 `nl_level_1`，**THEN** 返回默认值（completed=false, stars=0）
- **GIVEN** 玩家通关第 5 关获得 3 星，**WHEN** 调用 saveLevelProgress(5, 3, 14)，**THEN** 数据成功写入，再次读取时 stars=3, bestSteps=14
- **GIVEN** 第 3 关已有 2 星记录，**WHEN** 重玩获得 3 星，**THEN** 更新为 3 星（取最大值）
- **GIVEN** 微信存储满，**WHEN** 调用 saveLevelProgress，**THEN** console.error 输出，游戏不崩溃
- **GIVEN** 存储数据损坏（手动改 JSON），**WHEN** 读取，**THEN** 捕获异常，返回默认值

## Open Questions

- 是否需要在后续版本加入云存储同步（wx.setUserCloudStorage）？→ Vertical Slice 阶段评估