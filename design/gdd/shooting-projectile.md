# 射击与弹道系统 (Shooting & Projectile)

> **Status**: In Design
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-20
> **Implements Pillar**: Pillar 1（每一发子弹都有重量——冲击力、后坐力、命中停顿）

## Summary

射击与弹道系统创建和管理每一发子弹——从枪口生成、赋予初速度、飞行中受重力影响、命中时传递冲击力并触发命中停顿。它实现了 Pillar 1 的核心承诺：子弹不是数值输出器，而是物理事件的触发器。MVP 支持 2 种弹型：标准弹（冲击力）和粘弹（延时引爆）。

> **Quick reference** — Layer: `Core Gameplay` · Priority: `MVP` · Key deps: `玩家控制器, 物理引擎配置, 碰撞与命中判定`

## Overview

射击与弹道系统是"扣扳机→命中→冲击力"链路的执行者。武器系统调用 `fire(origin, target, bullet_type, source_entity)`，本系统在枪口位置实例化一颗 RigidBody2D 子弹，赋予初速度，然后子弹自主飞行——受重力影响、检测碰撞、命中时产生冲击力并触发 hit-stop。子弹在命中后销毁（或粘弹附着后延时引爆）。`source_entity` 标识子弹来源（player / enemy），用于区分 hit-stop 触发和友军伤害。

## Player Fantasy

这就是 Pillar 1 的化身——**"我开的每一枪都在物理上改变了战场"**。玩家看到子弹飞行轨迹、感受到后坐力的屏幕震动、看到命中点的冲击波推开周围物体。在普通射击游戏中子弹只是"扣血"——在这里，子弹是"推倒多米诺骨牌的第一指"。参考：Noita 的物理弹道 + Teardown 的冲击力反馈。

## Detailed Design

### Core Rules

1. **子弹生成**：`fire(origin: Vector2, target: Vector2, bullet_type: String, source_entity: Node = null)` 在 `origin`（枪口位置）创建一颗 RigidBody2D 子弹，设置初始速度方向为 `(target - origin).normalized()`。`source_entity` 标识调用者——player 子弹触发 hit-stop，enemy 子弹对 Enemy 层(2)关闭碰撞。

2. **子弹属性（标准弹）**：

| 属性 | 默认值 | 说明 |
|------|--------|------|
| `speed` | 2000 px/s | 初速度 |
| `mass` | 0.5 kg | RigidBody2D mass |
| `impact_force` | 500 | 命中时施加的冲量（`apply_impulse` 的 magnitude） |
| `gravity_scale` | 0.3 | 子弹受重力影响（不完全直线） |
| `max_distance` | 1500 px | 超过此距离自动销毁 |
| `lifetime` | 3.0 s | 超过此时长自动销毁 |
| `hit_stop_duration` | 50 ms | 命中时触发的 hit-stop 时长 |

3. **子弹属性（粘弹）**：

| 属性 | 默认值 | 说明 |
|------|--------|------|
| `speed` | 1500 px/s | 比标准弹慢 |
| `mass` | 1.0 kg | 更重 |
| `impact_force` | 200 | 命中冲量较小（它不靠撞击） |
| `gravity_scale` | 0.5 | 更受重力影响 |
| `max_distance` | 1200 px | — |
| `lifetime` | 5.0 s | 附着后延时更长 |
| `fuse_duration` | 1.5 s | 附着后延时引爆时间 |
| `explosion_radius` | 150 px | 引爆 AOE 范围 |
| `explosion_force` | 1000 | 引爆冲击力 |

4. **子弹飞行**：RigidBody2D 子弹以初速度直线飞行，受重力微调轨迹。CCD 启用（`CD_MODE_CAST_RAY`）。碰撞层 = Projectile (3)，碰撞 Enemy(2)、World(4)、PhysicsObject(5)。

5. **命中行为（标准弹）**：
   - 命中 World → 产生冲击力（`apply_impulse` 在命中点法线方向），触发 hit-stop（50ms），子弹销毁
   - 命中 Enemy → 产生伤害（通过 HitData 传递给伤害系统）+ 冲击力，触发 hit-stop，子弹销毁
   - 命中 PhysicsObject → 产生冲击力（推动该物体），触发 hit-stop，子弹销毁

6. **命中行为（粘弹）**：
   - 命中任何表面 → 附着（子弹变为 StaticBody2D 并 parent 到命中对象）
   - 延时 `fuse_duration` 后引爆 → 产生 AOE 爆炸冲击力（调用连锁传播系统）
   - 附着期间如果被其他爆炸波及 → 提前引爆（连锁反应！）

7. **后坐力**：每次射击给玩家 CharacterBody2D 施加后坐力冲量——方向为射击反方向，magnitude = `recoil_force`（默认 50）。

8. **hit-stop 触发**：子弹命中时调用摄像机系统的 `hit_stop(duration, time_scale=0.1)`。仅对玩家子弹触发，敌人子弹不触发。

### States and Transitions

子弹自身有状态：

| 状态 | 说明 |
|------|------|
| **FLYING** | 飞行中——RigidBody2D 活跃，等待碰撞 |
| **HIT** | 已命中——产生 HitData + 冲击力，即将销毁 |
| **ATTACHED** | 粘弹附着——等待延时引爆 |
| **DETONATING** | 粘弹引爆中——产生 AOE，即将销毁 |
| **EXPIRED** | 超时/超距——静默销毁，无效果 |

### Interactions

