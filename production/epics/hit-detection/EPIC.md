# Epic: 碰撞与命中判定 (Hit Detection)

> **Layer**: Core
> **GDD**: `design/gdd/hit-detection.md`
> **Architecture Module**: Hit Detection — 物理查询 + HitData 结构 + _integrate_forces 碰撞
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories hit-detection`

## Overview

实现"射击→命中→反应"链路的中枢——检测子弹命中了什么、两个物体何时碰撞、爆炸范围覆盖了哪些物体。将原始碰撞事件转化为结构化的 HitData（命中点、命中法线、命中对象、碰撞冲量等 9 个字段），供下游 7 个系统（Material Destruction、Chain Propagation、Health & Damage、Shooting、Enemy AI、Boss AI、Player Controller）消费。使用 `_integrate_forces` + 自定义 `collision_hit` signal 获取完整接触数据，而非 `body_entered`。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | HitDetection 作为 Autoload，提供 query_area/raycast 查询 + hit_detected signal | LOW |
| ADR-0004: 命中检测架构 | _integrate_forces + collision_hit signal + HitData 结构（9 字段）；Callable bind/disconnect 实现对象池安全 | LOW |
| ADR-0007: 子弹生命周期 | 子弹单次命中默认 + hit_detected signal 触发子弹释放；无穿透（Alpha 功能） | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-hit-detection-001 | 统一 HitData 结构: hit_point, hit_normal, hit_object, hit_layer, impulse, source_object, source_layer, damage_type, source_entity（9 字段） | ADR-0004 ✅ |
| TR-hit-detection-002 | 碰撞检测通过 _integrate_forces + 自定义 collision_hit signal（非 body_entered）获取完整接触数据（位置、法线、冲量） | ADR-0004 ✅ |
| TR-hit-detection-003 | AOE query_area(center, radius, layer_mask, exclude_rids) 通过 PhysicsDirectSpaceState2D.intersect_shape() 用于爆炸/连锁传播 | ADR-0006 ✅ |
| TR-hit-detection-004 | Raycast raycast(from, to, collision_mask) 仅用于敌人 AI 视觉——直接返回，不经过 hit_detected signal | ADR-0013 ✅ |
| TR-hit-detection-005 | 子弹单次命中默认: 首次 collision_hit → 构建 HitData → 发射 hit_detected → 子弹释放。无穿透（Alpha 功能） | ADR-0007 ✅ |
| TR-hit-detection-006 | Callable bind/disconnect 模式用于池化对象: 通过 set_meta('hit_callback') 存储绑定 Callable，使用相同引用断开 | ADR-0004 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/hit-detection.md` are verified
- All Logic stories have passing test files in `tests/unit/hit-detection/`
- HitData 结构完整性测试 + AOE 查询精度测试 + 对象池 callback 泄漏测试

## Next Step

Run `/create-stories hit-detection` to break this epic into implementable stories.
