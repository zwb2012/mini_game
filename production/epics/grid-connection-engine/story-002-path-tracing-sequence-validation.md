# Story 002: 核心路径追踪与序列验证

> **Epic**: 网格连线引擎
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Manifest Version**: 2026-05-11

## Context

**GDD**: `design/gdd/grid-connection-engine.md`
**Requirement**: `TR-GCE-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-002: 网格渲染策略 / ADR-005: 触控输入管线
**ADR Decision Summary**: 引擎只接收 `INPUT_MOVE(row, col)`——输入管线已过滤越界/非 Playing 态事件。路径追踪逻辑在引擎数据层执行，渲染层通过脏标记在下一帧反映变化。

**Engine**: Cocos Creator 3.8.8 | **Risk**: MEDIUM-HIGH
**Engine Notes**: Bresenham 插值在引擎侧实现（非输入管理器）——ADR-005 明确责任边界。输入管线只负责透传事件，跳格填充由引擎填充。

**Control Manifest Rules (this layer)**:
- Required: 引擎事件通过 subscribe 暴露（`stepChange`、`levelComplete`）；引擎只接收 INPUT_MOVE——不监听 Cocos 触摸事件
- Forbidden: 禁止引擎直接监听 Cocos 触摸事件；禁止跳数字连接
- Guardrail: 端到端触控延迟 ≤50ms（手指触屏到引擎收到 INPUT_MOVE）

---

## Acceptance Criteria

*From GDD `design/gdd/grid-connection-engine.md`, scoped to this story:*

- [ ] **AC-1**: GIVEN 当前路径为空，WHEN 玩家触摸 nodeNumber=1 的格子，THEN currentNumber=1，该格被填充（filled=true, ownerNumber=1），stepCount=1
- [ ] **AC-2**: GIVEN 当前路径为空，WHEN 玩家触摸非数字节点格，THEN 触摸被忽略——无填充、无状态变化
- [ ] **AC-3**: GIVEN currentNumber=1 且路径已从节点 1 开始，WHEN 玩家滑动到 nodeNumber=2 的格子，THEN currentNumber 变为 2，1→2 段路径被锁定（不可再回溯修改）
- [ ] **AC-4**: GIVEN currentNumber=2，WHEN 玩家直接触摸 nodeNumber=4 的格子（跳过 3），THEN 触摸被忽略，currentNumber 保持为 2，nodeNumber=4 的格子不被填充
- [ ] **AC-5**: GIVEN 玩家在 Drawing 状态抬手指（INPUT_END）后从不同数字节点重新开始，WHEN 新 TOUCH_START 触摸 nodeNumber=2 且 currentNumber=2，THEN 视为新路径——currentNumber 重置为 2，新路径从节点 2 开始
- [ ] **AC-6**: GIVEN currentNumber=1 且存在障碍格，WHEN 玩家滑入障碍格，THEN 触摸被忽略——障碍格不被填充
- [ ] **AC-7**: GIVEN 路径已锁定（已触达下一数字节点），WHEN 玩家滑入已锁定的格子，THEN 触摸被忽略——不可修改已锁定段

---

## Implementation Notes

*Derived from ADR-002 and GDD 规则 2-3:*

**路径追踪核心循环**（GDD 规则 2）：
```
INPUT_MOVE(row, col) 到达：
1. 检查 Cell(row,col).filled —— 若已填充 → 执行 Story 004 回溯逻辑
2. 检查 Cell(row,col).isBlocked —— 若障碍格 → 忽略
3. 若当前路径为空：检查是否触摸在数字节点上
   - 是 → 开始新路径，currentNumber = nodeNumber
   - 否 → 忽略
4. 填充该格：filled=true, ownerNumber=currentNumber
5. 触发 Push: stepCount++ → subscribe('stepChange', +1)
6. 将该格坐标推入 path[]
7. 若该格 nodeNumber == currentNumber + 1（到达下一数字节点）：
   - 锁定当前数字段路径（不可再被回溯修改）
   - currentNumber += 1
