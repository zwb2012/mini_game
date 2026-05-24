# Epic: 死亡与重生系统 (Death & Respawn)

> **Layer**: Core
> **GDD**: `design/gdd/death-respawn.md`
> **Architecture Module**: Death & Respawn — 死亡流程、重生逻辑、无敌帧
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories death-respawn`

## Overview

实现玩家和敌人的死亡后流程与重生逻辑。玩家死亡流程：entity_died → DEAD state → 死亡动画(0.5s) → 死亡暂停(1.0s) → reset_current_room() → PLAYING → 重生点 + 满 HP + 1.0s 无敌。无生命限制、无死亡惩罚（无限重试）。敌人死亡流程：死亡动画(0.3s) → 移出物理空间 → 尸体粒子(1s) → 通知 enemy-spawn (count -1)。订阅 state_changed 驱动玩家死亡→PLAYING 转换，订阅 entity_died 驱动敌人死亡后处理。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | DeathRespawn 作为 Autoload，订阅 entity_died + state_changed signal | LOW |
| ADR-0010: 游戏状态机架构 | DEAD state → transition_to(PLAYING) 作为重生触发；DEAD→PAUSED 非法转换 | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-death-respawn-001 | 玩家死亡流程: entity_died → DEAD state → 死亡动画(0.5s) → 死亡暂停(1.0s) → reset_current_room() → PLAYING → 重生点 + 满 HP | ADR-0010 ✅ |
| TR-death-respawn-002 | 无限重试（无生命限制）；重生无敌 1.0s；无死亡惩罚 | ADR-0010 ✅ |
| TR-death-respawn-003 | 敌人死亡流程: 死亡动画(0.3s) → 移出物理空间 → 尸体粒子(1s) → 通知 enemy-spawn (count -1) | ADR-0001 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/death-respawn.md` are verified
- All Integration stories have passing test files in `tests/integration/death-respawn/`
- 玩家死亡→重生完整流程 + 敌人死亡→清除完整流程的计时精度测试

## Next Step

Run `/create-stories death-respawn` to break this epic into implementable stories.
