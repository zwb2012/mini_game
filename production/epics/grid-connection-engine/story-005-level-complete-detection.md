# Story 005: 通关检测与事件发射

> **Epic**: 网格连线引擎
> **Status**: Done
> **Layer**: Core
> **Type**: Integration
> **Manifest Version**: 2026-05-11

## Context

**GDD**: `design/gdd/grid-connection-engine.md`
**Requirement**: `TR-GCE-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-002: 网格渲染策略 / ADR-003: 数据流模式
**ADR Decision Summary**: 通关检测为数据层操作——每步填充后检查 allCellsFilled。LEVEL_COMPLETE 通过 Push 模式（subscribe）发射给状态机和评分系统。事件与状态机 transition(LEVEL_COMPLETE) 并行发出。

**Engine**: Cocos Creator 3.8.8 | **Risk**: MEDIUM-HIGH (ADR-002) / LOW (ADR-003)
**Engine Notes**: 通关检测纯 TypeScript 逻辑——无引擎依赖。Push 事件 subscribe('levelComplete', finalSteps) 同步执行回调。

**Control Manifest Rules (this layer)**:
- Required: 引擎事件通过 subscribe 暴露（`levelComplete`）；Push 回调同步执行，按注册顺序
- Forbidden: 禁止状态机 transition 在引擎回调中触发重新进入（_isTransitioning 守卫——ADR-001）
- Guardrail: allCellsFilled 检查 <0.1ms

---

## Acceptance Criteria

*From GDD `design/gdd/grid-connection-engine.md`, scoped to this story:*

- [ ] **AC-1**: GIVEN 全部非障碍格已填充（allCellsFilled=true），WHEN INPUT_END 触发，THEN LEVEL_COMPLETE 事件发送给状态机（Push——subscribe('levelComplete', finalSteps)）
- [ ] **AC-2**: GIVEN 最后一个非障碍格恰好在 INPUT_END 时被填充（手指抬起时恰好填充），WHEN INPUT_END 处理完成，THEN 通关检测在 INPUT_END 后执行——正常触发 LEVEL_COMPLETE
- [ ] **AC-3**: GIVEN 全部非障碍格已填充，WHEN 引擎检测到 allCellsFilled=true，THEN 引擎内部状态保持不变（不自行转换——等待状态机 transition），推送 finalStepCount 给订阅者
- [ ] **AC-4**: GIVEN 通关后玩家触发撤销（Story 004），WHEN allCellsFilled 从 true 变为 false，THEN LEVEL_COMPLETE 不再触发（可继续游戏）
- [ ] **AC-5**: GIVEN 关卡仅含 2 个非障碍格（最小合法关卡），WHEN 两格均被填充，THEN 通关检测正常触发

---

## Implementation Notes

*Derived from GDD 规则 5 + ADR-003 Push 模式:*

**检测时机**：
- 在 `handleInputMove()` 每次有效填充后检查
- 在 `handleInputEnd()` 后再次检查（覆盖 "最后一格恰好在 INPUT_END 时填充" 场景）
- 不在 `undo()` 后触发——撤销不会导致通关（已通关状态由状态机控制）

**检测逻辑**：

```typescript
private _checkLevelComplete(): void {
  // 遍历所有 Cell——若非障碍格且未填充 → 未通关
  for (let r = 0; r < this._rows; r++) {
    for (let c = 0; c < this._cols; c++) {
      const cell = this._grid[r][c];
      if (!cell.isBlocked && !cell.filled) return;
    }
  }
  // 全部非障碍格已填充
  this._notify('levelComplete', this._stepCount);
  // 同时触发状态机转换（由订阅者之一——或引擎自身触发）
  this._stateMachine.transition('LEVEL_COMPLETE', { finalSteps: this._stepCount });
}
```

**事件发射**：
- `subscribe('levelComplete', finalSteps)` —— Push 模式，同步按注册顺序执行回调
- 引擎自身不判断星级——finalSteps 传给评分系统（step-scoring）计算星级
- 通关后引擎不再响应 INPUT_MOVE——状态由状态机控制（Playing → LevelComplete 后输入管理器自动停用）

**性能**：allCellsFilled 检查遍历 rows×cols 数组，最坏 100 格（10×10），<0.1ms。

**与撤销的交互**：
- 若关卡已通关（状态机已转换到 LevelComplete），引擎不再接收输入——不存在"通关后撤销"的情况
- 若 "全部填满" 瞬间玩家撤销（allCellsFilled 变为 false），需在下次 `_checkLevelComplete` 调用时停止发射重复事件

**防止重复触发**：关卡只触发一次 LEVEL_COMPLETE。使用 `_levelCompleteFired` 标记守卫。

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: 格子填充逻辑（allCellsFilled 的前提）
- Story 004: 撤销逻辑
- Story 006: 通关闪烁动画（200ms opacity 脉冲）——本 story 仅触发事件，不负责视觉
- step-scoring: 星级计算——接收 finalSteps 后独立计算

---

## QA Test Cases

- **AC-1**: 全部填满触发 LEVEL_COMPLETE
  - Given: 3×3 网格，无障碍格，仅 1 个数字节点 (1)，玩家已手工填满 8 格，还剩 1 格未填充
  - When: `engine.handleInputMove(last_cell_row, last_cell_col)` 填充最后一格
  - Then: `subscribe('levelComplete')` 回调被调用，参数 finalSteps 为实际步数
  - Edge cases: 最后一步是 Bresenham 插值填充的最后一格——同样触发

- **AC-2**: INPUT_END 时恰好填满
  - Given: 仅剩 1 格未填充，(0,0) 未填充
  - When: `engine.handleInputMove(0, 0)` 填充最后一格 + 立即 `engine.handleInputEnd()`
  - Then: allCellsFilled=true 在 INPUT_END 后检测到，LEVEL_COMPLETE 正常发射
  - Edge cases: INPUT_END 和 INPUT_MOVE 在同一帧——检测只执行一次

- **AC-3**: 引擎不自行转换状态
  - Given: allCellsFilled=true
  - When: 引擎检测完成
  - Then: 引擎内部状态保持 Dirty（不自行切换到新状态），通过 stateMachine.transition('LEVEL_COMPLETE') 委托状态机管理
  - Edge cases: 状态机 callback 中调用 engine.undo()——需防止重入

- **AC-4**: 撤销后 allCellsFilled 从 true 变 false
  - Given: allCellsFilled=true 但 LEVEL_COMPLETE 尚未触发（竞争状态）
  - When: 玩家在检测间隙执行 undo()
  - Then: allCellsFilled 变为 false，LEVEL_COMPLETE 不触发
  - Edge cases: 实际上此场景极难发生——检测在每步填充后立即执行，撤销也在同步调用栈中完成

- **AC-5**: 最小合法关卡
  - Given: 2×2 网格，2 个节点格 (1,2)，0 个障碍格
  - When: 玩家填充所有 2 个非障碍格
  - Then: LEVEL_COMPLETE 正常触发
  - Edge cases: 最小网格 3×3（GDD 定义的 [3,10] 范围）

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: `tests/integration/grid-connection-engine/level_complete_test.ts` — must exist and pass
**Status**: [x] Complete — 13 tests, all 5 AC covered

---

## Dependencies

- Depends on: Story 002（路径追踪——填充逻辑），Story 004（撤销系统）
- Unlocks: step-scoring 系统的实现（接收 levelComplete 事件计算星级）；Story 006（通关闪烁动画）
