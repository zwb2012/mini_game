# Control Manifest

> **Engine**: Cocos Creator 3.8.8
> **Last Updated**: 2026-05-11
> **Manifest Version**: 2026-05-11
> **ADRs Covered**: ADR-001, ADR-002, ADR-003, ADR-004, ADR-005
> **Status**: Active — regenerate with `/create-control-manifest` when ADRs change

---

## Foundation Layer Rules

*Applies to: game-state-machine, input-manager, scene-manager, local-storage, audio-manager*

### Required Patterns

- **状态机使用回调注册模式**：`onEnter(state, cb)` / `onExit(state, cb)` 注册监听，`transition(event, params)` 触发转换。回调返回 unsubscribe 函数。— source: ADR-001
- **回调同步按序执行**：每个回调包裹 try-catch——一个回调抛异常不阻塞后续回调。— source: ADR-001
- **非法转换静默忽略 + console.warn**：不抛异常。同一状态重复转换无副作用。— source: ADR-001
- **状态机销毁后拒绝所有后续转换**：`transition()` 调用前检查 `destroyed` 标记。— source: ADR-001
- **微信切后台自动 PAUSE**：监听 `wx.onHide` 回调，触发 `transition('PAUSE')`。恢复前台时引擎从 onEnter(Playing) 恢复路径状态。— source: ADR-001
- **数据流遵守 Push/Pull 分类表**：谁变了就 Push（subscribe），谁想知道就 Pull（getter）。事件/变化通知 = Push，状态查询/快照 = Pull。每帧变化的数据必须 Push。— source: ADR-003
- **Push 模式标准接口**：`subscribe(event, callback): () => void`。返回 unsubscribe 函数。回调同步执行，按注册顺序。回调不得修改生产者状态（只读）。— source: ADR-003
- **Pull 模式标准接口**：`getXxx(): T`。同步、无副作用、<1ms。返回当前快照——调用者不得缓存跨帧使用。— source: ADR-003
- **平台存储使用 IPlatformStorage 接口**：业务代码只依赖接口，不直接调用 `wx.*` 或 `cc.sys.localStorage`。— source: ADR-004
- **平台检测在模块加载时完成**：`createPlatformStorage()` 一次检测 `sys.platform`，后续调用零分支开销。— source: ADR-004
- **微信 Storage 双重守卫**：`sys.platform === sys.Platform.WECHAT_GAME` + `typeof wx !== 'undefined'` 双重校验。— source: ADR-004
- **Storage 写入包裹 try-catch**：存储满或数据损坏时 catch 异常、`console.error`、游戏不崩溃。— source: ADR-004
- **输入管线模式**：触摸事件按序流经 4 个独立处理步骤——坐标映射 → 滑动阈值过滤 → Playing 状态守卫 → 发布给订阅者。每步为纯函数，可脱离 Cocos 单元测试。— source: ADR-005
- **使用 touch.getUILocation()**（非 getLocation()）：UI 坐标系与网格渲染坐标系一致。调用前检查 `event.touch` 非 null（微信 JSB 环境已知边界）。— source: ADR-005
- **订阅者遍历使用 .slice() 快照**：`this._subscribers.slice().forEach(cb => cb(...))`——防止回调中 unsubscribe 导致跳过元素。— source: ADR-005
- **onDestroy 显式解绑 Cocos 触摸事件**：`node.off(Node.EventType.TOUCH_*)`，清空订阅者数组。— source: ADR-005

### Forbidden Approaches

