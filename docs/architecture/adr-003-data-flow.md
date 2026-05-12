# ADR-003: 数据流模式——Push 订阅制 vs Pull 查询制

## Status
Accepted

## Date
2026-05-11

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Cocos Creator 3.8.8 |
| **Domain** | Data |
| **Knowledge Risk** | LOW — 纯 TypeScript 约定，不依赖任何 Cocos API |
| **References Consulted** | `design/gdd/systems-index.md`, `docs/architecture/architecture.md`, `docs/architecture/adr-001-state-machine.md`, `docs/architecture/adr-004-platform-adapter.md`, `docs/architecture/adr-005-input-pipeline.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | None — 纯架构约定，无引擎行为依赖 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-001 (状态机回调注册模式——已确立 Push 模式) |
| **Enables** | ADR-002 (网格渲染——引擎事件订阅/查询接口), ADR-006 (关卡数据——Pull 模式加载), ADR-007 (步数评分——Push 接收步数事件), ADR-008 (提示系统——Pull 读取网格快照) |
| **Blocks** | Epic `grid-connection-engine` — 引擎的 subscribe/getGrid 接口依赖此 ADR 确定模式；Epic `step-scoring` — 评分系统的 Push 订阅接口依赖此 ADR |
| **Ordering Note** | 必须在 ADR-002 之前 Accept——引擎接口（subscribe/getGrid）需要明确 Push/Pull 约定 |

## Context

### Problem Statement

数字连线的 11 个系统通过多种方式交换数据——状态机用回调（ADR-001）、输入管理器用订阅（ADR-005）、存储用直接调用（ADR-004）、引擎/评分/HUD 间既有点对点通知又有轮询读取。如果每个系统自行决定通信模式，将导致三个问题：

1. **接口混乱**：新系统开发者不知道该暴露 subscribe() 还是 getter()——同一数据可能在一个系统中 Push、在另一个系统中 Pull
2. **调试困难**：数据流向不透明——步数从引擎到 HUD 经过 3 层（engine → scoring → HUD），出 bug 时难以追踪
3. **性能不可控**：Pull 模式被滥用会导致每帧不必要的轮询（11 系统 × N 次 getter = 帧预算碎片化）

需要一条明确的架构规则，划分 Push 和 Pull 的适用场景。

### Constraints
- 11 个系统，最多 3 层依赖深度（Foundation → Core → Feature/UI）
- 所有数据流在当前帧内完成——不涉及异步回调或 Promise
- 微信小游戏内存限制 100MB——订阅者列表必须轻量
- 系统间禁止循环依赖（系统 A Push 到 B，B Push 回 A）

### Requirements
- 定义 Push 和 Pull 各自适用场景的明确规则
- 标准化跨系统接口模式：`subscribe(event, cb)` + `getXxx()` getter
- 禁止 Pull 被用于高频数据（每帧变化的数据必须 Push）
- 禁止同一数据同时暴露 Push 和 Pull 两种消费方式（双重真理源）

## Decision

采用**混合模式（Hybrid Push/Pull）**——Push 用于事件/变化通知，Pull 用于状态查询/快照。规则由一条核心原则驱动：

> **"谁变了就 Push，谁想知道就 Pull。"**
>
> 数据**生产者**负责推送变化事件（Push），数据**消费者**通过 getter 查询当前值（Pull）。
> Push 和 Pull 是互补的，不是互斥的——一个数据可以既有 Push 通知也有 Pull 查询。

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                  数据流规则                                │
│                                                          │
│  ┌─────────────┐         ┌─────────────┐                │
│  │   PUSH       │         │   PULL       │               │
│  │  (subscribe)  │         │  (getter)    │               │
│  ├─────────────┤         ├─────────────┤               │
│  │ 适用：        │         │ 适用：        │               │
│  │ · 事件发生时  │         │ · 需要当前值  │               │
│  │ · 值已改变    │         │ · 调用时计算  │               │
│  │ · 低频→高频   │         │ · 快照/只读   │               │
│  │              │         │              │               │
│  │ 示例：        │         │ 示例：        │               │
│  │ stepCount++  │         │ getGrid()    │               │
│  │ LEVEL_COMPLETE│        │ getStars()   │               │
│  │ state=Paused │         │ getRemaining()│              │
│  │ INPUT_MOVE   │         │ canUndo()    │               │
│  └─────────────┘         └─────────────┘               │
│                                                          │
│  规则 1: 每帧变化的数据必须 Push —— 禁止每帧轮询            │
│  规则 2: Pull 用于"此刻快照" —— 不得缓存跨帧旧值           │
│  规则 3: 同一数据不得同时 Push 和 Pull 给同一消费者          │
└──────────────────────────────────────────────────────────┘
```

