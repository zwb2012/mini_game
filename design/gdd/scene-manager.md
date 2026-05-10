# 场景管理器

> **Status**: In Design
> **Author**: cocos-specialist
> **Last Updated**: 2026-05-10
> **Last Verified**: —
> **Implements Pillar**: Pillar 2（一分钟一关）、Pillar 4（越简单越好）

## Summary

场景管理器封装 Cocos Creator 的 scene 加载 API，在状态机驱动下切换 MenuScene 和 GameScene。MVP 阶段瞬切，无过渡动画，遵循"越简单越好"（Pillar 4）。

> **Quick reference** — Layer: `Foundation` · Priority: `MVP` · Key deps: `游戏状态机`

## Overview

场景管理器封装 Cocos Creator 的 `director.loadScene()` API，在游戏状态机驱动下切换场景。游戏共 2 个场景——MenuScene（关卡选择界面）和 GameScene（游戏进行中）。场景管理器监听状态机回调：进入 Menu 态时加载 MenuScene，进入 Playing 态时加载 GameScene。MVP 阶段场景切换为瞬切（无过渡动画），遵循"越简单越好"（Pillar 4）。

## Player Fantasy

场景管理器是纯基础设施——玩家不直接感知它，但场景切换的流畅性直接影响"一分钟一关"（Pillar 2）的体验。场景加载延迟必须短到玩家不注意到等待。

## Detailed Design

### Core Rules

**规则 1：场景定义**

| 场景名称 | 文件名 | 绑定状态 | 内容 |
|----------|--------|----------|------|
| MenuScene | `MenuScene.scene` | Menu | 关卡选择界面、游戏标题 |
| GameScene | `GameScene.scene` | Playing | 网格连线引擎、游戏 HUD |

**规则 2：状态驱动切换**
- 状态机 `onEnter(Menu)` → `director.loadScene("MenuScene")`
- 状态机 `onEnter(Playing)` → `director.loadScene("GameScene")`，通过场景参数传入 `levelId`
- Paused 和 LevelComplete 状态**不触发场景切换**——它们是在 GameScene 内覆盖的 UI 层

**规则 3：场景预加载**
- MenuScene 在游戏启动时即为当前场景
- GameScene 在 MenuScene 显示后异步预加载：`director.preloadScene("GameScene")`
- 预加载完成后，Menu → Playing 切换为瞬时

**规则 4：加载失败处理**
- 场景加载失败 → `console.error` + 回退到 MenuScene
- 不崩溃，不给玩家看白屏

### States and Transitions

场景管理器自身无状态——它是状态机的被动响应者。

### Interactions with Other Systems

| 系统 | 方向 | 数据流 |
|------|------|--------|
| 游戏状态机 | 监听状态变化 | onEnter(Menu)→加载MenuScene, onEnter(Playing)→加载GameScene |
| 网格连线引擎 | 场景参数传递 | loadScene("GameScene", { levelId }) → 引擎初始化时读取 levelId |

## Formulas

不适用——场景管理器无计算公式。

## Edge Cases

| 场景 | 预期行为 |
|------|----------|
| 预加载 GameScene 失败（如资源缺失） | console.error，玩家选择关卡时即时加载（稍慢但不阻塞） |
| 状态机快速连续触发 Menu→Playing→Menu（< 100ms） | 仅处理最新的状态，中间的 loadScene 请求被取消 |
| 当前已在目标场景时再次触发加载 | 静默忽略，不重新加载 |
| 微信切后台期间场景加载完成 | 正常处理，回到前台时场景已就绪 |

## Dependencies

| 系统 | 方向 | 依赖性质 |
|------|------|----------|
| 游戏状态机 | 场景管理器依赖状态机 | 硬依赖——场景切换由状态机驱动 |

## Tuning Knobs

| 参数 | 当前值 | 安全范围 | 效果 |
|------|--------|----------|------|
| 场景预加载时机 | MenuScene 加载完成后 | 即时 / 延迟 500ms / 延迟 1s | 越早越流畅但影响 MenuScene 的首帧时间 |

## Visual/Audio Requirements

不适用——纯基础设施层。

## UI Requirements

不适用——场景管理器本身无 UI。

## Cross-References

| This Document References | Target GDD | Specific Element Referenced | Nature |
|--------------------------|-----------|----------------------------|--------|
| 状态变化驱动场景切换 | `design/gdd/game-state-machine.md` | Menu / Playing 状态定义 | State trigger |
| 传入 levelId 给引擎 | `design/gdd/grid-connection-engine.md` | 引擎初始化参数 | Data dependency |

## Acceptance Criteria

- **GIVEN** 状态机进入 Menu 态，**WHEN** 场景管理器响应，**THEN** 当前场景为 MenuScene
- **GIVEN** 状态机从 Menu 进入 Playing 态，**WHEN** 传入 levelId=5，**THEN** 当前场景为 GameScene，且引擎收到 levelId=5
- **GIVEN** 已在 GameScene，**WHEN** 再次触发 loadScene("GameScene")，**THEN** 请求被静默忽略
- **GIVEN** GameScene 预加载完成，**WHEN** 触发 Menu→Playing 状态转换，**THEN** 场景切换在 100ms 内完成（无网络加载延迟）
- **GIVEN** 场景加载失败（模拟资源缺失），**WHEN** loadScene 回调 error，**THEN** console.error 输出，当前场景回退到 MenuScene

## Open Questions

暂无。
