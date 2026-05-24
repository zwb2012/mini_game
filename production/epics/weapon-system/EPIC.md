# Epic: 武器系统 (Weapon System)

> **Layer**: Core
> **GDD**: `design/gdd/weapon-system.md`
> **Architecture Module**: Weapon System — 武器切换、弹药管理、fire_current
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories weapon-system`

## Overview

实现所有可用武器的数据定义、切换逻辑和弹药管理。每把武器不仅定义伤害和射速——它定义一种物理交互方式。MVP 提供 2 把武器：标准步枪（standard 弹型、0.3s 射击间隔、20 发弹匣、1.5s 装填）和粘弹发射器（sticky 弹型、0.8s 射击间隔、3 发弹匣、2.0s 装填）。fire_current 流程：CD 检查 → 弹药检查 → ShootingSystem.fire()。每把武器独立弹药状态，切换武器保留；装填可被切换中断（弹药保持 0）。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | WeaponSystem 作为 Autoload，weapon_changed signal + fire_current(origin, target) 委托给 ShootingSystem | LOW |
| ADR-0008: 武器系统与弹药管理 | 武器数据从 weapon_config.json；独立弹药状态；装填状态机 READY/RELOADING/OFF_COOLDOWN；fire_current 委托 | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-weapon-system-001 | 武器数据: weapon_id, weapon_name, bullet_type, shoot_interval, magazine_size, reload_time——从 weapon_config.json | ADR-0008 ✅ |
| TR-weapon-system-002 | MVP 武器: standard_rifle (standard, 0.3s, 20mag, 1.5s reload) + sticky_launcher (sticky, 0.8s, 3mag, 2.0s reload) | ADR-0008 ✅ |
| TR-weapon-system-003 | fire_current → CD 检查 → 弹药检查 → ShootingSystem.fire()；状态=RELOADING 或在射击间隔内时拒绝 CD | ADR-0008 ✅ |
| TR-weapon-system-004 | 每把武器独立弹药状态，切换时保留；装填可被武器切换中断（弹药保持 0） | ADR-0008 ✅ |
| TR-weapon-system-005 | 房间重置 → 所有武器弹药恢复至 magazine_size；状态 → READY | ADR-0008 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/weapon-system.md` are verified
- All Logic stories have passing test files in `tests/unit/weapon-system/`
- 武器切换 + 装填 + CD 状态机全覆盖 + 弹药状态持久化测试

## Next Step

Run `/create-stories weapon-system` to break this epic into implementable stories.
