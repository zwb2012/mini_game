# ADR-0010: 游戏状态机架构

## Status
Accepted

## Date
2026-05-22

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Godot 4.6 |
| **Domain** | Core |
| **Knowledge Risk** | LOW — enum/Signal/Node 自 Godot 3.x 起稳定，4.x 无破坏性变更 |
| **References Consulted** | `docs/engine-reference/godot/VERSION.md`, `docs/engine-reference/godot/breaking-changes.md`, `docs/engine-reference/godot/deprecated-apis.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | None |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Autoload + Signal 架构 — GameStateMachine 作为 17 个 Autoload 之一) |
| **Enables** | ADR-0002 (SceneManager — 依赖状态读取决定加载/重置行为), DeathRespawn, TouchInput, PhysicsConfig, HUD — 所有依赖状态读取的下游系统 |
| **Blocks** | 无 — GameStateMachine 为 Foundation 层，无上游依赖。其 Autoload 可立即注册 |
| **Ordering Note** | 必须在 SceneManager (ADR-0002) 和 DeathRespawn 的 story 开始前 Accepted |

## Context

### Problem Statement
坍塌禁区有 5 个互斥的游戏状态（MAIN_MENU、PLAYING、PAUSED、DEAD、LEVEL_COMPLETE），每个状态决定了哪些系统活跃、哪些暂停。没有集中式状态管理，各系统会各自判断"现在该干什么"——导致行为不一致（如 PAUSED 时物理停了但 AI 还在跑）、状态切换路径不可控（如 DEAD 时被误切成 PAUSED）、以及调试困难（无法追踪"谁切换了状态"）。

### Constraints
- Foundation 层系统——不依赖任何其他系统，被所有上层系统依赖
- 必须作为 Autoload 运行（ADR-0001）——场景切换期间状态不丢失
- 单人开发——复杂度必须最低，5 个状态不需要层次化状态机
- 移动端 60fps——状态查询必须零开销（直接属性读取，不走方法调用）
- GDD 已定义完整的状态枚举、切换表和 12 条验收标准

### Requirements
- 5 个互斥状态的枚举定义
- `transition_to(new_state)` 作为唯一的切换入口——禁止直接赋值
- `state_changed(old_state, new_state)` signal — 所有下游系统通过此信号响应
- `current_state` 只读属性 — 各系统按需轮询（如 TouchInput 每帧检查是否为 PLAYING）
- 非法切换必须拒绝（如 DEAD → PAUSED），同状态切换必须忽略
- 状态切换规则必须数据驱动——合法转换表从配置文件读取，配置文件缺失时使用硬编码默认值

## Decision

**采用基于枚举的简单状态机模式：GDScript enum + transition_to() 守卫方法 + state_changed 信号。**

GameStateMachine 作为 Autoload 注册（`res://autoload/game_state_machine.gd`），在 ADR-0001 的 Autoload 注册表中位于 Foundation 层第一位。5 个状态定义为 GDScript enum，合法转换表从 JSON 配置文件加载，加载失败时回退到硬编码默认值。`transition_to()` 在修改状态前验证转换合法性，无效请求被拒绝并打印 error。

**初始化策略**（应对 Autoload 顺序问题）：不自动发射初始 `state_changed` — 初始状态 MAIN_MENU 以静默方式设置。消费者如需初始状态值，应在自身 `_ready()` 中直接读取 `GameStateMachine.current_state`。`state_changed` 仅在运行时 `transition_to()` 调用时发射。

### Architecture Diagram

```
                  ┌──────────────────────────┐
                  │     GameStateMachine      │
                  │     (Autoload, F0)        │
                  │                          │
                  │  enum GameState {         │
                  │    MAIN_MENU,             │
                  │    PLAYING,               │
                  │    PAUSED,                │
                  │    DEAD,                  │
                  │    LEVEL_COMPLETE         │
                  │  }                        │
                  │                          │
                  │  current_state: GameState │  ← 只读，O(1) 属性访问
                  │  transition_to(new) → bool│  ← 唯一写入入口，返回成功/失败
                  │                          │
                  │  signal state_changed(    │
                  │    old: GameState,        │
                  │    new: GameState         │
                  │  )                        │
                  └────┬─────────────────────┘
                       │ state_changed signal
         ┌─────────────┼─────────────┬──────────────┐
         ▼             ▼             ▼              ▼
    TouchInput    PhysicsConfig  SceneManager     HUD
    (仅 PLAYING   (PAUSED/        (DEAD 触发      (切换界面)
     时处理触控)   COMPLETE 冻结)  重置)

合法转换表:
  MAIN_MENU      → [PLAYING]
  PLAYING        → [PAUSED, DEAD, LEVEL_COMPLETE]
  PAUSED         → [PLAYING]
  DEAD           → [PLAYING, MAIN_MENU]
  LEVEL_COMPLETE → [PLAYING, MAIN_MENU]
```

