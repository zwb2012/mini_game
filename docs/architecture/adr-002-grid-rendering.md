# ADR-002: 网格渲染策略——纯 Graphics API 程序化绘制

## Status
Accepted

## Date
2026-05-11

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Cocos Creator 3.8.8 |
| **Domain** | Rendering |
| **Knowledge Risk** | MEDIUM-HIGH — `cc.Graphics` 3.x 无 `fillText`/`fillRect`（2.x 遗留），已改用 `rect()+fill()` + `cc.Label` 节点池；SystemFont Label 在 3.8.8 中**不可自动合批**（每个 Label 生成独立纹理），已改用嵌入式 TTF 字体；微信 Canvas `stroke()` 线宽一致性需真机验证；低端 Android 全量脏重绘可能达 8-12ms |
| **References Consulted** | `docs/engine-reference/cocos/VERSION.md`, `docs/engine-reference/cocos/breaking-changes.md`（3.8.0: cc.loader 移除, Animation track API 迁移）, `design/gdd/grid-connection-engine.md`, `design/gdd/game-concept.md` |
| **Post-Cutoff APIs Used** | None — `cc.Graphics`、`cc.Label`（SystemFont）均为 Cocos 3.0+ 核心 API |
| **Verification Required** | 微信真机 10×10 网格 60fps；Label SystemFont 14px 在低端 Android 微信 Canvas 清晰度；100 格 + 6 路径 + 15 Label 的 draw call 总数；`cc.view.getDevicePixelRatio()` 在华为/小米真机的返回值 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-001 (游戏状态机——Playing 状态守卫)、ADR-003 (数据流——Push 事件/Pull 查询)、ADR-005 (触控输入——INPUT_MOVE 事件) |
| **Enables** | ADR-007 (步数评分——订阅引擎事件)、ADR-008 (提示系统——箭头渲染叠加) |
| **Blocks** | Epic `grid-connection-engine` — 核心玩法实现依赖渲染策略 |
| **Ordering Note** | 必须在 ADR-007/ADR-008 之前 Accept——评分和提示系统依赖引擎的 subscribe() 和 getGrid() 接口 |

## Context

### Problem Statement

网格连线引擎需要渲染 rows×cols 的网格（最大 10×10=100 格），每格有 3 种视觉状态（空白/填充/障碍）、按数字颜色的连线路径、数字节点标记和提示箭头叠加。渲染方案的选择直接影响三个关键指标：微信 2MB 包体预算、<20 draw call 性能目标、极简几何风（Pillar 4）的视觉纯度。

### Constraints
- 微信小游戏包体限制 2MB — 纹理资源必须最小化
- Draw call 预算 <20 — 100 格不能是 100 个独立 Sprite 节点
- 60fps 目标 — 每帧渲染预算 16.6ms，网格渲染 <8ms
- 极简几何风（Pillar 4）— "能用色块不用图标，能用图标不用文字"
- 色盲友好 — 6 种连线色必须有足够对比度和明度差异
- 44×44px 最小触控区域 — cellSize 自动计算 ≥44px

### Requirements
- 渲染网格线（1px 细灰线）、空单元格（白底）、障碍格（深灰填充）
- 渲染 6 色连线路径——当前数字颜色填充途经格子，像素精确跟手
- 在节点格中心显示数字（1, 2, 3...）——清晰可辨
- 格子填充动画——缩放 0.85→1.0 (100ms)，通关全屏闪烁 (200ms)
- 撤销动画——填充色消失，瞬间恢复空白
- 提示箭头叠加——三角形 + 方向指示，与 currentNumber 同色

## Decision

采用**纯 `cc.Graphics` API + `cc.Label` 组件池**——网格线、格填充、连线路径、箭头通过单个 `cc.Graphics` 组件代码绘制，数字文字通过预创建的 `cc.Label` 组件池渲染（嵌入式 TTF 字体, 14px bold）。零精灵纹理资源，仅嵌入一个 TTF 字体文件（数字+拉丁字符，~100-200KB）。视觉风格是极简几何风的技术实现——平色块、细灰线、纯色连线、无渐变无阴影。