- **禁用全局 EventBus 替代状态机回调**：对 4 状态 11 系统的极简游戏，EventBus 增加概念复杂度而无对应收益。— source: ADR-001
- **禁用 Cocos EventTarget 作为状态分发机制**：依赖 Cocos 运行时——状态机无法脱离引擎单元测试。— source: ADR-001
- **禁用 XState 等外部状态机库**：增加 ~12KB 包体，违反 Pillar 4（越简单越好）。— source: ADR-001
- **禁止全 Push 模式（Event Sourcing）**：本地状态副本冗余；大型快照（如 Cell[][] 100 格）的事件序列化开销不可接受。— source: ADR-003
- **禁止全 Pull 模式（每帧轮询）**：高频数据（stepCount 60fps 变化）轮询无法保证读到一致状态。— source: ADR-003
- **禁止全局 EventBus（Mediator）**：事件名字符串无类型安全；无法追溯订阅关系。直接 subscribe() 已足够解耦。— source: ADR-003
- **禁止同一数据同时 Push 和 Pull 给同一消费者**：防止双重真理源。一个消费者对一个数据只能选一种模式。— source: ADR-003
- **禁止条件分支模式（if wx）内联到业务逻辑**：平台代码应与业务逻辑隔离。存储策略（防抖、容量管理）不得与平台判断混杂。— source: ADR-004
- **禁止仅使用 cc.sys.localStorage（绕过适配层）**：微信环境下 `sys.localStorage` 底层实现不透明——可能使用内存存储导致进程被杀后数据丢失。— source: ADR-004

### Performance Guardrails

- **状态转换**: <0.01ms/次（6 个消费者各执行简单操作）— source: ADR-001
- **输入管线**: <0.1ms/帧（4 步全为纯数学运算）— source: ADR-005
- **端到端触控延迟**: ≤50ms（手指触屏到引擎收到 INPUT_MOVE）— source: ADR-005

---

## Core Layer Rules

*Applies to: grid-connection-engine*

### Required Patterns

- **使用 cc.Graphics.rect() + fill() 绘制所有填充**：`fillRect` 在 3.x 已移除。使用 `rect(x,y,w,h)` + `fill()` 替代。`stroke()` 同理——`moveTo()` + `lineTo()` + `stroke()`。— source: ADR-002
- **Label 使用嵌入式 TTF 字体**（非 SystemFont）：SystemFont 在 3.8.8 中不可合批——每个 Label 生成独立纹理。TTF 字体（数字+拉丁字符，~100-200KB）使所有 Label 共享纹理，合批为 1 draw call。— source: ADR-002
- **脏标记机制**：引擎 update() 中仅在 `_renderDirty === true` 时重绘。标记脏的事件：INPUT_MOVE、onEnter(Playing)、提示箭头显示/消失、通关闪烁。闲置帧零重绘。— source: ADR-002
- **LabelPool 生命周期绑定 Component**：在 `onLoad()` 创建 LabelPool + 加载 TTF 字体；在 `onDestroy()` 调用 `labelPool.destroy()` 清理所有 Label 节点——防止场景切换后孤儿节点泄漏。— source: ADR-002
- **颜色常量预创建**：`LINE_COLORS`、`COLOR_NODE_DIM` 等在模块顶层创建。渲染循环中直接赋值 `graphics.fillColor = LINE_COLORS[n]`——不 `new Color()`。— source: ADR-002
- **6 色色盲友好色板**：红 #E03E2D / 蓝 #2196F3 / 绿 #4CAF50 / 橙 #FF9800 / 紫 #9C27B0 / 青 #00BCD4。色盲模拟器（protanopia/deuteranopia/tritanopia）验证可区分。— source: ADR-002
- **cellSize 自动计算**：`min(floor((canvasW-2*margin)/cols), floor((canvasH-2*margin)/rows), 120)`。保底 ≥44px（最小触控区域）。— source: ADR-002
- **Bresenham 插值由引擎实现（非输入管理器）**：输入管线只负责透传事件——快速滑动跳格由引擎侧填充。— source: ADR-005（责任边界）
- **引擎事件通过 subscribe 暴露**：`engine.subscribe('stepChange', delta => ...)` / `engine.subscribe('levelComplete', finalSteps => ...)`。— source: ADR-003
- **网格快照通过 Pull 暴露**：`engine.getGrid(): Cell[][]` 返回只读快照。调用者不得缓存跨帧使用。— source: ADR-003
- **撤销接口 Pull 模式**：`engine.canUndo(): boolean` — HUD 每帧查询按钮状态。— source: ADR-003

