# 游戏内 HUD

> **Status**: In Design
> **Author**: cocos-specialist
> **Last Updated**: 2026-05-10
> **Implements Pillar**: Pillar 3（划线本身就是奖励）、Pillar 4（越简单越好）

## Summary

游戏内 HUD 是 Playing 状态下的常驻 UI 层——显示步数计数器、撤销按钮、暂停按钮和当前连线颜色指示。所有元素极简，不遮挡网格，遵循"越简单越好"（Pillar 4）。

> **Quick reference** — Layer: `Presentation` · Priority: `MVP` · Key deps: `游戏状态机, 网格连线引擎, 步数评分系统`

## Overview

游戏内 HUD 覆盖在 GameScene 的网格上方，提供三个核心功能：显示当前步数（从评分系统实时更新）、撤销上一步操作（调用引擎 undo）、暂停游戏（触发 PAUSE 事件）。HUD 在 Playing 状态显示，Paused 状态被暂停菜单覆盖，LevelComplete 状态被结算弹窗覆盖。

## Player Fantasy

HUD 不制造存在感——它只在玩家需要时可用，不需要时不打扰。步数计数器是"我能做得更好"的数据锚点；撤销按钮让试错无成本。

## Detailed Design

### Core Rules

**规则 1：步数计数器**
- 位置：屏幕顶部居中
- 显示格式：`{stepCount}` （纯数字，大字号）
- 每步更新：引擎驱动 → 评分系统计数 → HUD 刷新
- 通关后冻结显示最终步数

**规则 2：撤销按钮**
- 位置：屏幕底部左侧
- 图标：逆时针箭头（←↩）
- 点击 → 调用 `gridEngine.undo()`
- 仅在 Drawing/Dirty 状态且 path 非空时可点击
- path 为空时灰色不可点击

**规则 3：暂停按钮**
- 位置：屏幕顶部右侧
- 图标：两条竖线（⏸）
- 点击 → 触发状态机 `PAUSE` 事件

**规则 4：暂停菜单（Paused 态覆盖）**
- 半透明遮罩覆盖网格
- 两个按钮：「继续」（触发 RESUME）、「退出」（触发 QUIT_TO_MENU）
- 最小实现，无动画

### Interactions

| 系统 | 方向 | 数据流 |
|------|------|--------|
| 步数评分系统 | 读取 | stepCount → 显示步数计数器 |
| 网格连线引擎 | 调用 | undo() → 撤销一步 |
| 游戏状态机 | 监听 + 触发 | 监听 Playing/Paused 状态切换；触发 PAUSE/RESUME/QUIT_TO_MENU |

## Formulas / Edge Cases

| 场景 | 预期行为 |
|------|----------|
| 撤销到 path 为空 | 撤销按钮变灰，不可点击 |
| Playing → Paused 切换 | HUD 隐藏，暂停菜单显示 |
| 微信切后台 | 状态机自动 PAUSE → HUD 隐藏 + 暂停菜单显示 |

## Dependencies

| 系统 | 方向 | 依赖性质 |
|------|------|----------|
| 步数评分系统 | HUD 依赖 | 硬依赖——stepCount 数据源 |
| 网格连线引擎 | HUD 调用 | 硬依赖——撤销功能依赖引擎 |
| 游戏状态机 | HUD 依赖 | 硬依赖——状态决定 HUD 显示/隐藏 |

## Acceptance Criteria

- **GIVEN** Playing 状态，**WHEN** 引擎每填充一格，**THEN** 步数计数器实时更新
- **GIVEN** path 非空，**WHEN** 点击撤销按钮，**THEN** 引擎 undo() 被调用，步数 -1
- **GIVEN** path 为空，**WHEN** 页面渲染，**THEN** 撤销按钮灰色不可点击
- **GIVEN** Playing 状态，**WHEN** 点击暂停按钮，**THEN** 状态变为 Paused

## Open Questions

暂无。