> **引擎兼容性说明（Cocos 3.8.8）**：`cc.Graphics` 在 3.x 中已移除 `fillText`/`strokeText`/`fillRect` 等 2.x 快捷方法。3.x 中文本渲染的唯一途径是 `cc.Label` 组件。**SystemFont Label 在 3.8.8 中不可合批**——每个 SystemFont Label 生成独立纹理（~15 draw call）。改用嵌入式 TTF 字体可使同字号、同颜色的所有 Label 共享纹理，合批为 1 draw call。本 ADR 已适配 3.x API 并修正合批策略。

### Architecture Diagram

```
┌──────────────────────────────────────────────┐
│            GridConnectionEngine               │
│                                              │
│  ┌────────────┐    ┌──────────────────────┐  │
│  │  Data Layer │    │   Render Layer        │  │
│  │             │    │                      │  │
│  │ Cell[][]    │───→│  cc.Graphics (单组件)  │  │
│  │ path[]      │    │  + LabelPool           │  │
│  │ stepCount   │    │                      │  │
│  │ currentNum  │    │  drawGrid()          │  │
│  │             │    │  drawCells()         │  │
│  │ (纯 TS)     │    │  drawPath()          │  │
│  │             │    │  updateLabels()      │  │
│  │             │    │  drawArrow()          │  │
│  └────────────┘    └──────────────────────┘  │
│                                              │
│  数据变更 ──→ markDirty() ──→ 下一帧重绘     │
└──────────────────────────────────────────────┘
         │                    │
    subscribe()          Canvas 2D
    INPUT_MOVE           (微信/WebGL)
```

### Key Interfaces

```typescript
/** 网格渲染布局参数 */
interface GridLayout {
  originX: number;    // 网格左上角 X（Canvas 坐标）
  originY: number;    // 网格左上角 Y
  cellSize: number;   // 单格边长 (px)，自动计算 = min(canvasW/cols, canvasH/rows, 120)
  rows: number;
  cols: number;
}

/** 连线颜色板——6 种色盲友好高对比色 */
const LINE_COLORS: ReadonlyArray<Color> = [
  new Color(0xE0, 0x3E, 0x2D), // 红 #E03E2D
  new Color(0x21, 0x96, 0xF3), // 蓝 #2196F3
  new Color(0x4C, 0xAF, 0x50), // 绿 #4CAF50
  new Color(0xFF, 0x98, 0x00), // 橙 #FF9800
  new Color(0x9C, 0x27, 0xB0), // 紫 #9C27B0
  new Color(0x00, 0xBC, 0xD4), // 青 #00BCD4
];

/** 网格渲染器——引擎的内部渲染模块 */
interface IGridRenderer {
  /** 初始化 Graphics 组件并计算 cellSize */
  init(graphics: Graphics, layout: {rows: number; cols: number}): GridLayout;

  /** 标记脏——下一帧 update() 中全量重绘 */
  markDirty(): void;

  /** 每帧由引擎 update() 调用——脏标记为 true 时执行重绘 */
  render(grid: Cell[][], path: PathEntry[], hintArrow: ArrowData | null): void;

  /** 获取屏幕坐标对应的网格坐标（供输入管理器使用） */
  screenToGrid(screenX: number, screenY: number): GridCoord | null;

  /** 销毁——清理 Graphics 绘制缓存 */
  destroy(): void;
}
```

### 绘制顺序（每帧脏重绘）

```
1. graphics.clear()                              // 清空上一帧 mesh buffer
2. drawGridLines(rows, cols)                     // 1px 灰线 (#E0E0E0)
3. drawBlockedCells(blockedCells)                // 深灰填充 (#9E9E9E)
4. drawFilledCells(grid, pathColors)             // 按 ownerNumber 着色填充
5. drawPathLine(path, currentNumber)             // 连线轨迹——2px 宽色线
6. updateLabelNodes(nodes, grid)                 // 更新 Label 节点池的位置和文字
7. drawHintArrow(arrow)                          // 三角形箭头叠加（仅在 ACTIVE 态）
```

> **注意**：3.x Graphics 中 `fillRect` 快捷方法已移除——使用 `rect(x,y,w,h)` + `fill()` 替代。`fill` 和 `stroke` 使用不同渲染状态，每次 `fillColor`/`strokeColor` 变化会切分 mesh buffer。按绘制顺序，实际 draw call 估算：网格线 stroke (1) + 障碍格 fill (1) + 已填充格 fill（最多 6 色 = 6）+ 路径 stroke (1) + 箭头 fill (1) + 箭头 stroke (1) = **5-11 draw call**（取决于连线颜色种数），仍在 <20 预算内。Label 节点池使用 TTF 字体时可合批为 1 draw call；若用 SystemFont 则每个 Label 为独立 draw call（~15）。

