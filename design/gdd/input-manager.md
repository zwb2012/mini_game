# 输入管理器

> **Status**: In Design
> **Author**: cocos-specialist
> **Last Updated**: 2026-05-10
> **Last Verified**: —
> **Implements Pillar**: Pillar 3（划线本身就是奖励）

## Summary

输入管理器是玩家触屏操作与游戏逻辑之间的桥梁。它将 Cocos 原生触摸事件转换为网格坐标输入，仅在 Playing 状态激活，端到端延迟目标 ≤50ms，确保"划线本身就是奖励"（Pillar 3）。

> **Quick reference** — Layer: `Foundation` · Priority: `MVP` · Key deps: `游戏状态机`

## Overview

输入管理器是玩家触屏操作与游戏逻辑之间的桥梁。它监听 Cocos Creator 的触摸事件（TOUCH_START / TOUCH_MOVE / TOUCH_END），将屏幕像素坐标转换为网格行列坐标，并将处理后的输入事件分发给订阅者（主要是网格连线引擎）。输入管理器只在 Playing 状态下激活，其他状态下静默丢弃所有触摸事件。核心设计目标是低延迟响应——从手指触屏到连线引擎收到事件的端到端延迟不超过 50ms，确保"划线本身就是奖励"（Pillar 3）的流畅手感。

## Player Fantasy

输入管理器是纯基础设施——玩家不直接感知它，但它的响应质量直接决定游戏的"手感"。手指滑过屏幕的每一帧都应该即时反映为网格上的线条延伸，任何可感知的延迟都会破坏"划线本身就是奖励"（Pillar 3）。目标手感：像 Flow Free 一样流畅跟手。

## Detailed Design

### Core Rules

**规则 1：触摸事件监听**
- 在 Cocos Canvas 节点上注册 `TOUCH_START`、`TOUCH_MOVE`、`TOUCH_END` 事件
- TOUCH_START：记录起始屏幕坐标 (startX, startY)，重置当前路径
- TOUCH_MOVE：计算当前坐标与上一帧坐标的差值，发出 `INPUT_MOVE` 事件
- TOUCH_END：发出 `INPUT_END` 事件，终止当前路径

**规则 2：坐标映射**

```
gridRow = floor((touchY - gridOriginY) / cellSize)
gridCol = floor((touchX - gridOriginX) / cellSize)
```

- 若计算结果超出 [0, rows-1] 或 [0, cols-1]，该触摸点无效，静默丢弃
- `gridOriginX/Y` 和 `cellSize` 由网格连线引擎在初始化时提供

**规则 3：状态守卫**
- 在处理任何触摸事件之前，查询游戏状态机当前状态
- 仅当状态为 `Playing` 时处理事件；其他状态静默丢弃
- 从 Paused 恢复到 Playing 时，丢弃所有在 Paused 期间积累的触摸事件

**规则 4：滑动阈值**
- TOUCH_MOVE 仅在移动距离 ≥ 4px（约 0.5 个最小触控单元）时才触发
- 低于阈值的微动作为手指颤抖，忽略

**规则 5：多点触摸**
- MVP 阶段仅处理单点触摸（第一个触点）
- 后续触点静默忽略

### States and Transitions

| 内部状态 | 含义 |
|----------|------|
| `Idle` | 无触摸，等待 TOUCH_START |
| `Dragging` | 手指按下并移动中，持续发出 INPUT_MOVE |
| — | TOUCH_END 后回到 Idle |

### Interactions with Other Systems

| 系统 | 方向 | 数据流 |
|------|------|--------|
| 游戏状态机 | 查询状态 | 读取 currentState，仅 Playing 时激活 |
| 网格连线引擎 | 引擎订阅事件 | INPUT_MOVE(gridRow, gridCol), INPUT_END |
| 网格连线引擎 | 引擎提供布局参数 | gridOriginX, gridOriginY, cellSize |

## Formulas

坐标映射公式（定义于 Detailed Design 规则 2）：

```
gridRow = floor((touchY - gridOriginY) / cellSize)
gridCol = floor((touchX - gridOriginX) / cellSize)
```

输入管理器本身不产生额外公式。

## Edge Cases

| 场景 | 预期行为 |
|------|----------|
| 手指滑出网格边界 | 超出范围的坐标静默丢弃，当前路径保持，等手指回到网格内继续 |
| 手指在单个格子上停留 > 500ms | 不触发新事件——没有移动就没有 INPUT_MOVE |
| TOUCH_END 后立即 TOUCH_START（< 16ms） | 视为新路径开始，不延续上一路径 |
| 微信切后台时正在划线中（Dragging 态） | 状态机触发 PAUSE → 输入管理器丢弃当前路径，回到 Idle |
| 两个手指同时触摸（多点触摸 > 1） | MVP 忽略第二指，仅处理第一指 |
| 网格布局参数未初始化时发生触摸 | 输入管理器初始化完成前丢弃所有事件 |

## Dependencies

| 系统 | 方向 | 依赖性质 |
|------|------|----------|
| 游戏状态机 | 输入管理器依赖状态机 | 硬依赖——每次事件处理前查询 Playing 状态 |
| 网格连线引擎 | 连线引擎依赖输入管理器 | 硬依赖——引擎的唯一输入来源 |

## Tuning Knobs

| 参数 | 当前值 | 安全范围 | 效果 |
|------|--------|----------|------|
| 滑动阈值 (px) | 4 | [2, 10] | 增大→减少误触但可能感觉迟钝；减小→更敏感但可能颤抖触发 |
| 端到端延迟目标 (ms) | 50 | [16, 100] | 越低触控响应越好，但受硬件/引擎限制 |

## Visual/Audio Requirements

不适用——纯基础设施层，无视觉或音频反馈。

## UI Requirements

不适用——输入管理器本身无 UI。

## Cross-References

| This Document References | Target GDD | Specific Element Referenced | Nature |
|--------------------------|-----------|----------------------------|--------|
| 仅在 Playing 状态处理输入 | `design/gdd/game-state-machine.md` | Playing / Paused 状态定义 | Rule dependency |
| INPUT_MOVE 发给连线引擎 | `design/gdd/grid-connection-engine.md` | INPUT_MOVE(gridRow, gridCol) | Data dependency |
| 布局参数由引擎提供 | `design/gdd/grid-connection-engine.md` | gridOriginX/Y, cellSize | Data dependency |

## Acceptance Criteria

- **GIVEN** 状态机为 Playing，**WHEN** 用户在网格内 TOUCH_START + TOUCH_MOVE，**THEN** 连线引擎收到 INPUT_MOVE 事件且包含正确 gridRow/gridCol
- **GIVEN** 状态机为 Paused，**WHEN** 用户触摸屏幕，**THEN** 无 INPUT_MOVE 事件发出
- **GIVEN** 手指在网格坐标 (row=2, col=3)，**WHEN** TOUCH_MOVE 触发，**THEN** gridRow=2, gridCol=3
- **GIVEN** 手指滑出网格边界（row<0），**WHEN** TOUCH_MOVE 触发，**THEN** 该帧事件被丢弃
- **GIVEN** 手指微动 2px（低于阈值），**WHEN** TOUCH_MOVE 触发，**THEN** 无 INPUT_MOVE 事件发出
- 端到端延迟：TOUCH_MOVE → INPUT_MOVE 发出 ≤ 50ms（在目标设备上测量）

## Open Questions

暂无。