8. 标记 renderDirty = true
```

**序列连接验证**（GDD 规则 3）：
- 引擎不强制一次连对所有数字——玩家可分段操作（抬手指后继续）
- 当前路径始终以 currentNumber 的颜色填充
- 跳数字触摸无效——只接受 nodeNumber == currentNumber（同数字节点）或 nodeNumber == currentNumber + 1（下一数字节点）
- 同数字节点不做特殊处理（仅填充该格，不切换 currentNumber）

**脏标记触发**：
- 每次有效填充后 `_renderDirty = true`
- 引擎 update() 中检查 dirty flag 再调用 `renderer.render()`

**步数计数**：
- 每成功填充一格 → stepCount +1，Push `subscribe('stepChange', +1)`
- 不计算星级——评分由 step-scoring 系统负责

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 001: 网格初始化、Cell 结构定义、Label 节点池创建
- Story 003: Bresenham 插值——快速滑动跳格处理（本 story 假设每次 INPUT_MOVE 仅处理当前单格）
- Story 004: 路径回溯与撤销——滑入已填充格的处理和 undo() API
- Story 005: 通关检测——allCellsFilled 检查与 LEVEL_COMPLETE 事件
- Story 006: 视觉效果——填充动画、路径线渲染、音频咔嗒音

---

## QA Test Cases

- **AC-1**: 首次触摸 nodeNumber=1 的格子开始路径
  - Given: 4×4 网格，nodeNumber=1 在 (0,0)，currentNumber=undefined，空路径
  - When: `engine.handleInputMove(0, 0)`
  - Then: `grid[0][0].filled === true && grid[0][0].ownerNumber === 1 && engine.getCurrentNumber() === 1 && engine.getStepCount() === 1`
  - Edge cases: 已在 path 中的格子再次收到 INPUT_MOVE——防止重复填充同一格

- **AC-2**: 从非数字格开始被忽略
  - Given: 4×4 网格，(1,1) 是空非节格格，当前路径为空
  - When: `engine.handleInputMove(1, 1)`
  - Then: `grid[1][1].filled === false`，currentNumber 不变，stepCount=0
  - Edge cases: 触摸障碍格——同样忽略

- **AC-3**: 到达下一数字节点切换 currentNumber
  - Given: currentNumber=1，path 已包含 1 号节点，(1,0) 是 nodeNumber=2
  - When: `engine.handleInputMove(1, 0)`
  - Then: `engine.getCurrentNumber() === 2`，1→2 段路径已锁定
  - Edge cases: 路径末格恰好是 nodeNumber=2——正常切换；路径中包含 nodeNumber=2 但中间还有未锁定格——回溯测试见 Story 004

- **AC-4**: 跳数字连接被拒绝
  - Given: currentNumber=2，nodeNumber=4 的节点在 (3,3)
  - When: `engine.handleInputMove(3, 3)`
  - Then: `grid[3][3].filled === false`，currentNumber 保持 2，stepCount 不增加
  - Edge cases: 触摸 nodeNumber=1（比 currentNumber 小）——同样拒绝

- **AC-5**: 抬手指后从不同节点重新开始
  - Given: 已连完 1→2（currentNumber=2），INPUT_END 触发状态变为 Dirty。玩家触摸 nodeNumber=2 的节点
  - When: `engine.handleInputStart()` + `engine.handleInputMove(2_node_row, 2_node_col)`
  - Then: 新路径从节点 2 开始，currentNumber=2
  - Edge cases: 触摸已锁定的 1 号节点——应拒绝（路径已锁定）

- **AC-6**: 障碍格忽略
  - Given: currentNumber=1，(1,1) 是障碍格
  - When: `engine.handleInputMove(1, 1)`
  - Then: 无变化——grid[1][1] 不变，stepCount 不变，路径不变
  - Edge cases: 所有相邻方向均为障碍格——玩家只能绕过

- **AC-7**: 已锁定路径段不可修改
  - Given: 已锁定 1→2 段（5 个格子），currentNumber=2 且正在画线
  - When: `engine.handleInputMove(locked_cell_row, locked_cell_col)`（该格属于 1→2 段）
  - Then: 忽略——格子保持已填充状态，路径不变
  - Edge cases: 锁定段末格（nodeNumber=2 的节点）——同样不可修改

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/grid-connection-engine/path_tracing_test.ts` — must exist and pass
**Status**: [x] Created — `tests/unit/grid-connection-engine/path_tracing.test.ts` (31 tests, all passing)

---

## Dependencies

- Depends on: Story 001（网格初始化与状态机必须 DONE）
- Unlocks: Story 003（Bresenham 插值——依赖路径追踪核心逻辑）

---

## Completion Notes

**Completed**: 2026-05-12
**Criteria**: 7/7 passing
**Deviations**:
  - ADVISORY: Test file path — story 指定 `path_tracing_test.ts`，实际为 `path_tracing.test.ts`。Jest `testMatch: **/*.test.ts` 不匹配 `*_test.ts` 后缀。Story 001 的 `grid_init_test.ts` 同样受影响。
  - ADVISORY: `_handleDirtyTouch` 参数 `_row`/`_col` 带 `_` 前缀但在使用中——破坏局部命名一致性。不影响正确性。
**Test Evidence**: `tests/unit/grid-connection-engine/path_tracing.test.ts` — 31/31 tests pass
**Code Review**: Complete — Approved with suggestions (2026-05-12)
