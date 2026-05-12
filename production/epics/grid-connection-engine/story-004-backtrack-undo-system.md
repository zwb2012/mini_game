# Story 004: 路径回溯与撤销系统

> **Epic**: 网格连线引擎
> **Status**: Done
> **Layer**: Core
> **Type**: Logic
> **Manifest Version**: 2026-05-11

## Context

**GDD**: `design/gdd/grid-connection-engine.md`
**Requirement**: `TR-GCE-004`, `TR-GCE-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-002: 网格渲染策略
**ADR Decision Summary**: 回溯为数据层操作——修改 Cell 状态 + path.pop() + 标记脏。撤销接口为 Pull（canUndo）+ 方法调用（undo）。渲染层在脏重绘时反映变化。

**Engine**: Cocos Creator 3.8.8 | **Risk**: MEDIUM-HIGH
**Engine Notes**: 撤销接口纯 TypeScript 实现，无引擎依赖。

**Control Manifest Rules (this layer)**:
- Required: 撤销接口 Pull 模式——`engine.canUndo(): boolean`（HUD 每帧查询）；引擎事件通过 subscribe 暴露
- Forbidden: 禁止引擎直接监听 Cocos 触摸事件
- Guardrail: undo() 执行 <1ms

---

## Acceptance Criteria

*From GDD `design/gdd/grid-connection-engine.md`, scoped to this story:*

- [ ] **AC-1**: GIVEN 玩家从 (1,0) 开始绘制并滑过 (1,1)→(1,2)，WHEN 手指滑回 (1,1)，THEN (1,1) 被撤销填充（filled=false, ownerNumber=null），stepCount 减少，path 移除该格
- [ ] **AC-2**: GIVEN 玩家当前路径为 [(1,0),(1,1)]，WHEN 手指滑回 (1,0)（回溯到起点——路径完全回退），THEN 所有格恢复未填充，currentNumber 保持不变，状态变为 Idle
- [ ] **AC-3**: GIVEN 1→2 段路径已锁定（触达 nodeNumber=2 后），WHEN 手指滑入 1→2 段的已锁定格子，THEN 触摸被忽略——已锁定路径不可修改
- [ ] **AC-4**: GIVEN 引擎当前路径为空（path=[]），WHEN 调用 `engine.undo()`，THEN 无操作，不抛异常
- [ ] **AC-5**: GIVEN 引擎当前路径非空（至少 1 格），WHEN 调用 `engine.undo()`，THEN 移除 path 最后一格（filled=false, ownerNumber=null, stepCount--），若该格为数字节点则 currentNumber 回退
- [ ] **AC-6**: GIVEN 引擎状态为 Idle 或 path=[]，WHEN HUD 调用 `engine.canUndo()`，THEN 返回 false
- [ ] **AC-7**: GIVEN 引擎状态为 Drawing 或 Dirty 且路径非空，WHEN HUD 调用 `engine.canUndo()`，THEN 返回 true

---

## Implementation Notes

*Derived from GDD 规则 4 + ADR-002:*

**路径回溯（滑入已填充格）**——GDD 规则 4：
```
INPUT_MOVE(row, col) 且 Cell.filled === true：
1. 检查该格是否等于 path[path.length - 1]（当前路径末尾）：
   - 是 → 执行撤销步骤：
     a. Cell.filled = false, Cell.ownerNumber = null
     b. path.pop()
     c. stepCount--，Push subscribe('stepChange', -1)
     d. 触发 audioManager.play('TICK', {pitchOffset: -12})（低音撤回反馈）
     e. 若该格 isNode && nodeNumber === currentNumber：
        currentNumber = nodeNumber - 1（回退到上一个数字）
     f. 标记 renderDirty = true
   - 否 → 检查该格是否属于已锁定路径（path 中在锁定段之前）：
     - 是 → 忽略——不可修改已锁定段
     - 否 → 属于当前路径非末尾格（不应发生）→ 忽略
