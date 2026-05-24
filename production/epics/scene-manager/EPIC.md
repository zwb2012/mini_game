# Epic: 场景管理器 (Scene Manager)

> **Layer**: Foundation
> **GDD**: `design/gdd/scene-manager.md`
> **Architecture Module**: Scene Manager — load_room/reset_room/unload_room + 过渡动画
> **Status**: Ready
> **Stories**: Not yet created — run `/create-stories scene-manager`

## Overview

实现关卡房间的加载、卸载、重置和过渡——根据游戏状态机指令切换场景（主菜单→第一关、当前房间→下一房间、死亡后重置当前房间）。作为 Foundation 层系统，不定义"房间里有什么"（那是关卡设计数据系统的职责），只负责"何时加载哪个场景"和"过渡怎么播"。场景间过渡使用 150ms FADE_OUT + 150ms FADE_IN（共 300ms），死亡重置无过渡。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-0001: Autoload + Signal 架构 | SceneManager 作为 Autoload，订阅 state_changed 驱动场景切换 | LOW |
| ADR-0002: 场景加载策略 | change_scene_to_file() 同步加载 + 5s 超时 + is_loading guard flag + 请求队列（最大深度 2） | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-scene-manager-001 | load_room(id): 验证 JSON → change_scene_to_file() → setup(camera, enemies, physics_objects) → FADE_IN → room_active signal | ADR-0002 ✅ |
| TR-scene-manager-002 | reset_current_room(): 调用房间根节点 reset() 方法——敌人重生，one_shot=false 物体恢复，one_shot=true 保持破坏 | ADR-0002 ✅ |
| TR-scene-manager-003 | 过渡: FADE_OUT 150ms + FADE_IN 150ms = 300ms 总计；死亡重置即时无过渡 | ADR-0002 ✅ |
| TR-scene-manager-004 | 加载超时 5s → room_load_failed signal → 错误 UI → 允许返回主菜单 | ADR-0002 ✅ |
| TR-scene-manager-005 | is_loading guard flag + 请求队列（最大深度 2）；加载期间拒绝重复加载请求 | ADR-0002 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/scene-manager.md` are verified
- All Logic and Integration stories have passing test files in `tests/integration/scene-manager/`
- 场景加载 ≤ 2s（含 setup）+ 过渡 300ms 的性能预算验证

## Next Step

Run `/create-stories scene-manager` to break this epic into implementable stories.
