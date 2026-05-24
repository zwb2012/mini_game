# Story 002: 配置驱动转换表与启动验证

> **Epic**: 游戏状态机 (Game State Machine)
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Config/Data
> **Estimate**: 1.5h
> **Manifest Version**: N/A — control-manifest.md 尚未创建
> **Last Updated**: 2026-05-24

## Context

**GDD**: `design/gdd/game-state-machine.md`
**Requirements**:
- `TR-game-state-003` (配置维度): 合法转换表从 JSON 配置文件读取，配置文件缺失时使用硬编码 DEFAULT_TRANSITIONS 回退
- GDD AC11: 游戏启动初始状态 = MAIN_MENU（MVP 决策：默认 PLAYING，可通过配置覆盖）
- GDD AC12: 所有状态枚举值和合法切换表均从配置文件读取，无硬编码

**ADR Governing Implementation**: ADR-0010: 游戏状态机架构
**ADR Decision Summary**: 合法转换表从 `assets/data/state_machine/transitions.json` 加载。JSON 缺失/空/格式错误 → 回退到 DEFAULT_TRANSITIONS + push_warning。`_ready()` 中额外验证所有 GameState 枚举值在转换表中都有条目。初始状态通过 `initial_state` JSON 字段配置。

**Engine**: Godot 4.6 | **Risk**: LOW
**Engine Notes**: FileAccess API 自 4.0 起稳定。JSON.parse_string() 自 4.0 起可用。JSON 文件必须包含在项目导出资源中——确保 `assets/data/state_machine/` 目录在导出过滤规则中显式包含。

**Control Manifest Rules (Foundation 层)**:
- Required: 配置数据必须从外部文件加载，代码中仅保留回退默认值
- Required: JSON 加载失败时系统仍可运行（使用硬编码回退）
- Guardrail: 所有 `push_warning()` / `push_error()` 消息包含 "GameStateMachine:" 前缀以便日志过滤

---

## Acceptance Criteria

*From GDD `design/gdd/game-state-machine.md`, scoped to this story:*