### Forbidden Approaches

- **禁止每格一个 Sprite Node**：100 格 = 100 Node + 100 Sprite ≈ 80KB 仅节点开销 + 纹理包体。违反 Pillar 4。— source: ADR-002
- **禁止 RenderTexture 离屏缓存**：~200KB 额外 GPU 内存 + 微信低端设备兼容性不稳定。100 格全量重绘优化收益微乎其微。— source: ADR-002
- **禁止 SystemFont Label**：在 3.8.8 中不可合批——15 个数字 ≈ 15 draw call。必须使用 TTF 字体。— source: ADR-002
- **禁止渲染循环中 new Color()**：临时对象增加 GC 压力。使用预创建颜色常量。— source: ADR-002
- **禁止 LabelPool 在无 onDestroy 绑定的情况下使用**：场景切换时 Label 节点不会自动清理。— source: ADR-002
- **禁止引擎直接监听 Cocos 触摸事件**：引擎只接收 `INPUT_MOVE(row, col)`——不关心坐标来自触摸、鼠标还是自动化测试。— source: ADR-005

### Performance Guardrails

- **Graphics draw call**: 5-11（网格线 stroke + 障碍 fill + 多色填充 + 路径 stroke + 箭头 fill+stroke）— source: ADR-002
- **Label draw call**: 1（TTF 合批，所有数字共享纹理）— source: ADR-002
- **总 draw call**: <20 — source: ADR-002
- **CPU**: 脏重绘 <2ms（中高端设备）/ 8-12ms（低端 Android）— source: ADR-002
- **内存**: <10KB（Graphics + Cell[][] + path[]）+ TTF 字体 ~100-200KB — source: ADR-002

---

## Feature Layer Rules

*Applies to: step-scoring, hint-system*

### Required Patterns

- **步数评分接收引擎 Push 事件**：`subscribe('stepChange', delta => ...)` + `subscribe('levelComplete', finalSteps => ...)`。— source: ADR-003
- **星级结果通过 Pull 暴露**：`getStepCount(): number` / `getResult(): StarResult`（仅在 LEVEL_COMPLETE 后有效）。— source: ADR-003

### Forbidden Approaches

- **禁止评分系统直接读取引擎内部状态**：不通过 `engine._stepCount` 访问私有字段——必须通过 subscribe 订阅。— source: ADR-003
- **禁止 Push 回调链超过 2 层**：engine → scoring → HUD 为最大深度（2 层）。第 4 层必须 Pull。— source: ADR-003

---

## Presentation Layer Rules

*Applies to: level-select-ui, in-game-hud, level-complete-overlay*

### Required Patterns

- **HUD 步数通过 Pull 读取**：`scoring.getStepCount()` 实时值——HUD 按需刷新，非轮询。— source: ADR-003
- **撤销按钮使用 Pull 查询可用状态**：`engine.canUndo()` 控制按钮灰色/可点击。— source: ADR-002
- **结算弹窗通过 Pull 读取星级**：`scoring.getResult()` 快照——仅在 LEVEL_COMPLETE 后有效。— source: ADR-003
- **UI 按钮触发状态转换**：通过 `stateMachine.transition(event, params)` 驱动——不直接调用引擎或场景管理器。— source: ADR-001
- **所有触控区域 ≥44×44px**（微信无障碍标准）。— source: technical-preferences

### Forbidden Approaches

- **禁止 UI 系统直接调用引擎内部方法而不通过公共接口**：所有交互通过 engine.undo()、engine.canUndo()、scoring.getStepCount() 等公共 API。— source: ADR-003
- **禁止 Pull 返回值缓存跨帧使用**：getter 方法文档注释标注"当前快照——不得缓存跨帧使用"。— source: ADR-003

### Performance Guardrails

- **Label 合批**：使用相同 TTF 字体的所有 Label 共享纹理——Cocos 2D 渲染器自动合批。— source: ADR-002
- **闲置帧零渲染**：脏标记机制——UI 值变化时才刷新（事件驱动，非每帧）。— source: ADR-002

