# Epic: 连锁传播系统 (Chain Propagation)

> **Layer**: Core
> **GDD**: `design/gdd/chain-propagation.md`
> **Architecture Module**: Chain Propagation — 两阶段传播、深度追踪、传播力计算
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories chain-propagation`

## Overview

实现"每一发子弹都是一个物理事件的触发器"的核心卖点——当一个可破坏物体被摧毁时，它的碎片撞击周围物体，可能触发连锁反应。两阶段模型：Phase 1 物理（同一帧，迭代队列计算所有连锁） + Phase 2 视觉回放（每 2-3 帧交错展示）。3 种传播类型：碎片传播（r=100, eff=0.85）、爆炸传播（r=250, eff=0.70）、倒塌传播（r=200, eff=1.00）。传播力公式：F_source = D_threshold + max(0, I_incoming - D_threshold) × 0.25；深度倍率 = 1 - (depth/20)²，depth ≥ 20 硬截断。去重通过 _processed_in_chain 集合 + COOLDOWN 0.1s + 待处理队列（最大 5）。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | ChainPropagation 作为 Autoload，订阅 object_destroyed signal 作为连锁入口 | LOW |
| ADR-0005: 材质破坏管线 | object_destroyed signal 携带 position + material + debris_list → Chain Propagation 消费 | HIGH |
| ADR-0006: 连锁传播递归策略 | 两阶段模型 + 迭代队列（非递归 signal 链）+ DepthMult 公式 + depth=20 硬截断 | HIGH |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-chain-propagation-001 | 3 种传播类型: debris(r=100, eff=0.85, exp=3.0), explosion(r=250, eff=0.70, exp=1.5), collapse(r=200, eff=1.00, exp=1.0) | ADR-0006 ✅ |
| TR-chain-propagation-002 | 两阶段模型: Phase 1 物理（同帧，迭代队列）+ Phase 2 视觉回放（每 2-3 帧交错） | ADR-0006 ✅ |
| TR-chain-propagation-003 | F_source = D_threshold + max(0, I_incoming - D_threshold) × 0.25; F_received = F_source × C_type × DepthMult(depth) × Attn_dist(d, r) | ADR-0006 ✅ |
| TR-chain-propagation-004 | DepthMult(depth) = 1 - (depth/20)²; depth ≥ 20 → 0（硬截断）。迭代队列，非递归 signal 链。 | ADR-0006 ✅ |
| TR-chain-propagation-005 | 去重通过 _processed_in_chain 集合；exclude_rids 传入 query_area；COOLDOWN 0.1s + 待处理队列（最大 5） | ADR-0006 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/chain-propagation.md` are verified
- All Logic stories have passing test files in `tests/unit/chain-propagation/`
- 传播力公式数学验证 + 深度截断测试 + 去重防无限循环测试
- "70% 可预测 + 30% 惊喜"的平衡性 playtest 记录

## Next Step

Run `/create-stories chain-propagation` to break this epic into implementable stories.
