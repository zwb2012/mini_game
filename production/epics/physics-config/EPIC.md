# Epic: 物理引擎配置 (Physics Config)

> **Layer**: Foundation
> **GDD**: `design/gdd/physics-config.md`
> **Architecture Module**: Physics Config — 碰撞层定义、碰撞矩阵、物理材质
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories physics-config`

## Overview

实现所有物理交互的地基——定义 GodotPhysics2D 参数、5 层碰撞体系、4 种物理材质和碎片 RigidBody2D 对象池。本系统不关心"什么物体在碰撞"，只定义"碰撞的规则是什么"。作为 Foundation 层 Autoload，它是 Pillar 1（子弹重量）、Pillar 2（多米诺战场）和 Pillar 3（规则稳定）的物理实现基础。碰撞层常量、物理材质参数、对象池容量全部从配置文件读取。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | Physics Config 作为 Autoload，提供碰撞层常量和物理参数查询 | LOW |
| ADR-0003: 物理对象池设计 | FIFO 碎片 RigidBody2D 对象池（size=50），acquire_debris() / release_debris() | MEDIUM |
| ADR-0004: 命中检测架构 | _integrate_forces 碰撞检测 + collision_hit signal（影响 Physics Config 的 body type 分配） | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-physics-config-001 | 5 碰撞层: Player(1), Enemy(2), Projectile(3), World(4), PhysicsObject(5) | ADR-0004 ✅ |
| TR-physics-config-002 | 碰撞矩阵: Player↔Enemy/World/PhysicsObject, Enemy↔Player/Projectile/World/PhysicsObject, Projectile↔Enemy/World/PhysicsObject, World↔Player/Enemy/Projectile, PhysicsObject↔Player/Enemy/Projectile/PhysicsObject | ADR-0004 ✅ |
| TR-physics-config-003 | 4 种物理材质: wood(0.6,0.3), metal(0.3,0.1), concrete(0.9,0.0,rough=true), organic(0.5,0.05) | ADR-0005 ✅ |
| TR-physics-config-004 | 碎片 RigidBody2D 对象池: size=50, FIFO 回收 | ADR-0003 ✅ |
| TR-physics-config-005 | physics_ticks_per_second=60, max_physics_steps_per_frame=8 | ADR-0004 ✅ |
| TR-physics-config-006 | CCD (CD_MODE_CAST_RAY) 仅对子弹 RigidBody2D 启用——防止高速子弹穿透 | ADR-0007 ✅ |
| TR-physics-config-007 | Body type 分配: Player=CharacterBody2D, enemies=CharacterBody2D 或 RigidBody2D, projectiles=RigidBody2D, destructibles=StaticBody2D→RigidBody2D, debris=RigidBody2D, world=StaticBody2D | ADR-0003 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/physics-config.md` are verified
- All Logic and Integration stories have passing test files in `tests/unit/physics-config/`
- 碰撞层分配 + 对象池压力测试通过（50 碎片同时活跃 @ 60fps）

## Next Step

Run `/create-stories physics-config` to break this epic into implementable stories.