### 单个格子填充动画

格子填充动画使用简单的缩放插值而非 tween 系统——避免每格注册一个 tween 的开销：

```typescript
// 每帧在 render() 中计算填充动画进度
function getCellScale(cell: Cell, nowMs: number): number {
  if (!cell.filledAt) return 1.0;
  const elapsed = nowMs - cell.filledAt;
  if (elapsed > FILL_ANIM_MS) return 1.0;  // 100ms 后完成
  // easeOutBack: 0.85 → 1.0
  const t = elapsed / FILL_ANIM_MS;
  return 0.85 + 0.15 * easeOutBack(t);
}

// 渲染时根据 scale 调整绘制尺寸
// 3.x 中无 fillRect 快捷方法——使用 rect() + fill()
const drawSize = cellSize * getCellScale(cell, nowMs);
const offset = (cellSize - drawSize) / 2;
graphics.rect(originX + col * cellSize + offset,
              originY + row * cellSize + offset,
              drawSize, drawSize);
// 批量 rect 后统一 fill——优化 mesh 生成

```

### 连线路径渲染

```typescript
// 连线路径——2px 宽连续折线
function drawPathLine(g: Graphics, path: PathEntry[], currentColor: Color): void {
  if (path.length < 2) return;
  g.strokeColor = currentColor;
  g.lineWidth = 2;
  g.moveTo(cellCenterX(path[0]), cellCenterY(path[0]));
  for (let i = 1; i < path.length; i++) {
    g.lineTo(cellCenterX(path[i]), cellCenterY(path[i]));
  }
  g.stroke();
}
```

### 数字文字渲染（Label 组件池 + TTF 字体）

> **关键引擎约束**：`cc.Graphics.fillText()` 在 Cocos 3.x 中**不存在**（2.x→3.x 迁移时已移除）。文本渲染的唯一途径是 `cc.Label` 组件。**SystemFont Label 在 3.8.8 中不可合批**——必须使用嵌入式 TTF 字体使所有数字 Label 共享纹理，合批为 1 draw call。

```typescript
/** Label 节点池——在引擎 onEnter(Playing) 时创建，使用嵌入式 TTF 字体 */
class LabelPool {
  private _labels: Label[] = [];
  private _container: Node; // 置于网格之上的独立容器节点
  private _font: Font;      // 嵌入式 TTF 字体资源（数字+拉丁字符，~100-200KB）

  init(container: Node, nodeCount: number, fontAsset: Font): void {
    this._container = container;
    this._font = fontAsset;
    // 预创建 nodeCount 个 Label（关卡数据已知节点数）
    // 所有 Label 使用同一 TTF 字体、相同字号和颜色 → Cocos 2D 渲染器合批为 1 draw call
    for (let i = 0; i < nodeCount; i++) {
      const node = new Node(`NodeLabel_${i + 1}`);
      const label = node.addComponent(Label);
      label.font = fontAsset;           // TTF 字体——非 SystemFont
      label.fontSize = 14;
      label.color = Color.WHITE;
      label.horizontalAlign = Label.HorizontalAlign.CENTER;
      label.verticalAlign = Label.VerticalAlign.CENTER;
      container.addChild(node);
      this._labels.push(label);
    }
  }

  /** 每帧脏重绘时更新位置和文字 */
  update(nodes: NodeData[], layout: GridLayout): void {
    if (this._labels.length === 0) return;  // destroy() 后守卫
    for (let i = 0; i < nodes.length; i++) {
      const label = this._labels[i];
      label.string = String(nodes[i].number);
      label.node.setPosition(
        layout.originX + nodes[i].col * layout.cellSize + layout.cellSize / 2,
        layout.originY + nodes[i].row * layout.cellSize + layout.cellSize / 2,
      );
      // 已连线的节点数字正常显示，未连线节点数字更暗
      label.color = nodes[i].connected ? Color.WHITE : new Color(0x99, 0x99, 0x99);
    }
  }

  /** 销毁——清理所有 Label 节点。必须在引擎 Component.onDestroy() 中调用 */
  destroy(): void {
    for (const label of this._labels) {
      if (label && label.node && label.node.isValid) {
        label.node.destroy();
      }
    }
    this._labels.length = 0;
  }
}
```

