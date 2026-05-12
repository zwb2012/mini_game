# ADR-005: 触控输入管线——延迟预算与坐标映射

## Status
Accepted

## Date
2026-05-11

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Cocos Creator 3.8.8 |
| **Domain** | Input |
| **Knowledge Risk** | LOW — `Node.EventType.TOUCH_START/MOVE/END` 是 Cocos 3.x 核心 API，自 3.0 起稳定 |
| **References Consulted** | `docs/engine-reference/cocos/VERSION.md`, `docs/engine-reference/cocos/deprecated-apis.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | 端到端延迟 ≤50ms 需在微信真机（低端 Android）上通过 `performance.now()` 打点验证 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-001 (游戏状态机——Playing 状态守卫) |
| **Enables** | ADR-002 (网格渲染策略——引擎接收 INPUT_MOVE 事件) |
| **Blocks** | Epic `input-manager` — 输入系统实现依赖此 ADR Accepted |
| **Ordering Note** | 与 ADR-004 可并行——两者均为 Foundation 层且无相互依赖 |

## Context

### Problem Statement

数字连线的核心操作是手指在屏幕上滑动连线。触控事件从 Cocos Canvas 的像素坐标到连线引擎可用的网格坐标，需要经过 4 步处理——坐标映射、滑动阈值过滤、Playing 状态守卫、事件分发。如果这些步骤耦合在单个函数中，每个步骤无法独立测试，延迟瓶颈无法定位。需要一种管线架构，每一步可独立验证正确性和性能。

### Constraints
- 微信小游戏环境——触控事件通过 Cocos `Node.EventType` 系统投递
- MVP 仅需单点触摸——无需多点手势识别
- 最小触控区域 44×44px（微信无障碍标准）
- 目标帧率 60fps（帧预算 16.6ms）——输入处理必须 <1ms/帧
- 端到端延迟目标 ≤50ms（手指触屏到引擎收到 INPUT_MOVE）

### Requirements
- 支持 TOUCH_START → TOUCH_MOVE → TOUCH_END 完整触摸生命周期
- 屏幕像素坐标 → 网格行列坐标映射（`gridRow = floor((touchY - originY) / cellSize)`）
- 4px 滑动阈值过滤手指颤抖
- Playing 状态守卫——非 Playing 态静默丢弃
- 坐标越界丢弃（row < 0 或 row ≥ rows）
- 多点触摸忽略（MVP——仅处理第一个触点）

## Decision

采用**管线模式（Pipeline）**——输入管理器将触控事件按序流经独立的处理步骤，每步为纯函数，可脱离 Cocos 运行时单独测试。管线末端通过回调模式发布 `INPUT_MOVE(row, col)` 事件给订阅者（连线引擎）。

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  InputManager                        │
│                                                     │
│  Cocos TouchEvent ──→ Pipeline ──→ Subscribers      │
│                                                     │
│  Step 1          Step 2         Step 3     Step 4   │
│  ┌─────────┐    ┌─────────┐   ┌────────┐ ┌───────┐ │
│  │Coordinate│───→│Dead Zone│──→│ State  │→│Publish│ │
│  │ Mapping  │    │ Filter  │   │ Guard  │ │Event  │ │
│  └─────────┘    └─────────┘   └────────┘ └───────┘ │
│       │              │             │          │     │
│  pixel→(r,c)   delta<4px   state≠Playing  INPUT_   │
│  outOfRange→✗   →discard    →discard     MOVE(r,c) │
└─────────────────────────────────────────────────────┘
       │                                      │
  gridOriginX/Y                      grid-connection-engine
  cellSize (from engine)             (唯一的 INPUT_MOVE 订阅者)
```

### Key Interfaces

```typescript
/** 触摸生命周期事件类型 */
enum InputEventType {
  INPUT_START = 'INPUT_START',
  INPUT_MOVE = 'INPUT_MOVE',
  INPUT_END = 'INPUT_END',
}

/** 网格坐标（管线输出） */
interface GridCoord {
  row: number;  // [0, rows-1]
  col: number;  // [0, cols-1]
}

/** 订阅者回调签名 */
type InputCallback = (type: InputEventType, coord: GridCoord) => void;

/** 输入管理器公共接口 */
interface IInputManager {
  /** 订阅输入事件。返回 unsubscribe 函数 */
  subscribe(cb: InputCallback): () => void;

  /** 设置网格布局参数（由引擎在初始化时调用） */
  setLayoutParams(params: LayoutParams): void;

  /** 激活/停用（根据状态机 Playing 态开关） */
  setActive(active: boolean): void;

  /** 销毁——显式解绑所有 Cocos 事件和订阅者 */
  destroy(): void;
}

/** 引擎提供的网格布局参数 */
interface LayoutParams {
  gridOriginX: number;  // 网格左上角 X（屏幕像素）
  gridOriginY: number;  // 网格左上角 Y（屏幕像素）
  cellSize: number;     // 单格边长（像素），范围 [40, 120]
  rows: number;         // 网格行数
  cols: number;         // 网格列数
}
```

