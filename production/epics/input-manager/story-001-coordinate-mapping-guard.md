# Story 001: 坐标映射与输入守卫

> **Epic**: 输入管理器
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Manifest Version**: 2026-05-11
> **Estimate**: S (2-3h — 纯 TS 数学映射 + 守卫逻辑)

## Context

**GDD**: `design/gdd/input-manager.md`
**Requirement**: `TR-IM-001`, `TR-IM-002`, `TR-IM-003`

**ADR Governing Implementation**: ADR-005: 触控输入管线——延迟预算与坐标映射
**ADR Decision Summary**: 4-step pipeline——coordinate mapping → dead zone filter → state guard → publish. 每步为纯函数，可脱离 Cocos 单元测试。

**Engine**: Cocos Creator 3.8.8 | **Risk**: LOW (纯 TS 数学运算)
**Engine Notes**: 坐标映射和死区检测是纯数学，不依赖任何 Cocos API。

**Control Manifest Rules (this layer)**:
- Required: 输入管线模式——触摸事件按序流经 4 个独立处理步骤
- Required: 滑动阈值 4px + 多点触摸忽略 + 越界丢弃
- Required: 订阅者遍历使用 .slice() 快照

---

## Acceptance Criteria

*From GDD `design/gdd/input-manager.md`, scoped to this story:*

- [ ] **AC-1**: GIVEN 手指在网格坐标 (row=2, col=3)，WHEN 坐标映射，THEN gridRow=2, gridCol=3
- [ ] **AC-2**: GIVEN 手指滑出网格边界 (row < 0)，WHEN 坐标映射，THEN 返回 null（越界丢弃）
- [ ] **AC-3**: GIVEN 手指微动 2px（低于 4px 阈值），WHEN 死区检测，THEN 不通过（忽略）
- [ ] **AC-4**: GIVEN 手指移动 5px（超过阈值），WHEN 死区检测，THEN 通过（发出事件）
- [ ] **AC-5**: GIVEN 状态为 Playing，WHEN 收到输入，THEN 守卫通过
- [ ] **AC-6**: GIVEN 状态为 Paused，WHEN 收到输入，THEN 守卫拒绝

---

## Implementation Notes

*Derived from ADR-005:*

1. 坐标映射纯函数：
   ```typescript
   function screenToGrid(touchX: number, touchY: number, originX: number, originY: number, cellSize: number, rows: number, cols: number): {row: number, col: number} | null {
     const col = Math.floor((touchX - originX) / cellSize);
     const row = Math.floor((touchY - originY) / cellSize);
     if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
     return { row, col };
   }
   ```
2. 死区检测：跟踪上一次有效坐标 `_lastX, _lastY`，`Math.hypot(dx, dy) >= 4` 时通过
3. 状态守卫：`getState() === GameState.Playing` 时通过
4. InputEvent 类型定义
5. 全部为纯函数/简单类方法——零 Cocos API 依赖，可直接单元测试

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: Cocos 触摸事件绑定、Node.on(TOUCH_*)、多点触摸处理

---

## QA Test Cases

### AC-1: Coordinate mapping
- Given: cellSize=72, originX=8, originY=8, rows=6, cols=6
- When: touch at (152, 80) — col = floor((152-8)/72) = 2, row = floor((80-8)/72) = 1
- Then: mapping returns {row: 1, col: 2}
- Edge cases: touch exactly on grid line → floor 行为

### AC-2: Out of bounds
- Given: same grid params
- When: touch at (0, 0) — row=-1 (out of bounds since rows=6, row is -1 < 0)
- Then: mapping returns null
- Edge cases: touch exactly on last cell's bottom-right edge → should be in bounds

### AC-3: Below dead zone
- Given: lastX=100, lastY=100
- When: new touch at (101, 102) — dx=1, dy=2, dist=2.24 < 4
- Then: dead zone reject

### AC-4: Above dead zone
- Given: lastX=100, lastY=100
- When: new touch at (104, 100) — dx=4, dy=0, dist=4
- Then: dead zone pass

### AC-5: State guard pass (Playing)
- Given: state machine returns Playing
- When: check guard
- Then: pass

### AC-6: State guard reject (Paused)
- Given: state machine returns Paused
- When: check guard
- Then: reject

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/input-manager/coordinate_mapping.test.ts` — must exist and pass
**Status**: [x] Complete — 19 tests, all 6 ACs covered

---

## Dependencies

- Depends on: None (纯逻辑)
- Unlocks: Story 002 (集成依赖映射和守卫基础)

---

## Completion Notes
**Completed**: 2026-05-12
**Criteria**: 6/6 通过
**Deviations**: Advisory — 测试证据文件名 `coordinate_mapping.test.ts`（Jest testMatch 要求 `.test.ts` 后缀），story 原始声明为 `_test.ts`；`InputManager.ts` 同时包含 Story 002 的 Cocos 触摸管线代码（子 Story 001 范围但无副作用）
**Test Evidence**: `tests/unit/input-manager/coordinate_mapping.test.ts` — 19 项测试全部通过，覆盖 AC-1 ~ AC-6
**Code Review**: Skipped（lean mode）
