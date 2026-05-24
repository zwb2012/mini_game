# 游戏状态机 (Game State Machine)

> **Status**: In Design
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-20
> **Implements Pillar**: 间接服务全部支柱——状态机是所有系统行为的"开关"

## Summary

游戏状态机管理游戏的整体运行状态——当前是在主菜单、战斗中、暂停、死亡还是通关。它是所有其他系统的"总开关"：输入系统在 paused 时忽略触控，物理在 playing 时运行，UI 根据状态切换界面。作为 Foundation 层系统，它不关心"每个状态里发生什么"，只负责"当前是什么状态"和"状态何时切换"。

> **Quick reference** — Layer: `Foundation` · Priority: `MVP` · Key deps: `None`

## Overview

游戏状态机定义了坍塌禁区中 5 个互斥的游戏状态及其合法切换路径。每个状态决定了哪些系统活跃、哪些系统暂停——例如 playing 状态下输入和物理全速运行，paused 状态下仅有 UI 可交互。系统通过全局 signal 通知所有监听者状态变更，各下游系统自行决定如何响应。

## Player Fantasy

游戏状态机是纯基础设施——玩家不会感知到"状态机"的存在。它的成功表现为游戏行为的**一致性**：暂停时一切静止、死亡时输入冻结、通关时庆祝动画播放。当玩家按下暂停按钮时世界立即停顿，这种"可控感"就是状态机提供的间接幻想。**一句话**：让玩家始终清楚"游戏现在处于什么模式"。

## Detailed Design

### Core Rules

1. **状态枚举**（5 个，互斥）：

| 状态 | 含义 | 活跃系统 |
|------|------|----------|
| `MAIN_MENU` | 主菜单界面 | 仅 UI 系统 |
| `PLAYING` | 正常游戏进行中 | 全部系统（输入、物理、AI、HUD） |
| `PAUSED` | 游戏暂停 | 仅菜单 UI 系统可交互；物理冻结；输入抑制 |
| `DEAD` | 玩家死亡 | 物理继续（碎片动画），输入抑制，HUD 显示死亡画面 |
| `LEVEL_COMPLETE` | 关卡通关 | 物理冻结，输入抑制，HUD 显示通关结算 |

2. **状态切换规则**：状态切换必须通过 `transition_to(new_state)` 方法，不允许直接赋值。每次切换触发 `state_changed(old_state, new_state)` signal。

3. **当前状态查询**：提供只读属性 `current_state: GameState`，各系统可按需查询（如输入系统每帧检查是否为 PLAYING）。

### States and Transitions

```
MAIN_MENU ──→ PLAYING ──→ PAUSED ──→ PLAYING
                │  ↑                    │
                │  └────────────────────┘
                ↓                       ↑
              DEAD ─────────────────────┘
                │                       ↑
                ↓                       │
          LEVEL_COMPLETE ───────────────┘
                │
                ↓
           MAIN_MENU
```

| 触发事件 | 起点 | 终点 | 备注 |
|----------|------|------|------|
| 玩家点击"开始游戏" | MAIN_MENU | PLAYING | 加载第一个关卡 |
| 玩家点击"暂停" | PLAYING | PAUSED | 弹出暂停菜单 |
| 玩家点击"继续" | PAUSED | PLAYING | 恢复游戏 |
| 玩家死亡（HP=0） | PLAYING | DEAD | 播放死亡动画 → 显示重生选项 |
| 玩家选择"重生" | DEAD | PLAYING | 重置当前房间 |
| 玩家选择"返回菜单" | DEAD | MAIN_MENU | 放弃当前进度 |
| Boss 被击败 / 房间清空 | PLAYING | LEVEL_COMPLETE | 显示评分结算 |
| 玩家选择"下一关" | LEVEL_COMPLETE | PLAYING | 加载下一关 |
| 玩家选择"返回菜单" | LEVEL_COMPLETE | MAIN_MENU | — |

### Interactions with Other Systems

| 目标系统 | 方向 | 交互方式 |
|----------|------|----------|
| 触屏输入系统 | 下游（读取状态） | 仅 PLAYING 时处理触屏事件；PAUSED 时只透传给 UI |
| 场景管理器 | 下游（读取状态） | DEAD 时触发场景重置；LEVEL_COMPLETE 时加载下一场景 |
| 死亡与重生系统 | 上游（触发切换） | 玩家死亡时调用 `transition_to(DEAD)`；重生时调用 `transition_to(PLAYING)` |
| 菜单与设置界面 | 下游（读取+触发） | PAUSED 时显示暂停菜单；菜单可触发 `transition_to(PLAYING)` |
| 物理引擎配置 | 下游（读取状态） | PAUSED/LEVEL_COMPLETE 时物理暂停；PLAYING/DEAD 时物理运行 |
| HUD 系统 | 下游（读取状态） | 根据状态显示/隐藏不同 HUD 元素 |

## Formulas

