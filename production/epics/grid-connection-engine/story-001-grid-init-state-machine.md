# Story 001: 网格初始化与状态机

> **Epic**: 网格连线引擎
> **Status**: Complete
> **Layer**: Core
> **Type**: Integration
> **Estimate**: L (8-12 hrs)
> **Manifest Version**: 2026-05-11

## Context

**GDD**: `design/gdd/grid-connection-engine.md`
**Requirement**: `TR-GCE-001`, `TR-GCE-007`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-002: 网格渲染策略
**ADR Decision Summary**: 采用纯 `cc.Graphics` API + `cc.Label` 组件池（TTF 字体）程序化渲染——网格线、格填充、连线路径通过单个 Graphics 组件代码绘制，数字通过预创建 Label 池渲染。零纹理资源。

**Engine**: Cocos Creator 3.8.8 | **Risk**: MEDIUM-HIGH
**Engine Notes**: `cc.Graphics` 3.x 已移除 `fillRect`——使用 `rect()+fill()` 替代；SystemFont Label 不可合批——必须使用嵌入式 TTF 字体；微信 Canvas `stroke()` 线宽一致性需真机验证。

**Control Manifest Rules (this layer)**:
- Required: 使用 `cc.Graphics.rect() + fill()` 绘制所有填充（非 fillRect）；Label 使用嵌入式 TTF 字体；脏标记机制——仅在 `_renderDirty === true` 时重绘；LabelPool 生命周期绑定 Component（onLoad 创建，onDestroy 销毁）；颜色常量预创建
- Forbidden: 禁止每格一个 Sprite Node；禁止 RenderTexture 离屏缓存；禁止 SystemFont Label；禁止渲染循环中 `new Color()`
- Guardrail: Graphics draw call 5-11；Label draw call 1（TTF 合批）；总 draw call <20；脏重绘 <2ms（中高端）/ 8-12ms（低端 Android）

---

## Acceptance Criteria

*From GDD `design/gdd/grid-connection-engine.md`, scoped to this story:*

- [ ] **AC-1**: GIVEN onEnter(Playing) + 有效 Level(id=1, 4x4, 3 nodes)，WHEN 引擎初始化，THEN 4×4 网格渲染完毕，3 个数字节点在正确位置
- [ ] **AC-2**: GIVEN Level 含 blockedCells，WHEN 引擎初始化，THEN 障碍格以深灰色填充（#9E9E9E），不可交互
- [ ] **AC-3**: GIVEN 网格初始化完成，WHEN 无触摸输入，THEN 引擎内部状态为 Idle
- [ ] **AC-4**: GIVEN 引擎状态为 Idle，WHEN 玩家首次有效触摸数字节点，THEN 状态转换为 Drawing
- [ ] **AC-5**: GIVEN 引擎状态为 Drawing，WHEN 玩家抬手指（INPUT_END），THEN 状态转换为 Dirty
- [ ] **AC-6**: GIVEN 网格初始化时关卡数据格式异常（缺少 rows/cols/nodes），THEN console.error + 触发回退到 MenuScene
- [ ] **AC-7**: GIVEN cellSize 自动计算，WHEN 不同网格尺寸（3×3 到 10×10），THEN cellSize 始终 ≥44px 且在 [40, 120] 范围内

---

## Implementation Notes

*Derived from ADR-002 Implementation Guidelines:*

**网格初始化流程**（对应 GDD 规则 1）：
1. 从关卡数据加载 `Level` 对象 → 创建 `rows × cols` 二维 `Cell[][]` 数组
2. 每个 Cell 包含：`filled`, `ownerNumber`, `isNode`, `nodeNumber`, `isBlocked`
3. 在对应坐标标记节点格和障碍格
4. 计算 `cellSize = min(floor((canvasW - 2*margin)/cols), floor((canvasH - 2*margin)/rows), 120)`，保底 ≥44px
5. 计算 `gridOriginX/Y` 使网格居中
6. 向输入管理器发送 LayoutParams（gridOriginX/Y, cellSize, rows, cols）

**渲染层初始化**：
- 在 `onLoad()` 中获取 `cc.Graphics` 组件引用，创建 LabelPool 并加载 TTF 字体
- 在 `onDestroy()` 中调用 `labelPool.destroy()` 清理所有 Label 节点
- 颜色常量在模块顶层预创建：`LINE_COLORS`（6 色色盲友好色板）、`COLOR_NODE_DIM`、`COLOR_BLOCKED`

**状态机实现**（对应 GDD 内部状态）：
```
Idle ──(首次有效触摸)──→ Drawing
Drawing ──(INPUT_END)──→ Dirty
Dirty ──(新 TOUCH_START)──→ Drawing 或 Idle（新起点）
```
- 状态为内部枚举，不依赖外部状态机
- 仅在 Playing 态运行（通过 `onEnter(Playing)` 激活，`onExit(Playing)` 清理）