### 提示箭头渲染

```typescript
// 三角形箭头——指向下一步格子中心
function drawArrow(g: Graphics, arrow: ArrowData, color: Color): void {
  const { row, col, direction } = arrow;
  const cx = cellCenterX(col);
  const cy = cellCenterY(row);
  const s = cellSize * 0.3; // 箭头半径

  // 4 方向三角形顶点计算
  const points = arrowPoints(cx, cy, s, direction);
  g.fillColor = color;
  g.moveTo(points[0].x, points[0].y);
  g.lineTo(points[1].x, points[1].y);
  g.lineTo(points[2].x, points[2].y);
  g.close();
  g.fill();

  // 2px 白色描边增强辨识
  g.strokeColor = Color.WHITE;
  g.lineWidth = 2;
  g.stroke();
}
```

### 脏标记机制

引擎内部使用脏标记（Dirty Flag）避免每帧无意义重绘：

```typescript
// 仅在以下事件发生时标记脏：
// - INPUT_MOVE（玩家画了/撤销了一格）
// - onEnter(Playing)（新关卡初始化）
// - 提示箭头显示/消失
// - 通关闪烁

// 引擎 update() 中：
update(): void {
  if (!this._renderDirty) return;
  this._renderer.render(this._grid, this._path, this._hintArrow);
  this._renderDirty = false;
}
```

### Engine 组件生命周期集成

LabelPool 的创建和销毁必须与引擎 Component 生命周期绑定：

```typescript
// GridConnectionEngine 组件（Cocos Component）
onLoad(): void {
  // 加载 TTF 字体资源
  resources.load('fonts/number-font', Font, (err, font) => {
    if (err) { console.warn('[Engine] TTF font load failed, falling back to SystemFont'); }
    this._labelPool.init(this._labelContainer, this._level.nodes.length, font);
    this._fontLoaded = true;
  });
}

onDestroy(): void {
  // 必须显式销毁 LabelPool——防止场景切换后 Label 节点成为孤儿节点（内存泄漏）
  this._labelPool.destroy();
  // 清理订阅
  this._subscriptions.forEach(unsub => unsub());
}
```

### 性能优化：双 Graphics 组件分离

对于低端 Android 设备（华为畅享系列、红米 Note 10 以下），100 rect()+fill() 全量脏重绘可能达 8-12ms（非 ADR 预估的 <2ms）。建议将静态网格线和障碍格拆分到独立的非清除 Graphics 组件：

```typescript
// graphicsStatic: 仅绘制一次——网格线 + 障碍格（初始化时绘制，之后不变）
// graphicsDynamic: 每帧脏重绘——填充格颜色 + 连线路径 + 箭头
```
此举将每帧重绘量减少约 30%，且无需 RenderTexture 的额外内存开销。

### 颜色常量预创建

避免在渲染循环中 `new Color()` —— 在模块顶层预创建所有颜色常量：

```typescript
const COLOR_WHITE = Color.WHITE;  // 直接引用 Cocos 内置常量
const COLOR_NODE_DIM = new Color(0x99, 0x99, 0x99);  // 模块级创建一次
// LINE_COLORS 数组已在模块级创建——渲染循环中直接赋值：
graphics.fillColor = LINE_COLORS[currentNumber - 1];
```

### cellSize 自动计算

```typescript
function calcCellSize(canvasW: number, canvasH: number,
                      rows: number, cols: number): number {
  const maxByWidth  = Math.floor((canvasW - 2 * GRID_MARGIN) / cols);
  const maxByHeight = Math.floor((canvasH - 2 * GRID_MARGIN) / rows);
  return Math.min(maxByWidth, maxByHeight, 120); // 上限 120px
  // 下限由约束保证：3×3 网格在 375×667 屏幕上约 110px，远大于 44px
}
```

## Alternatives Considered

