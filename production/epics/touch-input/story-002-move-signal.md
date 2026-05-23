# Story 002: 移动信号生成

> **Epic**: 触屏输入系统 (Touch Input)
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 2h
> **Manifest Version**: N/A — control-manifest.md 尚未创建
> **Last Updated**: 2026-05-23

## Context

**GDD**: `design/gdd/touch-input.md`
**Requirement**: `TR-touch-input-005`

**ADR Governing Implementation**: ADR-0009: 玩家控制器与触屏射击架构
**ADR Decision Summary**: 左区触控拖动产生 move_direction——raw_offset / offset_length × clamp(offset_length / max_radius, 0, 1)；offset_length < deadzone 时输出 Vector2.ZERO

**Engine**: Godot 4.6 | **Risk**: LOW
**Engine Notes**: 无 post-cutoff API。Vector2 数学运算纯 GDScript。

**Control Manifest Rules (this layer)**:
- Required: 移动信号在 `_input` / `_process` 中更新——不得延迟超过 2 帧
- Forbidden: 禁止硬编码 deadzone / max_radius——必须从配置文件读取
- Guardrail: 移动信号计算 < 0.001ms（纯向量运算）

---

## Acceptance Criteria

*From GDD `design/gdd/touch-input.md`:*

- [ ] **AC2**: GIVEN `max_radius = 200`, `deadzone = 20`，WHEN 左区手指从原点向右拖动恰好 100px，THEN `move_direction.x = 0.5`, `move_direction.length() = 0.5`
- [ ] **AC3**: GIVEN `deadzone = 20`，WHEN 左区手指距原点 5px，THEN `move_direction = (0,0)`
- [ ] **AC4**: GIVEN `max_radius = 200`，WHEN 左区手指偏移 300px（超出 max_radius），THEN `move_direction.length() = 1.0`（方向保持，长度被 clamp 到上限）
- [ ] **AC5**: GIVEN 左区触控处于活跃拖动中，WHEN 手指抬起（released），THEN `move_direction = (0,0)`

---

## Implementation Notes

*Derived from ADR-0009 Implementation Guidelines:*

- 移动原点（`origin_pos`）在左区触控按下时记录——为手指初始落点的屏幕坐标
- `raw_offset = current_touch_pos - origin_pos`（每帧更新）
- 死区判定: `offset_length = raw_offset.length()`；若 `offset_length < deadzone` → `move_direction = Vector2.ZERO`
- 正常输出: `move_direction = (raw_offset / offset_length) × clamp(offset_length / max_radius, 0, 1)`
- 方向向量长度 0~1——0 = 静止，1 = 满速。超出 max_radius 的偏移被 clamp 到 1
- 触控抬起时 `move_direction` 归零
- 死区原点不因屏幕边缘而偏移——手指在屏幕最边缘按下时可向内拖动

---

## Out of Scope

- Story 001: 屏幕分区——左区/右区的归属判定
- Story 004: 多点触控——左区第 2 个触控点的忽略规则

---

## QA Test Cases

### AC2: 移动方向值计算
- Given: `max_radius = 200`, `deadzone = 20`；左区触控按下于 (100, 200) 作为原点
- When: 手指拖动到 (200, 200)（纯右移 100px）
- Then: `move_direction.x` 精确等于 0.5（100/200），`move_direction.y` 为 0，`move_direction.length()` 为 0.5
- Edge cases: 偏移超过 max_radius（如 300px）→ length 被 clamp 到 1.0；偏移方向非轴向（如 45° 斜向 100px）→ x 和 y 分量均为 0.5/√2 ≈ 0.354

### AC3: 死区行为
- Given: `deadzone = 20`；左区触控按下于 (100, 200)
- When: 手指拖动到 (105, 200)（仅偏移 5px）
- Then: `move_direction == Vector2.ZERO`
- Edge cases: 偏移恰好等于 deadzone (20px) → `offset_length > deadzone` 条件为 false（不触发），输出 zero；偏移 20.001px → 触发移动

### AC4: Clamp 上限
- Given: `max_radius = 200`, `deadzone = 20`；左区触控按下于 (100, 200)
- When: 手指拖动到 (400, 200)（纯右移 300px，超出 max_radius）
- Then: `move_direction.x` 精确等于 1.0，`move_direction.y` 为 0，`move_direction.length()` 为 1.0
- Edge cases: 任意方向超 max_radius → 方向向量保持，长度 clamp 到 1.0；斜向超 max_radius（如偏移 250px 45° 方向）→ length=1.0，x 和 y 分量保持原方向比例

### AC5: 抬起归零
- Given: 左区触控活跃拖动中，`move_direction` 为非零值
- When: 手指抬起（touch released）
- Then: `move_direction == Vector2.ZERO`
- Edge cases: 抬起后无其他左区触控 → move_direction 保持 zero 直到新的左区 touch pressed；多点触控场景（Story 004 覆盖）→ 仅当左区无活跃触控点时才归零

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/touch-input/move_signal_test.gd` — must exist and pass

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001 — 需要左区触控归属判定
- Unlocks: Story 004

## Completion Notes
**Completed**: 2026-05-23
**Criteria**: 4/4 passing
**Deviations**: ADVISORY — deadzone 使用 `<=`（含边界），ADR-0009 原文为 `<`。基于玩家体验的设计修正。
**Test Evidence**: `tests/unit/touch-input/move_signal_test.gd` — 7 test functions, 15 assertions
**Code Review**: Complete — APPROVED (with deadzone boundary fix)
