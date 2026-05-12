# 关卡选择界面

> **Status**: In Design
> **Author**: cocos-specialist
> **Last Updated**: 2026-05-10
> **Implements Pillar**: Pillar 2（一分钟一关）、Pillar 4（越简单越好）

## Summary

关卡选择界面是玩家进入游戏的第一屏——以按钮网格展示所有关卡，显示解锁/锁定状态和星级角标。点击已解锁关卡进入 Playing 状态。

> **Quick reference** — Layer: `Presentation` · Priority: `MVP` · Key deps: `场景管理器, 本地存储`

## Overview

关卡选择界面是 MenuScene 的唯一内容。它以滚动网格排列关卡按钮（3 列），每个按钮显示关卡编号，角标显示已获星级，锁定关卡灰色不可点击。从本地存储读取进度数据渲染状态。选择关卡后触发状态机 SELECT_LEVEL 事件，场景管理器切换到 GameScene。

## Player Fantasy

"还有 47 关等着我。" 关卡选择界面是进度可见性的载体——看到解锁链条向前延伸、星级从 0 变成 3，给玩家持续前进的动力。

## Detailed Design

### Core Rules

**规则 1：按钮网格布局**
- 3 列，N 行（自动计算），可垂直滚动
- 每个按钮显示 level.id（"1", "2", ...）
- 按钮尺寸：最小触控区域 44×44px

**规则 2：关卡状态渲染**

| 状态 | 按钮外观 | 点击行为 |
|------|----------|----------|
| Locked | 灰色，不可点击 | 无响应 |
| Unlocked (未通关) | 亮色，可点击 | 进入关卡 |
| Completed (已通关) | 亮色 + 星级角标（1-3 星） | 进入关卡（重玩） |

**规则 3：数据源**
- 读取所有关卡的进度数据 (`nl_level_{id}`) → 决定按钮状态
- 读取 `nl_meta.lastPlayedLevelId` → 滚动到上次游玩位置
- 解锁条件：默认关卡 1 解锁；关卡 N 的 unlockCondition 满足时才解锁

**规则 4：选择关卡**
- 点击已解锁按钮 → 触发 `SELECT_LEVEL` 事件（传入 levelId）
- 状态机处理状态转换 → 场景管理器切换场景

### Interactions

| 系统 | 方向 | 数据流 |
|------|------|--------|
| 本地存储 | 读取 | getLevelProgress(id) → 决定按钮状态 |
| 游戏状态机 | 触发 | SELECT_LEVEL(levelId) |
| 场景管理器 | 被动 | 进入 Menu 态时本界面显示 |

## Formulas

不适用。

## Edge Cases

| 场景 | 预期行为 |
|------|----------|
| 存储中无任何进度（新玩家） | 仅关卡 1 解锁，其余锁定 |
| 关卡数据为空（无 levels.json） | 显示"无可用关卡"提示 |
| 滚动到很远的位置后切换关卡回来 | 保持上次滚动位置 |

## Dependencies

| 系统 | 方向 | 依赖性质 |
|------|------|----------|
| 本地存储 | 界面依赖 | 硬依赖——进度数据是按钮状态的唯一来源 |
| 关卡数据结构 | 界面依赖 | 硬依赖——读取关卡元数据（id/name/chapter/unlockCondition）渲染按钮列表 |
| 场景管理器 | 界面依赖 | 硬依赖——界面在 MenuScene 中显示 |

## Tuning Knobs

| 参数 | 当前值 | 效果 |
|------|--------|------|
| 每行列数 | 3 | 列数越多按钮越小，列数越少需更多滚动 |
| 按钮最小尺寸 | 44px | 小于 44px 违反触控无障碍标准 |

## Acceptance Criteria

- **GIVEN** 新玩家首次启动，**WHEN** 界面渲染，**THEN** 仅关卡 1 可点击（亮色），其余灰色锁定
- **GIVEN** 玩家已通关 1-5 关（第 5 关 3 星），**WHEN** 界面渲染，**THEN** 关卡 1-5 显示星级角标，关卡 6 解锁可点击
- **GIVEN** 玩家点击已解锁关卡 3，**WHEN** SELECT_LEVEL(3) 触发，**THEN** 状态机进入 Playing 态

## Cross-References

| This Document References | Target GDD | Specific Element Referenced | Nature |
|--------------------------|-----------|----------------------------|--------|
| 触发 SELECT_LEVEL 事件 | `design/gdd/game-state-machine.md` | SELECT_LEVEL → Playing | Event trigger |
| 读取关卡进度数据 | `design/gdd/local-storage.md` | getLevelProgress(id) | Data dependency |
| 读取关卡元数据 | `design/gdd/level-data-schema.md` | Level.id/name/chapter/unlockCondition | Data dependency |
| MenuScene 显示 | `design/gdd/scene-manager.md` | MenuScene 场景 | State trigger |

## Open Questions

暂无。