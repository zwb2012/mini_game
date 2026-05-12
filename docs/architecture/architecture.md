# 数字连线 (Number Link) — 架构蓝图

## Document Status
- Version: 0.1
- Last Updated: 2026-05-10
- Engine: Cocos Creator 3.8.8
- Stage: Technical Setup — In Progress
- Technical Director Sign-Off: 2026-05-10 — APPROVED (self-review: all layers mapped, deps unidirectional, engine risks flagged, API boundaries documented)
- Lead Programmer Feasibility: — (Lean mode — skipped)

## Engine Knowledge Gap Summary

| 风险 | 域 | 影响系统 |
|------|-----|---------|
| HIGH | WeChat getSystemInfoSync 缓存 (3.8.8) | local-storage |
| MEDIUM | Scene auto-release 行为变更 (3.8.0) | scene-manager |
| NONE | 其他所有域（无物理/Spine/后处理依赖） | 其余 10 个系统 |

## System Layer Map

```
┌─────────────────────────────────────────────┐
│  PRESENTATION LAYER                         │
│  level-select-ui · in-game-hud ·            │
│  level-complete-overlay                     │
├─────────────────────────────────────────────┤
│  FEATURE LAYER                              │
│  step-scoring · hint-system                 │
├─────────────────────────────────────────────┤
│  CORE LAYER                                 │
│  grid-connection-engine                     │
├─────────────────────────────────────────────┤
│  FOUNDATION LAYER                           │
│  level-data-schema · game-state-machine ·   │
│  input-manager · scene-manager ·            │
│  audio-manager · local-storage              │
├─────────────────────────────────────────────┤
│  PLATFORM LAYER                             │
│  Cocos Creator 3.8.8 · WeChat Mini Game SDK │
└─────────────────────────────────────────────┘
```

*依赖方向：上层依赖下层。禁止反向依赖。同层系统通过 Foundation 层的事件总线间接通信。*

---

## Module Ownership

### Foundation Layer

| 模块 | Owns | Exposes | Consumes | Engine APIs |
|------|------|---------|----------|-------------|
| level-data-schema | LevelData JSON 格式、校验规则、Level[] 数组 | `loadLevels()` → `Level[]`, `getLevel(id)` → `Level` | 无 | `resources.load()` |
| game-state-machine | 当前 GameState、转换表、onEnter/onExit 回调 | `getState()`, `transition(event, params)`, `onEnter(state, cb)` | 无 | 无（纯 TS） |
| input-manager | 触摸事件、屏幕→网格坐标映射 | `subscribe(listener)` → INPUT_MOVE/INPUT_END | state-machine (Playing 守卫), engine (gridOrigin/cellSize) | `Node.on(TOUCH_*)` |
| scene-manager | 场景加载/预加载、场景参数传递 | `loadScene(name, params)` | state-machine (onEnter) | `director.loadScene()`, `preloadScene()` |
| audio-manager | AudioSource 实例、静音状态 | `play(eventId)`, `setMuted(bool)`, `isMuted()` | local-storage (静音偏好) | `AudioSource.play()` |
| local-storage | KV 读写、key 命名空间 `nl_` | `getLevelProgress(id)`, `saveLevelProgress(id, data)`, `getSettings()` | 无 | `wx.setStorageSync()` / `cc.sys.localStorage` |

### Core Layer

| 模块 | Owns | Exposes | Consumes | Engine APIs |
|------|------|---------|----------|-------------|
| grid-connection-engine | Cell[][] 网格、当前路径 `path[]`、stepCount、内部状态 (Idle/Drawing/Dirty) | `undo()`, `canUndo()`, `getStepCount()`, `getCurrentNumber()`, `subscribe(event, cb)` | level-data-schema (Level), state-machine (Playing), input-manager (INPUT_MOVE), audio-manager (play) | Canvas 2D `Graphics` |

### Feature Layer

| 模块 | Owns | Exposes | Consumes | Engine APIs |
|------|------|---------|----------|-------------|
| step-scoring | 星级计算、THRESHOLD 常量 | `getStars()`, `getStepCount()`, `onLevelComplete(finalSteps)` | engine (stepCount 推送), level-data-schema (optimalSteps), local-storage (保存) | 无（纯 TS） |
| hint-system | 提示计数器、BFS 算法、箭头状态 (IDLE/COMPUTING/ACTIVE/COOLDOWN) | `getRemaining()`, `useHint()` | engine (Cell[][] 读取 + 箭头渲染), local-storage (计数器) | Canvas 2D 箭头渲染 |