### Alternative 1: Sprite 节点方案（每格一个 Node + Sprite）
- **Description**: 每个 Cell 是一个带 Sprite 组件的 Node——空/填/障/节点 4 种纹理切换
- **Pros**: 设计师可在外部工具精调纹理（圆角、微阴影）；Sprite 批量渲染（同一纹理自动合批）
- **Cons**: 100 格 = 100 个 Node + 100 个 Sprite 组件 = ~200 个 Cocos 对象——内存 ~80KB 仅节点开销；100 个纹理切换分别对应 6 种颜色 = 6 种纹理各需 9-patch——包体 +18 textures × ~2KB = ~36KB；节点树遍历开销 >Graphics 单组件绘制；极简几何风不需要纹理质感——平色块与其视觉定位一致
- **Rejection Reason**: 违反 Pillar 4（"能用色块不用图标"）——引入纹理资源去实现纯色块能完成的渲染。100 个节点的 Cocos 对象开销和纹理包体不符合"越简单越好"原则。极简几何风不需要纹理的圆角和阴影——平色块的纯粹性本身就是风格

### Alternative 2: 混合方案（Sprite 背景 + Graphics 连线）
- **Description**: 网格和方块用 Sprite 纹理渲染，连线路径和箭头用 Graphics 动态绘制
- **Pros**: 格态切换利用 Sprite 批量渲染优势；连线路径保持像素精确跟手
- **Cons**: 两套渲染系统共存——Graphics 和 Sprite 的 z-order 排序需手动管理；网格背景 Sprite 需对齐 Graphics 的坐标系统——原点不一致会导致连线偏移；混合方案增加了概念复杂性而没有改变视觉结果（色块依然是色块）
- **Rejection Reason**: 视觉结果与纯 Graphics 无差异（都是平色块），但引入了两套渲染系统的协调负担。画蛇添足

### Alternative 3: RenderTexture + 离屏缓存
- **Description**: 将静态部分（网格线、障碍格）绘制到 RenderTexture 作为背景缓存，动态部分（填充、连线）用 Graphics 叠加
- **Pros**: 静态网格背景只绘制一次——减少每帧重绘量；网格不变量与动态量分层渲染
- **Cons**: RenderTexture 占用额外 GPU 内存（10×10 网格 ~200KB）；微信小游戏 RenderTexture 支持不稳定——部分低端设备不支持或性能退化；网格很小（最大 100 格），全量重绘的开销 <2ms——缓存优化的收益微乎其微
- **Rejection Reason**: 100 格的网格全量重绘 <2ms——RenderTexture 的额外内存和兼容性成本不值得。如果未来网格扩展到 50×50 再考虑此方案

## Consequences

### Positive
- 零纹理资源——包体节省 30-50KB，全部 6 色格子填充由代码控制
- 视觉极简——平色块、细灰线、像素精确连线，完全符合 Pillar 4 的几何风格
- 单 Graphics 组件 + Label 池——Graphics 5-11 draw call（fill pass + stroke pass，取决于连线颜色种数）+ Label 合批至 1 draw call（TTF 字体），总 draw call 6-12，在 <20 预算内
- 颜色完全代码化——6 种连线色可随时调整，色盲友好色板可精确控制对比度
- 可脱离引擎测试——Cell 状态到颜色映射为纯函数，`cellSize` 计算为纯函数，Label 渲染为集成层

### Negative
- Label 节点池增加额外节点——15 个 Label Node 的开销（~5KB 内存 + 15 个 Cocos 对象）——小但不可忽略。TTF 字体文件额外占用 ~100-200KB 包体
  - **缓解**: Label 池在 onEnter(Playing) 创建、onDestroy() 销毁——非 Playing 状态零开销。TTF 字体为唯一纹理资源，仍在 2MB 包体预算内
- 每帧脏重绘清空并重建 Graphics + 更新 Label 位置——100 格 + 15 Label 约 2-3ms（中高端设备）、8-12ms（低端 Android）
  - **缓解**: 脏标记机制确保仅在数据变化时重绘——闲置状态零渲染开销。低端设备可启用双 Graphics 组件分离优化
- Graphics 不支持纹理填充——如果需要更丰富的视觉效果（渐变、图案）需要架构变更
  - **缓解**: 游戏 Pillar 明确排除复杂视觉效果——"能做色块不做图标"。这是 feature 不是 bug

### Risks
- 微信小游戏 Canvas 2D 模式下 `stroke()` 的 1px 线宽可能因设备像素比渲染为 2px（模糊）
  - **缓解**: 使用 `cc.view.getDevicePixelRatio()` 计算实际像素；部分低端华为/小米机型 DPR 偶发返回 1.0 而非真实值——微信环境兜底 `wx.getSystemInfoSync().pixelRatio`
