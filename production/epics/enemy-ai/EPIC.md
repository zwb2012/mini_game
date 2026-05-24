# Epic: 敌人 AI 系统 (Enemy AI)

> **Layer**: Feature
> **GDD**: `design/gdd/enemy-ai.md`
> **Architecture Module**: Enemy AI — AI 状态机、感知模型、掩体选择、射击决策
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories enemy-ai`

## Overview

实现 4 种敌人原型的 AI 行为——Scout（HP=200, speed=350, stun=150）、Soldier（400, 200, 300）、Heavy（800, 100, 600）、Carrier（200, 300, 100），每种有差异化行为。4 状态 AI 状态机：IDLE→COMBAT→SEARCHING→IDLE，STUNNED 和 DEAD 可从任意状态触发。视觉感知：120° 锥形、600px 范围、3 条射线（头/躯干/脚）、0.3s 检测延迟、3s 记忆。导航：NavigationAgent2D + NavigationRegion2D，预烘焙导航多边形，Scout/Soldier 使用 RVO2，Heavy 无 RVO，Carrier 使用 Direct+RayCast2D。敌人射击复用玩家子弹系统 fire()，散布基于距离（基础 5-15° × 距离因子）。AI 帧预算：中端移动设备 15 个活跃敌人 ≤ 2ms @ 60fps。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | Enemy AI 作为 Scene Node，activate()/deactivate() 管理生命周期；通过 signal 与 Autoload 交互 | LOW |
| ADR-0013: 敌人 AI 导航系统架构 | NavigationAgent2D + NavigationRegion2D；3 种导航路径: RVO2(Scout/Soldier) / No RVO(Heavy) / Direct+RayCast2D(Carrier)；静态导航网格 | MEDIUM |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-enemy-ai-001 | 4 种原型: Scout(HP=200, speed=350, stun=150), Soldier(400, 200, 300), Heavy(800, 100, 600), Carrier(200, 300, 100) 各有差异化 AI 行为 | ADR-0013 ✅ |
| TR-enemy-ai-002 | 视觉锥形: range=600px, angle=120°, 3 条射线（头/躯干/脚）, detection_delay=0.3s, memory_duration=3s | ADR-0013 ✅ |
| TR-enemy-ai-003 | NavigationAgent2D + NavigationRegion2D 寻路；每房间预烘焙导航多边形；危险区域旅行成本修改 | ADR-0013 ✅ |
| TR-enemy-ai-004 | 状态机: IDLE→COMBAT→SEARCHING→IDLE；STUNNED 和 DEAD 可从任意状态；Scout 掩体选择评分；目标优先级公式 | ADR-0013 ✅ |
| TR-enemy-ai-005 | 敌人射击通过 fire(enemy_muzzle, target, 'standard', self)——复用玩家子弹系统；散布基于距离（基础 5-15° × 距离因子） | ADR-0007 ✅ |
| TR-enemy-ai-006 | AI 帧预算: 中端移动设备 15 个活跃敌人 @ 60fps ≤ 2ms | ADR-0013 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/enemy-ai.md` are verified
- All Logic stories have passing test files in `tests/unit/enemy-ai/`
- 4 种原型 × 4 种状态的行为测试 + AI 帧预算性能分析报告

## Next Step

Run `/create-stories enemy-ai` to break this epic into implementable stories.
