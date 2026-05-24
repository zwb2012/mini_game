# Epic: 关卡设计数据系统 (Level Design Data)

> **Layer**: Feature
> **GDD**: `design/gdd/level-design-data.md`
> **Architecture Module**: Level Design Data — JSON schema、数据验证、房间配置
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories level-design-data`

## Overview

实现所有房间的数据层——定义 JSON schema（room_id, room_type, scene_path, camera_bounds, navigation, enemies[], physics_objects[], room_transitions）和 load_room_data(id) → RoomData 查询接口。5 种物理对象类型：explosive_barrel, hanging_object, destructible_wall, acid_pool, unstable_structure。Pillar 2 约束：每房间 ≥2 种物理对象类型。Boss 房间扩展 schema：boss_archetype, anchor_points[], body_parts[], room_center, trigger_zone。作为纯数据层（无 Autoload 运行时逻辑），验证 JSON → 返回结构化数据 → 消费者（Scene Manager, Enemy Spawn）执行。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | LevelDesignData 作为 Autoload，提供 load_room_data(id) → RoomData（纯数据查询） | LOW |
| ADR-0002: 场景加载策略 | JSON 验证在 Scene Manager.load_room() 调用前完成；scene_path 指向 .tscn 文件 | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-level-design-data-001 | 房间 JSON schema: room_id, room_type(combat/boss/transition), scene_path, camera_bounds, navigation.polygon_path, enemies[], physics_objects[], room_transitions | ADR-0002 ✅ |
| TR-level-design-data-002 | 5 种物理对象类型: explosive_barrel, hanging_object, destructible_wall, acid_pool, unstable_structure。Pillar 2 约束: 每房间 ≥2 种类型 | ADR-0005 ✅ |
| TR-level-design-data-003 | Boss 房间扩展: boss_archetype, anchor_points[], body_parts[], room_center, trigger_zone——schema 已定义 | ADR-0012 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/level-design-data.md` are verified
- All Logic stories have passing test files in `tests/unit/level-design-data/`
- JSON schema 验证覆盖所有必填字段 + 类型检查 + Pillar 2 约束（≥2 物理类型）
- MVP 1 个 Boss 房间 + 3 个 combat 房间 + 1 个 transition 房间的 JSON 数据文件

## Next Step

Run `/create-stories level-design-data` to break this epic into implementable stories.
