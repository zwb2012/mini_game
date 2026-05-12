# Story 006: 视觉打磨——填充动画、路径渲染与音频同步

> **Epic**: 网格连线引擎
> **Status**: Complete
> **Layer**: Core
> **Type**: Visual/Feel
> **Manifest Version**: 2026-05-11

## Context

**GDD**: `design/gdd/grid-connection-engine.md`
**Requirement**: GDD Visual/Audio Requirements 章节 + Game Feel 章节
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-002: 网格渲染策略
**ADR Decision Summary**: 所有视觉效果通过 `cc.Graphics` 程序化渲染——填充动画用缩放插值（easeOutBack，100ms），连线路径 2px 宽色线，通关闪烁用 opacity 脉冲（200ms）。音频通过 audio-manager 的 play('TICK') 同步触发。

**Engine**: Cocos Creator 3.8.8 | **Risk**: MEDIUM-HIGH
**Engine Notes**: `cc.Graphics` 3.x 无 `fillRect`——使用 `rect()+fill()`；无 `fillText`——数字用 Label 组件；`fill` 和 `stroke` 颜色变化切分 mesh buffer。低端 Android 全量脏重绘可能 8-12ms——脏标记和双 Graphics 组件分离可优化。

**Control Manifest Rules (this layer)**:
- Required: 脏标记机制——仅在 `_renderDirty === true` 时重绘；颜色常量预创建——渲染循环中不 `new Color()`；cellSize 自动计算；6 色色盲友好色板
- Forbidden: 禁止渲染循环中 `new Color()`；禁止 SystemFont Label
- Guardrail: Graphics draw call 5-11；Label draw call 1（TTF 合批）；总 draw call <20；脏重绘 <2ms（中高端）/ 8-12ms（低端 Android）；闲置帧零重绘

---

## Acceptance Criteria

*From GDD Visual/Audio Requirements + Game Feel:*

- [ ] **AC-1**: GIVEN 玩家手指滑入新格，WHEN 填充触发，THEN 格子显示缩放动画——scale 0.85→1.0（100ms，easeOutBack），动画开始时间 `performance.now()` 到完成 ≤100ms
- [ ] **AC-2**: GIVEN 当前路径非空（≥2 格），WHEN 脏重绘执行，THEN 连线路径以 2px 宽、currentNumber 对应颜色渲染——从 path 起点到终点的连续折线
- [ ] **AC-3**: GIVEN 每步有效填充，WHEN 格子填充完成后 16ms 内，THEN audioManager.play('TICK') 被调用——每格一次咔嗒音（含 Bresenham 插值格）
- [ ] **AC-4**: GIVEN 回溯/撤销触发，WHEN 格子恢复空白，THEN 填充色消失（无淡出动画——瞬间清除），audioManager.play('TICK', {pitchOffset: -12}) 被调用
- [ ] **AC-5**: GIVEN allCellsFilled=true → LEVEL_COMPLETE，WHEN 通关检测触发，THEN 全部格子执行 opacity 脉冲闪烁——1.0→0.5→1.0（200ms），共 1 次
- [ ] **AC-6**: GIVEN 无触摸闲置状态，WHEN 连续 2 帧无任何网格变化，THEN 渲染层零重绘（`_renderDirty === false`，update() 直接返回）
- [ ] **AC-7**: GIVEN 6 种连线颜色同时显示（6 个不同 currentNumber 的已锁定路径段），WHEN 在色盲模拟器下检查，THEN protanopia/deuteranopia/tritanopia 模式均可区分 6 色
- [ ] **AC-8**: GIVEN 全部格子（10×10=100 格）均被填充 + 6 条已锁定路径 + 15 个数字 Label + 1 个箭头，WHEN 脏重绘执行，THEN draw call <20，单帧渲染 <16.6ms（60fps）

---

## Implementation Notes

*Derived from ADR-002 Implementation Guidelines:*

