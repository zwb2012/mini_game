# 材质破坏系统 (Material Destruction)

> **Status**: In Design
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-20
> **Implements Pillar**: Pillar 2（战场是多米诺骨牌阵列）、Pillar 3（规则稳定——材质行为可学习）

## Summary

材质破坏系统定义了每种材质的破坏阈值、倒塌方向规则和碎片生成逻辑。当碰撞与命中判定传递 HitData 给一个可破坏物体时，本系统判断"这一枪的冲击力是否超过材质的破坏阈值"——如果超过，物体碎裂成碎片 RigidBody2D 并沿倒塌方向飞散；如果未超过，物体仅产生裂缝视觉反馈但结构保持完整。木材<金属<混凝土的破坏层级让玩家逐步建立"材质词典"。

> **Quick reference** — Layer: `Core Gameplay` · Priority: `MVP` · Key deps: `物理引擎配置, 碰撞与命中判定`

## Overview

材质破坏系统是 Pillar 2"战场是多米诺骨牌阵列"的物理实现。它管理 5 种游戏材质（木材、金属、混凝土、有机体、复合体）的破坏规则——每种材质有不同的破坏阈值、倒塌方向偏好和碎片行为。系统监听 HitData（来自碰撞与命中判定），当冲击力 ≥ 破坏阈值时触发破坏；低于阈值时累积"结构损伤"（裂缝阶段）。破坏后生成对应材质的碎片 RigidBody2D（来自对象池），同时向连锁传播系统发出"已破坏"通知。

## Player Fantasy

玩家建立的"材质词典"是本系统的幻想核心——**"看一眼就知道这东西能挨几枪"**。不同材质的视觉设计（危险色语言）让玩家 0.2 秒内识别材质类型，规则稳定性（Pillar 3）让每次破坏的结果可预测。木材一枪碎、金属两枪凹、混凝土三枪裂——这不是随机数，是可学习的物理规则。

## Detailed Design

### Core Rules

1. **材质类型与破坏阈值**：

| 材质 | 破坏阈值 (impulse) | 裂缝阶段数 | 倒塌方向 | 碎片数 |
|------|-------------------|-----------|----------|--------|
| 木材 (Wood) | 200 | 0（直接碎） | 冲击方向 + 重力向下 | 3~5 |
| 金属 (Metal) | 500 | 1（凹痕→碎裂） | 冲击反方向（弹开） | 2~3 |
| 混凝土 (Concrete) | 1000 | 2（微裂→大裂→碎裂） | 重力向下（优先） | 5~8 |
| 有机体 (Organic) | 300 | 0（直接碎） | 冲击方向 | 1~2 |
| 复合体 (Composite) | 1500 | 2（微裂→大裂→碎裂） | 重力向下（优先） | 6~10 |

2. **破坏判定**：`if hit_data.impulse >= material.destruction_threshold → destroy(); else → accumulate_damage(hit_data.impulse)`

3. **损伤累积**：低于阈值的冲击力累积在物体的 `accumulated_damage` 中。当累积值 ≥ 阈值时触发破坏。每次累积后进入下一裂缝阶段（视觉反馈：裂缝纹理递增）。

4. **倒塌方向规则**：
   - 悬空物（底部无支撑）：优先向下倒
   - 靠墙物（一侧有 World 层支撑）：向支撑反方向倒
   - 被从下方击中：向上飞散
   - 一般情况下：沿 `hit_normal` 反方向散射碎片

5. **碎片生成**：破坏时从对象池（physics-config 定义，池大小 50）取出 N 个 RigidBody2D 碎片，每个碎片：
   - 初始位置 = 物体中心 + 随机偏移
   - 初始速度 = 倒塌方向 × (200~800 随机值) + 重力方向 × (0~300)
   - 材质 = 源物体材质（继承 PhysicsMaterial 的 friction/bounce）
   - 碰撞层 = PhysicsObject (5)
   - 生命周期 = 5~10 秒后回收

6. **碎片连锁**：碎片飞出时如果命中其他可破坏物体 → 产生新的 HitData → 可能触发二次破坏（多米诺效应！）。

### States

| 状态 | 条件 | 行为 |
|------|------|------|
| **INTACT** | accumulated_damage = 0 | 完整，等待冲击 |
| **DAMAGED** | 0 < accumulated_damage < threshold | 显示裂缝阶段，结构仍完整 |
| **DESTROYED** | accumulated_damage ≥ threshold | 生成碎片，原节点 free，发射 `object_destroyed` signal |
| **DEBRIS** | 碎片状态 | 受物理驱动，等待回收 |

