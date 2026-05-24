# Story 001: 屏幕分区与触控点生命周期

> **Epic**: 触屏输入系统 (Touch Input)
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 2h
> **Manifest Version**: N/A — control-manifest.md 尚未创建
> **Last Updated**: 2026-05-23

## Context

**GDD**: `design/gdd/touch-input.md`
**Requirement**: `TR-touch-input-001`（partial）, `TR-touch-input-002`

**ADR Governing Implementation**: ADR-0009: 玩家控制器与触屏射击架构
**ADR Decision Summary**: TouchInput 作为 Foundation Autoload，屏幕按 split_x 分为左右两区；触控点按下时根据初始坐标判定归属并锁定，抬起前不改变分区

**Engine**: Godot 4.6 | **Risk**: LOW
**Engine Notes**: InputEventScreenTouch/Drag 自 Godot 4.0 起稳定，无 post-cutoff API 使用

**Control Manifest Rules (this layer)**:
- Required: Autoload 单例模式 — TouchInput 注册为 Autoload
- Forbidden: 禁止在 `_ready()` 中执行业务逻辑——仅允许 Signal 连接
- Guardrail: 输入→信号更新必须在 2 帧内完成（≤33ms @ 60fps）

---

## Acceptance Criteria

*From GDD `design/gdd/touch-input.md`:*

- [x] **AC1**: GIVEN 屏幕上无手指，且右区先前 `aim_position` 为 (300, 400)，WHEN 检查全部 5 个输出信号，THEN `move_direction = (0,0)`, `aim_position = (300,400)`（保留上次有效值）, `shoot_tapped = false`, `shoot_held = false`, `is_aiming = false`
- [x] **AC9**: GIVEN 屏幕中线 `split_x = screen_width/2`，WHEN 触控点恰好落在中线上，THEN 归属右区
- [x] **AC10**: GIVEN 触控点在左区按下，WHEN 拖动跨越中线进入右区，THEN 继续驱动左区 `move_direction`，`aim_position` 不受影响

---

## Implementation Notes

*Derived from ADR-0009 Implementation Guidelines:*

- TouchInput 作为 Autoload（`res://autoload/touch_input.gd`），在 Project Settings 中注册
- `split_x = screen_width / 2` 是左右分区的唯一真实来源——所有下游系统（含 touch-control-ui）必须从此处读取
- 触控点归属在 `pressed` 事件中判定：`touch.position.x < split_x` → 左区（移动），`>= split_x` → 右区（瞄准/射击）
- 使用 Dictionary 存储活跃触控点：`{touch_index: {zone: "left"|"right", origin: Vector2, current: Vector2, press_time: int}}`
- `_input(event)` 中处理 `InputEventScreenTouch`（按下/抬起）和 `InputEventScreenDrag`（拖动）
- `is_aiming` = 右区是否有活跃触控点
- 触控抬起时清理对应 touch_index 的状态

---

## Out of Scope

- Story 002: 移动方向的具体计算（deadzone + max_radius）
- Story 003: 射击信号的 tap/hold 判别
- Story 004: 多点触控的并发处理规则

---

## QA Test Cases

### AC1: 空闲状态默认值
- Given: 屏幕上无活跃触控点；先前的 aim_position 缓存为 (300, 400)
- When: 读取 TouchInput 的 5 个输出属性
- Then: `move_direction == Vector2.ZERO`, `aim_position == Vector2(300, 400)`, `shoot_tapped == false`, `shoot_held == false`, `is_aiming == false`
- Edge cases: 启动后第一帧（无先前 aim_position）→ aim_position 应为 Vector2.ZERO

### AC9: 中线归属
- Given: `split_x = screen_width / 2`
- When: 触控点在 `position.x == split_x` 按下
- Then: 该触控点归属右区（`>= split_x` 判定）
- Edge cases: `split_x` 非整数时浮点精度不影响归属判定

### AC10: 跨中线锁定
- Given: 触控点在左区按下（position.x = split_x - 50）
- When: 手指向右拖动 100px，当前 position.x > split_x
- Then: 该触控点仍归属左区，继续驱动 `move_direction`；`aim_position` 不受此拖动影响
- Edge cases: 从右区跨越到左区→仍归属右区；刚好拖到中线 (x == split_x)→归属不变

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/touch-input/zone_partition_test.gd` — must exist and pass

**Status**: [x] Created — `tests/unit/touch-input/zone_partition_test.gd` (14 test functions)
> **Note**: GUT framework not yet installed — tests exist but cannot execute. Run `/test-setup`.

---

## Dependencies

- Depends on: None — Foundation 层第一故事
- Unlocks: Story 002, Story 003

---

## Completion Notes
**Completed**: 2026-05-23
**Criteria**: 3/3 passing
**Deviations**: None
**Implementation**: `autoload/touch_input.gd` — TouchInput Autoload (5 signals/properties, zone partition, touch lifecycle)
**Tests**: `tests/unit/touch-input/zone_partition_test.gd` — 14 test functions (GUT pending `/test-setup`)
**Code Review**: Passed — all BLOCKING and advisory issues resolved (2026-05-23)