无数学公式。状态切换是纯逻辑操作。

## Edge Cases

- **在 PAUSED 状态下玩家死亡（如暂停时被定时爆炸杀死）**: 不可能——PAUSED 状态下物理和 AI 均冻结，无伤害计算。
- **快速连续点击暂停按钮**: `transition_to()` 必须检查——如果 `new_state == current_state`，忽略此次请求并打印 warning。
- **在 DEAD 动画播放中点击暂停**: 忽略——DEAD 状态下不接受切换到 PAUSED。
- **在 LEVEL_COMPLETE 结算动画中点击暂停**: 忽略——与 DEAD 相同，通关是不可逆的终态。
- **系统启动时无初始状态**: 游戏启动默认进入 MAIN_MENU（或直接进入 PLAYING 如果 MVP 不做菜单）。
- **从 PLAYING 直接切到 MAIN_MENU（如玩家中途放弃）**: 需要确认弹窗（"确定要放弃当前进度吗？"）→ 这是菜单系统的职责，状态机只执行切换。

## Dependencies

| 系统 | 方向 | 依赖性质 |
|------|------|----------|
| **死亡与重生系统** | 上游（触发本系统状态切换） | 软依赖——死亡时调用 `transition_to(DEAD)` |
| **菜单与设置界面** | 上游（触发本系统状态切换） | 软依赖——暂停/恢复/返回菜单通过状态机切换 |
| **触屏输入系统** | 下游（读取当前状态） | 硬依赖——输入系统需要知道何时处理/忽略触控 |
| **场景管理器** | 下游（读取当前状态） | 硬依赖——场景加载/重置依赖状态 |
| **物理引擎配置** | 下游（读取当前状态） | 硬依赖——物理暂停/运行依赖状态 |
| **HUD 系统** | 下游（读取当前状态） | 软依赖——HUD 显示/隐藏依赖状态 |
| **音频系统** | 下游（读取当前状态） | 软依赖——PAUSED 时音乐暂停 |

## Tuning Knobs

无运行时调优参数。状态枚举和切换规则在编码时固定。

## Visual/Audio Requirements

状态机本身无视觉/音频输出。状态切换的视觉反馈（暂停菜单弹出、死亡画面）属于各 UI 系统的职责。

## UI Requirements

状态机本身不渲染 UI。状态切换时的 UI 响应（暂停菜单、死亡画面、通关结算）由 [菜单与设置界面] 和 [HUD 系统] 负责。

## Acceptance Criteria

- [ ] **AC1**: GIVEN 游戏在 MAIN_MENU 状态，WHEN 触控输入发生，THEN 游戏不响应（不触发移动/射击）
- [ ] **AC2**: GIVEN 游戏在 PLAYING 状态，WHEN 玩家触控操作，THEN 角色正常移动和射击
- [ ] **AC3**: GIVEN 游戏在 PLAYING 状态，WHEN 玩家点击暂停，THEN 状态切换到 PAUSED，物理停止，输入抑制
- [ ] **AC4**: GIVEN 游戏在 PAUSED 状态，WHEN 玩家点击继续，THEN 状态恢复到 PLAYING，物理和输入恢复
- [ ] **AC5**: GIVEN 游戏在 PLAYING 状态，WHEN 玩家 HP 归零，THEN 状态切换到 DEAD，输入抑制
- [ ] **AC6**: GIVEN 游戏在 DEAD 状态，WHEN 玩家选择重生，THEN 状态切换到 PLAYING，房间重置
- [ ] **AC7**: GIVEN 游戏在 PLAYING 状态，WHEN Boss 被击败，THEN 状态切换到 LEVEL_COMPLETE
- [ ] **AC8**: GIVEN 状态切换发生（任意 from → to），WHEN 检查 signal 发射，THEN `state_changed(old, new)` 被触发且所有监听者收到通知
- [ ] **AC9**: GIVEN 当前状态 = PAUSED，WHEN 代码尝试 `transition_to(PAUSED)`，THEN 请求被忽略（同状态切换不触发 signal）
- [ ] **AC10**: GIVEN 当前状态 = DEAD，WHEN 代码尝试 `transition_to(PAUSED)`，THEN 请求被拒绝（DEAD 不允许直接切到 PAUSED）
- [ ] **AC11**: GIVEN 游戏启动，WHEN 检查初始状态，THEN `current_state = MAIN_MENU`
- [ ] **AC12**: 所有状态枚举值和合法切换表均从配置文件读取，无硬编码

## Open Questions

| 问题 | 负责人 | 目标日期 | 状态 |
|------|--------|---------|------|
| MVP 是否需要 MAIN_MENU？还是直接进游戏？ | game-designer | MVP 前 | 可选——如果 MVP 无主菜单，初始状态直接 = PLAYING |
| LEVEL_COMPLETE 是否需要确认按键再切到下一关，还是自动切换？ | game-designer | Alpha 前 | 暂定玩家手动确认 |
