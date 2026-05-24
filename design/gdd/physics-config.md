# 物理引擎配置 (Physics Config)

> **Status**: In Design
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-20
> **Implements Pillar**: Pillar 1 (子弹重量) / Pillar 2 (多米诺战场) / Pillar 3 (规则稳定)

## Summary

物理引擎配置是所有物理交互的地基——定义 GodotPhysics2D 参数、5 层碰撞体系、4 种物理材质和碎片对象池。它不关心"什么物体在碰撞"，只定义"碰撞的规则是什么"。作为 Foundation 层系统，它是 Pillar 1（子弹重量）、Pillar 2（多米诺战场）和 Pillar 3（规则稳定）的物理实现基础。

> **Quick reference** — Layer: `Foundation` · Priority: `MVP` · Key deps: `None`

## Overview

物理引擎配置系统定义了坍塌禁区中所有物理模拟的基础参数——从重力常量到碰撞层级划分，从物理体类型选择到移动端性能预算。它不关心"什么物体"在被模拟（那是材质破坏系统和关卡数据系统的职责），只定义"模拟的规则是什么"——重力多大、碰撞如何分层、性能上限在哪里。作为 Foundation 层系统，它是所有物理交互（射击冲击、材质破坏、连锁传播）的共同地基。引擎采用 GodotPhysics2D（Godot 4.6 中 2D 物理未改变，Jolt 仅用于 3D）。

## Player Fantasy

物理引擎配置本身没有独立的玩家幻想。它是一个"隐形"的基础设施——玩家从不会说"这个重力常量调得真好"，但他们会在碎片以正确速度飞溅、结构以可信方式倒塌时感到满足。它的成功表现为物理世界的**可信度**：当物体下坠的速度、碎片弹跳的方式、冲击波的传播都符合直觉时，Pillar 3（规则稳定、结果惊喜）才有了被信任的基础。

**一句话幻想**：让物理世界的行为始终可预测——玩家学会的每条物理规则都不会被引擎的不一致背叛。

## Detailed Design

### Core Rules

1. **物理引擎**：GodotPhysics2D。不使用 Jolt（Jolt 是 3D 引擎，4.6 中 2D 物理未改变）。

2. **重力**：默认 `Vector2(0, 980)`（Godot 默认值，模拟标准重力加速度 9.8 m/s²）。全局可配置，运行时不可变。

3. **碰撞层级**（5 层）：

| 层 | 名称 | 用途 |
|----|------|------|
| 1 | Player | 玩家角色（CharacterBody2D） |
| 2 | Enemy | 所有敌人（CharacterBody2D / RigidBody2D） |
| 3 | Projectile | 子弹、弹片（RigidBody2D / Area2D） |
| 4 | World | 地面、墙壁、不可破坏结构（StaticBody2D） |
| 5 | PhysicsObject | 所有可互动物理物体——碎片、箱子、油桶（RigidBody2D） |

4. **碰撞矩阵**（谁与谁碰撞）：

| | Player | Enemy | Projectile | World | PhysicsObject |
|------|--------|-------|------------|-------|---------------|
| **Player** | ✗ | ✓ | ✗ | ✓ | ✓ |
| **Enemy** | ✓ | ✗ | ✓ | ✓ | ✓ |
| **Projectile** | ✗ | ✓ | ✗ | ✓ | ✓ |
| **World** | ✓ | ✓ | ✓ | ✗ | ✗ |
| **PhysicsObject** | ✓ | ✓ | ✓ | ✗ | ✓ |

5. **物理体类型使用规范**：

| 游戏对象 | Body 类型 | 理由 |
|----------|----------|------|
| 玩家 | CharacterBody2D | 自定义移动逻辑，不受物理力驱动 |
| 敌人（常规） | CharacterBody2D | 与玩家相同，自定义 AI 移动 |
| 敌人（可被击飞） | RigidBody2D | 受冲击力驱动（Boss 召唤物等） |
| 子弹/弹丸 | RigidBody2D 或 Area2D | 高速物体，可能需要 CCD |
| 可破坏物（初始状态） | StaticBody2D | 未触发前不移动 |
| 碎片/废墟 | RigidBody2D | 破坏后产生，受重力+冲击力 |
| 爆炸桶 | RigidBody2D | 始终受物理影响 |
| 地面/墙壁 | StaticBody2D | 永久固定 |