**Label 节点池**：
- 在 onEnter(Playing) 时根据关卡节点数预创建 Label 节点
- 所有 Label 使用同一 TTF 字体、14px、同色 → Cocos 2D 渲染器合批为 1 draw call
- 节点坐标根据 gridOrigin + cellSize 计算中心位置

**异常处理**：
- 关卡数据格式校验失败 → `console.error('[Engine] Invalid level data:', details)` + 触发 `stateMachine.transition('BACK_TO_MENU')`

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: 路径追踪逻辑（触摸填充、currentNumber 切换）
- Story 003: Bresenham 跳格插值
- Story 004: 路径回溯与撤销 API
- Story 005: 通关检测与事件发射
- Story 006: 填充动画、路径渲染视觉效果、音频同步

---

## QA Test Cases

- **AC-1**: GIVEN onEnter(Playing) + 有效 Level(id=1, 4x4, 3 nodes)，WHEN 引擎初始化，THEN 4×4 网格渲染完毕，3 个数字节点在正确位置
  - Given: 加载关卡 id=1（4×4 网格，nodes=[{row:0,col:0,number:1},{row:3,col:3,number:2},{row:1,col:2,number:3}]）
  - When: 调用 `engine.onEnter(Playing, {levelId: 1})`
  - Then: `engine.getGrid()` 返回 4×4 Cell[][]，`grid[0][0].isNode === true && grid[0][0].nodeNumber === 1`，其余节点位置同理
  - Edge cases: rows=10/cols=10 最大网格；rows=3/cols=3 最小网格

- **AC-2**: GIVEN Level 含 blockedCells，WHEN 引擎初始化，THEN 障碍格以深灰色填充
  - Given: Level 含 `blockedCells: [{row:1, col:1}]`
  - When: 引擎初始化完成
  - Then: `grid[1][1].isBlocked === true`，渲染为 #9E9E9E 色块
  - Edge cases: 0 个障碍格（全开放网格）；障碍格与节点格坐标重叠（应拒绝——数据校验层捕获）

- **AC-3**: 初始状态为 Idle
  - Given: 引擎初始化完成，无触摸输入
  - When: 查询引擎内部状态
  - Then: 状态为 Idle
  - Edge cases: 无

- **AC-4**: Idle → Drawing 转换
  - Given: 引擎状态为 Idle
  - When: 收到 `INPUT_MOVE(row=0, col=0)`（nodeNumber=1 的节点格）
  - Then: 状态转换为 Drawing，currentNumber=1
  - Edge cases: 触摸非节点格——保持 Idle

- **AC-5**: Drawing → Dirty 转换
  - Given: 引擎状态为 Drawing
  - When: 收到 `INPUT_END`
  - Then: 状态转换为 Dirty
  - Edge cases: 无

- **AC-6**: 关卡数据异常回退
  - Given: Level 数据缺少 `rows` 字段
  - When: 引擎尝试初始化
  - Then: `console.error` 输出 + 触发状态机 `transition('BACK_TO_MENU')`
  - Edge cases: nodes 数组为空；grid 尺寸超出 [3,10] 范围

- **AC-7**: cellSize 自动计算范围
  - Given: 各种网格尺寸（3×3, 5×5, 10×10）
  - When: 引擎计算 cellSize
  - Then: 所有场景 cellSize ∈ [44, 120]
  - Edge cases: 极小 Canvas（320×320）+ 10×10 网格——cellSize 截断至 44px 保底

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: `tests/integration/grid-connection-engine/grid_init_test.ts` — must exist and pass
**Status**: [x] Created — `tests/integration/grid_init.test.ts` (30 tests, all passing)

---

## Dependencies

- Depends on: Foundation 层系统已实现——`level-data-schema`（Level 数据加载）、`game-state-machine`（Playing 状态回调）、`input-manager`（LayoutParams 接收）
- Unlocks: Story 002（路径追踪——依赖网格和状态机就绪）

---

## Completion Notes

**Completed**: 2026-05-12
**Criteria**: 7/7 passing
**Deviations**:
  - ADVISORY: 测试文件位于 `tests/integration/grid_init.test.ts`（非 story 指定的 `grid-connection-engine/` 子目录），因 Jest 无法发现含连字符目录下的测试文件。测试覆盖完整。
  - ADVISORY: `_validateLevel` 未检测重复节点坐标——应由 `level-data-schema/validation.ts` 补全。
  - ADVISORY: `filledAt` 使用 `Date.now()`，Story 006 动画实现前建议统一为 `performance.now()`。
**Test Evidence**: `tests/integration/grid_init.test.ts` — 30/30 tests pass
**Code Review**: Approved with suggestions (2026-05-12)