### Key Interfaces

```gdscript
# game_state_machine.gd (Autoload: "GameStateMachine")
extends Node

enum GameState {
    MAIN_MENU,
    PLAYING,
    PAUSED,
    DEAD,
    LEVEL_COMPLETE
}

## 状态变化时发射。仅在运行时 transition_to() 调用时发射，不在初始化时发射。
## old 和 new 绝不会相同。
signal state_changed(old: GameState, new: GameState)

## 硬编码默认转换表——JSON 配置加载失败时的回退
const DEFAULT_TRANSITIONS: Dictionary = {
    GameState.MAIN_MENU: [GameState.PLAYING],
    GameState.PLAYING: [GameState.PAUSED, GameState.DEAD, GameState.LEVEL_COMPLETE],
    GameState.PAUSED: [GameState.PLAYING],
    GameState.DEAD: [GameState.PLAYING, GameState.MAIN_MENU],
    GameState.LEVEL_COMPLETE: [GameState.PLAYING, GameState.MAIN_MENU],
}

var _current_state: GameState = GameState.MAIN_MENU
var _transitions: Dictionary = {}
var _is_transitioning: bool = false  # guard flag 防止重入

var current_state: GameState:
    get:
        return _current_state
    set(_value):
        push_warning("GameStateMachine: current_state is read-only. Use transition_to().")

func _ready() -> void:
    _transitions = _load_transition_table()

func _load_transition_table() -> Dictionary:
    var file_path: String = "res://assets/data/state_machine/transitions.json"
    if not FileAccess.file_exists(file_path):
        push_warning("GameStateMachine: transitions.json not found, using defaults.")
        return DEFAULT_TRANSITIONS.duplicate()
    var json_str: String = FileAccess.get_file_as_string(file_path)
    if json_str.is_empty():
        push_warning("GameStateMachine: transitions.json empty, using defaults.")
        return DEFAULT_TRANSITIONS.duplicate()
    var parsed: Variant = JSON.parse_string(json_str)
    if not parsed is Dictionary or not parsed.has("transitions"):
        push_warning("GameStateMachine: transitions.json invalid format, using defaults.")
        return DEFAULT_TRANSITIONS.duplicate()
    return _parse_transitions(parsed["transitions"])

func _parse_transitions(raw: Dictionary) -> Dictionary:
    var result: Dictionary = {}
    for state_str in raw:
        var state: GameState = GameState[state_str]
        var targets: Array = []
        for target_str in raw[state_str]:
            targets.append(GameState[target_str])
        result[state] = targets
    return result

## 尝试切换到新状态。返回 true 表示切换成功，false 表示被拒绝。
## 非法切换：push_error + return false。同状态切换：push_warning + return false。
func transition_to(new_state: GameState) -> bool:
    if _is_transitioning:
        push_warning("GameStateMachine: reentrant transition_to() blocked (%s → %s)" % [_current_state, new_state])
        return false
    if new_state == _current_state:
        push_warning("GameStateMachine: same-state transition ignored (%s)" % _current_state)
        return false
    var allowed := _transitions.get(_current_state, [])
    if new_state not in allowed:
        push_error("GameStateMachine: illegal transition %s → %s" % [_current_state, new_state])
        return false

    _is_transitioning = true
    var old_state := _current_state
    _current_state = new_state
    state_changed.emit(old_state, new_state)
    _is_transitioning = false
    return true

func is_playing() -> bool:
    return _current_state == GameState.PLAYING
```

**消费者模式**（两种方式，系统按需选择）：

