# Story 004: 多点触控并发

> **Epic**: 触屏输入系统 (Touch Input)
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 2h
> **Manifest Version**: N/A — control-manifest.md 尚未创建
> **Last Updated**: 2026-05-24

## Context

**GDD**: `design/gdd/touch-input.md`
**Requirement**: `TR-touch-input-003`

**ADR Governing Implementation**: ADR-0009: 玩家控制器与触屏射击架构
**ADR Decision Summary**: 支持 2 指同时操作（左区 1 指 + 右区 1 指可同时活跃）；同区第 2 指被忽略；MOVE_AND_SHOOT 状态 = 左区活跃 + 右区满足射击条件

**Engine**: Godot 4.6 | **Risk**: LOW
**Engine Notes**: InputEventScreenTouch.index 区分多点触控；仅 MVP 2 指——预留第 3 指接口

**Control Manifest Rules (this layer)**:
- Required: 触控点 Dictionary 按 touch_index 索引，最大活跃数 2
- Forbidden: 禁止同区第 2 指覆盖或影响第 1 指状态
- Guardrail: 2 指并发信号更新不得互相阻塞——<1ms 总处理

---

## Acceptance Criteria

*From GDD `design/gdd/touch-input.md`:*

- [ ] **AC6**: GIVEN 左区手指在位置 L0、右区手指在位置 R0，WHEN 左指移到 L1 且右指移到 R1，THEN `move_direction` 仅由 L0→L1 计算，`aim_position = R1`
- [ ] **AC7**: GIVEN 左区已有 1 个活跃触控点，WHEN 同区出现第 2 个触控点，THEN 第 2 个被忽略，第 1 个继续驱动 `move_direction`
- [ ] **AC12**: GIVEN 左区有活跃手指 + 右区按住满足 `shoot_held` 条件，WHEN 两指各自移动，THEN `move_direction` 更新 + `shoot_held` 保持 true（覆盖 MOVE_AND_SHOOT 状态）

---

## Implementation Notes

*Derived from ADR-0009 Implementation Guidelines:*

- 使用 Dictionary 管理活跃触控点：`_active_touches[touch_index] = {zone, origin, current, press_time}`
- 最大活跃触控点数 = 2（左区 1 + 右区 1）
- 同区第 2 指：检查该区是否已有活跃触控点（遍历 `_active_touches` 检查 zone 值）→ 有则忽略新触控点
- 抬起顺序无关：先抬哪个手指都不影响另一个手指的正常驱动——仅清理对应 touch_index 的状态
- 5 种系统状态管理：IDLE, MOVE_ONLY, AIM_ONLY, MOVE_AND_AIM, MOVE_AND_SHOOT
- 状态判定在每个 `_process` 中根据活跃触控点分布更新
- `_process` 中：遍历活跃触控点 → 左区触控点更新 move_direction，右区触控点更新 aim_position 和射击信号

---

## Out of Scope

- Story 002: 移动信号的具体数学计算
- Story 003: 射击信号的 tap/hold 判别逻辑
- Story 005: 游戏状态集成——paused 时此处所有信号被抑制

---

## QA Test Cases

### AC6: 双指同时独立操作
- Given: 左区 touch[0] 原点 L0=(100,300)，右区 touch[1] 原点 R0=(600,300)
- When: 左指拖到 L1=(200,300)，右指拖到 R1=(700,200)
- Then: `move_direction` 仅由 L0→L1 偏移计算（max_radius 归一化）；`aim_position == (700, 200)`；两个信号互不干扰
- Edge cases: 只有左指移动而右指静止→move_direction 更新，aim_position 保持；反之亦然

### AC7: 同区第 2 指忽略
- Given: 左区已有 touch[0] 活跃，驱动移动信号
- When: 左区出现新的 touch[2] 按下
- Then: touch[2] 被忽略——不注册到 `_active_touches`；touch[0] 继续正常驱动 move_direction；move_direction 不受影响
- Edge cases: 右区第 2 指同理忽略；被忽略的触控点抬起时无任何影响

### AC12: MOVE_AND_SHOOT 状态
- Given: 左区 touch[0] 活跃，右区 touch[1] 按住 ≥ tap_threshold（shoot_held=true）
- When: 两指各自移动
- Then: `move_direction` 随左指更新；`shoot_held` 保持 true；系统处于 MOVE_AND_SHOOT 状态
- Edge cases: 右指抬起→shoot_held=false，状态退化为 MOVE_ONLY；左指抬起→move_direction=zero，退化为 AIM_ONLY

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/touch-input/multitouch_concurrency_test.gd` — must exist and pass

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 002, Story 003 — 需要移动和射击信号各自正常工作
- Unlocks: Story 005