### 数据流分类表

每个跨系统数据接口必须在此表中归类：

| 数据 | 生产者 | 消费者 | 模式 | 理由 |
|------|--------|--------|------|------|
| 状态转换（state=Playing） | game-state-machine | engine, scene-mgr, input-mgr, HUD, overlay, audio | **Push** (ADR-001 onEnter/onExit) | 事件——状态值改变时通知所有监听者 |
| 输入事件（INPUT_MOVE） | input-manager | grid-connection-engine | **Push** (ADR-005 subscribe) | 高频事件——每帧可能 0-N 次 |
| 步数变化（stepCount++） | grid-connection-engine | step-scoring | **Push** (subscribe('stepChange')) | 增量——引擎推送 +1/-1 |
| 通关事件（LEVEL_COMPLETE） | grid-connection-engine | state-machine, step-scoring, audio | **Push** (subscribe('levelComplete')) | 一次性事件 |
| 当前步数（stepCount） | step-scoring | in-game-hud | **Pull** (getStepCount()) | 查询——HUD 需要时读取，被动刷新 |
| 星级结果（stars） | step-scoring | level-complete-overlay | **Pull** (getResult()) | 快照——仅在 LEVEL_COMPLETE 后有效 |
| 网格快照（Cell[][]） | grid-connection-engine | hint-system | **Pull** (getGrid()) | 快照——BFS 需要当前完整网格状态 |
| 撤销能力（canUndo） | grid-connection-engine | in-game-hud | **Pull** (canUndo()) | 查询——HUD 每帧检查按钮状态 |
| 关卡数据（Level） | level-data-schema | engine | **Pull** (getLevel(id)) | 一次性加载——不是事件 |
| 关卡进度（LevelProgress） | local-storage | level-select-ui | **Pull** (getLevelProgress(id)) | 查询——界面渲染时读取 |
| 静音偏好（muted） | local-storage | audio-manager | **Pull** (getSettings().muted) | 查询——启动时读一次，设置变更时写一次 |
| 提示剩余数（remaining） | hint-system | in-game-hud | **Pull** (getRemaining()) | 查询——HUD 显示时读取 |

### Key Interfaces

**Push 模式标准接口**（参考 ADR-001 onEnter/onExit、ADR-005 subscribe）：

```typescript
/**
 * Push 接口约定：
 * - 生产者暴露 subscribe(event, callback): () => void
 * - 返回值为 unsubscribe 函数
 * - 回调同步执行，按注册顺序
 * - 回调不得修改生产者内部状态（只读回调）
 */
interface PushExample {
  /** 订阅事件。返回取消订阅函数。 */
  subscribe(event: string, callback: (data: any) => void): () => void;
}
```

**Pull 模式标准接口**：

```typescript
/**
 * Pull 接口约定：
 * - 生产者暴露 getXxx(): T 同步方法
 * - 返回值为当前快照——不可被调用者修改（返回只读或副本）
 * - 不得有副作用——getter 不触发状态变更
 * - 不得在 getter 内执行重计算（超过 1ms）——重计算应缓存或 Push
 */
interface PullExample {
  /** 获取当前值——同步，无副作用，<1ms */
  getStepCount(): number;
}
```

### 规则详解

**规则 1：每帧变化的数据必须 Push**

