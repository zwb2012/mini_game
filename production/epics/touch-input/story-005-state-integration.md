# Story 005: 游戏状态集成与焦点管理

> **Epic**: 触屏输入系统 (Touch Input)
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Integration
> **Estimate**: 2h
> **Manifest Version**: N/A — control-manifest.md 尚未创建
> **Last Updated**: 2026-05-23

## Context

**GDD**: `design/gdd/touch-input.md`
**Requirement**: `TR-touch-input-006`

**ADR Governing Implementation**:
- Primary: ADR-0001: Autoload + Signal 架构
- Secondary: ADR-0010: 游戏状态机架构

**ADR Decision Summary**: TouchInput 订阅 GameStateMachine.state_changed signal——仅在 PLAYING 状态处理输入；PAUSED/DEAD 抑制所有输出信号；MAIN_MENU 透传给 UI 层。状态切换时重置所有活跃触控点状态到 IDLE。

**Engine**: Godot 4.6 | **Risk**: LOW
**Engine Notes**: `NOTIFICATION_APPLICATION_FOCUS_OUT` 在 `_notification(what)` 中接收；无 post-cutoff API

**Control Manifest Rules (this layer)**:
- Required: `_ready()` 中连接 `GameStateMachine.state_changed` signal——不做业务逻辑调用
- Forbidden: 禁止在非 PLAYING 状态下处理触控输入
- Guardrail: 状态切换→信号抑制 ≤ 1 帧（16ms）

---

## Acceptance Criteria

*From GDD `design/gdd/touch-input.md`:*

- [ ] **AC8**: GIVEN 游戏状态机报告 `state = paused`，且暂停前有活跃触控点，WHEN 检查下一帧信号，THEN `move_direction = (0,0)`, `shoot_held = false`, `is_aiming = false`（集成测试）
- [ ] **AC11**: GIVEN 左右区各有一个活跃触控点，WHEN 应用收到 `NOTIFICATION_APPLICATION_FOCUS_OUT`，THEN `move_direction = (0,0)`, `shoot_tapped = false`, `shoot_held = false`, `is_aiming = false`, `aim_position` 保留最后有效值（集成测试）

---

## Implementation Notes

*Derived from ADR-0001 and ADR-0010 Implementation Guidelines:*

- `_ready()` 中连接 `GameStateMachine.state_changed` signal → `_on_state_changed(old_state, new_state)`
- `_on_state_changed()`:
  - PLAYING → 恢复输入处理
  - PAUSED / DEAD → 立即清除所有活跃触控点状态（模拟所有手指抬起），重置输出信号到默认值
  - MAIN_MENU → 输入事件透传，不处理为游戏输入
- `_notification(NOTIFICATION_APPLICATION_FOCUS_OUT)`:
  - 清除所有活跃触控点（引擎会自动发送 released 事件，但主动重置确保一致性）
  - move_direction = Vector2.ZERO, shoot_tapped = false, shoot_held = false, is_aiming = false
  - aim_position 保留最后有效值（恢复前台时瞄准点不变）
- 恢复前台时（`NOTIFICATION_APPLICATION_FOCUS_IN`）：不做任何动作——等待用户重新触摸屏幕

---

## Out of Scope

- Game State Machine 本身的实现——这是另一个 Epic
- MAIN_MENU 状态下 UI 层的具体消费行为

---

## QA Test Cases

### AC8: PAUSED 状态抑制
- Given: 游戏处于 PLAYING 状态；左区有活跃触控点驱动 move_direction 非零；右区 shoot_held=true
- When: GameStateMachine 发射 `state_changed("PLAYING", "PAUSED")`
- Then: 下一帧 `move_direction == Vector2.ZERO`, `shoot_held == false`, `is_aiming == false`；aim_position 保留暂停前最后值

### AC8 变体: DEAD 状态抑制
- Given: 游戏处于 PLAYING 状态；左区有活跃触控点驱动 move_direction 非零；右区 shoot_held=true
- When: GameStateMachine 发射 `state_changed("PLAYING", "DEAD")`
- Then: 下一帧 `move_direction == Vector2.ZERO`, `shoot_held == false`, `is_aiming == false`；aim_position 保留最后值

### AC8 变体: PAUSED → PLAYING 恢复后不自动恢复输入
- Given: 游戏刚从 PAUSED 恢复到 PLAYING
- When: 无任何新触控输入
- Then: 所有信号保持默认值（move_direction=Vector2.ZERO, shoot_held=false 等）；需用户重新触摸才产生信号

### AC8 Edge: 连续多次暂停/恢复
- Given: 状态从 PLAYING → PAUSED → PLAYING → PAUSED（连续切换）
- When: 每次进入 PAUSED
- Then: 每次都正确抑制所有输出信号；aim_position 保留切换前最后有效值

### AC8 Edge: 状态切换同帧触控抬起 → 无残留 shoot_tapped
- Given: 右区有活跃触控点；GameStateMachine 即将切换状态
- When: 状态切换与触控抬起发生在同一帧
- Then: 不产生 shoot_tapped 脉冲残留（切换后 shoot_tapped == false）

### AC8 Edge: IDLE 状态下切换无副作用
- Given: 无活跃触控点（IDLE 状态）
- When: GameStateMachine 发射任意状态切换
- Then: 所有信号保持默认值，无异常

### AC11: 失去焦点重置
- Given: 左区 touch[0] 驱动 move_direction=(1,0)，右区 touch[1] 驱动 shoot_held=true, is_aiming=true
- When: 系统发送 `NOTIFICATION_APPLICATION_FOCUS_OUT`（如来电/通知）
- Then: `move_direction == Vector2.ZERO`, `shoot_tapped == false`, `shoot_held == false`, `is_aiming == false`；`aim_position` 保留最后有效值

### AC11 Edge: 失去焦点前有 shoot_tapped 脉冲
- Given: 失去焦点前一帧恰好触发 shoot_tapped=true
- When: `NOTIFICATION_APPLICATION_FOCUS_OUT` 到达
- Then: shoot_tapped 立即复位为 false；恢复焦点后无残留脉冲

### AC11 Edge: 恢复焦点后无自动输入
- Given: 焦点恢复（`NOTIFICATION_APPLICATION_FOCUS_IN`）
- When: 无任何触控操作
- Then: 所有输出信号保持默认值；aim_position 保留失去焦点前最后有效值；等待新触控

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: `tests/integration/touch-input/state_integration_test.gd` — must exist and pass

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 004 — 需要多点触控逻辑先完成；Game State Machine Epic 的实现
- Unlocks: Story 006
