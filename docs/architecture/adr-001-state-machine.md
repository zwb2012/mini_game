# ADR-001: 游戏状态机架构

## Status
Accepted

## Date
2026-05-10

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Cocos Creator 3.8.8 |
| **Domain** | Core / State |
| **Knowledge Risk** | LOW — 纯 TypeScript 逻辑，不依赖 Cocos API 变更 |
| **References Consulted** | `design/gdd/game-state-machine.md`, `docs/architecture/architecture.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | 微信切后台自动 PAUSE 行为需在真机验证 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None |
| **Enables** | ADR-002 (网格渲染策略——引擎需 Playing 状态守卫), ADR-003 (数据流模式——状态转换触发事件推送) |
| **Blocks** | None |
| **Ordering Note** | 必须最先实现——所有 Core 和 Feature 层系统依赖状态机判断当前游戏阶段 |

## Context

### Problem Statement
数字连线游戏有 4 个互斥的运行时阶段（Menu、Playing、Paused、LevelComplete），6 个系统需要响应阶段变化。必须选择一个状态管理模式，确保状态转换正确、回调执行顺序确定、非法转换被阻止。

### Constraints
- 微信小游戏环境下运行——必须轻量，无外部依赖
- 4 个状态，8 条合法转换（MVP）
- 6 个监听系统：grid-connection-engine、in-game-hud、scene-manager、input-manager、level-complete-overlay、audio-manager
- 微信切后台事件需自动触发 PAUSE
- 回调必须同步执行——不允许异步回调导致的状态不一致窗口

### Requirements
- 状态转换必须原子化（回调链中不允许状态被再次修改）
- 非法转换静默忽略 + console.warn（不抛异常）
- 同一状态重复转换（如 Playing → Playing）必须无副作用
- 快速连续触发两次转换时，第二次必须排队等待第一次回调链完成
- 状态机销毁后拒绝所有后续转换

## Decision

采用**回调注册模式**——状态机在内部维护 `Map<GameState, Set<callback>>`，系统通过 `onEnter(state, callback)` 和 `onExit(state, callback)` 注册监听。状态转换时，按注册顺序同步执行所有回调。

### Architecture Diagram

```
                    ┌──────────────────────────┐
                    │     GameStateMachine      │
                    │                           │
                    │  currentState: GameState  │
                    │  listeners: Map<...>      │
                    │  destroyed: boolean       │
                    │                           │
                    │  transition(event, params)│
                    │  onEnter(state, cb)       │
                    │  onExit(state, cb)        │
                    │  getState(): GameState    │
                    └──────────┬───────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
    ┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
    │    Engine    │  │  Scene Mgr   │  │  Input Mgr   │
    │ onEnter(Play)│  │ onEnter(Menu)│  │ (reads state)│
    │ → init grid  │  │ → load Menu  │  │              │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                  │                  │
    ┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
    │     HUD      │  │   Overlay    │  │    Audio     │
    │ onEnter(Play)│  │ (triggers    │  │ onEnter(LC)  │
    │ → show UI    │  │  NEXT_LEVEL) │  │ → play sfx   │
    └──────────────┘  └──────────────┘  └──────────────┘
```

### Key Interfaces

```typescript
enum GameState {
  Menu = 'Menu',
  Playing = 'Playing',
  Paused = 'Paused',
  LevelComplete = 'LevelComplete',
}

type StateCallback = (prevState: GameState, params?: any) => void;

class GameStateMachine {
  getState(): GameState;

  // 触发状态转换。非法转换静默忽略 + console.warn。
  // params 传递给回调（如 SELECT_LEVEL 携带 {levelId: number}）
  transition(event: string, params?: any): void;

  // 注册进入/退出回调。返回 unsubscribe 函数。
  onEnter(state: GameState, cb: StateCallback): () => void;
  onExit(state: GameState, cb: StateCallback): () => void;

