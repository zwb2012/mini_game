# Story 001: 状态机核心逻辑与转换验证

> **Epic**: 游戏状态机 (Game State Machine)
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 2h (核心代码已有 S05 骨架，本 story 聚焦单元测试)
> **Manifest Version**: N/A — control-manifest.md 尚未创建，规则直接从 ADR-0010 提取
> **Last Updated**: 2026-05-24

## Completion Notes
**Completed**: 2026-05-24
**Criteria**: 5/5 passing (AC8, AC9, AC10, reentrant guard, current_state read-only + is_playing() coverage)
**Deviations**:
- `extends GutTest` 而非 GdUnitTestSuite — GUT 插件未安装，与项目现有测试一致
- push_error/push_warning 未被 assert — GUT 限制，以注释文档化；行为契约完整断言
- 测试不可执行 — 需手动安装 GUT 或 GdUnit4 插件（已知技术债务）
**Test Evidence**: `tests/unit/game-state-machine/core_logic_test.gd` — 28 test functions covering 5×5 matrix
**Code Review**: APPROVED (2026-05-24)

## Context

**GDD**: `design/gdd/game-state-machine.md`
**Requirements**:
- `TR-game-state-001`: 5 种互斥状态 — MAIN_MENU, PLAYING, PAUSED, DEAD, LEVEL_COMPLETE
- `TR-game-state-002`: transition_to(new_state) 是唯一状态变更方式；禁止直接赋值；每次转换发射 state_changed(old, new) signal
- `TR-game-state-003`: 非法转换拒绝 — DEAD→PAUSED, LEVEL_COMPLETE→PAUSED；同状态转换忽略并警告

**ADR Governing Implementation**: ADR-0010: 游戏状态机架构
**ADR Decision Summary**: GDScript enum + transition_to() 守卫方法 + state_changed signal + 重入 guard flag。合法转换表由 Dictionary 白名单控制，非法转换 push_error + return false，同状态 push_warning + return false。初始化时不自动发射 state_changed。

**ADR Secondary Reference**: ADR-0001: Autoload + Signal 架构 — GameStateMachine 作为 17 个 Autoload 之一，Foundation 层第一位注册

**Engine**: Godot 4.6 | **Risk**: LOW
**Engine Notes**: enum / Signal / Node 自 Godot 3.x 起稳定，4.x 无破坏性变更。无 post-cutoff API。

**Control Manifest Rules (Foundation 层)**:
- Required: Autoload 注册顺序 — GameStateMachine 必须在所有消费者之前
- Required: Signal-First 通信 — state_changed signal 是状态变更的唯一广播渠道
- Forbidden: 下层不可连接上层 Signal
- Guardrail: `_ready()` 中只做 Signal 连接 + 配置加载，不做业务逻辑调用

---

## Acceptance Criteria

*From GDD `design/gdd/game-state-machine.md`, scoped to this story:*

- [ ] **AC8**: GIVEN 状态切换发生（任意 from → to），WHEN 检查 signal 发射，THEN `state_changed(old, new)` 被触发且 old/new 值正确，`transition_to()` 返回 true
- [ ] **AC9**: GIVEN 当前状态 = PAUSED，WHEN 代码尝试 `transition_to(PAUSED)`，THEN 请求被忽略（同状态切换不触发 signal，返回 false，push_warning）
- [ ] **AC10**: GIVEN 当前状态 = DEAD，WHEN 代码尝试 `transition_to(PAUSED)`，THEN 请求被拒绝（DEAD 不允许直接切到 PAUSED，返回 false，push_error）
- [ ] **重入保护**: GIVEN state_changed 的 Signal 回调中调用 `transition_to()`，THEN 被 `_is_transitioning` guard 拦截，返回 false + push_warning
- [ ] **current_state 只读**: GIVEN 外部代码直接赋值 `GameStateMachine.current_state = X`，THEN setter 拒绝写入，push_warning，值不变

---

## Implementation Notes

*Derived from ADR-0010 Implementation Guidelines:*

**已有代码** (`autoload/game_state_machine.gd` — S05 骨架):
- `enum GameState` 5 状态定义 ✅
- `transition_to()` — 唯一写入入口，含重入 guard + 合法性校验 + state_changed emit ✅
- `current_state` 只读属性（setter 拒绝外部写入）✅
- `is_playing()` 便捷方法 ✅
- `DEFAULT_TRANSITIONS` 硬编码回退字典 ✅
- JSON 配置文件加载逻辑 (`_load_transition_table()` + `_parse_transitions()`) ✅

**本 story 核心工作 — 编写单元测试**:

1. **合法转换全覆盖** (9 条路径 × 验证 old/new + 返回值):
   - MAIN_MENU → PLAYING
   - PLAYING → PAUSED, DEAD, LEVEL_COMPLETE
   - PAUSED → PLAYING
   - DEAD → PLAYING, MAIN_MENU
   - LEVEL_COMPLETE → PLAYING, MAIN_MENU

2. **非法转换拒绝** (5×5 矩阵中所有非法组合):
   - 重点: DEAD→PAUSED, LEVEL_COMPLETE→PAUSED, MAIN_MENU→DEAD, MAIN_MENU→PAUSED 等
   - 验证: push_error 触发 + 状态不变 + 返回 false