### Interactions

| 系统 | 方向 | 交互 |
|------|------|------|
| 物理引擎配置 | 上游 | PhysicsMaterial 参数、对象池 |
| 碰撞与命中判定 | 上游 | 接收 HitData |
| 连锁传播系统 | 输出 | 发射 `object_destroyed(position, material)` 供连锁使用 |
| 2D 摄像机系统 | 输出 | 破坏事件触发 shake() |

## Formulas

### 破坏判定

```
will_destroy = (accumulated_damage + hit_data.impulse) >= material.destruction_threshold
```

### 碎片初速度

```
debris_velocity = collapse_direction * randf_range(200, 800) + Vector2.DOWN * randf_range(0, 300)
```

## Edge Cases

- **多颗子弹同一帧命中同一物体**: 每颗子弹独立产生 HitData → 累积计算，如果总和超过阈值则破坏。
- **物体被夹在两个 World 层之间无法倒塌**: 碎片初始速度设为 0 + 物体直接 disabled（不产生碎片，节省性能）。
- **破坏阈值 = 0 的材质**: 任何碰撞都破坏（用于"一碰就碎"的装饰物）。
- **碎片飞出场景边界**: 超出边界后立即回收（不等待生命周期到期）。

## Dependencies

| 系统 | 方向 | 性质 |
|------|------|------|
| 物理引擎配置 | 上游 | 硬依赖——PhysicsMaterial、对象池 |
| 碰撞与命中判定 | 上游 | 硬依赖——接收 HitData |
| 关卡设计数据系统 | 上游 | 硬依赖——读取 `physics_objects[].material` 获取各物理物体的材质类型 |
| 连锁传播系统 | 下游 | 软依赖——通知破坏事件 |
| 2D 摄像机系统 | 下游 | 软依赖——触发屏幕震动 |

## Tuning Knobs

| 参数 | 默认 | 范围 | 说明 |
|------|------|------|------|
| 各材质 `destruction_threshold` | 见上表 | 100~2000 | 越高越难破坏 |
| 各材质 `debris_count` | 见上表 | 1~15 | 碎片数量 |
| `debris_lifetime` | 7.0 | 3~15 | 碎片存在秒数 |
| `debris_speed_min/max` | 200/800 | 50~2000 | 碎片飞散速度范围 |

## Visual/Audio Requirements

| 事件 | 视觉 | 音频 |
|------|------|------|
| 木材碎裂 | 浅色碎片 + 木屑粒子 | 脆裂声 |
| 金属凹陷/碎裂 | 暗色碎片 + 火花 | 金属撞击声 |
| 混凝土开裂/碎裂 | 灰色碎片 + 粉尘 | 低沉碎裂声 |
| 结构损伤（未碎） | 裂缝贴图递增（阶段 1→2→3） | 轻微开裂声 |

## Acceptance Criteria

- [ ] **AC1**: GIVEN 木材物体（threshold=200），WHEN HitData impulse=250，THEN 物体立即破坏，生成 3~5 个碎片
- [ ] **AC2**: GIVEN 金属物体（threshold=500），WHEN HitData impulse=300，THEN 物体不破坏，accumulated_damage=300，进入 DAMAGED 状态
- [ ] **AC3**: GIVEN 金属物体 accumulated_damage=300，WHEN 第二次 HitData impulse=250（累积 550≥500），THEN 物体破坏
- [ ] **AC4**: GIVEN 悬空混凝土物体（底部无支撑），WHEN 破坏，THEN 碎片优先向下倒塌
- [ ] **AC5**: GIVEN 破坏产生 5 个碎片，WHEN 碎片飞出并命中另一个木材物体，THEN 可能触发二次破坏（连锁）
- [ ] **AC6**: GIVEN 碎片超过 debris_lifetime=7 秒，WHEN 检查，THEN 碎片回收至对象池
- [ ] **AC7**: 所有材质参数（threshold, debris_count, 倒塌方向偏好）从配置文件读取

## Open Questions

| 问题 | 负责人 | 目标日期 | 状态 |
|------|--------|---------|------|
| 是否需要"部分破坏"——如只破坏物体的上半部分？ | game-designer | Alpha 前 | MVP 做全破坏 |
| 裂缝阶段的视觉反馈用什么方式（贴图替换 vs shader）？ | technical-artist | MVP 前 | 待技术评估 |