- TTF 字体文件增加包体 ~100-200KB——在 2MB 微信小游戏限制内但仍需控制
  - **缓解**: 字体仅含数字 + 拉丁基本字符，压缩后控制在 150KB 以内；若包体紧张可降级为 BMFont 数字纹理（~10KB）
- 100 格全填充 + 6 色路径 + 箭头 + 15 Label 同时渲染时，单帧可能超过 16.6ms 帧预算
  - **缓解**: `performance.now()` 打点测量渲染时间；若超预算，将静态部分（网格线）缓存到独立的不可变 Graphics 组件

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| grid-connection-engine.md | 网格初始化——Cell[][] 创建、节点放置、障碍格标记 (TR-GCE-001) | 引擎数据层创建 Cell[][]，渲染层通过 drawCells/drawGridLines/drawBlockedCells 绘制 |
| grid-connection-engine.md | 路径追踪——按序连接、填充格子 (TR-GCE-002) | drawPathLine() 2px 色线 + drawFilledCells() 按 ownerNumber 着色 |
| grid-connection-engine.md | Bresenham 插值——快速滑动填充跳格 (TR-GCE-003) | 引擎数据层计算 Bresenham 插值格，渲染层在下一帧脏重绘时自动可见 |
| grid-connection-engine.md | 路径回溯——滑入末格=撤销 (TR-GCE-004) | 数据层 path.pop() + filled=false，渲染层脏重绘——撤销格恢复白底 |
| grid-connection-engine.md | 通关检测——填满→LEVEL_COMPLETE (TR-GCE-005) | 引擎数据层检测 allCellsFilled，触发通关闪烁动画——opacity 脉冲 (200ms) |
| grid-connection-engine.md | 撤销接口——undo() + canUndo() (TR-GCE-006) | 纯数据层接口——undo() 修改 Cell 状态 + 标记脏，canUndo() 为 Pull 查询 |
| grid-connection-engine.md | 3 内部状态——Idle/Drawing/Dirty (TR-GCE-007) | 引擎数据层状态机，渲染层根据状态决定脏标记逻辑 |
| hint-system.md | 箭头渲染——三角形指示下一步方向 (TR-HS-002) | drawArrow() — 三角形 + 方向指示，与 currentNumber 同色，2px 白描边 |

## Performance Implications
- **CPU**: 脏重绘 <2ms/帧（中高端设备，100 格 + 6 路径 + 数字 + 箭头）；低端 Android（华为畅享、红米 Note 10 以下）可能达 8-12ms——可启用双 Graphics 组件分离优化降至 <5ms；闲置帧 0ms（脏标记未触发）
- **Memory**: <10KB（Graphics 组件 + Cell[][] 数据 + path[] 数组）；零纹理内存
- **Load Time**: 0——无资源加载，Graphics 在 onEnter(Playing) 时初始化
- **Network**: 无

## Migration Plan
不适用——无现有渲染系统需要迁移。

## Validation Criteria
- 10×10 网格 + 100 格全填充 + 6 条连线在微信真机（低端 Android）上稳定 60fps
- TTF 字体 Label 14px 数字在微信 Canvas 上清晰可读（肉眼检查——数字边缘无明显锯齿）
- Label 合批验证：15 个 Label 节点使用相同 TTF 字体时，Cocos 调试面板显示 ≤2 draw call（Label pass）
- 总 draw call（Graphics + Label）在 10×10 网格 + 6 色连线时 <20
- cellSize 自动计算在 3×3→10×10 全部网格尺寸下 ≥44px
- 颜色板 6 色在色盲模拟器（protanopia/deuteranopia/tritanopia）下可区分的明度差
- 脏标记仅在 INPUT_MOVE/初始化/箭头变化时触发——闲置时零重绘
- 填充动画 100ms 完成——scale 0.85→1.0，不卡顿不跳帧
- 场景切换（Playing → Menu）后 LabelPool 无残留节点——引擎 onDestroy() 中调用了 labelPool.destroy()

## Related Decisions
- ADR-001: 游戏状态机——Playing 状态守卫
- ADR-003: 数据流——Push 事件 (stepChange/levelComplete) + Pull 查询 (getGrid/canUndo)
- ADR-005: 触控输入管线——INPUT_MOVE 事件驱动网格变化
- ADR-008 (planned): 提示系统——箭头数据传递给渲染层