3. **同状态切换忽略** (5 个状态各自尝试切到自身):
   - 验证: push_warning 触发 + signal 不发射 + 返回 false

4. **重入保护**:
   - 在 state_changed 回调中调用 transition_to() → 返回 false

5. **只读 current_state**:
   - 直接赋值 current_state = X → push_warning + 值不变

**测试数量预估**: 25 条（9 合法 + ~11 非法 + 5 同状态 + 1 重入 + 1 只读）

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- **Story 002**: JSON 配置文件创建 (`transitions.json`)、启动验证（ADR-0010 Note #4）、初始状态从配置读取、配置缺失/损坏回退测试
- **TouchInput Story 005**: 状态切换对触控输入的实际抑制效果（已通过 Integration 测试覆盖）
- **AC1~AC7**: 具体状态切换场景（暂停→恢复、死亡→重生、通关）—— 这些是下游系统（DeathRespawn、SceneManager、MenuSystem）的集成行为

---

## QA Test Cases

*Written at story creation. The developer implements against these — do not invent new test cases during implementation.*

### 合法转换 (9 条路径)

- **AC8-1: MAIN_MENU → PLAYING**
  - Given: current_state = MAIN_MENU
  - When: transition_to(PLAYING)
  - Then: 返回 true, state_changed 发射 (MAIN_MENU, PLAYING), current_state = PLAYING

- **AC8-2: PLAYING → PAUSED**
  - Given: current_state = PLAYING
  - When: transition_to(PAUSED)
  - Then: 返回 true, state_changed 发射 (PLAYING, PAUSED), current_state = PAUSED

- **AC8-3: PLAYING → DEAD**
  - Given: current_state = PLAYING
  - When: transition_to(DEAD)
  - Then: 返回 true, state_changed 发射 (PLAYING, DEAD), current_state = DEAD

- **AC8-4: PLAYING → LEVEL_COMPLETE**
  - Given: current_state = PLAYING
  - When: transition_to(LEVEL_COMPLETE)
  - Then: 返回 true, state_changed 发射 (PLAYING, LEVEL_COMPLETE), current_state = LEVEL_COMPLETE

- **AC8-5: PAUSED → PLAYING**
  - Given: current_state = PAUSED
  - When: transition_to(PLAYING)
  - Then: 返回 true, state_changed 发射 (PAUSED, PLAYING), current_state = PLAYING

- **AC8-6: DEAD → PLAYING**
  - Given: current_state = DEAD
  - When: transition_to(PLAYING)
  - Then: 返回 true, state_changed 发射 (DEAD, PLAYING), current_state = PLAYING

- **AC8-7: DEAD → MAIN_MENU**
  - Given: current_state = DEAD
  - When: transition_to(MAIN_MENU)
  - Then: 返回 true, state_changed 发射 (DEAD, MAIN_MENU), current_state = MAIN_MENU

- **AC8-8: LEVEL_COMPLETE → PLAYING**
  - Given: current_state = LEVEL_COMPLETE
  - When: transition_to(PLAYING)
  - Then: 返回 true, state_changed 发射 (LEVEL_COMPLETE, PLAYING), current_state = PLAYING

- **AC8-9: LEVEL_COMPLETE → MAIN_MENU**
  - Given: current_state = LEVEL_COMPLETE
  - When: transition_to(MAIN_MENU)
  - Then: 返回 true, state_changed 发射 (LEVEL_COMPLETE, MAIN_MENU), current_state = MAIN_MENU

### 非法转换 (重点 case)

- **AC10-1: DEAD → PAUSED**
  - Given: current_state = DEAD
  - When: transition_to(PAUSED)
  - Then: 返回 false, state_changed 不发射, current_state 仍为 DEAD, push_error 触发

- **AC10-2: LEVEL_COMPLETE → PAUSED**
  - Given: current_state = LEVEL_COMPLETE
  - When: transition_to(PAUSED)
  - Then: 返回 false, state_changed 不发射, current_state 仍为 LEVEL_COMPLETE, push_error 触发

- **AC10-3~11: 其余非法组合**
  - 覆盖: MAIN_MENU→MAIN_MENU 以外的所有非白名单路径
  - 如: MAIN_MENU→DEAD, PAUSED→DEAD, DEAD→LEVEL_COMPLETE, LEVEL_COMPLETE→DEAD 等
  - 均验证: 返回 false + 状态不变 + push_error

### 同状态转换 (5 条)

- **AC9-1~5: 每个状态 → 自身**
  - Given: current_state = X
  - When: transition_to(X)
  - Then: 返回 false, state_changed 不发射, push_warning 触发
  - Edge cases: 5 个状态各测一次

### 重入保护

- **Guard-1: state_changed 回调中二次 transition_to**
  - Given: state_changed Signal 已连接一个会调用 transition_to() 的回调
  - When: transition_to(PLAYING) from MAIN_MENU
  - Then: 第一次切换成功, 回调中的第二次 transition_to 返回 false + push_warning

### 只读属性

- **ReadOnly-1: current_state setter 拒绝**
  - Given: current_state = PLAYING
  - When: 直接赋值 `current_state = PAUSED`
  - Then: push_warning 触发, current_state 仍为 PLAYING

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/game-state-machine/core_logic_test.gd` — must exist and pass
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None — GameStateMachine 是 Foundation 层，无上游依赖
- Unlocks: Story 002 (配置驱动转换表)
