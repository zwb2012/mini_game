# Epic: 敌人生成与波次管理 (Enemy Spawn & Wave)

> **Layer**: Feature
> **GDD**: `design/gdd/enemy-spawn-wave.md`
> **Architecture Module**: Enemy Spawn & Wave — 生成队列、stagger、房间清空检测
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories enemy-spawn-wave`

## Overview

实现敌人生成队列和房间清空检测逻辑。MVP 阶段：一次性批量生成带 stagger（默认每敌人 0.3s 间隔）。spawn_room_enemies(room_id) → 顺序实例化 PackedScene → 每个敌人 activate() → 全部生成后发射 all_enemies_spawned。Boss 独立路径：activate_boss(boss_id, room_config) 绕过敌人生成队列，发射 boss_spawned signal。房间清空检测：active_enemy_count=0 且 spawn_queue 为空且状态 ∈ {ACTIVE, BOSS_ACTIVE} → room_cleared signal → 触发下一房间过渡。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | EnemySpawn 作为 Autoload，all_enemies_spawned + room_cleared + boss_spawned signal | LOW |
| ADR-0013: 敌人 AI 导航系统架构 | PackedScene.instantiate() + activate() lifecycle；导航网格在场景加载时预烘焙 | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-enemy-spawn-001 | MVP: 一次性批量生成带 stagger（默认 0.3s/敌人）；spawn_room_enemies(room_id) → 顺序实例化 → all_enemies_spawned | ADR-0013 ✅ |
| TR-enemy-spawn-002 | Boss 独立路径: activate_boss(boss_id, room_config)——绕过敌人生成队列；发射 boss_spawned signal | ADR-0012 ✅ |
| TR-enemy-spawn-003 | 房间清空检测: active_enemy_count=0 且 spawn_queue 为空且状态 ∈ {ACTIVE, BOSS_ACTIVE} → room_cleared signal | ADR-0010 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/enemy-spawn-wave.md` are verified
- All Integration stories have passing test files in `tests/integration/enemy-spawn-wave/`
- Stagger 时序精度（0.3s ± 5%）+ 房间清空检测完整性 + Boss 独立路径隔离测试

## Next Step

Run `/create-stories enemy-spawn-wave` to break this epic into implementable stories.