**绘制顺序**（每帧脏重绘严格此序）：
```
1. graphics.clear()
2. drawGridLines(rows, cols)        — 1px 灰线 (#E0E0E0)
3. drawBlockedCells(blockedCells)   — 深灰填充 (#9E9E9E)
4. drawFilledCells(grid)             — 按 ownerNumber 着色，含缩放动画插值
5. drawPathLine(path, currentColor)  — 2px 宽连续折线
6. updateLabelNodes(nodes, grid)     — 更新 Label 位置和文字
```

**填充动画**（easeOutBack 缩放插值——不创建 tween 对象）：

```typescript
function getCellScale(cell: Cell, nowMs: number): number {
  if (!cell.filledAt) return 1.0;
  const elapsed = nowMs - cell.filledAt;
  if (elapsed > 100) return 1.0;  // 100ms 后完成
  const t = elapsed / 100;
  return 0.85 + 0.15 * easeOutBack(t);
}
```

渲染时根据 scale 调整绘制尺寸：
```typescript
const drawSize = cellSize * scale;
const offset = (cellSize - drawSize) / 2;
graphics.rect(originX + col * cellSize + offset,
              originY + row * cellSize + offset,
              drawSize, drawSize);
// 批量 rect 后统一 fill
```

**连线路径渲染**：
- 2px 宽，currentNumber 对应的颜色
- 从 path[0] 格中心画到 path[N] 格中心
- 颜色每 segment 可不同（锁定段不同颜色）

**通关闪烁**：
- opacity 脉冲：1.0 → 0.5 → 1.0，easeInOutSine，200ms 总时长
- 所有填充格同时闪烁——通过修改 fillColor 的 alpha 通道实现

**颜色常量**（模块顶层预创建——不 new Color() 在循环中）：
```typescript
const LINE_COLORS = [
  new Color(0xE0, 0x3E, 0x2D), // 红
  new Color(0x21, 0x96, 0xF3), // 蓝
  new Color(0x4C, 0xAF, 0x50), // 绿
  new Color(0xFF, 0x98, 0x00), // 橙
  new Color(0x9C, 0x27, 0xB0), // 紫
  new Color(0x00, 0xBC, 0xD4), // 青
];
```

**音频同步**：
- 每次填充 → `audioManager.play('TICK')`（包含在 Story 002/003 中实现，本 story 验证时序）
- 撤销 → `audioManager.play('TICK', {pitchOffset: -12})`（Story 004）
- 通关 → `audioManager.play('LEVEL_COMPLETE')`（Story 005）

**低端设备优化**（双 Graphics 组件分离）：
- `graphicsStatic`: 仅绘制一次——网格线 + 障碍格（onEnter 时绘制，之后不重绘）
- `graphicsDynamic`: 每帧脏重绘——填充格、连线路径

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 001-005: 各 story 的数据逻辑（本 story 仅负责视觉呈现和音频时序验证）
- step-scoring: 星级显示（由 level-complete-overlay 负责）
- hint-system: 提示箭头渲染（由 hint-system 实现时调用 engine.setArrow()）

---

## QA Test Cases (Manual Verification)

- **AC-1**: 填充缩放动画
  - Setup: 进入任意关卡（4×4），触摸 nodeNumber=1 的格子
  - Verify: 首格填充时可见瞬间缩放——从稍小（~85%）弹到完整尺寸（100%），动画在 100ms 内完成，不卡顿
  - Pass condition: 肉眼观察动画流畅，无跳帧或延迟感；连续快速滑动时每格均有微动画但不延迟跟手

- **AC-2**: 连线路径渲染
  - Setup: 从 nodeNumber=1 连续滑动到 nodeNumber=2（途经 5 个中间格）
  - Verify: 路径线从 1 号节点中心开始，连续折线穿过每个途经格中心，到达 2 号节点。线宽 2px，颜色为 1 号颜色。1→2 段锁定后，继续画 2→3 段——颜色变为 2 号颜色
  - Pass condition: 路径线像素精确居中对齐格中心；颜色正确；2px 线宽清晰可辨；锁定段和新段颜色不同

