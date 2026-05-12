# Systems Index: 数字连线 (Number Link)

> **Status**: Draft
> **Created**: 2026-05-10
> **Last Updated**: 2026-05-10
> **Source Concept**: design/gdd/game-concept.md

---

## Overview

数字连线是一款极简几何风的纯逻辑益智连线游戏。玩家在网格中按数字顺序滑屏连线，填满所有格子通关，追求最少步数获得三星评价。系统架构以网格连线引擎为核心，周围环绕评分、UI 和持久化系统。MVP 共 11 个系统，聚焦"进入关卡 → 连线 → 评分 → 下一关"的最短可玩闭环。

---

## Systems Enumeration

| # | System Name | Category | Priority | Status | Design Doc | Depends On |
|---|-------------|----------|----------|--------|------------|------------|
| 1 | 关卡数据结构 | Core | MVP | Designed | [level-data-schema.md](level-data-schema.md) | — |
| 2 | 游戏状态机 | Core | MVP | Designed | [game-state-machine.md](game-state-machine.md) | — |
| 3 | 输入管理器 | Core | MVP | Designed | [input-manager.md](input-manager.md) | — |
| 4 | 场景管理器 | Core | MVP | Designed | [scene-manager.md](scene-manager.md) | — |
| 5 | 音频管理器 | Core | MVP | Designed | [audio-manager.md](audio-manager.md) | — |
| 6 | 本地存储 | Core | MVP | Designed | [local-storage.md](local-storage.md) | — |
| 7 | 网格连线引擎 | Gameplay | MVP | Designed | [grid-connection-engine.md](grid-connection-engine.md) | 1, 2, 3, 5 |
| 8 | 步数评分系统 | Gameplay | MVP | Designed | [step-scoring.md](step-scoring.md) | 7 |
| 9 | 关卡选择界面 | UI | MVP | Designed | [level-select-ui.md](level-select-ui.md) | 4, 6 |
| 10 | 游戏内 HUD | UI | MVP | Designed | [in-game-hud.md](in-game-hud.md) | 2, 7, 8 |
| 11 | 完成结算弹窗 | UI | MVP | Designed | [level-complete-overlay.md](level-complete-overlay.md) | 8 |
| 12 | 关卡求解器 | Gameplay | Vertical Slice | Not Started | — | 1 |
| 13 | 提示系统 | Gameplay | MVP | Designed | [hint-system.md](hint-system.md) | 7 |
| 14 | 激励视频广告 | Gameplay | Alpha | Not Started | — | 13 |

---

## Categories

| Category | Description | Systems |
|----------|-------------|---------|
| **Core** | 基础架构，所有系统依赖的底层设施 | 关卡数据结构、游戏状态机、输入管理器、场景管理器、音频管理器、本地存储 |
| **Gameplay** | 核心玩法系统，让游戏好玩 | 网格连线引擎、步数评分系统、关卡求解器、提示系统、激励视频广告 |
| **UI** | 玩家面向前端 | 关卡选择界面、游戏内 HUD、完成结算弹窗 |

---

## Priority Tiers

| Tier | Definition | Systems |
|------|------------|---------|
| **MVP** | 最小可玩闭环：进入关卡→连线→评分→存档→下一关 | 1-11, 13 (12 systems) |
| **Vertical Slice** | 关卡质量验证 | 12 关卡求解器 |
| **Alpha** | 变现层 | 14 激励视频广告 |

---

## Dependency Map

### Foundation Layer (no dependencies)

1. **关卡数据结构** — 定义网格尺寸、数字节点坐标、障碍格、最优步数的 JSON schema。所有其他系统的数据契约。
2. **游戏状态机** — Menu → Playing → Paused → LevelComplete 状态转换。HUD 和连线引擎依赖它判断当前可执行的操作。
3. **输入管理器** — 触屏 swipe 手势识别（start/move/end），屏幕坐标→网格坐标映射。连线引擎的唯一输入源。
4. **场景管理器** — Cocos director.loadScene 封装，场景过渡动画。关卡选择和游戏中切换场景依赖它。
5. **音频管理器** — 连线音效、完成音效、背景白噪音播放，静音切换。连线引擎的反馈输出。
6. **本地存储** — wx.setStorage / cc.sys.localStorage 封装。关卡进度、星级、设置的读写。关卡选择和 HUD 依赖它展示进度。

### Core Layer (depends on Foundation)

