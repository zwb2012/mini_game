# Epic: 材质破坏系统 (Material Destruction)

> **Layer**: Core
> **GDD**: `design/gdd/material-destruction.md`
> **Architecture Module**: Material Destruction — 破坏阈值、碎片生成、损伤累积
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories material-destruction`

## Overview

实现 5 种材质的差异化破坏行为——当 HitData 传递给可破坏物体时，判断冲击力是否超过材质破坏阈值：超过则物体碎裂成碎片 RigidBody2D 并沿倒塌方向飞散；未超过则产生裂缝视觉反馈（crack_stage 0/1/2）但结构保持完整。损伤累积机制允许多次小冲击最终破坏物体。木材（threshold=200）< 金属（500）< 混凝土（1000）< 有机（300）< 复合（1500）的破坏层级让玩家逐步建立"材质词典"。3 种倒塌方向：重力向下（悬挂物）、冲击方向（默认）、冲击反向（金属反弹）。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | MaterialDestruction 作为 Autoload，object_destroyed signal 供 Chain Propagation 消费 | LOW |
| ADR-0003: 物理对象池设计 | 碎片从 PhysicsObjectPool.acquire_debris() 获取；碎片在 object_destroyed signal 发射前生成 | MEDIUM |
| ADR-0005: 材质破坏管线 | 损伤累积模型 + crack_stage 系统 + 倒塌方向规则 + 所有参数从 material_config.json | HIGH |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-material-destruction-001 | 5 种材质: wood(threshold=200, debris=3-5), metal(500, 2-3), concrete(1000, 5-8), organic(300, 1-2), composite(1500, 6-10) | ADR-0005 ✅ |
| TR-material-destruction-002 | 损伤累积: accumulated_damage += hit.impulse；accumulated ≥ threshold 时破坏；crack_stage_changed(stage) signal 用于裂缝阶段（0/1/2） | ADR-0005 ✅ |
| TR-material-destruction-003 | 倒塌方向: gravity_down（悬挂物）, impact_direction（默认: -hit_normal）, impact_reverse（金属反弹） | ADR-0005 ✅ |
| TR-material-destruction-004 | 碎片: 从 PhysicsObjectPool.acquire_debris() 获取；碎片在 object_destroyed signal 发射前生成 | ADR-0003 ✅ |
| TR-material-destruction-005 | 所有材质参数（threshold, debris_count, collapse_bias）从 material_config.json——数据驱动 | ADR-0005 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/material-destruction.md` are verified
- All Logic stories have passing test files in `tests/unit/material-destruction/`
- 5 种材质 × 3 种倒塌方向（15 种组合）破坏测试 + 损伤累积精度测试
- Visual stories: 裂缝阶段 + 碎片飞散截图在 `production/qa/evidence/`

## Next Step

Run `/create-stories material-destruction` to break this epic into implementable stories.