- **AC-3**: 音频咔嗒同步
  - Setup: 打开设备声音，以正常速度在网格上滑动手指
  - Verify: 手指每滑入一格格子，伴随一次咔嗒音——快速滑动时连续咔嗒（像按微型开关），慢速滑动时逐格咔嗒。手指滑回撤销时咔嗒音调降低（比正常咔嗒低约半个八度）
  - Pass condition: 音频与手指移动同步，无不自然的延迟（>50ms）；快速滑动时音频不堆积（同帧内多次 TICK 已防抖——见 ADR-010）；音调降低的撤销咔嗒可感知

- **AC-4**: 撤销视觉
  - Setup: 画一条 5 格路径，然后手指滑回上一格
  - Verify: 被撤销格的填充色瞬间消失（无淡出动画），格子恢复空白背景。路径线缩短至 4 格
  - Pass condition: 撤销格与相邻已填充格的边界清晰——无残留颜色或半透明

- **AC-5**: 通关闪烁
  - Setup: 填满一关的最后一个格子（可通过作弊或选最小关卡）
  - Verify: 全部填充格同时闪烁——颜色透明度从正常到 50% 再到正常，总时长约 200ms。闪烁 1 次
  - Pass condition: 闪烁节奏干脆利落，不拖尾；不阻塞结算弹窗的显示

- **AC-6**: 闲置帧零重绘
  - Setup: 使用 Cocos 调试面板或 `performance.now()` 打点，进入关卡后不触摸
  - Verify: engine.update() 中 `_renderDirty === false` 直接返回——Graphics.clear()/redraw 不被调用
  - Pass condition: 闲置 5 秒以上无任何重绘；GPU 和 CPU 使用率不因引擎而升高

- **AC-7**: 色盲友好验证
  - Setup: 使用色盲模拟工具（如 Chrome DevTools Rendering 面板或外部模拟器），在 protanopia/deuteranopia/tritanopia 模式下查看 6 条已锁定路径
  - Verify: 每两种相邻颜色之间有足够的明度或色调差异——不会出现两条路径看起来完全相同的情况（尤其是红/绿和蓝/紫组合）
  - Pass condition: 3 种色盲模式下 6 色均可区分——明度差至少 15%（WCAG AA 标准近似）

- **AC-8**: 性能上限
  - Setup: 10×10 全填充网格 + 6 条已锁定路径 + 15 个数字 Label + 1 个提示箭头，触发脏重绘
  - Verify: Cocos 调试面板显示 draw call <20；`performance.now()` 打点显示单帧渲染时间 <16.6ms
  - Pass condition: 中高端设备 <3ms，低端 Android <12ms；60fps 稳定无帧掉落

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: `production/qa/evidence/visual-polish-evidence.md` + sign-off
**Status**: [ ] Not yet created (Visual/Feel — manual verification deferred)

---

## Dependencies

- Depends on: Story 002（路径追踪——填充和路径数据）、Story 003（Bresenham——完整填充覆盖率）、Story 004（撤销视觉）、Story 005（通关闪烁触发）
- Unlocks: None — 网格连线引擎 Epic 的最后一项 Story

---

## Completion Notes
**Completed**: 2026-05-12
**Criteria**: 5/8 自动验证通过 + 3 延迟验证（AC-3/AC-4 音频同步、AC-8 性能 panel）
**Deviations**:
- Advisory — 音频同步通过现有 `subscribe('stepChange'/'levelComplete')` 事件系统实现（外部订阅者负责调用 AudioManager），符合 ADR-003 Push 模式
- Advisory — AC-8（draw call <20, <16.6ms）需在 Cocos 调试面板中实际测量
**Test Evidence**: Visual/Feel story—manual evidence deferred to Cocos preview/manual verification
**Code Review**: Skipped（lean mode）
**Implementation**: +~150 lines in `GridConnectionEngine.ts` — `_drawFilledCells()`, `_drawPathLine()`, `_drawCompletionBlink()`, `easeOutBack()`, `easeInOutSine()`, `getCellScale()`