**管线步骤实现**：

```typescript
// Step 1: 坐标映射（纯函数，可单元测试）
function mapToGrid(touchX: number, touchY: number, params: LayoutParams): GridCoord | null {
  const row = Math.floor((touchY - params.gridOriginY) / params.cellSize);
  const col = Math.floor((touchX - params.gridOriginX) / params.cellSize);
  if (row < 0 || row >= params.rows || col < 0 || col >= params.cols) {
    return null; // 越界丢弃
  }
  return { row, col };
}

// Step 2: 滑动阈值过滤（纯函数，可单元测试）
function shouldFireMove(
  coord: GridCoord,
  lastCoord: GridCoord | null,
  threshold: number  // 4px
): boolean {
  if (!lastCoord) return true;
  // 网格坐标变化才触发——等价于至少移动 1 格
  return coord.row !== lastCoord.row || coord.col !== lastCoord.col;
}

// Step 3: 状态守卫（依赖注入——不依赖 Cocos）
function isPlayingState(stateMachine: GameStateMachine): boolean {
  return stateMachine.getState() === GameState.Playing;
}
```

**Cocos 集成层**（唯一依赖 Cocos 的代码）：

```typescript
// Cocos 组件生命周期——对称注册/解绑
onLoad(): void {
  this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
  this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
  this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
}

onDestroy(): void {
  // 显式解绑——Cocos 最佳实践，防止场景切换后残留监听
  this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
  this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
  this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
  // 清空订阅者列表
  this._subscribers.length = 0;
}

// TOUCH_MOVE 处理——管线入口
onTouchMove(event: EventTouch): void {
  if (!this._active) return;           // 快速路径：未激活直接返回
  // 微信 JSB 环境下 event.touch 可能为 null（系统中断/快速重复触摸）
  if (!event.touch) return;
  const touch = event.touch;

  const uiPos = touch.getUILocation(); // Cocos 3.x 推荐 API

  // 管线处理
  const coord = mapToGrid(uiPos.x, uiPos.y, this._layoutParams);
  if (!coord) return;                  // 越界

  const lastCoord = this._lastCoord;
  if (!shouldFireMove(coord, lastCoord, this._deadZonePx)) return;

  this._lastCoord = coord;
  this._subscribers.forEach(cb => cb(InputEventType.INPUT_MOVE, coord));
}
```

**为什么使用 `touch.getUILocation()` 而非 `touch.getLocation()`**：
- `getUILocation()` 返回 UI 坐标系（原点在 Canvas 左下角）——与网格渲染坐标系一致
- `getLocation()` 返回世界坐标系，多一层转换

### 延迟预算分解

| 步骤 | 预算 | 说明 |
|------|------|------|
| Cocos 事件投递 | ≤16ms | 1 帧内——引擎保证 |
| 坐标映射 + 阈值 | <0.1ms | 纯数学运算 |
| 状态守卫 | <0.01ms | 单次 Map 查找 |
| 回调执行 | <0.1ms | 6 个订阅者（当前仅 1 个——连线引擎） |
| **端到端总计** | **≤50ms** | GDD 目标——包含帧同步等待 |

## Alternatives Considered

### Alternative 1: 内联模式（无管线分离）
- **Description**: 输入管理器在一个 `onTouchMove` 方法中内联坐标映射、阈值判断、状态守卫，直接调用引擎接口
- **Pros**: 零抽象开销——延迟最低（<0.1ms 额外开销）；代码最少（~60 行）
- **Cons**: 无法单独测试坐标映射（必须 mock Cocos EventTouch）；阈值逻辑与坐标映射耦合——改阈值就要动整个 touch handler；延迟瓶颈不可定位（所有逻辑在一个函数中）
- **Rejection Reason**: GDD 要求核心逻辑 80%+ 测试覆盖率。内联模式使得坐标映射和阈值过滤无法脱离 Cocos 测试——这违反了 ADR-001 确立的"纯 TypeScript 可测"原则

### Alternative 2: Cocos EventTarget 链式分发
- **Description**: 使用 Cocos 内置 `EventTarget` 将每步处理作为独立事件节点——touch → map(target) → filter(target) → guard(target) → engine
- **Pros**: 每步独立 EventTarget，新增处理步骤（如双击检测）只需插入新节点
- **Cons**: 依赖 Cocos 运行时——无法纯 TypeScript 测试；EventTarget 调度引入额外帧延迟（每层 ~0.5ms）；4 个 EventTarget 节点增加内存和管理开销
- **Rejection Reason**: 与 ADR-001 的 EventTarget 否决理由一致——"4 步处理的简单管线"用 Cocos EventTarget 是过度设计。纯函数管线更轻量、更可测、更易调试

