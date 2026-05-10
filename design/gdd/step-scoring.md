# 步数评分系统

> **Status**: In Design
> **Author**: cocos-specialist
> **Last Updated**: 2026-05-10
> **Last Verified**: —
> **Implements Pillar**: Pillar 1（纯逻辑零运气）

## Summary

步数评分系统实时追踪玩家的连线步数，通关后将实际步数与关卡预设的最优步数对比，输出 1-3 星评级。步数是驱动"再试一次刷三星"重复挑战行为的关键指标。

> **Quick reference** — Layer: `Feature` · Priority: `MVP` · Key deps: `网格连线引擎`

## Overview

步数评分系统是网格连线引擎的"记分员"。它从引擎接收步数变化通知——每填充一格 +1，每撤销一格 -1——实时维护步数计数。通关时，将最终步数 `actualSteps` 与关卡数据中的 `optimalSteps` 对比，按比例计算星级。三星评分是玩家"掌控感"（Competence）的核心反馈通道，驱动重复挑战行为。

## Player Fantasy

"我能做得更好。" 三星评分给每次通关赋予轻量竞技性——不是和别人比，而是和自己比。看到 2 星时产生的"差一点就 3 星了"的冲动，是次日留存的核心驱动力。

## Detailed Design

### Core Rules

**规则 1：步数追踪**
- 引擎每填充一格 → `stepCount++`
- 引擎每撤销一格 → `stepCount--`
- stepCount 最小值 = 0（不能为负）

**规则 2：星级计算**

```
starRatio = actualSteps / optimalSteps
```

| 条件 | 星级 |
|------|------|
| starRatio ≤ 1.0 | ★★★ 三星（完美或更优） |
| starRatio ≤ 1.5 | ★★ 二星 |
| starRatio ≤ 2.5 | ★ 一星 |
| starRatio > 2.5 | ★ 一星（底线，防止零星挫败） |

- `optimalSteps` 从关卡数据的 `Level.optimalSteps` 读取
- 结果向上取整：`starRatio = 1.0` → 三星；`starRatio = 1.01` → 二星

**规则 3：星级封顶和保底**
- 最高 ★★★，最低 ★（无论如何通关都有 1 星）
- 这是"通关即奖励"的设计意图——不给零星挫败感

**规则 4：通关触发**
- 收到引擎的 LEVEL_COMPLETE + finalStepCount → 计算星级
- 将结果（stars, actualSteps）写入本地存储
- 通知 HUD 和结算弹窗显示结果

### States and Transitions

无独立状态——评分系统是对引擎事件的被动响应。

### Interactions with Other Systems

| 系统 | 方向 | 数据流 |
|------|------|--------|
| 网格连线引擎 | 订阅引擎事件 | 接收 stepCount 更新和 LEVEL_COMPLETE + finalStepCount |
| 关卡数据结构 | 读取 | 读取 Level.optimalSteps 作为评分基准 |
| 本地存储 | 写入 | 保存 stars, actualSteps 到 nl_level_{id} |
| 游戏内 HUD | 通知 | 发送当前 stepCount → HUD 显示步数 |
| 完成结算弹窗 | 通知 | 发送 stars, actualSteps, optimalSteps → 结算展示 |

## Formulas

### 星级计算公式

```
starRatio = actualSteps / optimalSteps

stars = 3  if starRatio ≤ 1.0
        2  if starRatio ≤ 1.5
        1  if starRatio > 1.5
```

**变量：**

| 变量 | 符号 | 类型 | 范围 | 描述 |
|------|------|------|------|------|
| actualSteps | A | int | [optimalSteps, ∞) | 玩家实际步数 |
| optimalSteps | O | int | [1, max_steps] | 关卡理论最小步数 |

**输出范围：** 1-3 星
**示例：** optimalSteps=12, actualSteps=14 → ratio=1.17 → ★★ 二星

## Edge Cases

| 场景 | 预期行为 |
|------|----------|
| actualSteps = 0（不可能通关——至少需要连接所有节点的步数） | 防御性检查：若为 0，计算为 ★（1 星） |
| optimalSteps 为 0 或未定义（数据损坏） | 默认 optimalSteps=1，避免除零错误 |
| 玩家反复撤销导致 stepCount 大幅波动 | 评分在 LEVEL_COMPLETE 时才算数，中间波动不影响 |
| 同一关多次通关 | 仅在新星级 > 旧星级 或 (星级相同但步数更少) 时更新存储 |

## Dependencies

| 系统 | 方向 | 依赖性质 |
|------|------|----------|
| 网格连线引擎 | 评分依赖引擎 | 硬依赖——引擎是步数和通关事件的唯一来源 |
| 关卡数据结构 | 评分依赖数据 | 硬依赖——optimalSteps 是评分基准 |
| 本地存储 | 评分写入 | 硬依赖——星级和步数必须持久化 |
| 游戏内 HUD | HUD 依赖评分 | HUD 读取 stepCount 显示 |
| 完成结算弹窗 | 结算依赖评分 | 结算读取 stars 展示 |

## Tuning Knobs

| 参数 | 当前值 | 安全范围 | 效果 |
|------|--------|----------|------|
| ★★★ 阈值 | 1.0 | [1.0, 1.2] | 增大→更容易拿三星，降低三星含金量 |
| ★★ 阈值 | 1.5 | [1.2, 2.0] | 增大→二星更容易，缩小三星和二星的差距 |
| ★ 阈值 | 2.5 | [1.5, 3.0] | 增大→更宽容，保证玩家总是有星 |

## Visual/Audio Requirements

不适用——评分系统纯逻辑，无视觉/音频产出。

## UI Requirements

不适用——评分本身无 UI。结果通过 HUD 和结算弹窗展示。参阅系统 #10（游戏内 HUD）和 #11（完成结算弹窗）。

## Cross-References

| This Document References | Target GDD | Specific Element Referenced | Nature |
|--------------------------|-----------|----------------------------|--------|
| 接收步数事件 | `design/gdd/grid-connection-engine.md` | stepCount, LEVEL_COMPLETE | Data dependency |
| 读取最优步数 | `design/gdd/level-data-schema.md` | Level.optimalSteps | Data dependency |
| 写入通关数据 | `design/gdd/local-storage.md` | saveLevelProgress(id, stars, steps) | Data dependency |
| 通知 HUD | `design/gdd/in-game-hud.md` | stepCount 实时显示 | Data dependency |
| 通知结算 | `design/gdd/level-complete-overlay.md` | stars, actualSteps, optimalSteps | Data dependency |

## Acceptance Criteria

- **GIVEN** optimalSteps=12, actualSteps=12, **WHEN** 计算星级, **THEN** stars=3
- **GIVEN** optimalSteps=12, actualSteps=18, **WHEN** 计算星级, **THEN** stars=2
- **GIVEN** optimalSteps=12, actualSteps=36, **WHEN** 计算星级, **THEN** stars=1（保底）
- **GIVEN** optimalSteps=0（数据损坏）, **WHEN** 计算星级, **THEN** 使用 optimalSteps=1，不崩溃
- **GIVEN** 玩家通关，新星级 3 > 旧星级 2，**WHEN** 保存进度，**THEN** 存储更新为 3 星

## Open Questions

暂无。