6. **物理帧率**：`physics_ticks_per_second = 60`。物理每帧最大模拟步数 `max_physics_steps_per_frame = 8`（防止 death spiral）。

7. **对象池**：为碎片类 RigidBody2D 预分配对象池（池大小 = 50）。碎片生命周期结束后回收（reset velocity + disable），不 free 节点。超出池大小时使用 FIFO 回收最早碎片。

8. **连续碰撞检测（CCD）**：仅为子弹/弹丸启用（`continuous_cd = CD_MODE_CAST_RAY`），防止高速弹丸穿透薄物体。

### States and Transitions

本系统无自身状态——物理模拟状态由引擎管理。运行时受游戏状态机间接控制（playing → 正常运行，paused → 物理暂停，dead → 物理继续但输入冻结）。

### Interactions with Other Systems

| 目标系统 | 方向 | 数据流 | 接口 |
|----------|------|--------|------|
| 碰撞与命中判定 | 输出 | 碰撞事件、碰撞点、碰撞法线 | 通过 Godot 信号 `body_entered`/`area_entered` 传递 |
| 材质破坏系统 | 输出 | RigidBody2D 引用 + 碰撞冲量 | 材质系统读取碰撞数据决定破坏阈值 |
| 射击与弹道系统 | 输出 | 弹丸初始速度、重力影响 | 射击系统设置 RigidBody2D 初始速度 |
| 连锁传播系统 | 输出 | 爆炸冲击力、AOE 范围内的 RigidBody2D | 通过 `PhysicsServer2D` 区域查询获取范围内物体 |
| 敌人 AI 系统 | 输出 | 敌人的 CharacterBody2D 是否被物理推动 | AI 读取自身速度判断是否被击飞 |

## Formulas

### 对象池大小计算

```
pool_size = ceil(peak_concurrent_rigidbody × safety_margin)
```

| 变量 | 类型 | 范围 | 说明 |
|------|------|------|------|
| `peak_concurrent_rigidbody` | int | 10~50 | 实测峰值——同时存在的碎片 RigidBody2D 数 |
| `safety_margin` | float | 1.2~2.0 | 安全系数，默认 1.5 |
| `pool_size` | int | 15~100 | 最终池大小，MVP 默认 50 |

**输出范围**: 15~100。低于 15 可能导致频频创建新节点；高于 100 浪费内存。

### 物理材质参数（按游戏材质）

| 游戏材质 | friction | bounce | rough | 说明 |
|----------|----------|--------|-------|------|
| 木材 (Wood) | 0.6 | 0.3 | false | 中等摩擦，有弹性 |
| 金属 (Metal) | 0.3 | 0.1 | false | 低摩擦，低弹性 |
| 混凝土 (Concrete) | 0.9 | 0.0 | true | 高摩擦，零弹性 |
| 有机体 (Organic) | 0.5 | 0.05 | false | 敌人身体 |

| 参数 | 范围 | 说明 |
|------|------|------|
| `friction` | 0.0~1.0 | 表面摩擦力，0=冰面，1=砂纸 |
| `bounce` | 0.0~1.0 | 弹性系数，0=完全非弹性，1=完全弹性 |
| `rough` | bool | 是否吸收冲击力（粗糙表面不传导动量） |

### 重力向量

```
gravity = Vector2(0, 980)
```

GodotPhysics2D 默认值，不可配置（修改会破坏 Pillar 3 的规则可学习性）。单位：px/s²。

## Edge Cases