| 系统 | 方向 | 交互 |
|------|------|------|
| 玩家控制器 | 上游 | 接收 fire() 调用 |
| 物理引擎配置 | 上游 | RigidBody2D 属性、CCD、碰撞层 |
| 碰撞与命中判定 | 上游 | 接收 HitData 知道命中了什么 |
| 碰撞与命中判定 | 下游 | 子弹碰撞产生 HitData |
| 生命值与伤害系统 | 下游 | 命中敌人时传递伤害数据 |
| 材质破坏系统 | 下游 | 命中可破坏物时传递冲击力 |
| 连锁传播系统 | 下游 | 粘弹引爆时调用 AOE |
| 2D 摄像机系统 | 下游 | 触发 hit-stop |

## Formulas

### 子弹初速度

```
initial_velocity = (target - origin).normalized() * bullet_speed
```

### 冲击力衰减（按距离）

```
effective_force = impact_force * clamp(1 - distance_traveled / max_distance, 0.3, 1.0)
```

远距离命中冲击力降低（最少保留 30%），鼓励中近距离射击。

## Edge Cases

- **子弹飞出场景边界**: `max_distance` 和 `lifetime` 双重保险——任一条满足即销毁。
- **粘弹附着到正在移动的 PhysicsObject**: parent 到该对象 → 跟随移动 → 在移动中的物体上爆炸。
- **子弹命中已销毁的节点**: 碰撞回调中的 is_instance_valid 检查——无效节点不产生 HitData。
- **粘弹引爆时附着对象已被销毁**: 在引爆位置（上次已知坐标）产生 AOE，不依赖附着对象。
- **同一帧创建大量子弹（如按住射击 + 射击冷却 = 0）**: shoot_interval 限制创建频率。单帧最多创建 1 颗子弹。

## Dependencies

| 系统 | 方向 | 性质 |
|------|------|------|
| 玩家控制器 | 上游 | 硬依赖——射击触发源 |
| 物理引擎配置 | 上游 | 硬依赖——子弹物理属性 |
| 碰撞与命中判定 | 上游+下游 | 硬依赖——产生和消费 HitData |
| 生命值与伤害系统 | 下游 | 硬依赖——传递伤害 |
| 材质破坏系统 | 下游 | 硬依赖——传递冲击力 |
| 连锁传播系统 | 下游 | 软依赖——粘弹引爆 |
| 2D 摄像机系统 | 下游 | 软依赖——hit-stop |

## Tuning Knobs

| 参数 | 默认 | 范围 | 说明 |
|------|------|------|------|
| `bullet_speed` | 2000 | 500~5000 | 越高越像 hitscan |
| `impact_force` | 500 | 100~2000 | Pillar 1 核心——越高每发子弹越"重" |
| `gravity_scale` | 0.3 | 0~1.0 | 弹道弧度 |
| `hit_stop_duration` | 50 | 0~150 | 命中停顿时长 |
| `recoil_force` | 50 | 0~200 | 后坐力大小 |
| `fuse_duration` (粘弹) | 1.5 | 0.5~5.0 | 延时引爆时间 |
| `explosion_force` (粘弹) | 1000 | 500~3000 | 爆炸冲击力 |

## Visual/Audio Requirements

| 事件 | 视觉 | 音频 | 优先级 |
|------|------|------|--------|
| 射击 | 枪口闪光（1-2帧）+ 弹壳弹出 | 射击音效（干涩、有重量感） | MVP |
| 子弹飞行 | 弹道拖尾（细线粒子） | — | Alpha |
| 命中 World | 火花粒子 + 弹坑贴花 | 金属/混凝土撞击声 | MVP |
| 命中 Enemy | 命中喷溅 + 屏幕微震 | 命中声 + 敌人受伤声 | MVP |
| 粘弹附着 | 闪烁光点 + 嘀嗒声 | 倒计时蜂鸣 | MVP |
| 粘弹引爆 | 爆炸粒子 + 冲击波环 | 低频爆炸 | MVP |

## Acceptance Criteria

- [ ] **AC1**: GIVEN fire(origin, target, "standard")，WHEN 子弹创建，THEN 一颗 RigidBody2D 以 2000 px/s 向 target 方向飞行
- [ ] **AC2**: GIVEN 标准弹命中 World 层墙壁，WHEN 碰撞，THEN 子弹销毁、hit-stop 50ms 触发、冲击力 500 施加到命中点
- [ ] **AC3**: GIVEN 标准弹命中 Enemy 层敌人，WHEN 碰撞，THEN HitData 包含 damage 相关字段传递给生命值系统
- [ ] **AC4**: GIVEN 标准弹飞行距离 > 1500 px，WHEN 检查，THEN 子弹自动销毁
- [ ] **AC5**: GIVEN 粘弹命中 PhysicsObject 油桶，WHEN 附着，THEN 子弹变为油桶子节点，1.5 秒后引爆
- [ ] **AC6**: GIVEN 粘弹引爆（explosion_radius=150），WHEN AOE 查询，THEN 范围内所有 PhysicsObject 和 Enemy 受到 explosion_force=1000 的冲击力
- [ ] **AC7**: GIVEN 射击调用，WHEN 检查玩家，THEN 玩家受到 recoil_force=50 的反方向后坐力
- [ ] **AC8**: GIVEN 子弹受重力影响（gravity_scale=0.3），WHEN 飞行 500px，THEN 弹道有可测量的下坠
- [ ] **AC9**: 所有弹型属性参数从配置文件读取

## Open Questions

| 问题 | 负责人 | 目标日期 | 状态 |
|------|--------|---------|------|
| MVP 是否需要弹道拖尾视觉？ | art-director | MVP 前 | 优先功能正确性，拖尾可选 |
| 粘弹能否附着到敌人身上？ | game-designer | Alpha 前 | MVP 仅附着到环境和物理物体 |
| 是否需射手雷/磁力弹等其他弹型？ | game-designer | Alpha 前 | MVP 仅 2 种，Alpha 扩展至 6-8 种 |