```

**撤销接口（GDD 规则 6 + ADR-003 Pull 模式）**：

```typescript
/** 撤销当前路径最后一步。供 HUD 撤销按钮调用。 */
undo(): void {
  if (this._path.length === 0) return;
  // 同路径回溯逻辑——移除最后一格
  const last = this._path[this._path.length - 1];
  this._grid[last.row][last.col].filled = false;
  this._grid[last.row][last.col].ownerNumber = null;
  this._path.pop();
  this._stepCount--;
  this._notify('stepChange', -1);
  this._audio.play('TICK', { pitchOffset: -12 });
  if (last.isNode) {
    this._currentNumber = last.nodeNumber - 1;
  }
  this._renderDirty = true;
}

/** 查询是否可撤销。供 HUD 按钮状态控制。 */
canUndo(): boolean {
  return this._path.length > 0 && this._state !== EngineState.Idle;
}
```

**状态机行为**：
- 回溯到路径完全为空时：状态从 Drawing → Idle
- 撤销（undo()）不改变状态——Dirty 状态保持 Dirty
- 已锁定段（lockedSegments: Set<number>）存储 path 中已锁定的索引范围

**步数计数**：撤销也触发 `subscribe('stepChange', -1)`——评分系统接收负增量，HUD 反映正确步数。

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: 前向路径追踪逻辑（仅依赖其 path 结构和填充逻辑）
- Story 003: Bresenham 插值中的回溯（插值中间格恰好在 path 末尾 → 复用本 story 回溯逻辑）
- Story 005: 通关检测（撤销后 allCellsFilled 从 true 变 false 的情况）
- Story 006: 撤销动画（格子恢复空白的瞬间视觉效果）

---

## QA Test Cases

- **AC-1**: 滑入当前路径末格 = 撤销
  - Given: path=[(1,0),(1,1),(1,2)]，currentNumber=1，(1,1) 不是节点
  - When: `engine.handleInputMove(1, 1)`（手指滑回上一格）
  - Then: (1,1) filled=false, ownerNumber=null, stepCount--, path=[(1,0),(1,2)]
  - Edge cases: 滑回格是当前路径倒数第 3 格（非末格）——应忽略

- **AC-2**: 回溯到起点（路径完全回退）
  - Given: path=[(1,0),(1,1)]，(1,0) 是 nodeNumber=1
  - When: `engine.handleInputMove(1, 0)`
  - Then: 所有格恢复未填充，currentNumber 保持 1 或重置为 undefined（待设计决策），状态变为 Idle
  - Edge cases: nodeNumber=1 被撤销后 currentNumber 回退到 undefined 还是保持 1？——GDD 规定"currentNumber 保持不变"

- **AC-3**: 已锁定路径不可修改
  - Given: path 已锁定 1→2 段（索引 0..4），当前在 2→3 段
  - When: `engine.handleInputMove(locked_cell_row, locked_cell_col)`（触摸到索引 0..4 的任一格）
  - Then: 忽略——格子保持已填充，path 不变
  - Edge cases: 锁定段和当前段在 path 中的分界——末格必须精确判断

- **AC-4**: 空路径 undo() 无操作
  - Given: path=[]，状态为 Idle
  - When: `engine.undo()`
  - Then: 无操作，不抛异常，canUndo()=false
  - Edge cases: 连续多次调用 undo()——每次都无操作

- **AC-5**: undo() 正常撤销
  - Given: path=[(1,0),(1,1)], (1,1) 非节点，stepCount=2
  - When: `engine.undo()`
  - Then: (1,1) 恢复未填充，path=[(1,0)]，stepCount=1
  - Edge cases: 撤销的是节点格（nodeNumber=N）——currentNumber 回退到 N-1

- **AC-6**: Idle 态 canUndo()=false
  - Given: 引擎状态为 Idle，path=[]
  - When: `engine.canUndo()`
  - Then: false
  - Edge cases: 状态为 Drawing 但 path 非空——canUndo()=true

- **AC-7**: Dirty/Drawing 态 canUndo()=true
  - Given: 引擎状态为 Dirty，path 非空
  - When: `engine.canUndo()`
  - Then: true
  - Edge cases: 在通关检测临界点——path 可能已清空或即将关空

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/grid-connection-engine/backtrack_undo_test.ts` — must exist and pass
**Status**: [x] Complete — 25 tests, all 7 AC covered

---

## Dependencies

- Depends on: Story 002（路径追踪——path 结构和填充逻辑），Story 003（Bresenham——插值路径中回溯判断）
- Unlocks: Story 005（通关检测——撤销可能影响 allCellsFilled 状态）