7. **网格连线引擎** — depends on: 1, 2, 3, 5
   核心玩法实现：网格渲染、按序连线路径绘制、格子填充、撤销、碰撞检测。游戏的"心脏"。

8. **步数评分系统** — depends on: 7
   实时步数计数，通关后与关卡预设的最优步数比较，输出 1-3 星评级。HUD 和结算弹窗的数据源。

### Presentation Layer (depends on Core + Foundation)

9. **关卡选择界面** — depends on: 4, 6
   网格按钮列表（解锁/锁定态）、星级角标、翻页。玩家进入游戏的第一屏。

10. **游戏内 HUD** — depends on: 2, 7, 8
    步数计数器、撤销按钮、暂停菜单、关卡信息显示。游戏中的常驻 UI 层。

11. **完成结算弹窗** — depends on: 8
    通关动画、1-3 星展示、"下一关"/"重玩"按钮。每关结束时的反馈界面。

11. **完成结算弹窗** — depends on: 8
    通关动画、1-3 星展示、"下一关"/"重玩"按钮。每关结束时的反馈界面。

### Feature Layer (depends on Core)

13. **提示系统** — depends on: 7
    消耗提示次数，使用简化路径查找计算下一步最优方向，在网格上显示箭头指引。MVP 阶段不依赖完整关卡求解器（#12）。

### Vertical Slice Layer (MVP 之后)

12. **关卡求解器** — depends on: 1
    Backtracking 算法验证关卡有唯一最优解，计算每关理论最小步数。AI 关卡生成的质量守门人。MVP 阶段提示系统使用简化版路径查找（不依赖完整求解器）。

### Alpha Layer

14. **激励视频广告** — depends on: 13
    wx.createRewardedVideoAd 封装，广告看完奖励提示次数。

---

## Recommended Design Order

| Order | System | Priority | Layer | Agent(s) | Est. Effort |
|-------|--------|----------|-------|----------|-------------|
| 1 | 关卡数据结构 | MVP | Foundation | cocos-specialist | S |
| 2 | 游戏状态机 | MVP | Foundation | cocos-specialist | S |
| 3 | 输入管理器 | MVP | Foundation | cocos-specialist | S |
| 4 | 场景管理器 | MVP | Foundation | cocos-specialist | S |
| 5 | 音频管理器 | MVP | Foundation | cocos-specialist | S |
| 6 | 本地存储 | MVP | Foundation | cocos-specialist + wechat-platform-specialist | S |
| 7 | 关卡选择界面 | MVP | Presentation | cocos-specialist | M |
| 8 | 网格连线引擎 | MVP | Core | cocos-specialist + gameplay-programmer | L |
| 9 | 步数评分系统 | MVP | Feature | cocos-specialist | S |
| 10 | 游戏内 HUD | MVP | Presentation | cocos-specialist | M |
| 11 | 完成结算弹窗 | MVP | Presentation | cocos-specialist | S |
| 12 | 关卡求解器 | VS | Core | cocos-specialist | M |
| 13 | 提示系统 | MVP | Feature | cocos-specialist | S |
| 14 | 激励视频广告 | Alpha | Feature | wechat-platform-specialist + backend-developer | M |

---

## Circular Dependencies

- None found

---

## High-Risk Systems

| System | Risk Type | Risk Description | Mitigation |
|--------|-----------|-----------------|------------|
| 网格连线引擎 | Technical + Design | 微信 Canvas 上划线操作的帧率/延迟可能影响手感；触摸事件在快速滑动时可能丢帧 | 第 1 周做触控原型验证（/prototype 核心连线操作） |
| 关卡求解器 | Technical | Backtracking 在大网格（10x10+）可能性能不足，需要启发式优化 | 先实现小网格验证，大网格加 A* 启发式 |
| 激励视频广告 | Platform | 微信广告审核可能拒审，eCPM 可能低于预期 | 提示系统不依赖广告也可用（每日免费提示次数） |

---

## Progress Tracker

| Metric | Count |
|--------|-------|
| Total systems identified | 14 |
| Design docs started | 11 |
| Design docs reviewed | 0 |
| Design docs approved | 0 |
| MVP systems designed | 12/12 |
| Vertical Slice systems designed | 0/2 |

---

## Next Steps

- [ ] Design MVP systems in order: `/design-system 关卡数据结构` first
- [ ] Run `/design-review` on each completed GDD
- [ ] Run `/gate-check pre-production` when MVP GDDs are complete
- [ ] Prototype the grid connection engine early: `/prototype 核心连线操作`
