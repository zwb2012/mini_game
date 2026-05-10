# 完成结算弹窗

> **Status**: In Design
> **Author**: cocos-specialist
> **Last Updated**: 2026-05-10
> **Implements Pillar**: Pillar 2（一分钟一关）

## Summary

完成结算弹窗在通关后显示——展示星级评定、实际步数 vs 最优步数、以及「下一关」「重玩」「返回」三个操作按钮。它是每关的情感高潮交付点。

> **Quick reference** — Layer: `Presentation` · Priority: `MVP` · Key deps: `步数评分系统`

## Overview

完成结算弹窗覆盖在 GameScene 上方，在 LEVEL_COMPLETE 事件后显示。核心展示：星级评定动画（1-3 星逐个点亮）、实际步数与最优步数的对比（如 "14 / 12 步"）、操作按钮。它是 Pillar 2（"一分钟一关"）的自然休止符——给玩家一个"成就感确认"的瞬间，然后快速进入下一关。

## Player Fantasy

"我做到了！" 三星点亮时的满足感。2 星时的"差一点——再试一次"。"下一关"按钮是进入下一轮"一分钟一关"循环的邀请。

## Detailed Design

### Core Rules

**规则 1：星级展示**
- 3 颗星并排排列，每颗星间隔 200ms 依次点亮
- 点亮的星为金色，未点亮的星为灰色
- 若 stars=2，第 1、2 颗点亮，第 3 颗不亮

**规则 2：步数对比**
- 显示格式：`实际步数 / 最优步数`（如 "14 / 12"）
- 若 actualSteps ≤ optimalSteps（三星），文本为金色；否则白色

**规则 3：操作按钮**

| 按钮 | 行为 | 可见条件 |
|------|------|----------|
| 下一关 | 触发 NEXT_LEVEL → Playing(levelId+1) | 存在下一关 |
| 重玩 | 触发 NEXT_LEVEL → Playing(levelId) | 始终可见 |
| 返回 | 触发 BACK_TO_MENU → Menu | 始终可见 |

**规则 4：弹窗出现时机**
- 引擎触发 LEVEL_COMPLETE → 评分计算 → 结算弹窗显示
- 弹窗显示前有 200ms 全屏闪烁（网格反馈，由引擎负责）

### Interactions

| 系统 | 方向 | 数据流 |
|------|------|--------|
| 步数评分系统 | 读取 | stars, actualSteps, optimalSteps → 展示 |
| 游戏状态机 | 触发 | NEXT_LEVEL / BACK_TO_MENU |

## Formulas

不适用。

## Edge Cases

| 场景 | 预期行为 |
|------|----------|
| 当前关卡是最后一关（无下一关） | "下一关"按钮隐藏，仅显示"重玩"和"返回" |
| 玩家重玩已满星关卡并获得更低星级 | 不覆盖旧星级（存储层保护），但结算弹窗正常显示新结果 |

## Dependencies

| 系统 | 方向 | 依赖性质 |
|------|------|----------|
| 步数评分系统 | 弹窗依赖 | 硬依赖——所有展示数据来自评分 |
| 游戏状态机 | 弹窗触发 | 硬依赖——按钮驱动状态转换 |

## Acceptance Criteria

- **GIVEN** stars=3，**WHEN** 结算弹窗显示，**THEN** 3 颗金色星依次点亮（每次间隔 200ms）
- **GIVEN** stars=2，**WHEN** 结算弹窗显示，**THEN** 2 颗星点亮，第 3 颗灰色
- **GIVEN** 当前关卡 id=50（最后一关），**WHEN** 弹窗显示，**THEN** "下一关"按钮不显示
- **GIVEN** 结算弹窗显示中，**WHEN** 点击"下一关"，**THEN** 状态机触发 NEXT_LEVEL，进入下一关

## Open Questions

暂无。