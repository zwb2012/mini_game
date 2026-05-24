# Epic: HUD 系统 (HUD)

> **Layer**: Presentation
> **GDD**: `design/gdd/hud.md`
> **Architecture Module**: HUD — HP 条、武器图标、连锁计数器、Boss 仪表盘、低血量脉冲
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories hud`

## Overview

实现玩家可见的所有游戏状态信息的 3 层信息展示。Persistent 层（始终可见）：HP 条（绿→黄→红渐变）、武器图标 + 弹药。Event 层（条件显示）：连锁计数器（chain_depth_changed）、阶段文字、房间清空提示。Boss 层（Boss 战专属）：Boss HP 条、身体部件状态、VULNERABLE 倒计时、崩塌计时器。HUD 运行在 CanvasLayer layer=10（ADR-0014），所有 Control 节点 mouse_filter=IGNORE。低血量边缘脉冲：HP ≤ 30% 时红色边缘覆盖 0.5Hz 脉冲。信号订阅注册表：配置驱动的方式将上游 signal 连接到 HUD 元素。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | HUD 作为 Scene Node（CanvasLayer layer=10），订阅上游 signal（health/weapon/chain/boss/state） | LOW |
| ADR-0014: 触控 UI 与 HUD CanvasLayer 架构 | 双 CanvasLayer: TouchControlLayer(5) + HUDLayer(10); mouse_filter=IGNORE; STUNNED 图标世界→屏幕坐标转换 + clamp | MEDIUM |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-hud-001 | 3 层信息层级: Persistent(HP bar, weapon icon), Event(chain counter, phase text, room clear), Boss(Boss HP, parts, timers) | ADR-0014 ✅ |
| TR-hud-002 | 10 个 MVP HUD 元素，定义位置、尺寸、signal 来源和动画——布局来自 hud_layout.json | ADR-0014 ✅ |
| TR-hud-003 | Signal 订阅注册表: 配置驱动的上游 signal 到 HUD 元素连接；CanvasLayer 渲染独立于摄像机移动 | ADR-0014 ✅ |
| TR-hud-004 | 低血量边缘脉冲: HP ≤ max_hp × 0.3 → 红色边缘覆盖 0.5Hz 脉冲；HP 条绿→黄→红渐变 | ADR-0014 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/hud.md` are verified
- All UI stories have manual walkthrough docs in `production/qa/evidence/`
- 3 层信息层级正确显示/隐藏 + 低血量脉冲视觉验证截图
- Boss HUD 元素在 boss_spawned/boss_defeated 时正确展开/收起

## Next Step

Run `/create-stories hud` to break this epic into implementable stories.
