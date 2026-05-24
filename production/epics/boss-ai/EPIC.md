# Epic: Boss AI 系统 (Boss AI)

> **Layer**: Feature
> **GDD**: `design/gdd/boss-ai.md`
> **Architecture Module**: Boss AI — 阶段系统、身体部件、攻击选择
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories boss-ai`

## Overview

实现 Boss 的完整 AI——5 个身体部件（2 腿 Concrete/1000, 2 臂 Metal/500, 1 核心 Composite/1500）作为独立 top_level=true RigidBody2D，通过 PinJoint2D 连接到 CharacterBody2D 根节点。3 阶段系统：Phase 1 (HP>50%, legs=0) → Phase 2 (HP≤50% 或 legs≥1) → DOWNED (legs=2, 永久 VULNERABLE, 20s 崩塌倒计时)。Pillar 4 子弹分离：子弹 damage_type 的 dtc_effective=0.0（子弹永不减少 BossTotalHP），碾压穿透 dtc_effective=1.0。6 种攻击：Ground Slam(CD 4s), Debris Throw(6s), Arm Sweep(5s, P1 only), Self-Destruct Throw(8s, P2), Collapse Charge(10s, P2), Doom Pulse(4s, DOWNED)。沿锚点路径移动（每 Boss 房间 5-8 锚点），非自由导航，移动速度 80(P1)/30(P2)/0(DOWNED) px/s。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | Boss AI 作为 Scene Node，boss_state_changed/boss_phase_changed/boss_part_damaged signal | LOW |
| ADR-0012: Boss 身体部件物理架构 | 方案 D: RigidBody2D 根 + _integrate_forces + PinJoint2D 子节点；方案 A（top_level 手动同步）因根本性缺陷被拒绝；5 项验证标准 | HIGH |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-boss-ai-001 | 5 个身体部件（2 腿=Concrete/1000, 2 臂=Metal/500, 1 核心=Composite/1500）作为独立 RigidBody2D top_level=true 在 CharacterBody2D 根节点下 | ADR-0012 ✅ |
| TR-boss-ai-002 | 阶段系统: Phase 1 (HP>50%, legs=0) → Phase 2 (HP≤50% 或 legs≥1) → DOWNED (legs=2, 永久 VULNERABLE, 20s 崩塌倒计时) | ADR-0012 ✅ |
| TR-boss-ai-003 | Pillar 4 子弹分离: bullet damage_type 的 dtc_effective=0.0（子弹永不减少 BossTotalHP）；crush penetration dtc_effective=1.0 | ADR-0012 ✅ |
| TR-boss-ai-004 | VULNERABLE 状态: vuln_mult=2.0, 5.0s 窗口；STUNNED: 2.0s 固定。手臂保护: 双臂完整时核心免疫碾压 | ADR-0012 ✅ |
| TR-boss-ai-005 | 6 种攻击: Ground Slam(CD 4s), Debris Throw(6s), Arm Sweep(5s, P1 only), Self-Destruct Throw(8s, P2), Collapse Charge(10s, P2), Doom Pulse(4s, DOWNED) | ADR-0012 ✅ |
| TR-boss-ai-006 | 沿锚点路径移动（每 Boss 房间 5-8 锚点）；非自由导航；move_speed 80(P1)/30(P2)/0(DOWNED) px/s | ADR-0012 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/boss-ai.md` are verified
- All Logic stories have passing test files in `tests/unit/boss-ai/`
- 身体部件 PinJoint2D 锚点精度 <5px + impulse 响应 ≥5px + 1000 帧一致性（ADR-0012 spike gate）
- Boss 3 阶段 × 6 攻击的行为完整性测试

## Next Step

Run `/create-stories boss-ai` to break this epic into implementable stories.
