# Story 003: 瞄准与射击信号生成

> **Epic**: 触屏输入系统 (Touch Input)
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 3h
> **Manifest Version**: N/A — control-manifest.md 尚未创建
> **Last Updated**: 2026-05-23
> **Status**: In Progress

## Context

**GDD**: `design/gdd/touch-input.md`
**Requirement**: `TR-touch-input-001`（partial）, `TR-touch-input-004`

**ADR Governing Implementation**: ADR-0009: 玩家控制器与触屏射击架构
**ADR Decision Summary**: shoot_tapped 是单帧脉冲 signal（非 poll 属性），shoot_held 是持续布尔状态；tap vs hold 以 tap_threshold(200ms) + 位移 < deadzone 为界；aim_position 随右区手指位置持续更新

**Engine**: Godot 4.6 | **Risk**: LOW
**Engine Notes**: InputEventScreenTouch.pressed/released + Time.get_ticks_msec() 用于按下时长计算

**Control Manifest Rules (this layer)**:
- Required: shoot_tapped 必须用 signal emit（单帧脉冲）——不可仅设为属性 poll
- Forbidden: 禁止在 `_process` 中仅 poll shoot_tapped——会因帧序丢失点击事件
- Guardrail: 点击→shoot_tapped 发射 ≤ 1 帧（16ms）

---

## Acceptance Criteria

*From GDD `design/gdd/touch-input.md`:*

- [ ] **AC4**: GIVEN `tap_threshold = 200`，WHEN 右区手指在 150ms 内按下并抬起且位移 < deadzone，THEN `shoot_tapped = true` 在抬起帧，下一帧复位为 false
- [ ] **AC5**: GIVEN `tap_threshold = 200`，WHEN 右区手指按住 300ms，THEN 自按下后 200ms 起每帧 `shoot_held = true`，抬起帧变为 false
- [ ] **AC13**: GIVEN 右区手指按住并拖动（`hold_distance > deadzone`），WHEN 检查信号，THEN `shoot_held = true` 且 `aim_position` 随手指位置持续更新

---

## Implementation Notes

*Derived from ADR-0009 Implementation Guidelines:*

- **shoot_tapped**: 单帧脉冲 signal。在触控抬起时判定：如果 `hold_duration < tap_threshold` 且 `hold_distance < deadzone` → `emit shoot_tapped`（下一帧 `shoot_tapped` 属性复位为 false）
- **shoot_held**: 布尔状态。在触控按下后 `tap_threshold` 毫秒开始，每帧设为 true，直到抬起帧变为 false
- **aim_position**: 右区活跃触控点的当前屏幕坐标。按住拖动时持续更新
- 计时使用 `Time.get_ticks_msec()`——从 `press_time`（按下时记录）到 `release_time`（抬起时记录）
- `hold_distance = (release_pos - press_pos).length()`
- 极快速点击（< 30ms）正常识别为 tap——不做最小时长过滤

---

## Out of Scope

- Story 001: 屏幕分区——右区的归属判定
- Story 004: 多点触控——右区第 2 指的忽略规则
- Story 005: 游戏状态——paused 时信号抑制

---

## QA Test Cases

### AC4: 快速点击 → shoot_tapped 脉冲
- Given: `tap_threshold = 200`, `deadzone = 20`
- When: 右区手指按下并抬起，持续 150ms，位移 5px
- Then: 抬起帧 `shoot_tapped == true`；下一帧 `shoot_tapped == false`
- Edge cases: 位移 ≥ deadzone 但时长 < tap_threshold → shoot_tapped 不触发（移动手指不算 tap）；时长 ≥ tap_threshold 但位移 < deadzone → shoot_held 在 200ms 后开始（非 tap）

### AC5: 按住 → shoot_held 持续
- Given: `tap_threshold = 200`
- When: 右区手指按下后持续 300ms 未抬起
- Then: 自 200ms 时刻起，每帧 `shoot_held == true`；抬起帧 `shoot_held == false`
- Edge cases: 恰好 200ms 时抬起 → shoot_tapped 不触发（`hold_duration >= tap_threshold`），shoot_held 也不触发（在 200ms 时抬起前未进入 hold 状态）

### AC13: 按住拖动 → shoot_held + aim_position 更新
- Given: 右区手指按住，shoot_held 已为 true，aim_position 为 (500, 300)
- When: 手指拖动到 (600, 400)（hold_distance > deadzone）
- Then: `shoot_held` 保持 true；`aim_position` 更新为 (600, 400)
- Edge cases: 拖动中位移极小（< deadzone）→ shoot_held 保持，aim_position 微调

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/touch-input/aim_shoot_signal_test.gd` — must exist and pass

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001 — 需要右区触控归属判定
- Unlocks: Story 004
