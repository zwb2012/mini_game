# 游戏状态机

> **Status**: In Design
> **Author**: cocos-specialist
> **Last Updated**: 2026-05-10
> **Last Verified**: —
> **Implements Pillar**: Pillar 2（一分钟一关）、Pillar 4（越简单越好）

## Summary

游戏状态机管理数字连线游戏的全部运行时状态及其转换规则。MVP 阶段仅含 4 个核心状态和 5 条合法转换，无子状态，遵循"越简单越好"（Pillar 4）。

> **Quick reference** — Layer: `Foundation` · Priority: `MVP` · Key deps: `None`

## Overview

游戏状态机管理数字连线游戏的全部运行时状态及其转换规则。它定义了四个核心状态——Menu（关卡选择）、Playing（游戏中）、Paused（暂停）、LevelComplete（通关结算）——以及状态间的合法转换路径。所有其他系统通过状态机获知当前游戏阶段，并据此决定自身行为（如 Playing 态才接受触控输入，Paused 态冻结计时）。MVP 阶段仅含 4 个状态、5 条合法转换，无子状态。

## Player Fantasy

游戏状态机是纯基础设施，玩家不直接感知它。但状态转换的流畅性直接影响"一分钟一关"（Pillar 2）的体验——Playing → LevelComplete 的切换必须瞬时完成，Paused → Playing 的恢复必须零延迟。

## Detailed Design

### Core Rules

**规则 1：状态定义**

| 状态 | 含义 | 允许的用户操作 |
|------|------|---------------|
| `Menu` | 关卡选择界面显示中 | 选择关卡、滚动列表 |
| `Playing` | 关卡进行中，接受连线输入 | 滑屏连线、撤销、暂停 |
| `Paused` | 游戏暂停，覆盖暂停菜单 | 继续、退出到菜单 |
| `LevelComplete` | 通关结算弹窗显示中 | 下一关、重玩、返回菜单 |

**规则 2：合法状态转换**

```
Menu ──(选择关卡)──→ Playing
Playing ──(暂停按钮)──→ Paused
Paused ──(继续按钮)──→ Playing
Paused ──(退出)──→ Menu
Playing ──(全部连通)──→ LevelComplete
LevelComplete ──(下一关)──→ Playing
LevelComplete ──(返回)──→ Menu
```

**规则 3：状态进入/退出回调**
- 每个状态提供 `onEnter(prevState)` 和 `onExit(nextState)` 回调
- 其他系统通过注册回调来响应状态变化（如连线引擎在 onEnter(Playing) 时初始化网格）
- 回调按注册顺序同步执行

**规则 4：非法转换处理**
- 尝试非法转换（如 LevelComplete → Paused）时，状态机忽略请求并输出 console.warn
- 不抛异常——静默忽略以保证鲁棒性

### States and Transitions

| 当前状态 | 触发事件 | 目标状态 | 条件 |
|----------|----------|----------|------|
| Menu | `SELECT_LEVEL` | Playing | levelId 有效 |
| Playing | `PAUSE` | Paused | — |
| Paused | `RESUME` | Playing | — |
| Paused | `QUIT_TO_MENU` | Menu | — |
| Playing | `LEVEL_COMPLETE` | LevelComplete | 所有格子已填满 |
| LevelComplete | `NEXT_LEVEL` | Playing | 存在下一关 |
| LevelComplete | `BACK_TO_MENU` | Menu | — |

### Interactions with Other Systems

| 交互系统 | 方向 | 机制 |
|----------|------|------|
| 网格连线引擎 | 连线引擎监听状态 | onEnter(Playing) → 初始化网格；onEnter(Paused) → 隐藏网格 |
| 游戏内 HUD | HUD 监听状态 | Playing 时显示步数/撤销；Paused 时覆盖暂停菜单 |
| 场景管理器 | 场景管理器监听状态 | Menu ⇄ Playing 时触发场景切换 |
| 输入管理器 | 输入管理器查询状态 | 仅在 Playing 状态处理 touch 事件 |

## Formulas

不适用——状态机无计算公式。

## Edge Cases

| 场景 | 预期行为 |
|------|----------|
| 同一状态重复转换（如在 Playing 态再次触发 Playing） | 静默忽略，不触发 onEnter/onExit |
| 快速连续触发两次转换（如在 Playing→Paused 完成前再次触发） | 第二次请求排队，等第一次回调链执行完再处理 |
| 状态回调中抛出异常 | 捕获异常，console.error 输出，不阻塞状态转换完成 |
| Playing 态下收到微信切后台事件 | 自动触发 PAUSE，进入 Paused 状态 |
| 退出游戏时（onDestroy） | 状态机标记为 destroyed，拒绝所有后续转换请求 |

## Dependencies

| 系统 | 方向 | 依赖性质 |
|------|------|----------|
| 网格连线引擎 | 连线引擎依赖本系统 | 硬依赖——引擎只在 Playing 态运行 |
| 游戏内 HUD | HUD 依赖本系统 | 硬依赖——HUD 根据状态显示/隐藏 UI 元素 |
| 场景管理器 | 场景管理器依赖本系统 | 硬依赖——状态转换驱动场景切换 |
| 输入管理器 | 输入管理器依赖本系统 | 硬依赖——只在 Playing 态处理输入 |

## Tuning Knobs

不适用——状态机无设计师可调参数。

## Visual/Audio Requirements

不适用——纯基础设施层，无视觉或音频反馈。

## UI Requirements

不适用——状态机本身无 UI。它控制其他系统的 UI 显示/隐藏。

## Cross-References

| This Document References | Target GDD | Specific Element Referenced | Nature |
|--------------------------|-----------|----------------------------|--------|
| Playing 态初始化网格 | `design/gdd/grid-connection-engine.md` | onEnter(Playing) 触发网格初始化 | State trigger |
| Paused 态冻结输入 | `design/gdd/input-manager.md` | Playing 态为输入处理的前置条件 | Rule dependency |
| 状态转换驱动场景切换 | `design/gdd/scene-manager.md` | Menu/Playing 场景的加载/卸载 | State trigger |

## Acceptance Criteria

- **GIVEN** 当前状态为 Menu，**WHEN** 触发 SELECT_LEVEL 且 levelId 有效，**THEN** 状态变为 Playing，onExit(Menu) 和 onEnter(Playing) 回调均被调用
- **GIVEN** 当前状态为 Playing，**WHEN** 触发 PAUSE，**THEN** 状态变为 Paused
- **GIVEN** 当前状态为 LevelComplete，**WHEN** 触发 PAUSE，**THEN** 请求被静默忽略，状态保持 LevelComplete
- **GIVEN** 当前状态为 Playing，**WHEN** 快速连续触发 PAUSE 和 RESUME（<16ms 间隔），**THEN** 最终状态为 Playing，回调按 PAUSE→RESUME 顺序执行
- **GIVEN** 状态机 onEnter 回调中抛异常，**WHEN** 触发状态转换，**THEN** 异常被捕获并 console.error，转换仍完成

## Open Questions

暂无。状态模型简单清晰，4 个状态覆盖全部游戏流程。
