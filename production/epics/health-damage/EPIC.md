# Epic: 生命值与伤害系统 (Health & Damage)

> **Layer**: Core
> **GDD**: `design/gdd/health-damage.md`
> **Architecture Module**: Health & Damage — 伤害公式、HP 追踪、死亡宣告
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories health-damage`

## Overview

实现所有实体的伤害计算、HP 追踪和死亡宣告。伤害公式：`final_damage = floor(impulse × type_factor × dtc)`，5 种伤害类型因子（bullet=0.20, explosion=0.15, fragment=0.25, crush=0.30, environment=0.20）。实体 HP 池：Player=1000(dtc=1.0), Light enemy=200, Medium=400, Heavy=800, Boss=3000。health_changed(entity, old, new) 和 entity_died(entity, killer_source) signal 广播——DEAD guard 拒绝后续命中。所有 HP 值从配置文件读取。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | HealthSystem 作为 Autoload，health_changed + entity_died signal 供 HUD、Enemy AI、Death 消费 | LOW |
| ADR-0004: 命中检测架构 | 订阅 hit_detected signal，提取 HitData.impulse 和 damage_type → 计算 final_damage | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-health-damage-001 | final_damage = floor(impulse × type_factor × dtc); type_factors: bullet=0.20, explosion=0.15, fragment=0.25, crush=0.30, environment=0.20 | ADR-0004 ✅ |
| TR-health-damage-002 | 实体 HP 池: Player=1000(dtc=1.0), Light enemy=200(1.0), Medium=400(0.8), Heavy=800(0.5), Boss=3000(0.3) | ADR-0004 ✅ |
| TR-health-damage-003 | health_changed(entity, old_hp, new_hp) 和 entity_died(entity, killer_source) signal；DEAD guard 拒绝后续命中 | ADR-0001 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/health-damage.md` are verified
- All Logic stories have passing test files in `tests/unit/health-damage/`
- 5 种伤害类型 × 5 种实体 DTC 组合的伤害计算精度测试

## Next Step

Run `/create-stories health-damage` to break this epic into implementable stories.
