# Epics Index

> **Last Updated**: 2026-05-23
> **Engine**: Godot 4.6 + GodotPhysics2D
> **ADR Count**: 14 (all Accepted)
> **TR Count**: 90 active requirements

## Status Legend

| Status | Meaning |
|--------|---------|
| **Ready** | Epic defined, ready for `/create-stories` |
| **In Progress** | Stories being authored or implemented |
| **Complete** | All stories closed via `/story-done` |

## Foundation Layer (4 epics)

| Epic | System | GDD | Stories | Risk | Status |
|------|--------|-----|---------|------|--------|
| [touch-input](touch-input/EPIC.md) | 触屏输入系统 | design/gdd/touch-input.md | 6 stories | LOW | Ready |
| [physics-config](physics-config/EPIC.md) | 物理引擎配置 | design/gdd/physics-config.md | Not yet created | MEDIUM | Ready |
| [game-state-machine](game-state-machine/EPIC.md) | 游戏状态机 | design/gdd/game-state-machine.md | 2 stories | LOW | Ready |
| [scene-manager](scene-manager/EPIC.md) | 场景管理器 | design/gdd/scene-manager.md | Not yet created | LOW | Ready |

## Core Layer (9 epics)

| Epic | System | GDD | Stories | Risk | Status |
|------|--------|-----|---------|------|--------|
| [hit-detection](hit-detection/EPIC.md) | 碰撞与命中判定 | design/gdd/hit-detection.md | Not yet created | LOW | Ready |
| [player-controller](player-controller/EPIC.md) | 玩家控制器 | design/gdd/player-controller.md | Not yet created | LOW | Ready |
| [camera-system](camera-system/EPIC.md) | 2D 摄像机系统 | design/gdd/camera-system.md | Not yet created | LOW | Ready |
| [shooting-projectile](shooting-projectile/EPIC.md) | 射击与弹道系统 | design/gdd/shooting-projectile.md | Not yet created | MEDIUM | Ready |
| [material-destruction](material-destruction/EPIC.md) | 材质破坏系统 | design/gdd/material-destruction.md | Not yet created | HIGH | Ready |
| [weapon-system](weapon-system/EPIC.md) | 武器系统 | design/gdd/weapon-system.md | Not yet created | LOW | Ready |
| [chain-propagation](chain-propagation/EPIC.md) | 连锁传播系统 | design/gdd/chain-propagation.md | Not yet created | HIGH | Ready |
| [health-damage](health-damage/EPIC.md) | 生命值与伤害系统 | design/gdd/health-damage.md | Not yet created | LOW | Ready |
| [death-respawn](death-respawn/EPIC.md) | 死亡与重生系统 | design/gdd/death-respawn.md | Not yet created | LOW | Ready |

## Feature Layer (4 epics)

| Epic | System | GDD | Stories | Risk | Status |
|------|--------|-----|---------|------|--------|
| [enemy-ai](enemy-ai/EPIC.md) | 敌人 AI 系统 | design/gdd/enemy-ai.md | Not yet created | MEDIUM | Ready |
| [boss-ai](boss-ai/EPIC.md) | Boss AI 系统 | design/gdd/boss-ai.md | Not yet created | HIGH | Ready |
| [level-design-data](level-design-data/EPIC.md) | 关卡设计数据系统 | design/gdd/level-design-data.md | Not yet created | LOW | Ready |
| [enemy-spawn-wave](enemy-spawn-wave/EPIC.md) | 敌人生成与波次管理 | design/gdd/enemy-spawn-wave.md | Not yet created | LOW | Ready |

## Presentation Layer (2 epics)

| Epic | System | GDD | Stories | Risk | Status |
|------|--------|-----|---------|------|--------|
| [hud](hud/EPIC.md) | HUD 系统 | design/gdd/hud.md | Not yet created | MEDIUM | Ready |
| [touch-control-ui](touch-control-ui/EPIC.md) | 触屏操控界面 | design/gdd/touch-control-ui.md | Not yet created | MEDIUM | Ready |

## Summary

| Layer | Epics | TR Count | HIGH Risk |
|-------|-------|----------|-----------|
| Foundation | 4 | 22 | 0 |
| Core | 9 | 43 | 2 (Material Destruction, Chain Propagation) |
| Feature | 4 | 18 | 1 (Boss AI) |
| Presentation | 2 | 7 | 0 |
| **Total** | **19** | **90** | **3** |