### Alternative 3: 引擎直接监听触摸（无输入管理器）
- **Description**: 连线引擎直接在 Cocos Node 上注册 TOUCH_MOVE，绕过输入管理器
- **Pros**: 零中间层——引擎直接拿到触摸事件；架构最简单
- **Cons**: 引擎与 Cocos API 耦合——无法脱离引擎测试连线逻辑；坐标映射逻辑进入引擎（违反单一职责——引擎不应关心屏幕坐标系）；未来如添加手势（双击暂停）需修改引擎代码
- **Rejection Reason**: 输入管理器是引擎的"数据净化层"——它将平台相关的像素坐标转为平台无关的网格坐标。省略这一层会让引擎依赖 Cocos 的具体 API，破坏架构分层

## Consequences

### Positive
- 管线每步为纯函数——坐标映射、阈值过滤、状态守卫均可独立单元测试，不依赖 Cocos 运行时
- 延迟预算可验证——每步有明确的性能预算，`performance.now()` 打点可精确定位瓶颈
- 引擎与触控 API 解耦——引擎只接收 `INPUT_MOVE(row, col)`，不关心坐标来自触摸、鼠标还是自动化测试
- 扩展点清晰——新增手势（如双击放大）只需在管线中插入新步骤，不触及其他步骤

### Negative
- 增加抽象层——IInputManager 接口 + 管线步骤 ≈ 120 行（vs 内联模式的 60 行）
- 订阅者模式引入回调开销——虽然当前仅 1 个订阅者（连线引擎），回调数组遍历是微小固定成本
- TOUCH_END 时 `_lastCoord` 需重置——管线状态机（Idle ↔ Dragging）增加少量复杂性

### Risks
- `touch.getUILocation()` 在部分旧版微信客户端中可能返回不精确的 UI 坐标
  - **缓解**: 在微信开发者工具 + 真机（Android 低端机）上验证坐标映射精度；若偏差 >1 格，回退到手动 UI 坐标转换
- `Node.EventType.TOUCH_MOVE` 在微信小游戏中可能因线程调度丢帧（低频设备 <30fps）
  - **缓解**: 管线只负责透传事件——若一帧内手指从 (0,0) 跳到 (0,3)，管线仅发出 INPUT_MOVE(0,3)。**引擎侧（ADR-002）必须实现 Bresenham 插值**填充跳过的格子 (0,1) 和 (0,2)。此责任边界明确定义在本 ADR 中
- 管线当前假设 `setLayoutParams()` 在首次 TOUCH_START 前已调用——若引擎初始化异步延迟，触摸事件可能早到
  - **缓解**: 在 `mapToGrid()` 开头检查 `params` 是否已初始化；未初始化则静默丢弃

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| input-manager.md | TOUCH_START/MOVE/END → 屏幕坐标转网格坐标 (TR-IM-001) | 管线 Step 1 `mapToGrid()` ——纯函数实现 `floor((touchY-originY)/cellSize)` 公式 |
| input-manager.md | 滑动阈值 4px + 多点触摸忽略 + 越界丢弃 (TR-IM-002) | 管线 Step 2 `shouldFireMove()` 网格坐标变化检测；Cocos 集成层 `getTouches().length > 1` 过滤；Step 1 越界返回 null |
| input-manager.md | 端到端延迟 ≤50ms，仅 Playing 态激活 (TR-IM-003) | 延迟预算分解表（总计 ≤50ms）；管线 Step 3 状态守卫 + `setActive()` 快速路径 |
| grid-connection-engine.md | 引擎订阅 INPUT_MOVE 事件 (TR-GCE-002) | 订阅者模式——引擎通过 `subscribe()` 注册回调，输入管理器发布 `INPUT_MOVE(row, col)` |

## Performance Implications
- **CPU**: <0.1ms/帧（管线 4 步全为纯数学运算 + 单次状态查询）
- **Memory**: <1KB（订阅者数组 + `_lastCoord` + `_layoutParams` 缓存）
- **Load Time**: 无（无资源加载）
- **Network**: 无

## Migration Plan
不适用——无现有输入系统需要迁移。

## Validation Criteria
- `mapToGrid(100, 150, {originX:10, originY:10, cellSize:50, rows:5, cols:5})` → `{row: 2, col: 1}`（单元测试）
- `shouldFireMove({row:0, col:1}, {row:0, col:0})` → `true`；相同坐标 → `false`（单元测试）
- 状态机为 Paused 时，TOUCH_MOVE 不产生 INPUT_MOVE 事件
- 手指滑出网格边界（row=-1），该帧无 INPUT_MOVE 事件
- 双指同时触摸，仅处理第一个触点
- `performance.now()` 打点：TOUCH_MOVE 事件到 INPUT_MOVE 回调完成 ≤50ms（微信真机）

## Related Decisions
- ADR-001: 游戏状态机——Playing 状态守卫
- ADR-002 (planned): 网格渲染策略——引擎是 INPUT_MOVE 的唯一消费者
- ADR-004: 平台适配层——输入管理器不依赖平台 API，仅依赖 Cocos Node 事件系统