数据在单帧内可能多次变化（如 stepCount 每格填充 +1）→ 禁止消费者每帧 `getStepCount()` 轮询。生产者必须推送增量事件（`subscribe('stepChange', delta => ...)`），消费者自行维护本地缓存。此规则防止 60fps × N 消费者 的无意义轮询开销。

**规则 2：Pull 仅用于调用时的快照**

`getGrid()` 返回的是调用时刻的 Cell[][] 引用或浅拷贝。调用者不得缓存此引用跨帧使用——下一帧生产者可能修改了内部状态。需要持续跟踪的变化 → 使用 Push。

**规则 3：同一数据不得同时 Push 和 Pull 给同一消费者**

防止"双重真理源"——如果 HUD 既订阅 `stepChange`（Push）又调用 `getStepCount()`（Pull），当两者不一致时无法判断哪个是正确的。一个消费者对一个数据只能选一种模式。

**规则 4：Push 回调不得修改生产者状态**

Push 回调是只读消费者——回调中调用生产者的 setter 或 transition() 会导致重入（reentrancy）。已由 ADR-001 的 `_isTransitioning` 守卫覆盖。所有 ADR 必须遵守此约束。

### 层级间的默认模式

| 层级方向 | 默认模式 | 例外 |
|----------|----------|------|
| Foundation → Core | **Pull**（加载配置/数据）+ **Push**（状态/输入事件） | 输入事件高频必须 Push |
| Core → Feature | **Push**（游戏事件） | 网格快照 Pull |
| Feature → Presentation | **Pull**（显示值查询） | 无 |
| Presentation → Foundation | **Push**（用户操作触发状态转换） | 通过状态机 transition() 间接 Push |

## Alternatives Considered

### Alternative 1: 全 Push 模式（Event Sourcing 风格）
- **Description**: 所有跨系统数据通过事件推送——引擎不暴露 `getGrid()`，HUD 不调用 `getStepCount()`。每个系统仅在初始化时订阅所需事件，内部维护本地状态副本
- **Pros**: 数据流完全可追踪——所有状态变更都有事件日志；系统完全解耦——消费者不持有生产者引用；天然支持"回放"调试
- **Cons**: 本地状态副本冗余——HUD 需要缓存 stepCount、currentNumber、canUndo、remaining 等 6+ 个值的本地副本；启动时需要"状态快照事件"初始化所有本地副本——复杂度爆炸；对于 11 系统的游戏，全事件溯源是极端过度设计
- **Rejection Reason**: 11 个系统的游戏不需要 event sourcing。本地状态副本的维护成本超过其收益——尤其是 Pull 数据（如 `getGrid()` 返回 Cell[][]）每次复制整个网格的事件开销（100 格 × JSON 序列化）不可接受

### Alternative 2: 全 Pull 模式（MVC 风格）
- **Description**: 所有数据通过 getter 读取——HUD 每帧 `getStepCount()`，引擎每帧检查 `getState()`。无订阅，无回调，纯查询
- **Pros**: 实现最简单——每个系统只暴露 getter，消费者按需调用；无回调注册/解绑生命周期管理；调试时调用栈清晰
- **Cons**: 高频数据（stepCount 60fps 变化）导致不必要的轮询——HUD 每帧 3 次 getter × 60fps = 180 次/秒无效调用；轮询时机不可控——可能在生产者修改状态中途读到不一致的中间值；违反 GDD 架构原则——GDD 明确要求引擎"推送"步数变化和通关事件
- **Rejection Reason**: 轮询开销虽然小（每次 getter <0.01ms），但架构上轮询无法保证读到一致状态——生产者在同一帧内多次修改状态时，消费者读到的是不确定的中间值。Push 将"何时读取"的控制权交给最了解数据一致性的生产者

