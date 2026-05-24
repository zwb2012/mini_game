# Systems Index: 坍塌禁区 (Collapse Zone)

> **Status**: Draft
> **Created**: 2026-05-20
> **Last Updated**: 2026-05-22
> **Source Concept**: design/gdd/game-concept.md

---

## Overview

坍塌禁区是一个物理驱动的横版动作射击游戏，其机械范围围绕"射击→物理连锁→清场"的核心循环展开。游戏需要 27 个系统，分属 6 个类别，跨越 6 个依赖层级。核心玩法系统（射击弹道、材质破坏、连锁传播）是游戏的独特卖点——它们共同实现"每一发子弹都是一个物理事件的触发器"这一核心幻想。MVP 阶段需要 19 个系统来验证"物理连锁 + 触屏操作 = 爽的、可学的、有深度的"这个核心假设。

---

## Systems Enumeration

| # | System Name | Category | Priority | Status | Design Doc | Depends On |
|---|-------------|----------|----------|--------|------------|------------|
| 1 | 触屏输入系统 (Touch Input) | Core | MVP | Designed | design/gdd/touch-input.md | — |
| 2 | 物理引擎配置 (Physics Config) | Core | MVP | Designed | design/gdd/physics-config.md | — |
| 3 | 游戏状态机 (Game State Machine) | Core | MVP | Designed | design/gdd/game-state-machine.md | — |
| 4 | 场景管理器 (Scene Manager) | Core | MVP | Designed | design/gdd/scene-manager.md | 3 |
| 5 | 碰撞与命中判定 (Hit Detection) | Gameplay | MVP | Designed | design/gdd/hit-detection.md | 2 |
| 6 | 玩家控制器 (Player Controller) | Gameplay | MVP | Designed | design/gdd/player-controller.md | 1, 2 |
| 7 | 2D 摄像机系统 (Camera System) | Gameplay | MVP | Designed | design/gdd/camera-system.md | 6, 4 |
| 8 | 射击与弹道系统 (Shooting & Projectile) | Gameplay | MVP | Designed | design/gdd/shooting-projectile.md | 6, 2, 5 |
| 9 | 材质破坏系统 (Material Destruction) | Gameplay | MVP | Designed | design/gdd/material-destruction.md | 2, 5 |
| 10 | 武器系统 (Weapon System) | Gameplay | MVP | Designed | design/gdd/weapon-system.md | 8 |
| 11 | 连锁传播系统 (Chain Propagation) | Gameplay | MVP | Designed | design/gdd/chain-propagation.md | 9, 5 |
| 12 | 生命值与伤害系统 (Health & Damage) | Gameplay | MVP | Designed | design/gdd/health-damage.md | 5 |
| 13 | 死亡与重生系统 (Death & Respawn) | Gameplay | MVP | Designed | design/gdd/death-respawn.md | 12, 4, 3 |
| 14 | 敌人 AI 系统 (Enemy AI) | Gameplay | MVP | Approved | design/gdd/enemy-ai.md | 6, 2, 12 |
| 15 | Boss AI 系统 (Boss AI) | Gameplay | MVP | Approved | design/gdd/boss-ai.md | 14, 9, 17 |
| 16 | 关卡设计数据系统 (Level Design Data) | Gameplay | MVP | In Review | design/gdd/level-design-data.md | 4, 9, 11, 14 |
| 17 | 敌人生成与波次管理 (Enemy Spawn & Wave) | Gameplay | MVP | Designed | design/gdd/enemy-spawn-wave.md | 16, 14 |
| 18 | HUD 系统 (HUD) | UI | MVP | Designed | design/gdd/hud.md | 6, 10, 12 |
| 19 | 触屏操控界面 (Touch Control UI) | UI | MVP | Designed | design/gdd/touch-control-ui.md | 1, 6 |
| 20 | 存档系统 (Save/Load) | Core | Alpha | Not Started | — | — |
| 21 | 玩家进度系统 (Player Progression) | Progression | Alpha | Not Started | — | 20, 16 |
| 22 | 菜单与设置界面 (Menu & Settings UI) | UI | Alpha | Not Started | — | 3, 20 |
| 23 | 评分结算界面 (Score/Rating Display) | UI | Alpha | Not Started | — | 11, 16, 21 |
| 24 | 音频系统 (Audio System) | Audio | Alpha | Not Started | — | 9, 11, 3, 8 |
| 25 | 教程与引导系统 (Tutorial & Onboarding) | Meta | Full Vision | Not Started | — | 19, 3, 16 |
| 26 | 数据埋点系统 (Analytics/Telemetry) | Meta | Full Vision | Not Started | — | 12, 11, 16, 21 |
| 27 | 无障碍系统 (Accessibility) | Meta | Full Vision | Not Started | — | 1, 22 |

---

## Categories