  // 销毁状态机——清除所有监听器，拒绝后续转换
  destroy(): void;
}
```

**合法转换表**：

| 当前状态 | 事件 | 目标状态 | 条件 | 参数 |
|----------|------|----------|------|------|
| Menu | SELECT_LEVEL | Playing | levelId 有效 | {levelId: number} |
| Playing | PAUSE | Paused | — | — |
| Paused | RESUME | Playing | — | — |
| Paused | QUIT_TO_MENU | Menu | — | — |
| Playing | LEVEL_COMPLETE | LevelComplete | — | — |
| LevelComplete | NEXT_LEVEL | Playing | 存在 levelId+1 | {levelId: number} |
| LevelComplete | REPLAY | Playing | — | {levelId: number} |
| LevelComplete | BACK_TO_MENU | Menu | — | — |

## Alternatives Considered

### Alternative 1: 事件总线 (Event Bus)
- **Description**: 中央 EventBus，系统通过 `bus.on('state:Playing:enter', cb)` 订阅
- **Pros**: 松耦合——系统不直接依赖状态机；易于添加新消费者而不修改状态机代码
- **Cons**: 事件名字符串无类型安全；调试困难（无法追踪谁订阅了什么）；增加一层抽象——对于仅 4 状态 6 消费者的游戏，过度设计
- **Rejection Reason**: 数字连线是极简益智游戏（Pillar 4），状态模型简单。事件总线增加了复杂度而没有对应收益。4 状态 × 6 消费者 = 最多 24 个回调注册——直接在状态机内部管理更清晰

### Alternative 2: Cocos EventTarget
- **Description**: 使用 Cocos 内建的 `EventTarget` 作为事件分发机制
- **Pros**: Cocos 原生支持；与 Cocos 节点系统集成
- **Cons**: 依赖 Cocos 运行时——状态机无法脱离 Cocos 进行单元测试；EventTarget 是通用事件系统，不提供状态转换守卫或非法转换检测
- **Rejection Reason**: 状态机逻辑应该可脱离引擎测试（纯 TypeScript 单元测试）。GDD 要求 80%+ 核心逻辑测试覆盖率——使用 Cocos EventTarget 会使测试依赖 Cocos 运行时环境

### Alternative 3: 有限状态机库 (XState 等)
- **Description**: 使用成熟的 FSM 库管理状态和转换
- **Pros**: 功能完整（守卫、并行状态、历史状态）；社区验证
- **Cons**: 增加包体积（~12KB min+gzip）；对 4 状态 8 转换的游戏过度设计；微信小游戏 2MB 包体限制敏感
- **Rejection Reason**: 违反 Pillar 4（越简单越好）。加入一个比游戏本身状态模型还复杂的库是不合理的

## Consequences

### Positive
- 纯 TypeScript 实现——零外部依赖，<200 行代码，可脱离引擎单元测试
- 回调注册模式直观——系统在初始化时注册，状态转换时自动触发
- 同步执行保证回调顺序确定——调试和推理状态转换行为简单
- 非法转换静默忽略——不会因 UI 竞态而崩溃

### Negative
- 回调按注册顺序同步执行——一个回调抛异常会阻止后续回调（已通过 try-catch 包装缓解）
- 状态机本身不感知"世界状态"——只能通过回调间接触发系统行为，无法验证转换是否产生了预期效果
- 没有状态历史——不支持"回到上一个状态"（当前设计不需要）

### Risks
- 微信切后台自动 PAUSE 行为依赖 WeChat `onHide` 回调——可能在某些微信版本不一致
  - **缓解**: 在 engine 的 onEnter(Paused) 中保存当前路径状态，onEnter(Playing) 中恢复
- 回调中抛异常可能使系统处于不一致状态
  - **缓解**: 每个回调包裹 try-catch；异常被 console.error 记录但不阻止后续回调

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| game-state-machine.md | 4 状态定义 (TR-GSM-001) | `GameState` 枚举精确映射 Menu/Playing/Paused/LevelComplete |
| game-state-machine.md | 8 条合法转换 (TR-GSM-002) | `transition()` 方法内建转换表，含条件和参数 |
| game-state-machine.md | onEnter/onExit 回调 (TR-GSM-003) | `onEnter()`/`onExit()` API + 同步按序执行 |
| game-state-machine.md | 非法转换忽略 + 微信后台 PAUSE (TR-GSM-004) | 转换守卫 + WeChat `onHide` 监听 |
| grid-connection-engine.md | Playing 态守卫 (TR-GCE-001) | 引擎注册 onEnter(Playing)，仅在该状态下初始化/运行 |
| input-manager.md | Playing 态激活 (TR-IM-003) | 输入管理器在事件处理前调用 `getState()` 守卫 |
| scene-manager.md | 状态驱动场景切换 (TR-SM-001) | 场景管理器注册 onEnter(Menu/Playing) 回调 |
| level-complete-overlay.md | NEXT_LEVEL/REPLAY/BACK_TO_MENU (TR-UI-006) | 转换表包含 REPLAY 事件，末关可重玩 |

## Performance Implications
- **CPU**: <0.01ms per transition（同步回调链，6 个消费者各执行简单操作）
- **Memory**: <1KB（回调 Map + 当前状态变量）
- **Load Time**: 无影响（纯逻辑，无资源加载）
- **Network**: 无

## Migration Plan
不适用——这是项目首个架构决策，无现有代码需要迁移。

## Validation Criteria
- 所有 8 条合法转换的单元测试通过
- 非法转换请求被静默忽略 + console.warn 输出
- 快速连续转换（<16ms 间隔）排队正确执行
- 状态机 destroy() 后所有后续 transition() 被拒绝
- 微信开发者工具中验证 onHide → PAUSE 自动触发

## Related Decisions
- ADR-002: 网格渲染策略（引擎依赖 Playing 状态守卫）
- ADR-003: 数据流模式（状态转换触发事件推送）