```gdscript
# 方式 1：Signal 驱动（推荐——大多数系统，如 PhysicsConfig、HUD）
func _ready():
    # 读取初始状态——state_changed 不会在初始化时发射
    match GameStateMachine.current_state:
        GameStateMachine.GameState.PAUSED:
            _pause_physics()
    # 连接 Signal 以响应运行时切换
    GameStateMachine.state_changed.connect(_on_state_changed)

func _on_state_changed(old: GameStateMachine.GameState, new: GameStateMachine.GameState):
    match new:
        GameStateMachine.GameState.PAUSED:
            _pause_physics()
        GameStateMachine.GameState.PLAYING:
            _resume_physics()

# 方式 2：轮询（仅高频系统——TouchInput 每帧检查）
func _process(_delta: float):
    if not GameStateMachine.is_playing():
        return  # 非 PLAYING 状态忽略所有触控
    # ...处理触控输入
```

### 切换规则配置文件

```json
// assets/data/state_machine/transitions.json
{
  "transitions": {
    "MAIN_MENU": ["PLAYING"],
    "PLAYING": ["PAUSED", "DEAD", "LEVEL_COMPLETE"],
    "PAUSED": ["PLAYING"],
    "DEAD": ["PLAYING", "MAIN_MENU"],
    "LEVEL_COMPLETE": ["PLAYING", "MAIN_MENU"]
  },
  "initial_state": "MAIN_MENU"
}
```

> **注意**: JSON 中的状态名使用字符串——在加载时通过 `GameState[state_str]` 转换为枚举值。配置文件缺失或格式错误时回退到 `DEFAULT_TRANSITIONS` 硬编码字典。

## Alternatives Considered

### Alternative 1: State 模式（每个状态一个类）
- **Description**: 每个游戏状态实现为独立的 State 子类（如 `PlayingState.gd`、`PausedState.gd`），各自实现 `enter()` / `exit()` / `update()`。GameStateMachine 持有当前 State 实例并委托调用。
- **Pros**: 每个状态的逻辑完全隔离——PLAYING 的代码不会出现在 PAUSED 的文件中；新增状态只需添加新类，无需修改现有代码
- **Cons**: 5 个状态需要 5 个额外文件 + 1 个基类 = 6 个文件；状态间的共享逻辑（如"大多数状态忽略输入"）需要在每个类中重复或引入额外抽象；GDScript 无 interface/abstract class 语法糖——`@abstract` 是 4.5 新增特性，类层次结构不如静态语言自然
- **Rejection Reason**: 5 个简单状态不需要 OOP 类层次结构。状态机的逻辑总量 < 100 行——拆成 6 个文件反而增加维护负担。且 ADR-0001 要求"状态切换规则数据驱动"——配置文件的字典方案比分散在多个类文件中更容易审计。

### Alternative 2: 字符串状态名 + Callback 注册
- **Description**: 不使用 enum，状态名为 String（`"playing"`、`"paused"`）。系统通过 `GameStateMachine.on_enter("paused", self._on_pause)` 注册回调，状态机在切换时调用所有匹配的回调。
- **Pros**: 字符串状态名易于序列化和日志记录；回调注册模式让系统只关心自己感兴趣的状态——不需要在单一 match 分支中处理所有状态
- **Cons**: 字符串无编译时类型检查——`"playnig"`（拼写错误）会在运行时静默失败；回调注册增加了 `_ready()` 样板代码；多个回调的执行顺序不确定——可能引发微妙的依赖 bug
- **Rejection Reason**: 5 个固定状态用 enum 更安全——GDScript 的 `match` + enum 提供穷尽性检查（编译时警告未覆盖的枚举值）。回调注册模式适合动态/插件化状态（如 mod 支持），对于固定枚举是过度设计。

### Alternative 3: 无集中状态机——各系统自行判断
- **Description**: 不创建 GameStateMachine Autoload。每个系统自行追踪"是否暂停"、"是否死亡"等布尔标志，通过各自的信号通信。
- **Pros**: 零额外架构——不需要新增 Autoload；系统之间无状态机耦合
- **Cons**: 各系统对"暂停"的理解可能不一致——TouchInput 认为暂停了但 EnemyAI 还在跑；状态组合爆炸（"暂停 + 死亡动画播放中"算什么状态？）；调试困难——无法回答"游戏现在处于什么状态"
- **Rejection Reason**: GDD 已明确定义 5 个互斥状态和合法切换路径——集中式状态机是实现这一规格的最直接方式。各系统自行判断会导致行为不一致和难以调试的竞态条件。