### Alternative 3: 全局 EventBus（Mediator 模式）
- **Description**: 中央 EventBus 单例——所有系统通过 `EventBus.emit('stepChange', delta)` 和 `EventBus.on('stepChange', cb)` 通信
- **Pros**: 系统间零直接依赖——引擎不 import HUD，HUD 不 import 引擎
- **Cons**: 事件名字符串无类型安全；无法追溯"谁在监听什么"——调试困难；对 4 状态 11 系统的游戏增加一层不必要的中间层
- **Rejection Reason**: 与 ADR-001 否决 EventBus 的理由一致——"对极简益智游戏，EventBus 增加了复杂度而没有对应收益"。直接 subscribe() 模式（每个系统暴露自己的订阅接口）已经足够解耦

## Consequences

### Positive
- 接口模式标准化——新增系统时，开发者根据"事件 vs 查询"规则即可确定暴露 subscribe() 还是 getter()
- 数据流可审计——从数据分类表一眼可见每个数据从哪来、到哪去、用什么模式
- 性能可预测——Push 的高频数据不会被 Pull 轮询浪费 CPU；Pull 的快照数据不会产生不必要的回调链
- 与已有 ADR 一致——ADR-001（Push 回调）、ADR-004（Pull 直接调用）、ADR-005（Push 订阅）均符合本 ADR 的规则

### Negative
- 需要人为判断——"这是事件还是查询？"在某些边界情况下可能模糊（如 `canUndo()`——当前是 Pull，但如果频率升高可能需要 Push）
- 双重模式存在——同一个数据可能被系统 A Push 订阅、系统 B Pull 查询——接口同时暴露 subscribe() 和 getter() 增加 API 表面积

### Risks
- 开发者错误地将高频数据暴露为 Pull→ 消费者每帧轮询导致性能退化
  - **缓解**: Code review checklist——任何新增 getter() 必须注明预期的调用频率；架构审查时检查是否有"可 Push 但设计了 Pull"的接口
- Push 回调链过长——A Push → B Push → C Push → D，4 层回调链导致单帧延迟 >1ms
  - **缓解**: 当前数据流分类表中最大深度为 2 层（engine → scoring → HUD）。禁止超过 3 层的 Push 链——第 4 层必须 Pull
- Pull 返回值被调用者缓存跨帧使用，导致显示过期数据
  - **缓解**: getter 方法文档注释标注 `@returns 当前快照——不得缓存跨帧使用`

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| grid-connection-engine.md | 引擎推送 stepCount 和 LEVEL_COMPLETE (TR-GCE-005) | 确定为 Push——引擎通过 subscribe() 推送事件 |
| step-scoring.md | 评分接收引擎步数变化 (TR-SS-001) | 确定为 Push——评分订阅 'stepChange' 事件 |
| in-game-hud.md | HUD 读取 stepCount 显示 (TR-UI-003) | 确定为 Pull——HUD 通过 getStepCount() 读取当前值 |
| level-complete-overlay.md | 结算弹窗读取评分结果 (TR-UI-005) | 确定为 Pull——弹窗通过 getResult() 读取最终星级 |
| hint-system.md | 提示读取网格快照 (TR-HS-002) | 确定为 Pull——BFS 通过 getGrid() 读取当前 Cell[][] |

## Performance Implications
- **CPU**: 无额外开销——Push 由生产者直接调用回调（无中间层），Pull 为同步 getter（<0.01ms）
- **Memory**: 0——纯约定，无运行时基础设施
- **Load Time**: 无
- **Network**: 无

## Migration Plan
不适用——项目尚无实现，所有系统在实现时直接遵守此 ADR 的接口约定。

## Validation Criteria
- 每个跨系统接口的 Push/Pull 模式与数据流分类表一致
- 无高频数据（每帧变化）暴露为 Pull
- 无数据同时 Push 和 Pull 给同一消费者
- Push 回调链深度 ≤ 2 层（当前所有数据流满足）
- 所有 Push 接口返回 unsubscribe 函数

## Related Decisions
- ADR-001: 游戏状态机——onEnter/onExit 为 Push 模式（回调注册）
- ADR-002 (planned): 网格渲染策略——引擎接口必须遵守 Push/Pull 约定
- ADR-004: 平台适配层——存储为 Pull 模式（直接调用）
- ADR-005: 触控输入管线——输入为 Push 模式（subscribe）
