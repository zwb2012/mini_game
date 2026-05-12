# Story 003: Bresenham 跳格插值

> **Epic**: 网格连线引擎
> **Status**: Done
> **Layer**: Core
> **Type**: Logic
> **Estimate**: S (2-4 hrs)
> **Manifest Version**: 2026-05-11

## Context

**GDD**: `design/gdd/grid-connection-engine.md`
**Requirement**: `TR-GCE-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-002: 网格渲染策略
**ADR Decision Summary**: Bresenham 插值在引擎侧实现（非输入管理器）——输入管线只透传事件，快速滑动跳格由引擎在 `INPUT_MOVE` 处理时填充中间格子。

**Engine**: Cocos Creator 3.8.8 | **Risk**: MEDIUM-HIGH
**Engine Notes**: 插值为纯数学算法，不依赖任何引擎 API。需在 3×3 到 10×10 全尺寸验证插值覆盖完整性。

**Control Manifest Rules (this layer)**:
- Required: Bresenham 插值由引擎实现（非输入管理器）
- Forbidden: 无
- Guardrail: 插值计算 <0.1ms（纯整数运算）

---

## Acceptance Criteria

*From GDD `design/gdd/grid-connection-engine.md`, scoped to this story:*

- [ ] **AC-1**: GIVEN 手指快速从 (0,0) 滑到 (0,3)（单帧跳过中间 3 格），WHEN 该帧处理完成，THEN 跳过的所有格子 (0,1), (0,2), (0,3) 均被填充（Bresenham 插值填充中间格）
- [ ] **AC-2**: GIVEN 手指从 (0,0) 斜向快速滑到 (2,2)（跳过 (1,1)），WHEN 该帧处理完成，THEN 中间格 (1,1) 被填充
- [ ] **AC-3**: GIVEN 插值路径中遇到障碍格，WHEN Bresenham 穿过的格子是障碍格，THEN 障碍格被跳过（不填充），但后续非障碍格正常填充
- [ ] **AC-4**: GIVEN 插值路径中遇到已填充格（属于当前路径段），WHEN 穿过的格子已填充，THEN 不触发重复填充，继续下一格
- [ ] **AC-5**: GIVEN 相邻格移动（delta row≤1 且 delta col≤1），WHEN 手指从一格滑到相邻格，THEN Bresenham 无中间格需填充——直接填充目标格
- [ ] **AC-6**: GIVEN 3×3 到 10×10 各尺寸网格，WHEN 所有可能方向快速滑动，THEN 插值从不遗漏格子（数据驱动验证——全尺寸全方向自动测试覆盖）

---

## Implementation Notes

*Derived from ADR-002 / ADR-005 责任边界:*

**算法选择**：标准 Bresenham 直线算法（整数运算，零浮点误差）。

```typescript
/**
 * 计算从 (r0,c0) 到 (r1,c1) 之间的所有网格坐标（含起止点）
 * 使用 Bresenham 直线算法——纯整数运算
 */
function bresenhamPath(r0: number, c0: number, r1: number, c1: number): GridCoord[] {
  // 标准 Bresenham 实现
  // 返回 [起点, 中间格..., 终点]
}
```

**集成方式**：
- 在 `handleInputMove(row, col)` 入口，检查上一次有效坐标 `lastCoord`
- 若 `lastCoord` 存在且 `|row - lastCoord.row| > 1 || |col - lastCoord.col| > 1`：
  - 调用 `bresenhamPath(lastCoord.row, lastCoord.col, row, col)`
  - 对插值路径中的每一格（不含已在 path 中的格子）依次执行路径追踪逻辑（Story 002）
- `lastCoord` 始终更新为本帧最终的 (row, col)

**步数计数**：每个插值填充的格也触发 `stepCount++` 和 `subscribe('stepChange', +1)`。

**音频**：每个插值填充的格触发 `audioManager.play('TICK')`——但需通过音频管理器的同帧防抖机制（ADR-010）。

**性能约束**：最坏情况——10×10 网格对角线滑动（~14 格插值），纯整数 Bresenham <0.05ms。

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: 单格填充逻辑（本 story 调用之）
- Story 004: 插值路径中的回溯判断（若中间格恰好在 path 末尾 → 回溯）
- Story 006: 插值路径的渲染（脏标记触发即可——无需逐格渲染）

---

## QA Test Cases

- **AC-1**: 水平快速滑动 4 格
  - Given: 4×4 网格，currentNumber=1，path 仅含 (0,0)，lastCoord=(0,0)
  - When: `engine.handleInputMove(0, 3)`（跳 3 格）
  - Then: (0,0)→(0,1)→(0,2)→(0,3) 全部填充，stepCount+=3
  - Edge cases: 重复滑回同一 row 不同 col——插值方向正确；反向滑回——回溯逻辑见 Story 004

- **AC-2**: 斜向快速滑动
  - Given: 4×4 网格，currentNumber=1，path 仅含 (0,0)，lastCoord=(0,0)
  - When: `engine.handleInputMove(2, 2)`（跳 (1,1)）
  - Then: (0,0)→(1,1)→(2,2) 全部填充
  - Edge cases: (0,0)→(3,3) 对角线——最坏情况 14 个中间格

- **AC-3**: 插值路径中含障碍格
  - Given: (0,1) 是障碍格，currentNumber=1，path 仅含 (0,0)
  - When: `engine.handleInputMove(0, 2)`
  - Then: (0,1) 保持障碍格状态（不填充），(0,2) 正常填充
  - Edge cases: 插值路径全部为障碍格——最后一个非障碍格才被填充

- **AC-4**: 插值路径中含已填充格
  - Given: (0,1) 已填充（属于当前路径），path=[(0,0),(0,1)]，lastCoord=(0,1)
  - When: `engine.handleInputMove(0, 3)`（跳 (0,2)）
  - Then: (0,2)→(0,3) 填充，(0,1) 不变（跳过已填充）
  - Edge cases: 已填充格不属于当前路径段（已锁定段）——见 Story 004

- **AC-5**: 相邻格移动（无跳格）
  - Given: lastCoord=(0,0)
  - When: `engine.handleInputMove(0, 1)`
  - Then: Bresenham 返回 [(0,0),(0,1)]——仅填充 (0,1)（(0,0) 已在 path 中）
  - Edge cases: 对角线相邻 (0,0)→(1,1)——Bresenham 可能插值也可能不插值（取决于实现选择），但至少不遗漏

- **AC-6**: 全尺寸验证
  - Given: 3×3、5×5、7×7、10×10 网格
  - When: 每个尺寸测试 4 个方向 + 4 条对角线的远距离滑动
  - Then: 所有测试中插值路径完整——无空格遗漏
  - Edge cases: 边界滑动 (0,0)→(0,9) 在 10×10 网格中——9 格全填充

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/grid-connection-engine/bresenham.test.ts` — exists and passes
**Status**: [x] Complete — 36 tests (19 纯函数 + 17 集成), all AC covered

---

## Dependencies

- Depends on: Story 002（路径追踪核心逻辑——Bresenham 调用 handleInputMove 逐格填充）
- Unlocks: Story 004（路径回溯——插值路径中的撤销判断）