---

## Global Rules (All Layers)

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes / Components | PascalCase | `GridConnectionEngine` |
| Methods / Variables | camelCase | `moveSpeed`, `takeDamage()` |
| Private fields | `_camelCase` | `_renderDirty`, `_labels` |
| Files | PascalCase (match class name) | `GridConnectionEngine.ts` |
| Scenes / Prefabs | PascalCase | `GameScene.scene`, `LevelButton.prefab` |
| Interfaces | PascalCase, `I` prefix optional | `IGridRenderer`, `LevelData` |
| Constants | UPPER_SNAKE_CASE | `LINE_COLORS`, `DEAD_ZONE_PX` |
| Decorators | `@ccclass`, `@property` | — |
| Events | UPPER_SNAKE_CASE | `LEVEL_COMPLETE`, `INPUT_MOVE` |

### Performance Budgets

| Target | Value |
|--------|-------|
| Framerate | 60fps |
| Frame budget | 16.6ms |
| Draw calls | <20 |
| Memory ceiling | 100MB (WeChat Mini Game) |
| Package size | <2MB (WeChat Mini Game) |

### Engine API Constraints (Cocos Creator 3.8.8)

#### Forbidden APIs — Deprecated / Removed

These APIs must NOT be used in any layer:

| Deprecated API | Replacement | Notes |
|---------------|-------------|-------|
| `cc.Graphics.fillText()` / `strokeText()` | `cc.Label` component | Removed in 3.x — text rendering ONLY via Label |
| `cc.Graphics.fillRect()` | `graphics.rect()` + `graphics.fill()` | Removed in 3.x |
| `cc.loader.loadRes(url, callback)` | `resources.load(url, callback)` | Removed in 3.x |
| `cc.loader.release(url)` | `assetManager.releaseAsset(asset)` | Removed in 3.x |
| `cc.find(path)` | `@property(Node)` + editor binding | Avoid in runtime |
| `node.getChildByName(name)` | `@property(Node)` + editor binding | Never use in update loops |
| `AnimationClip.times` / `.curves` / `.commonTargets` | Track/channel API | Deprecated since 3.3 |

#### Verified Post-Cutoff Behaviors (3.8.8)

| API | Verified Behavior | Source |
|-----|------------------|--------|
| `cc.Graphics` | `rect()`+`fill()` 和 `stroke()` 交替使用会按颜色变化切分 mesh buffer，每种新颜色产生新 draw call | ADR-002 |
| `cc.Label` (SystemFont) | **不可自动合批** — 每个 SystemFont Label 生成独立纹理，必须改用 TTF 字体 | ADR-002 (engine specialist verified) |
| `cc.Label` (TTF Font) | 同字体、同字号、同颜色的 Label 组件共享纹理，合批为 1 draw call | ADR-002 (engine specialist verified) |
| `sys.platform` | `sys.Platform.WECHAT_GAME` 在所有 Cocos 3.0+ 微信构建中可靠返回 true | ADR-004 |
| `touch.getUILocation()` | 返回事件目标节点坐标系位置——原点取决于节点锚点。若 anchor=(0.5,0.5)，原点在屏幕中心 | ADR-005 (engine specialist verified) |
| `wx.getSystemInfoSync()` | 3.8.8+ 内置缓存 | breaking-changes.md |

### Cross-Cutting Constraints

- **所有公共方法必须可单元测试**：依赖注入优于单例。不使用全局状态。— source: technical-preferences
- **玩法数值数据驱动**：所有可配置值（阈值、颜色、持续时间）外部化到常量或配置，不硬编码。— source: technical-preferences
- **禁用 `Math.random()`**：所有游戏逻辑确定性可重现（Pillar 1）。— source: architecture.md
- **禁止 Foundation 层反向依赖 Core/Feature/Presentation**：依赖方向唯一——上层依赖下层。— source: architecture.md
- **禁止循环依赖**：系统 A 依赖 B，B 不得依赖 A（直接或间接）。— source: architecture.md