## Consequences

### Positive
- 单一状态权威源——`GameStateMachine.current_state` 是游戏状态的唯一真相。调试时只需检查一个变量
- 状态切换路径受控——`_transitions` 字典白名单机制防止非法切换（如 DEAD → PAUSED 被拒绝）
- GDScript enum 提供编译时类型安全——`match` 穷尽性检查，Signal 参数类型不匹配在启动时报错
- 配置文件驱动——切换规则由 JSON 定义，可在不重新编译的情况下调整（如 MVP 跳过 MAIN_MENU 直接进入 PLAYING）
- Signal + 轮询双模式——大多数系统用 Signal（低开销），高频系统用属性轮询（零分配）
- `transition_to()` 返回 bool——调用者可以检测并处理被拒绝的切换（如显示错误提示）
- 重入 guard flag——`_is_transitioning` 防止 Signal 回调中的级联切换导致无限循环

### Negative
- `current_state` 轮询在 `_process()` 中增加分支（不可预测的分支预测），但开销 < 0.001ms——可忽略
- `transition_to()` 是唯一写入入口——如果将来有系统需要在切换前执行自定义逻辑（如"保存数据"），需要通过 Signal 或额外的 hook 机制。当前需求不需要此能力
- Autoload 常驻内存——GameStateMachine 实例 + 配置字典 ≈ 1-2KB（可忽略）
- 无显式 `on_enter` / `on_exit` 每状态回调——PAUSE 的副作用（冻结时间缩放、暂停敌人生成）分散在多个消费者的 Signal 处理器中。对于 5 个状态可接受——超过 10 个状态时建议改用 State 模式

### Risks
- **Signal 回调中的二次切换**: A 系统的 `_on_state_changed` 回调中调用 `transition_to()` → 触发另一个 `state_changed` → 导致级联切换。缓解：`_is_transitioning` guard flag——正在处理切换时忽略嵌套的 `transition_to()` 调用，打印 warning。**引擎专家验证已确认此方案安全。**
- **Autoload 初始化顺序**: 消费者在自身 `_ready()` 中连接 `state_changed` 时，GameStateMachine 可能已完成初始化。缓解：不自动发射初始 `state_changed`。消费者在 `_ready()` 中通过 `current_state` 属性主动读取初始状态。**引擎专家标记为 BLOCKING — 已修复。**
- **JSON 配置文件缺失或解析失败**: 导出构建中 `transitions.json` 可能被过滤规则排除。缓解：硬编码 `DEFAULT_TRANSITIONS` 常量作为回退——JSON 加载失败时使用默认表并打印 warning。**引擎专家标记为 BLOCKING — 已修复。**
- **JSON 配置文件导出依赖**: `transitions.json` 必须包含在项目导出资源中——确保文件位于始终被包含的目录（如 `assets/data/state_machine/`），或在导出过滤规则中显式添加。
- **DEAD 切换中的级联处理**: `PLAYING → DEAD` 可能在伤害处理链中间被调用（如 `health_changed` Signal 处理器内）。缓解：调用者如需确保当前帧处理完成后再切换，应使用 `call_deferred(transition_to.bind(DEAD))`。此约束应在 DeathRespawn 系统的 story 中注明。

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| game-state-machine.md | 5 个互斥状态枚举 (MAIN_MENU, PLAYING, PAUSED, DEAD, LEVEL_COMPLETE) | GDScript `enum GameState` 提供编译时类型安全的 5 状态定义 |
| game-state-machine.md | 状态切换必须通过 `transition_to(new_state)`，禁止直接赋值 | `transition_to()` 作为唯一写入路径；`current_state` setter 拒绝外部赋值 |
| game-state-machine.md | 每次切换触发 `state_changed(old, new)` signal | `state_changed` signal 在 `_current_state` 修改后、方法返回前同步发射 |
| game-state-machine.md | 只读 `current_state` 属性 | `current_state` getter 返回 `_current_state`，setter 拒绝外部写入 |
| game-state-machine.md | 合法切换表（9 条规则）从配置文件读取 | `transitions.json` 定义合法转换；`_transitions` Dictionary 在 `_ready()` 加载；`DEFAULT_TRANSITIONS` 作为回退 |
| game-state-machine.md | 非法切换拒绝、同状态切换忽略 | `transition_to()` 验证 `new_state in _transitions[current_state]`；非法 push_error + return false，同状态 push_warning + return false |
| game-state-machine.md | 初始状态 = MAIN_MENU | `_current_state` 默认值 = `GameState.MAIN_MENU`（静默设置，不发射 signal） |
| game-state-machine.md | AC1-AC12（12 条验收标准） | 每条 AC 对应一个可测试行为——见 Validation Criteria |

