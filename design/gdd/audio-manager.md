# 音频管理器

> **Status**: In Design
> **Author**: cocos-specialist
> **Last Updated**: 2026-05-10
> **Implements Pillar**: Pillar 3（划线本身就是奖励）

## Summary

音频管理器封装 Cocos AudioSource API，管理连线音效、完成音效和背景音播放。支持静音切换，单文件 <500KB（Pillar 4）。

> **Quick reference** — Layer: `Foundation` · Priority: `MVP` · Key deps: `None`

## Overview

音频管理器封装 Cocos Creator 的 AudioSource 组件，为游戏提供三个音频事件——连线咔嗒音效（每次手指滑入新格子）、通关完成音效（LevelComplete 状态触发）、可选的背景白噪音。连线音效是 Pillar 3（"划线本身就是奖励"）的关键实施者——没有音频反馈，划线手感会大打折扣。所有音频资源预加载，触发时零延迟播放。

## Player Fantasy

连线咔嗒音效是"划线即奖励"的听觉维度。每个格子的咔嗒声给手指滑动赋予质感——类似机械键盘的触觉确认。没有音频反馈时，连线操作会感觉"空洞"。

## Detailed Design

### Core Rules

**规则 1：音频事件定义**

| 事件 ID | 触发时机 | 资源 | 预加载 |
|---------|----------|------|--------|
| `TICK` | 手指每次滑入新格子 | `tick.mp3` (< 50KB) | 启动时 |
| `LEVEL_COMPLETE` | 状态机进入 LevelComplete | `complete.mp3` (< 100KB) | 启动时 |
| `AMBIENT` | 游戏启动后循环 | `ambient.mp3` (< 350KB) | 延迟加载 |

**规则 2：播放接口**
- `play(eventId)` — 播放指定音效
- `setMuted(bool)` — 静音/取消静音，状态持久化到本地存储
- `isMuted()` — 查询当前静音状态

**规则 3：连音防抖**
- 同一帧内多次 TICK 播放请求仅播放一次
- TICK 音效时长 ≤ 80ms，确保快速滑动时每个格子都能播放（最短间隔 = 音频时长）

**规则 4：资源缺失处理**
- 音频文件加载失败 → console.warn，静默降级——游戏正常运行，只是没声音

### Interactions with Other Systems

| 系统 | 方向 | 数据流 |
|------|------|--------|
| 网格连线引擎 | 引擎调用 | play(TICK) — 每次手指滑入新格子 |
| 游戏状态机 | 音频监听状态 | 进入 LevelComplete → play(LEVEL_COMPLETE) |
| 本地存储 | 静音偏好持久化 | setMuted/read muted preference |

## Formulas

不适用。

## Edge Cases

| 场景 | 预期行为 |
|------|----------|
| 音频文件加载失败 | console.warn + 游戏静默运行，不阻塞 |
| 快速滑动触发 >10 次 TICK/帧 | 合并为一次播放，不堆叠 |
| 静音切换时正在播放音效 | 正在播放的音效立即停止 |
| 微信切后台 | 暂停所有音频播放，回到前台时恢复 |

## Dependencies

| 系统 | 方向 | 依赖性质 |
|------|------|----------|
| 网格连线引擎 | 引擎依赖音频管理器 | 硬依赖——无音频则划线手感降级 |

## Tuning Knobs

| 参数 | 当前值 | 安全范围 | 效果 |
|------|--------|----------|------|
| TICK 音量 | 0.6 | [0.2, 1.0] | 过高刺耳，过低感知不到 |
| COMPLETE 音量 | 0.8 | [0.5, 1.0] | 通关反馈必须清晰 |
| TICK 音效时长 (ms) | 60 | [30, 100] | 越短可支持越快滑动频率 |

## Visual/Audio Requirements

自身即音频系统——无视觉需求。所有音频资源格式：MP3 128kbps mono，总大小 < 500KB。

## UI Requirements

不适用。设置界面的静音按钮由关卡选择/HUD 负责，音频管理器仅提供 API。

## Cross-References

| This Document References | Target GDD | Specific Element Referenced | Nature |
|--------------------------|-----------|----------------------------|--------|
| TICK 由引擎触发 | `design/gdd/grid-connection-engine.md` | 每次滑入新格子调 play(TICK) | Data dependency |
| LEVEL_COMPLETE 由状态触发 | `design/gdd/game-state-machine.md` | LevelComplete 状态 | State trigger |
| 静音偏好持久化 | `design/gdd/local-storage.md` | 静音值读写 | Data dependency |

## Acceptance Criteria

- **GIVEN** 音频管理器已初始化，**WHEN** 调用 play('TICK')，**THEN** tick.mp3 播放（可听到）
- **GIVEN** 音频管理器已初始化，**WHEN** 调用 setMuted(true) 后调用 play('TICK')，**THEN** 无声音输出
- **GIVEN** 同一帧内调用 play('TICK') 3 次，**WHEN** 该帧结束，**THEN** 仅播放 1 次
- **GIVEN** tick.mp3 加载失败，**WHEN** 调用 play('TICK')，**THEN** console.warn 输出，游戏不崩溃

## Open Questions

暂无。