| Category | Description | Systems in This Game |
|----------|-------------|---------------------|
| **Core** | 基础框架系统，所有其他系统依赖它们 | 触屏输入、物理引擎配置、游戏状态机、场景管理器、存档系统 |
| **Gameplay** | 让游戏好玩的核心玩法系统 | 碰撞命中、玩家控制器、摄像机、射击弹道、材质破坏、武器、连锁传播、生命伤害、死亡重生、敌人AI、BossAI、关卡数据、敌人生成 |
| **Progression** | 玩家随时间的成长 | 玩家进度（关卡解锁、武器解锁、模式解锁） |
| **UI** | 玩家可见的信息展示和交互界面 | HUD、触屏操控界面、菜单与设置、评分结算 |
| **Audio** | 声音和音乐系统 | 音频系统（材质差异化 SFX + 自适应音乐） |
| **Meta** | 游戏核心循环之外的系统 | 教程引导、数据埋点、无障碍 |

---

## Priority Tiers

| Tier | Definition | Target Milestone | System Count |
|------|------------|------------------|--------------|
| **MVP** | 验证核心假设所需的系统："物理连锁 + 触屏 = 爽的、可学的、有深度的" | 第一可玩原型（灰盒，~12 周） | 19 |
| **Alpha** | 4 关完整内容所需的额外系统 | Alpha 里程碑（~28 周） | 5 |
| **Full Vision** | 8 关完整发布 + 打磨所需的系统 | 正式发布（~45 周） | 3 |

---

## Dependency Map

### Foundation Layer (no dependencies)

1. **触屏输入系统** — 原始触屏事件采集，所有交互的起点
2. **物理引擎配置** — Jolt 物理参数，所有物理模拟的基础
3. **游戏状态机** — 游玩/暂停/死亡/通关状态切换
4. **存档系统** — 数据序列化基础设施（Alpha 开始使用，但 Foundation 层定义）

### Core Layer (depends on Foundation)

5. **场景管理器** — depends on: 游戏状态机
6. **碰撞与命中判定** — depends on: 物理引擎配置
7. **玩家控制器** — depends on: 触屏输入系统, 物理引擎配置
8. **2D 摄像机系统** — depends on: 玩家控制器, 场景管理器

### Core Gameplay Layer (depends on Foundation + Core)

9. **射击与弹道系统** — depends on: 玩家控制器, 物理引擎配置, 碰撞与命中判定
10. **材质破坏系统** — depends on: 物理引擎配置, 碰撞与命中判定
11. **武器系统** — depends on: 射击与弹道系统
12. **连锁传播系统** — depends on: 材质破坏系统, 碰撞与命中判定
13. **生命值与伤害系统** — depends on: 碰撞与命中判定
14. **死亡与重生系统** — depends on: 生命值与伤害系统, 场景管理器, 游戏状态机

### Feature Layer (depends on Core Gameplay)

15. **敌人 AI 系统** — depends on: 玩家控制器, 物理引擎配置, 生命值与伤害系统
16. **Boss AI 系统** — depends on: 敌人 AI 系统, 材质破坏系统, 关卡设计数据系统
17. **关卡设计数据系统** — depends on: 场景管理器, 材质破坏系统, 连锁传播系统, 敌人 AI 系统
18. **敌人生成与波次管理** — depends on: 关卡设计数据系统, 敌人 AI 系统

### Presentation Layer (depends on Features)

19. **HUD 系统** — depends on: 玩家控制器, 武器系统, 生命值与伤害系统
20. **触屏操控界面** — depends on: 触屏输入系统, 玩家控制器
21. **菜单与设置界面** — depends on: 游戏状态机, 存档系统
22. **评分结算界面** — depends on: 连锁传播系统, 关卡设计数据系统, 玩家进度系统
23. **音频系统** — depends on: 材质破坏系统, 连锁传播系统, 游戏状态机, 射击与弹道系统
24. **玩家进度系统** — depends on: 存档系统, 关卡设计数据系统

### Meta Layer (depends on everything below)

25. **教程与引导系统** — depends on: 触屏操控界面, 游戏状态机, 关卡设计数据系统
26. **数据埋点系统** — depends on: 生命值与伤害系统, 连锁传播系统, 关卡设计数据系统, 玩家进度系统
27. **无障碍系统** — depends on: 触屏输入系统, 菜单与设置界面

---

## Recommended Design Order