- **对象池耗尽（所有 50 个碎片都在使用中）**: FIFO 回收最早创建的碎片——该碎片立即消失（velocity 归零、disabled），新碎片从回收位置创建。优先保证新破坏的视觉反馈，牺牲最早碎片的持续性。
- **physics_ticks_per_second 与渲染帧率不同步**: Godot 默认 `physics_ticks_per_second=60` 与 `max_fps=60` 一致。如果移动端掉帧到 30fps，`max_physics_steps_per_frame=8` 防止物理"追赶"过度。物理以固定 60Hz 步进，渲染插值由引擎处理。
- **RigidBody2D 休眠未唤醒**: 如果碎片在稳定后进入休眠（sleeping），下一次冲击力必须通过 `apply_impulse()` 或 `apply_force()` 自动唤醒。系统不手动管理休眠状态，依赖引擎默认行为。
- **碰撞层级配置错误（如 PhysicsObject 层漏配与 World 的碰撞）**: 配置应在启动时通过自动化测试验证——已知场景中应产生碰撞事件，否则断言失败。运行时不做动态层级修正。
- **极大量碎片同时生成（如 Boss 房间大面积坍塌）**: 对象池 FIFO 策略 + `max_physics_steps_per_frame=8` 防止帧时间爆炸。如果一帧内超过 50 个碎片请求，超出部分延迟到下一帧生成。
- **设备性能差异导致物理行为不一致**: GodotPhysics2D 在相同 physics_ticks 下是确定性的，但不同设备的帧时间波动可能导致 `_physics_process` 调用次数差异。系统不尝试帧同步——接受微小行为偏差，不影响核心玩法。
- **子弹速度极高（>5000 px/s）穿透薄墙**: CCD (`CD_MODE_CAST_RAY`) 启用后，引擎以射线形式检测碰撞而非离散位置检测，解决穿透问题。CCD 仅在子弹 RigidBody2D 上启用。
- **PhysicsObject-PhysicsObject 碰撞导致碎片连锁运动**: 这是预期行为——碎片之间相互碰撞产生更自然的废墟堆积效果。但如果导致性能问题，可通过 `collision_priority` 降低碎片间碰撞的求解精度。

## Dependencies

| 系统 | 方向 | 依赖性质 | 接口说明 |
|------|------|----------|----------|
| **碰撞与命中判定** | 下游（依赖本系统） | 硬依赖——无物理引擎则无碰撞事件 | 通过 Godot `body_entered`/`area_entered` 信号提供碰撞数据 |
| **材质破坏系统** | 下游（依赖本系统） | 硬依赖——需要碰撞冲量判断破坏阈值 | 读取碰撞事件的 `impulse` 和碰撞对象的 PhysicsMaterial |
| **射击与弹道系统** | 下游（依赖本系统） | 硬依赖——弹丸需要物理空间才能运动 | 提供 RigidBody2D 初始速度设置 + 重力环境 |
| **连锁传播系统** | 下游（依赖本系统） | 硬依赖——爆炸需要区域查询获取范围内物体 | 通过 `PhysicsServer2D.intersect_shape()` 提供 AOE 查询 |
| **敌人 AI 系统** | 下游（依赖本系统） | 软依赖——AI 需要知道自身是否被物理推动 | 读取 CharacterBody2D/RigidBody2D 的 `linear_velocity` |

本系统无上游依赖——它是 Foundation 层。所有下游系统通过 Godot 物理 API 与本系统交互，不通过自定义接口。

## Tuning Knobs

| 参数 | 默认值 | 安全范围 | 增大效果 | 减小效果 |
|------|--------|----------|----------|----------|
| `gravity_y` | 980 | 不可调 | — | — |
| `physics_ticks_per_second` | 60 | 30~60 | 物理更流畅但 CPU 负载更高 | 省电但物理步进变粗糙，高速弹丸可能穿透 |
| `max_physics_steps_per_frame` | 8 | 4~16 | 卡顿时物理追赶更久，可能造成"时间加速"感 | 卡顿时直接丢物理帧，可能造成穿透或碰撞丢失 |
| `debris_pool_size` | 50 | 15~100 | 更多碎片可同时存在，但内存占用增加 | 碎片频繁回收，老碎片过早消失 |
| 材质 `friction` | 见 Formulas | 0.0~1.0 | 物体更难滑动 | 物体像在冰面上 |
| 材质 `bounce` | 见 Formulas | 0.0~1.0 | 碰撞后弹跳更高 | 碰撞后"粘住" |
| 材质 `rough` | 见 Formulas | bool | 不传导冲击力——子弹打粗糙混凝土不推动周围物体 | 冲击力传导——子弹打金属会推动相邻金属物 |

## Visual/Audio Requirements

物理引擎配置本身无视觉/音频输出。物理反馈的视觉表现（碎片粒子、倒塌动画、屏幕震动）属于各 Gameplay 系统的职责。

## Game Feel

### Feel Reference

**目标**: 物理世界行为与直觉一致——玩家不需要学习"这个游戏的物理规则"，因为规则与真实世界经验一致。重物坠落快、轻物弹跳、金属滑动——这些应该不需要教程。

### Physical Consistency Targets