### Presentation Layer

| 模块 | Owns | Exposes | Consumes | Engine APIs |
|------|------|---------|----------|-------------|
| level-select-ui | 按钮网格布局、滚动位置 | 无（触发 SELECT_LEVEL 事件） | local-storage (进度), level-data-schema (关卡列表), state-machine (触发转换) | `ScrollView`, `Button` |
| in-game-hud | 步数显示、按钮状态 | 无（调用 engine/hint API） | step-scoring (步数), engine (undo/canUndo), hint-system (remaining), state-machine (PAUSE) | `Label`, `Button` |
| level-complete-overlay | 星级动画、操作按钮 | 无（触发 NEXT_LEVEL/REPLAY/BACK_TO_MENU） | step-scoring (stars/steps), state-machine (触发转换) | `Label`, `Button`, `tween` |

### Dependency Diagram

```
level-select-ui ──→ local-storage, level-data-schema, state-machine
in-game-hud ──→ step-scoring, engine, hint-system, state-machine
level-complete-overlay ──→ step-scoring, state-machine
    │
    ├── Feature ─────────────────────────────────────
    │   step-scoring ──→ engine, level-data-schema, local-storage
    │   hint-system ──→ engine, local-storage
    │       │
    │       ├── Core ────────────────────────────────
    │       │   grid-connection-engine ──→ level-data-schema, state-machine,
    │       │       input-manager, audio-manager
    │       │       │
    │       │       ├── Foundation ──────────────────
    │       │       │   level-data-schema (no deps)
    │       │       │   game-state-machine (no deps)
    │       │       │   input-manager ──→ state-machine, engine
    │       │       │   scene-manager ──→ state-machine
    │       │       │   audio-manager ──→ state-machine, local-storage
    │       │       │   local-storage (no internal deps)
    │       │       │       │
    │       │       │       ├── Platform ───────────
    │       │       │       │   Cocos Creator 3.8.8 + WeChat Mini Game SDK
```

*箭头方向 = 依赖方向（调用者 → 被调用者）。所有依赖均为单向且向下指向更低层级。无循环。*

## Data Flow

### 1. 核心游戏循环（每帧）

```
TouchEvent → input-manager (坐标映射: gridRow = floor((touchY-originY)/cellSize))
  → engine.onInputMove(row, col)
    → Bresenham 插值填充跳过的格子
    → audio-manager.play('TICK')
    → step-scoring 推送 stepCount++
    → HUD 刷新步数显示
    → 检查 allCellsFilled
```

### 2. 通关结算

```
engine 检测 allCellsFilled=true
  → state-machine.transition(LEVEL_COMPLETE)       // 状态: Playing→LevelComplete
  → step-scoring.onLevelComplete(finalStepCount)    // 并行: 计算星级
    → local-storage.saveLevelProgress(id, stars, steps)
    → level-complete-overlay.show(stars, actualSteps, optimalSteps)
```

### 3. 场景切换

```
level-select-ui 触发 SELECT_LEVEL(levelId)
  → state-machine.transition(SELECT_LEVEL, {levelId})
    → scene-manager.loadScene('GameScene', {levelId})
      → engine.onEnter(Playing, {levelId})
        → level-data-schema.getLevel(levelId) → 初始化网格
        → input-manager 激活触摸监听
```

## API Boundaries

### Foundation → Core

| 接口 | 签名 | 契约 |
|------|------|------|
| Level Loader | `loadLevels(): Promise<LevelData>` | 返回全部关卡数据，失败抛异常由调用者处理 |
| State Machine | `transition(event: string, params?: any): void` | 同步执行回调链，非法转换静默忽略 |
| Input Provider | `subscribe(fn: (ev: InputEvent) => void): void` | 仅 Playing 态发出事件，越界坐标已丢弃 |
| Scene Loader | `loadScene(name: string, params?: any): Promise<void>` | 预加载优先，失败回退到 MenuScene |
| Audio Player | `play(eventId: string): void` | 资源缺失时静默降级，防抖合并同帧多次调用 |
| Storage | `getLevelProgress(id): LevelProgress` | key 不存在返回默认值，数据损坏返回默认值 |