| Order | System | Priority | Layer | Est. Effort |
|-------|--------|----------|-------|-------------|
| 1 | 触屏输入系统 | MVP | Foundation | S |
| 2 | 物理引擎配置 | MVP | Foundation | M |
| 3 | 游戏状态机 | MVP | Foundation | S |
| 4 | 场景管理器 | MVP | Core | S |
| 5 | 碰撞与命中判定 | MVP | Core | M |
| 6 | 玩家控制器 | MVP | Core | M |
| 7 | 2D 摄像机系统 | MVP | Core | S |
| 8 | 射击与弹道系统 | MVP | Core Gameplay | M |
| 9 | 材质破坏系统 | MVP | Core Gameplay | L |
| 10 | 武器系统 | MVP | Core Gameplay | S |
| 11 | 连锁传播系统 | MVP | Core Gameplay | L |
| 12 | 生命值与伤害系统 | MVP | Core Gameplay | S |
| 13 | 死亡与重生系统 | MVP | Core Gameplay | S |
| 14 | 敌人 AI 系统 | MVP | Feature | M |
| 15 | Boss AI 系统 | MVP | Feature | L |
| 16 | 关卡设计数据系统 | MVP | Feature | L |
| 17 | 敌人生成与波次管理 | MVP | Feature | S |
| 18 | HUD 系统 | MVP | Presentation | M |
| 19 | 触屏操控界面 | MVP | Presentation | M |
| 20 | 存档系统 | Alpha | Foundation | S |
| 21 | 玩家进度系统 | Alpha | Progression | S |
| 22 | 菜单与设置界面 | Alpha | Presentation | S |
| 23 | 评分结算界面 | Alpha | Presentation | M |
| 24 | 音频系统 | Alpha | Presentation | L |
| 25 | 教程与引导系统 | Full Vision | Meta | M |
| 26 | 数据埋点系统 | Full Vision | Meta | M |
| 27 | 无障碍系统 | Full Vision | Meta | S |

> Effort: S = 1 session, M = 2-3 sessions, L = 4+ sessions.
> A "session" is one focused design conversation producing a complete GDD.

---

## Circular Dependencies

以下潜在循环依赖已识别并解决：

1. **射击与弹道系统 ↔ 武器系统**: 射击系统定义武器属性 schema（冲击力、弹道类型），武器系统提供具体数值。**解决**: 射击系统先设计（定义接口），武器系统作为数据层后填充。无真正循环。

2. **关卡设计数据系统 ↔ 敌人 AI 系统**: 关卡数据引用敌人类型 ID，敌人 AI 独立定义行为。**解决**: 敌人 AI 先设计（定义类型和接口），关卡数据仅引用 ID。

3. **Boss AI ↔ 关卡设计数据系统**: Boss 行为依赖房间布局，关卡数据定义 Boss 房间。**解决**: Boss AI 定义"Boss 如何与环境交互"的规则接口，关卡数据提供具体房间配置。接口先行。

---

## High-Risk Systems

| System | Risk Type | Risk Description | Mitigation |
|--------|-----------|-----------------|------------|
| 物理引擎配置 | Technical | Godot 4.6 Jolt 在移动端 30-50 个活跃物理对象能否稳定 60fps——社区数据有限 | MVP 第一验证项：物理对象池 + LOD（远处对象简化模拟）。如果不行，降低活跃对象上限或降低帧率目标 |
| 连锁传播系统 | Design | "70% 可预测 + 30% 惊喜"的平衡点难以量化。失衡→无聊解谜或不可控随机 | 大量内部测试；每次测试记录"预期连锁步数 vs 实际连锁步数"偏差；设置连锁传播的随机偏差范围可调参数 |
| 触屏操控界面 | Design | 触屏精确选择"打柱子左下角"在物理上比鼠标/手柄困难得多 | MVP 阶段 A/B 测试 2 种方案（自动吸附最近物理要素 vs 点击精确瞄准）；考虑缩小可交互要素的点击热区 |
| Boss AI 系统 | Design | 8 个 Boss 各需独特物理环境解法，设计空间可能不够 | MVP 先做 1 个 Boss 验证设计方向；如果设计空间不足，降为 5-6 Boss + 2 个纯物理追逐关 |
| 材质破坏系统 | Technical + Design | 3 种材质的差异化视觉反馈（粒子、裂缝、倒塌动画）工作量大；材质破坏阈值调优需要大量迭代 | MVP 先用最简视觉（色块变化）；阈值暴露为配置参数 |

---

## Progress Tracker

| Metric | Count |
|--------|-------|
| Total systems identified | 27 |
| Design docs started | 18 |
| Design docs reviewed | 2 |
| Design docs approved | 2 |
| MVP systems designed | 18 / 18 |
| Alpha systems designed | 0 / 5 |
| Full Vision systems designed | 0 / 3 |

---

## Next Steps

- [ ] Design MVP-tier systems in dependency order (use `/design-system [system-name]` or `/map-systems next`)
- [ ] Run `/design-review` on each completed GDD
- [ ] Validate highest-risk systems (Physics Config, Chain Propagation) early via prototyping
- [ ] Run `/gate-check systems-design` when MVP GDDs are complete
- [ ] Run `/gate-check pre-production` when all MVP GDDs are authored and reviewed