## Performance Implications
- **CPU**: `current_state` 读取为 O(1) 属性访问（< 0.001ms）；`transition_to()` 为 Dictionary 查表 + Signal emit（< 0.01ms）；Signal 回调链取决于消费者数量——预估 5-7 个消费者 × 0.01ms = < 0.1ms 总开销
- **Memory**: Autoload 实例 + enum + Dictionary（5 键 × 平均 2 值）≈ 1-2KB 常驻内存
- **Load Time**: JSON 配置文件加载 < 1ms（文件 < 500 bytes）；JSON 不存在时直接使用硬编码默认值——零文件 I/O 开销
- **Network**: N/A（单机游戏）

## Migration Plan
本项目尚无代码——此为初始架构决策。实施步骤：
1. 创建 `assets/data/state_machine/transitions.json` 配置文件
2. 创建 `res://autoload/game_state_machine.gd` — 实现 enum + transition_to() + state_changed + JSON 加载 + DEFAULT_TRANSITIONS 回退
3. 在 Project Settings → Autoload 中注册为 `GameStateMachine`（Foundation 层第一位——必须在所有消费者 Autoload 之前）
4. 下游系统（TouchInput、PhysicsConfig、SceneManager）在 `_ready()` 中：先读取 `GameStateMachine.current_state` 获取初始状态，再连接 `state_changed` Signal
5. CI 添加状态机单元测试：验证所有合法切换成功、所有非法切换被拒绝、同状态切换被忽略、JSON 缺失时回退到默认值

## Validation Criteria
- 所有 9 条合法切换路径执行成功（`state_changed` signal 发射且 old/new 值正确，`transition_to()` 返回 true）
- 所有非法切换被拒绝（`push_error` 触发，状态不变，返回 false）
- 同状态切换被忽略（`push_warning` 触发，signal 不发射，返回 false）
- `current_state` 外部赋值被拒绝（`push_warning` 触发，值不变）
- JSON 配置文件缺失时使用 `DEFAULT_TRANSITIONS`（`push_warning` 触发，所有合法切换仍正常工作）
- `_is_transitioning` guard flag 阻止重入（Signal 回调中调用 `transition_to()` 返回 false）
- 初始状态为 `MAIN_MENU`，且初始化时不发射 `state_changed`
- 5 个消费者系统（TouchInput、PhysicsConfig、SceneManager、DeathRespawn、HUD）在 `state_changed` 后行为正确
- 所有 12 条 GDD 验收标准可追踪到具体测试用例

## Implementation Notes (from Engine Specialist Review)

1. **Autoload 注册顺序**: GameStateMachine 必须在 Project Settings → Autoload 中注册在所有消费者 Autoload 之前（SceneManager、HUD 等）。按 ADR-0001 的分层结构，它属于 Foundation 层。
2. **JSON 文件导出**: `transitions.json` 必须包含在导出资源中——确保文件位于 `assets/data/state_machine/` 目录，该目录应在导出过滤规则中显式包含。
3. **转换表类型标注**: `_transitions` 应使用 `Dictionary[GameState, Array[GameState]]` 类型以获得 GDScript 编译器优化。
4. **启动时验证**: 在 `_ready()` 中除加载 JSON 外，还应验证每个 `GameState` 枚举值在转换表中都有对应条目，且所有引用的目标状态都存在——在启动时捕获配置偏差而非运行时。
5. **`is_playing()` 语义**: 明确定义为 `current_state == GameState.PLAYING`。PAUSED 在技术上是"仍在游戏中但冻结"——需要与 PLAYING 区分开的系统应监听 `state_changed` 而非轮询 `is_playing()`。

## Related Decisions
- ADR-0001: Autoload + Signal 架构（GameStateMachine 是 17 个 Autoload 之一——本 ADR 遵循其 Signal-First 通信规则和层间通信约束）
- ADR-0002: 场景加载策略（SceneManager 依赖 GameStateMachine 的状态来决定加载/重置行为）
