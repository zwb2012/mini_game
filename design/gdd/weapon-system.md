# 武器系统 (Weapon System)

> **Status**: In Design
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-20
> **Implements Pillar**: Pillar 1（不同武器=不同物理交互）、Pillar 4（武器选择是战术决策，非数值堆砌）

## Summary

武器系统管理所有可用武器的数据定义、切换逻辑和解锁条件。每把武器不仅定义伤害和射速——它定义一种**物理交互方式**：标准弹传递冲击力，粘弹附着后引爆，磁力弹吸引金属物。MVP 提供 2 把武器（标准步枪 + 粘弹发射器），Alpha 扩展至 6-8 把。

> **Quick reference** — Layer: `Core Gameplay` · Priority: `MVP` · Key deps: `射击与弹道系统`

## Overview

武器系统是一个数据驱动的配置层——它不实现射击逻辑（那是射击与弹道系统的职责），而是定义"什么武器存在、它们的属性是什么、玩家如何获取和切换"。每把武器 = 一个弹型 + 一组属性参数（射速、后坐力、弹匣容量）。武器切换不改变角色移动能力——只改变按下射击按钮时飞出去的是什么。

## Player Fantasy

**"每把新武器不是伤害+10%，而是一种理解战场的新方式"**。当玩家解锁粘弹发射器时，他们不是在想"现在伤害更高了"，而是在想"现在我可以先附着再引爆，制造延时连锁"。武器是物理工具箱的扩展——不是数值成长的载体。参考：Noita 的法杖系统（每根法杖改变的是法术组合方式，而非数值）。

## Detailed Design

### Core Rules

1. **武器数据结构**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `weapon_id` | String | 唯一标识 |
| `weapon_name` | String | 显示名称 |
| `bullet_type` | String | 对应射击与弹道系统的弹型 |
| `shoot_interval` | float | 射速（覆盖玩家控制器的默认值） |
| `recoil_force` | float | 后坐力 |
| `magazine_size` | int | 弹匣容量（0=无限） |
| `reload_time` | float | 换弹时间（秒） |

2. **MVP 武器表**：

| ID | 名称 | 弹型 | 射速 | 后坐力 | 弹匣 | 换弹 |
|----|------|------|------|--------|------|------|
| `standard_rifle` | 标准步枪 | standard | 0.3s | 50 | 20 | 1.5s |
| `sticky_launcher` | 粘弹发射器 | sticky | 0.8s | 120 | 3 | 2.0s |

3. **武器切换**：玩家一次携带一把武器。MVP 阶段通过简单按钮切换（Alpha 阶段可用第 3 指手势切换）。切换无冷却。

4. **射击委托**：玩家控制器调用 `weapon_system.fire_current(origin, target)` → 武器系统检查弹药（消耗 1 发）、查找当前武器的 bullet_type → 调用射击与弹道系统的 `fire(origin, target, bullet_type, source_entity=self)`。房间重置时弹药恢复到满状态。

5. **解锁逻辑**（Alpha 阶段实现，MVP 阶段所有武器可用）：武器通过关卡通关解锁。解锁数据存储于玩家进度系统。

### States

| 状态 | 说明 |
|------|------|
| **READY** | 可射击 |
| **FIRING** | 射击冷却中 |
| **RELOADING** | 换弹中（仅粘弹等有限弹匣武器） |
| **EMPTY** | 弹匣空，需换弹 |

### Interactions

| 系统 | 方向 | 交互 |
|------|------|------|
| 射击与弹道系统 | 下游 | 委托 fire()，传递 bullet_type |
| 玩家控制器 | 上游 | 接收射击调用 |
| HUD 系统 | 输出 | 提供当前武器信息（ID, ammo） |
| 玩家进度系统 | 输出 | 武器解锁状态 |

## Formulas

无独立公式。所有参数为数据配置。

## Edge Cases

- **武器配置中引用不存在的 bullet_type**: 启动时验证——未定义的 bullet_type 回退到 "standard" 并打印 error。
- **换弹期间触发切换武器**: 取消换弹，切换到新武器（新武器为 READY 状态）。
- **弹匣无限的武器收到 reload 调用**: 忽略。

## Dependencies

| 系统 | 方向 | 性质 |
|------|------|------|
| 射击与弹道系统 | 下游 | 硬依赖——委托射击 |
| 玩家控制器 | 上游 | 硬依赖——接收射击调用 |
| HUD 系统 | 下游 | 软依赖——显示武器信息 |
| 玩家进度系统 | 下游 | 软依赖——解锁状态 |

## Tuning Knobs

所有武器属性（shoot_interval, recoil, magazine_size, reload_time）均为可配置参数。每种武器独立配置文件。

## Visual/Audio Requirements

| 事件 | 视觉 | 音频 |
|------|------|------|
| 标准步枪射击 | 枪口闪光 | 清脆射击声 |
| 粘弹发射器射击 | 更大枪口闪光 + 弹丸拖尾 | 低沉发射声 |
| 换弹 | 换弹动画 | 弹匣声 |

## Acceptance Criteria

- [ ] **AC1**: GIVEN 当前武器 = standard_rifle，WHEN fire_current()，THEN 射击与弹道系统收到 fire(bullet_type="standard", source_entity=self)
- [ ] **AC2**: GIVEN 当前武器 = sticky_launcher，WHEN fire_current()，THEN 射击与弹道系统收到 fire(bullet_type="sticky", source_entity=self)
- [ ] **AC3**: GIVEN standard_rifle 的 shoot_interval=0.3，WHEN 连续两次 fire_current() 间隔 0.1s，THEN 第二次被忽略
- [ ] **AC4**: GIVEN sticky_launcher 弹匣=3，WHEN 连续射击 3 次，THEN 第 4 次射击无效（需换弹）
- [ ] **AC5**: GIVEN 武器从 sticky_launcher 切换到 standard_rifle，WHEN 检查状态，THEN standard_rifle 为 READY
- [ ] **AC6**: 所有武器属性从配置文件读取

## Open Questions

| 问题 | 负责人 | 目标日期 | 状态 |
|------|--------|---------|------|
| Alpha 的 6-8 把武器各对应什么物理交互类型？ | game-designer | Alpha 前 | 磁力弹、酸液弹、震荡弹等候选 |
| 是否需要"武器升级"（同一武器提升属性）？ | game-designer | Alpha 前 | 倾向不做——与 Anti-Pillar "不堆数值"冲突 |
