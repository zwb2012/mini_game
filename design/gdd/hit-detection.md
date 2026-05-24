# 碰撞与命中判定 (Hit Detection)

> **Status**: In Design
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-20
> **Implements Pillar**: Pillar 1（每一枪都有重量）、Pillar 2（多米诺战场）

## Summary

碰撞与命中判定是"射击→命中→反应"链路的中枢——检测子弹命中了什么、两个物体何时碰撞、爆炸范围覆盖了哪些物体。它将原始碰撞事件转化为结构化的"命中数据"（命中点、命中法线、命中对象、碰撞冲量），供下游 7 个系统消费。作为 Core 层系统，它是连接物理引擎和游戏逻辑的翻译层。

> **Quick reference** — Layer: `Core` · Priority: `MVP` · Key deps: `物理引擎配置`

## Overview

碰撞与命中判定系统建立在 GodotPhysics2D 的碰撞检测之上，负责将引擎级的碰撞事件（`body_entered`、`area_entered`）转化为游戏级的命中信息。它定义了"什么碰撞应该产生命中"（碰撞矩阵）、"命中数据包含什么"（HitData 结构）、以及"一次射击可能命中多个目标时如何处理"（穿透 vs 停止）。子弹命中混凝土墙 = 产生冲击力但无穿透；子弹命中敌人 = 产生伤害 + 冲击力 + 触发材质反应。

## Player Fantasy

玩家不会说"这个碰撞检测真精准"，但他们会说"这一枪打到柱子左下角，柱子果然向右倒了"——这正是碰撞与命中判定提供的**精确性幻想**。当子弹的命中点、命中法线和碰撞冲量都与视觉反馈一致时，Pillar 1（每一枪都有重量）和 Pillar 3（规则稳定）才有了物理基础。**一句话幻想**：让每一发子弹的命中都精确、可信、有后果。

## Detailed Design

### Core Rules

1. **命中数据（HitData）结构**：每次有效碰撞产生一个 HitData 记录：

| 字段 | 类型 | 说明 |
|------|------|------|
| `hit_point` | Vector2 | 碰撞点的世界坐标 |
| `hit_normal` | Vector2 | 碰撞面的法线方向 |
| `hit_object` | Node | 被命中节点的引用 |
| `hit_layer` | int | 被命中对象所在的碰撞层 |
| `impulse` | float | 碰撞冲量大小（从碰撞回调获取） |
| `source_object` | Node | 产生碰撞的源节点（子弹/碎片/玩家） |
| `source_layer` | int | 源节点的碰撞层 |

2. **碰撞事件路由**：根据碰撞双方的层级组合，将事件路由到不同的处理逻辑：

| 源层 | 命中层 | 处理方式 |
|------|--------|----------|
| Projectile (3) | Enemy (2) | 产生 HitData → 伤害系统 + 冲击力反馈 |
| Projectile (3) | World (4) | 产生 HitData → 材质破坏系统（判断破坏阈值） |
| Projectile (3) | PhysicsObject (5) | 产生 HitData → 连锁传播系统 + 材质破坏 |
| PhysicsObject (5) | Enemy (2) | 产生 HitData → 伤害系统（碎片砸伤敌人） |
| PhysicsObject (5) | Player (1) | 产生 HitData → 伤害系统（碎片砸伤玩家） |
| Enemy (2) | Player (1) | 产生 HitData → 伤害系统（敌人接触伤害） |

3. **子弹穿透规则**：子弹默认不穿透——命中第一个有效目标后销毁。特殊弹药类型（Alpha 阶段添加）可配置穿透数。

4. **命中优先级**：当子弹在同一物理帧内命中多个目标时，按距离排序——取最近的碰撞点作为有效命中。

5. **区域查询（AOE）**：连锁传播系统通过 `PhysicsServer2D.intersect_shape()` 查询爆炸/火焰/酸液范围内的所有物体。本系统提供封装好的 `query_area(position, radius, layer_mask)` 接口。

6. **信号发射**：每次有效命中发射 `hit_detected(hit_data: HitData)` signal。所有下游系统通过监听此 signal 或主动查询获取命中信息。

### States and Transitions

无自身状态。碰撞检测在 PLAYING 和 DEAD 状态下运行（物理运行），在 PAUSED 和 MAIN_MENU 下冻结。

### Interactions with Other Systems

| 目标系统 | 方向 | 数据流 |
|----------|------|--------|
| 物理引擎配置 | 上游 | 读取碰撞层级定义、CCD 设置 |
| 材质破坏系统 | 输出 | HitData（hit_point, impulse, hit_object） |
| 射击与弹道系统 | 输出 | HitData（告知射击系统子弹命中了什么） |
| 连锁传播系统 | 输出 | AOE 区域查询结果 + HitData |
| 生命值与伤害系统 | 输出 | HitData（伤害来源、伤害量由该系统的公式计算） |
| 敌人 AI 系统 | 输出 | HitData（敌人被命中通知——AI 可据此改变行为） |
| 死亡与重生系统 | 输出 | HitData（致命伤害 → 触发死亡） |

## Formulas

### 命中距离排序