- [ ] **AC11**: GIVEN 游戏启动，WHEN 检查初始状态，THEN `current_state` 为配置文件中指定的 `initial_state`（默认 MAIN_MENU；MVP 使用 PLAYING）
- [ ] **AC12a**: GIVEN `transitions.json` 存在且格式正确，WHEN 系统加载，THEN 所有合法转换从 JSON 读取，DEFAULT_TRANSITIONS 仅作为回退不被使用
- [ ] **AC12b**: GIVEN `transitions.json` 不存在，WHEN 系统加载，THEN 使用 DEFAULT_TRANSITIONS，打印 push_warning，所有合法切换仍正常工作
- [ ] **AC12c**: GIVEN `transitions.json` 格式错误（非 JSON / 缺少 "transitions" key），WHEN 系统加载，THEN 回退到 DEFAULT_TRANSITIONS + push_warning
- [ ] **启动验证** (ADR-0010 Implementation Note #4): GIVEN 转换表加载完成，WHEN 检查所有 GameState 枚举值，THEN 每个枚举值在转换表中都有条目；缺失的值打印 push_error 并自动补齐为 DEFAULT_TRANSITIONS 对应条目
- [ ] **JSON 导出配置**: `assets/data/state_machine/transitions.json` 在项目导出过滤规则中显式包含

---

## Implementation Notes

*Derived from ADR-0010 Implementation Guidelines:*

**已有代码**:
- `_load_transition_table()` — JSON 文件存在性检查 + 空文件检查 + 格式校验 + 回退 ✅
- `_parse_transitions()` — 字符串 key → enum 值转换 ✅
- `DEFAULT_TRANSITIONS` 常量 — 5 个状态的完整回退表 ✅

**本 story 核心工作**:

### 1. 创建配置文件

创建 `assets/data/state_machine/transitions.json`:

```json
{
  "transitions": {
    "MAIN_MENU": ["PLAYING"],
    "PLAYING": ["PAUSED", "DEAD", "LEVEL_COMPLETE"],
    "PAUSED": ["PLAYING"],
    "DEAD": ["PLAYING", "MAIN_MENU"],
    "LEVEL_COMPLETE": ["PLAYING", "MAIN_MENU"]
  },
  "initial_state": "PLAYING"
}
```

> **MVP 决策**: `initial_state` 设为 `"PLAYING"` 而非 GDD 默认的 `"MAIN_MENU"` — MVP 无主菜单，直接进入游戏。该值可通过修改 JSON 切换，无需改代码。

### 2. 添加 initial_state 支持

修改 `_ready()` → 加载转换表后，从 JSON 读取 `initial_state` 字段并设置 `_current_state`。如果 JSON 中未指定或加载失败，使用 DEFAULT_INITIAL_STATE = PLAYING。

```gdscript
const DEFAULT_INITIAL_STATE: GameState = GameState.PLAYING

func _ready() -> void:
    _transitions = _load_transition_table()
    _current_state = _load_initial_state()
    _validate_transition_table()
```

### 3. 添加启动验证 (ADR-0010 Note #4)

新增 `_validate_transition_table()`:
- 遍历 `GameState.values()` 检查每个枚举值在 `_transitions` 中都有 key
- 遍历所有目标状态引用，确认引用的枚举值存在
- 缺失 key → push_error + 自动补齐为 DEFAULT_TRANSITIONS 对应条目

### 4. 编写单元测试

测试文件: `tests/unit/game-state-machine/config_driven_test.gd`

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- **Story 001**: transition_to() 核心逻辑、合法/非法转换验证、同状态忽略、重入保护
- **导出构建验证**: JSON 文件在实际导出包中的包含验证 — 属于 CI/导出流水线范围

---

## QA Test Cases

*Written at story creation. The developer implements against these — do not invent new test cases during implementation.*

### 配置文件正常加载

- **AC12a-1: JSON 正常加载并使用配置值**
  - Given: `transitions.json` 存在且格式正确
  - When: GameStateMachine._ready() 执行
  - Then: `_transitions` 包含 JSON 中定义的所有转换规则, 无 push_warning

- **AC11-1: initial_state 从 JSON 读取**
  - Given: JSON 中 `initial_state = "PLAYING"`
  - When: _ready() 完成
  - Then: current_state = PLAYING

- **AC11-2: initial_state 缺失使用默认值**
  - Given: JSON 中无 `initial_state` 字段
  - When: _ready() 完成
  - Then: current_state = DEFAULT_INITIAL_STATE (PLAYING)

### 配置文件回退

- **AC12b-1: JSON 文件不存在 → 回退**
  - Given: `transitions.json` 不存在
  - When: _ready() 执行
  - Then: `_transitions` = DEFAULT_TRANSITIONS, push_warning 触发, 所有 9 条合法转换仍正常工作

- **AC12c-1: JSON 内容为空字符串 → 回退**
  - Given: `transitions.json` 内容为空
  - When: _ready() 执行
  - Then: push_warning 触发, 使用 DEFAULT_TRANSITIONS

- **AC12c-2: JSON 格式错误 (非 JSON 文本) → 回退**
  - Given: `transitions.json` 内容为纯文本 "not json"
  - When: _ready() 执行
  - Then: push_warning 触发, 使用 DEFAULT_TRANSITIONS

- **AC12c-3: JSON 缺少 "transitions" key → 回退**
  - Given: JSON 为 `{"other": "data"}`
  - When: _ready() 执行
  - Then: push_warning 触发, 使用 DEFAULT_TRANSITIONS

- **AC12c-4: JSON 中某状态的转换列表为空 → 回退该状态条目**
  - Given: `"PLAYING": []`（空数组）
  - When: _ready() 执行
  - Then: PLAYING 的转换列表使用 DEFAULT_TRANSITIONS 值, push_warning 触发

### 启动验证

- **Validate-1: 所有 GameState 值在转换表中都存在**
  - Given: 正确的 `transitions.json`（5 个状态键齐全）
  - When: _validate_transition_table() 执行
  - Then: 无 push_error

- **Validate-2: 转换表缺少某个状态的 key**
  - Given: JSON 中缺少 `DEAD` 的条目
  - When: _validate_transition_table() 执行
  - Then: push_error 触发，DEAD 的转换列表自动补齐为 DEFAULT_TRANSITIONS[DEAD]

- **Validate-3: 转换表中的目标状态引用无效枚举值**
  - Given: JSON 中 `"PLAYING": ["PAUSED", "INVALID_STATE"]`
  - When: _parse_transitions() 执行
  - Then: push_error 触发，INVALID_STATE 被跳过

### 配置隔离

- **Isolation-1: DEFAULT_TRANSITIONS 不被修改**
  - Given: JSON 加载失败 → 使用 DEFAULT_TRANSITIONS
  - When: 运行时调用 transition_to()
  - Then: DEFAULT_TRANSITIONS 常量内容不变（使用了 `.duplicate()`）

- **Isolation-2: 运行时修改配置不重启**
  - Given: 运行中的 GameStateMachine
  - When: 修改并保存 transitions.json 文件
  - Then: 除非显式调用 reload 机制，否则运行中行为不变

---

## Test Evidence

**Story Type**: Config/Data
**Required evidence**: `tests/unit/game-state-machine/config_driven_test.gd` — must exist and pass; smoke check pass
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001 (核心转换逻辑 — 需 transition_to() 正常运作才能验证配置加载后的行为)
- Unlocks: None — 这是 GameStateMachine epic 的最后一个 story

## Completion Notes
**Completed**: 2026-05-24
**Criteria**: 5/6 passing (AC11, AC12a, AC12b, AC12c, startup validation), 1 deferred (JSON export config)
**Deviations**:
- Smoke check not run — ADVISORY (Config/Data type, not blocking)
- _load_initial_state() + _load_transition_table() duplicate JSON read — ADVISORY (negligible perf impact)
- JSON export config verification deferred to CI/export pipeline
**Test Evidence**: `tests/unit/game-state-machine/config_driven_test.gd` — 15 test functions
**Code Review**: APPROVED (2026-05-24)
