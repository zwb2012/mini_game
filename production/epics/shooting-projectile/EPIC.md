# Epic: 射击与弹道系统 (Shooting & Projectile)

> **Layer**: Core
> **GDD**: `design/gdd/shooting-projectile.md`
> **Architecture Module**: Shooting/Projectile — 子弹创建、弹道物理、命中处理
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories shooting-projectile`

## Overview

实现每一发子弹的完整生命周期——从枪口生成（从对象池 acquire）、赋予初速度（RigidBody2D + CCD 防穿透）、飞行中受重力影响（gravity_scale=0.3）、命中时传递冲击力并触发 hit-stop。MVP 支持 2 种弹型：标准弹（速度 2000px/s，冲击力 500，飞行距离 1500px）和粘弹（速度 1500px/s，延时 1.5s 引爆，爆炸半径 150px，爆炸力 1000）。source_entity 行为矩阵：玩家子弹命中敌人触发 hit-stop + 碰撞 ON，敌人子弹不触发 hit-stop + 敌人碰撞 OFF。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | ShootingSystem 作为 Autoload，提供 fire(origin, target, bullet_type, source_entity) | LOW |
| ADR-0004: 命中检测架构 | collision_hit signal + HitData 构建 → hit_detected → 触发下游系统 | LOW |
| ADR-0007: 子弹生命周期 | 子弹状态机 FLYING→HIT/ATTACHED→DETONATING/EXPIRED→pool release；Tween+set_loops() 寿命跟踪 | MEDIUM |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-shooting-001 | fire(origin, target, bullet_type, source_entity) → 从池获取 → 设置速度 → 连接 collision_hit → 启动寿命计时器 | ADR-0007 ✅ |
| TR-shooting-002 | 标准弹: speed=2000px/s, mass=0.5, impact_force=500, gravity_scale=0.3, max_distance=1500, lifetime=3s, hit_stop_duration=50ms | ADR-0007 ✅ |
| TR-shooting-003 | 粘弹: speed=1500px/s, mass=1.0, impact_force=200, fuse_duration=1.5s, explosion_radius=150, explosion_force=1000 | ADR-0007 ✅ |
| TR-shooting-004 | 子弹状态: FLYING→HIT(标准弹)/ATTACHED→DETONATING(粘弹)/EXPIRED→release to pool | ADR-0007 ✅ |
| TR-shooting-005 | source_entity 行为矩阵: player→hit_stop+Enemy layer collision ON; enemy→no hit_stop+Enemy layer collision OFF（防友军伤害） | ADR-0007 ✅ |
| TR-shooting-006 | 寿命跟踪通过 Tween+set_loops() 每 0.5s（非递归 create_timer）；释放时 kill tween | ADR-0007 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/shooting-projectile.md` are verified
- All Logic stories have passing test files in `tests/unit/shooting-projectile/`
- 子弹对象池压力测试（30 子弹同时飞行 @ 60fps）+ CCD 防穿透验证

## Next Step

Run `/create-stories shooting-projectile` to break this epic into implementable stories.