| 方面 | 目标 | 备注 |
|------|------|------|
| 重力感 | 碎片以自然加速度坠落，不飘不沉 | 980 px/s² 标准重力 |
| 弹性 | 木材弹跳明显，混凝土完全不弹 | 视觉 + 物理一致 |
| 摩擦 | 混凝土上物体快速停止，金属上滑动 | 影响碎片散落距离 |
| 冲击传导 | 粗糙材质吸收冲击力，光滑材质传导 | Pillar 2 多米诺效应依赖 |

## UI Requirements

无——本系统不渲染 UI 元素。

## Cross-References

| 本文档引用 | 目标文档 | 引用的具体元素 | 性质 |
|-----------|---------|--------------|------|
| 碰撞层级定义 | `design/gdd/hit-detection.md`（待设计） | Layer 1-5 的碰撞矩阵 | 数据依赖 |
| 材质 PhysicsMaterial | `design/gdd/material-destruction.md`（待设计） | friction/bounce/rough 参数 | 数据依赖 |
| 对象池策略 | `design/gdd/shooting-projectile.md`（待设计） | 弹丸 RigidBody2D 配置 | 数据依赖 |
| AOE 区域查询 | `design/gdd/chain-propagation.md`（待设计） | `PhysicsServer2D.intersect_shape()` | 数据依赖 |

## Acceptance Criteria

- [ ] **AC1**: GIVEN 游戏启动，WHEN 检查 Project Settings，THEN 物理引擎 = GodotPhysics2D（非 Jolt），`physics_ticks_per_second = 60`
- [ ] **AC2**: GIVEN PhysicsObject 层（层5）的一个 RigidBody2D 掉落，WHEN 它碰到 World 层（层4）的 StaticBody2D，THEN 产生碰撞并停止下落
- [ ] **AC3**: GIVEN Projectile 层（层3）的一颗子弹，WHEN 它飞过 Player 层（层1）的玩家角色，THEN 不产生碰撞事件（子弹不命中玩家）
- [ ] **AC4**: GIVEN 混凝土材质 PhysicsMaterial（friction=0.9, bounce=0.0），WHEN 一个 RigidBody2D 以此材质撞击地面，THEN 物体不弹跳且快速停止滑动
- [ ] **AC5**: GIVEN 木材材质 PhysicsMaterial（friction=0.6, bounce=0.3），WHEN 一个 RigidBody2D 以此材质撞击地面，THEN 物体弹跳至少 1 次
- [ ] **AC6**: GIVEN 子弹 RigidBody2D 启用 CCD (`CD_MODE_CAST_RAY`)，WHEN 子弹以 5000 px/s 速度穿过厚度 10px 的 World 层墙壁，THEN 碰撞被检测到（子弹不穿透）
- [ ] **AC7**: GIVEN 碎片对象池大小 = 50，WHEN 连续生成 60 个碎片请求，THEN 第 51 个碎片回收最早创建的碎片，池大小始终 ≤ 50
- [ ] **AC8**: GIVEN `max_physics_steps_per_frame = 8`，WHEN 一帧内渲染时间超过 8 个物理步，THEN 物理仅模拟 8 步（不无限追赶）
- [ ] **AC9**: GIVEN 游戏状态机切换到 `paused`，WHEN 物理模拟进行中，THEN 所有 RigidBody2D 暂停运动（通过 `process_mode` 或场景树暂停实现）
- [ ] **AC10**: GIVEN 重力 = Vector2(0, 980)，WHEN 一个不受其他力作用的 RigidBody2D 从静止释放，THEN 它以 980 px/s² 的加速度向下运动
- [ ] **AC11**: GIVEN PhysicsObject 层一个碎片与 PhysicsObject 层另一个碎片碰撞，WHEN 检查碰撞响应，THEN 两者均受影响（碎片间碰撞开启）
- [ ] **AC12**: 所有物理参数（gravity, physics_ticks, pool_size, 材质 friction/bounce/rough）均从配置文件读取，无硬编码

## Open Questions

| 问题 | 负责人 | 目标日期 | 状态 |
|------|--------|---------|------|
| GodotPhysics2D 在低端 Android（如 Snapdragon 625）上 50 个 RigidBody2D 的性能表现？ | engine-programmer | MVP 前 | 需 profiling 验证——这是 MVP 第一技术风险 |
| 是否需要为不同设备等级（低/中/高）预设不同的物理配置 profile？ | technical-director | Alpha 前 | 目前仅单一配置 |
| PhysicsObject 同层碰撞（碎片互碰）是否应该关闭以节省性能？ | engine-programmer | MVP 前 | 当前开启，需 profiling 验证开销 |
