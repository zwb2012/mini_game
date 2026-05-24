# Epic: 触屏操控界面 (Touch Control UI)

> **Layer**: Presentation
> **GDD**: `design/gdd/touch-control-ui.md`
> **Architecture Module**: Touch Control UI — 虚拟摇杆、瞄准准星、射击反馈、屏幕分区
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories touch-control-ui`

## Overview

实现玩家触屏操控的所有视觉元素——动态虚拟摇杆（手指落点居中，外环 60px 半径，内点 24px，最大拖拽 80px）、瞄准准星（24×24px 十字，跟随右指位置，无右触时隐藏）、射击反馈（点击→白色脉冲环 24→48px 0.1s；按住→按射击间隔重复脉冲）。运行在 CanvasLayer layer=5（ADR-0014），所有 Control 节点 mouse_filter=IGNORE，触摸事件穿透到 TouchInput._input()。纯显示层——消费 TouchInput 信号，不输出游戏信号。屏幕空间分配：顶部 48px 归 HUD，其余归触屏控件。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | TouchControlUI 作为 Scene Node（CanvasLayer layer=5），只读消费 TouchInput signals | LOW |
| ADR-0009: 玩家控制器与触屏射击架构 | 虚拟摇杆 + 准星视觉元素位置从 TouchInput 信号推断 | LOW |
| ADR-0014: 触控 UI 与 HUD CanvasLayer 架构 | CanvasLayer layer=5 + mouse_filter=IGNORE 触摸穿透；所有 Control 节点在 TouchControlLayer 渲染 | MEDIUM |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-touch-control-ui-001 | 动态摇杆: 手指落点居中，外环(60px 半径)，内点(24px)，最大拖拽 80px。只读消费 TouchInput 信号——不输出游戏信号。 | ADR-0014 ✅ |
| TR-touch-control-ui-002 | 准星: 24×24px 十字，跟随右指位置；无右触时隐藏 | ADR-0014 ✅ |
| TR-touch-control-ui-003 | 射击反馈: tap → 白色脉冲环 24→48px (0.1s); hold → 按射击间隔重复脉冲。屏幕空间: 顶部 48px 给 HUD，其余给触屏控件 | ADR-0014 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/touch-control-ui.md` are verified
- All UI stories have manual walkthrough docs + 截图在 `production/qa/evidence/`
- 双指同时操作（左摇杆+右瞄准）无视觉卡顿验证
- 屏幕旋转 + 不同分辨率下的布局适配验证

## Next Step

Run `/create-stories touch-control-ui` to break this epic into implementable stories.