### Core → Feature

| 接口 | 签名 | 契约 |
|------|------|------|
| Engine Events | `engine.subscribe('stepChange', (delta: number) => void)` | 推送增量 ±1 |
| Engine Events | `engine.subscribe('levelComplete', (finalSteps: number) => void)` | 与 STATE LEVEL_COMPLETE 并行发出 |
| Engine Query | `engine.getGrid(): Cell[][]` | 只读——返回当前网格快照 |
| Engine Action | `engine.setArrow(data: ArrowData \| null): void` | null = 清除箭头 |

### Feature → Presentation

| 接口 | 签名 | 契约 |
|------|------|------|
| Step Display | `scoring.getStepCount(): number` | 实时值，HUD 每帧或事件驱动刷新 |
| Star Result | `scoring.getResult(): StarResult` | 仅在 LEVEL_COMPLETE 后有效 |
| Hint Status | `hintSystem.getRemaining(): number` | HUD 显示剩余次数 |

## ADR Audit

**现有 ADR**: 0 份。所有架构决策均为本次会话产出，需通过 `/architecture-decision` 逐项正式化。

## Required ADRs

### Must Have（代码启动前必须创建——Foundation + Core 层）

| # | ADR 标题 | 覆盖 TR | 领域 |
|---|---------|---------|------|
| ADR-001 | 游戏状态机架构——事件驱动状态转换 | TR-GSM-* (5) | State |
| ADR-002 | 网格渲染策略——Canvas Graphics vs Sprite | TR-GCE-* (8) | Rendering |
| ADR-003 | 数据流模式——Push 订阅制 vs Pull 轮询 | TR-ALL | Data |
| ADR-004 | 平台适配层——WeChat API 隔离与 Web 回退 | TR-LS-* (3) | Platform |
| ADR-005 | 触控输入管线——延迟预算与坐标映射 | TR-IM-* (3) | Input |

### Should Have（对应系统实现前创建）

| # | ADR 标题 | 覆盖 TR | 领域 |
|---|---------|---------|------|
| ADR-006 | 关卡数据格式与校验策略 | TR-LDS-* (4) | Data |
| ADR-007 | 步数评分公式可配置化 | TR-SS-* (3) | Feature |
| ADR-008 | 提示系统 BFS 路径查找策略 | TR-HS-* (3) | Feature |
| ADR-009 | UI 组件树与数据绑定模式 | TR-UI-* (6) | UI |

### Can Defer（实现时决策）

| # | ADR 标题 | 领域 |
|---|---------|------|
| ADR-010 | 音频资源预加载与降级策略 | Audio |
| ADR-011 | 场景预加载时机与内存管理 | Scene |

## Architecture Principles

1. **Minimalism First（极简优先）** — 每个抽象必须证明其存在价值。能用纯 TypeScript 不用 Cocos 组件，能用色块不用图标，能用图标不用文字（Pillar 4）
2. **Determinism Over Randomness（确定性优先）** — 所有游戏逻辑必须确定可重现。不使用 `Math.random()`，不依赖时间戳做决策（Pillar 1）
3. **Touch-First Design（触控优先）** — 所有交互以触屏为第一目标。最小触控区 44×44px，端到端延迟 ≤50ms（Pillar 3）
4. **Platform Safety（平台安全）** — 微信 API 调用隔离在适配器层。所有 `wx.*` 调用有 Web 降级路径。存储操作假定可随时失败
5. **Data-Driven Tuning（数据驱动调优）** — 所有可配置值外部化到 JSON/Tuning Knobs。修改数值不需要重新编译

## Open Questions

- 微信 Canvas 60fps 渲染稳定性——需触控原型验证（第一优先级）
- 50 关内容制作工作量——是否全部手工（MVP），还是部分 AI 生成
- 激励视频广告 SDK 接入时机——Alpha 层，MVP 阶段仅免费每日提示
- 是否需要关卡进度云同步（wx.setUserCloudStorage）——完整愿景版评估