```
effective_hit = min(hits, key = distance(source_position, hit.hit_point))
```

当单帧内多次碰撞时，取距离子弹最近的那个。子弹在一帧内飞过的路径上可能有多个碰撞体。

## Edge Cases

- **子弹同时命中敌人和 PhysicsObject（如敌人站在油桶前）**: 按距离排序，命中最近的。如果穿透弹，则两者都命中（按穿透顺序）。
- **子弹命中已死亡的敌人**: 碰撞层不变——已死亡敌人仍产生 HitData（物理上存在身体）。伤害系统自行判断是否忽略（HP≤0 不再扣血）。
- **两枚碎片同时命中同一敌人**: 两个独立 HitData，伤害系统分别处理——不存在"合并"逻辑。
- **AOE 查询包含自身发射源**: `layer_mask` 应排除发射源所在层，防止爆炸把自己炸飞。由调用方（连锁传播系统）负责设置正确的 mask。
- **子弹在 CCD 模式下穿过两个紧邻物体**: CCD 产生每个穿透体的独立碰撞回调，按穿透顺序产生 HitData。

## Dependencies

| 系统 | 方向 | 依赖性质 |
|------|------|----------|
| **物理引擎配置** | 上游（本系统依赖它） | 硬依赖——碰撞层级和 CCD 配置由物理配置定义 |
| **材质破坏系统** | 下游（依赖本系统） | 硬依赖——需要 HitData 判断破坏阈值 |
| **射击与弹道系统** | 下游（依赖本系统） | 硬依赖——子弹需要命中结果来决定销毁/继续飞行 |
| **连锁传播系统** | 下游（依赖本系统） | 硬依赖——需要 AOE 区域查询 |
| **生命值与伤害系统** | 下游（依赖本系统） | 硬依赖——需要 HitData 计算伤害 |
| **敌人 AI 系统** | 下游（依赖本系统） | 软依赖——被命中通知可改变 AI 行为 |
| **死亡与重生系统** | 下游（依赖本系统） | 软依赖——致命命中触发死亡 |

## Tuning Knobs

| 参数 | 默认值 | 安全范围 | 说明 |
|------|--------|----------|------|
| `default_penetration` | 0 | 0~5 | 子弹默认穿透数（0=命中即停） |
| `hit_signal_throttle_ms` | 0 | 0~50 | 同一对物体两次碰撞间的最小间隔（防重复触发） |

## Visual/Audio Requirements

命中判定的视觉反馈由各下游系统负责——本系统只产生数据，不渲染。但以下全局视觉参数由本系统定义：

| 事件 | 视觉反馈 | 责任系统 |
|------|---------|----------|
| 子弹命中敌人 | 命中火花 + 屏幕微震 | 射击与弹道系统 |
| 子弹命中物理物体 | 碎片粒子 + 冲击方向指示 | 材质破坏系统 |

## UI Requirements

本系统不渲染 UI。

## Acceptance Criteria

- [ ] **AC1**: GIVEN Projectile 层一颗子弹飞行中，WHEN 它碰到 Enemy 层的敌人，THEN 产生 HitData（hit_layer=2, source_layer=3）并发射 `hit_detected` signal
- [ ] **AC2**: GIVEN 子弹命中 World 层墙壁，WHEN 检查 HitData，THEN `hit_normal` 指向子弹飞来的反方向
- [ ] **AC3**: GIVEN 子弹命中 PhysicsObject 层油桶，WHEN 检查 HitData，THEN `impulse > 0` 且命中数据包含油桶节点引用
- [ ] **AC4**: GIVEN 子弹同时碰到敌人和敌人背后的墙壁，WHEN 按距离排序，THEN 只产生敌人的 HitData（最近的碰撞点）
- [ ] **AC5**: GIVEN 子弹命中敌人，WHEN 检查子弹状态，THEN 子弹被销毁（默认无穿透）
- [ ] **AC6**: GIVEN AOE 查询（center, radius=100, layer_mask=PhysicsObject|Enemy），WHEN 范围内有 3 个 PhysicsObject 和 2 个 Enemy，THEN 返回 5 个结果
- [ ] **AC7**: GIVEN AOE 查询的 layer_mask 排除了发射源所在层，WHEN 发射源在查询范围内，THEN 发射源不在结果中
- [ ] **AC8**: GIVEN Projectile 层子弹飞过 Player 层玩家，WHEN 检查碰撞矩阵，THEN 不产生 HitData
- [ ] **AC9**: GIVEN 子弹启用 CCD，WHEN 以 5000 px/s 速度穿过 10px 厚度墙壁，THEN 产生碰撞 HitData（不穿透）
- [ ] **AC10**: HitData 的所有字段均通过 signal 传递，下游系统不直接访问 Godot 碰撞回调

## Open Questions

| 问题 | 负责人 | 目标日期 | 状态 |
|------|--------|---------|------|
| 是否需要"弱点命中"（如敌人头部 vs 身体）产生不同的 HitData？ | game-designer | Alpha 前 | MVP 不做——所有命中点等同处理 |
| 穿透弹的每次穿透是否应降低伤害/冲击力？ | systems-designer | Alpha 前 | 留待武器系统设计时决定 |
