# Story 001: 核心状态机——状态定义与合法转换

> **Epic**: 游戏状态机
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Manifest Version**: 2026-05-11
> **Estimate**: S (2-3h — 纯 TS 逻辑，<200 行代码，无外部依赖)

## Context

**GDD**: `design/gdd/game-state-machine.md`
**Requirement**: `TR-GSM-001`, `TR-GSM-002`

**ADR Governing Implementation**: ADR-001: 游戏状态机架构
**ADR Decision Summary**: 回调注册模式——状态机内部维护 `Map<GameState, Set<callback>>`，系统通过 `onEnter(state, cb)` 和 `onExit(state, cb)` 注册监听。状态转换时同步按序执行所有回调。

**Engine**: Cocos Creator 3.8.8 | **Risk**: LOW
**Engine Notes**: 纯 TypeScript 逻辑，不依赖 Cocos API。无需引擎环境即可单元测试。

**Control Manifest Rules (this layer)**:
- Required: 状态机使用回调注册模式 — `onEnter(state, cb)` / `onExit(state, cb)` 注册监听，`transition(event, params)` 触发转换。回调返回 unsubscribe 函数。
- Required: 回调同步按序执行——每个回调包裹 try-catch，一个回调抛异常不阻塞后续回调。
- Forbidden: 禁用全局 EventBus 替代状态机回调 — 对 4 状态 11 系统的极简游戏，EventBus 增加概念复杂度而无对应收益。
- Forbidden: 禁用 Cocos EventTarget 作为状态分发机制 — 依赖 Cocos 运行时，状态机无法脱离引擎单元测试。
- Forbidden: 禁用 XState 等外部状态机库 — 增加 ~12KB 包体，违反 Pillar 4。

---

## Acceptance Criteria

*From GDD `design/gdd/game-state-machine.md`, scoped to this story:*

- [ ] **AC-1**: GIVEN 当前状态为 Menu，WHEN 触发 SELECT_LEVEL 且 levelId 有效，THEN 状态变为 Playing，转换完成
- [ ] **AC-2**: GIVEN 当前状态为 Playing，WHEN 触发 PAUSE，THEN 状态变为 Paused
- [ ] **AC-3**: GIVEN 当前状态为 Paused，WHEN 触发 RESUME，THEN 状态变为 Playing
- [ ] **AC-4**: GIVEN 当前状态为 Paused，WHEN 触发 QUIT_TO_MENU，THEN 状态变为 Menu
- [ ] **AC-5**: GIVEN 当前状态为 Playing，WHEN 触发 LEVEL_COMPLETE，THEN 状态变为 LevelComplete
- [ ] **AC-6**: GIVEN 当前状态为 LevelComplete，WHEN 触发 NEXT_LEVEL（且 levelId+1 存在），THEN 状态变为 Playing，携带新 levelId
- [ ] **AC-7**: GIVEN 当前状态为 LevelComplete，WHEN 触发 REPLAY，THEN 状态变为 Playing，携带当前 levelId
- [ ] **AC-8**: GIVEN 当前状态为 LevelComplete，WHEN 触发 BACK_TO_MENU，THEN 状态变为 Menu
- [ ] **AC-9**: `getState()` 始终返回当前正确状态

---

## Implementation Notes

*Derived from ADR-001 Implementation Guidelines:*

1. 定义 `GameState` 枚举: `Menu = 'Menu'`, `Playing = 'Playing'`, `Paused = 'Paused'`, `LevelComplete = 'LevelComplete'`
2. 建立转换表——内部数据结构：
   ```typescript
   private _transitions: Map<GameState, Map<string, TransitionRule>>
   // TransitionRule = { target: GameState, condition?: (params?: any) => boolean }
   ```
3. `transition(event, params)` 方法：
   - 查表获取 TransitionRule
   - 如有 `condition` 函数，先调用检查——不满足则静默忽略
   - 更新 `currentState`
   - 同步执行 onExit(prev) 和 onEnter(current) 回调链
4. `getState()` 返回 `this._currentState`——同步、O(1)
5. 全部 <200 行代码——遵循 Pillar 4

---

## Performance Budget

- **CPU**: <0.01ms per transition——纯同步查表 + 状态赋值，无循环/异步开销 (from ADR-001)
- **Memory**: <1KB——单一 `GameState` 枚举值 + 转换表静态数据结构 (from ADR-001)

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: onEnter/onExit 回调注册与执行逻辑
- Story 003: 非法转换处理、快速连续转换排队、回调异常捕获、destroy()
- Story 004: 微信 wx.onHide → 自动 PAUSE

---

## QA Test Cases

### AC-1: SELECT_LEVEL from Menu → Playing
- Given: 状态机初始化为 `GameState.Menu`
- When: 调用 `transition('SELECT_LEVEL', { levelId: 1 })`
- Then: `getState()` 返回 `GameState.Playing`
- Edge cases: levelId 为 0、负数、undefined——暂由 condition 判断（当前 MVP 阶段不作参数校验，由 level-data-schema 保证）

### AC-2: PAUSE from Playing → Paused
- Given: 状态机当前状态为 `GameState.Playing`
- When: 调用 `transition('PAUSE')`
- Then: `getState()` 返回 `GameState.Paused`

### AC-3: RESUME from Paused → Playing
- Given: 状态机当前状态为 `GameState.Paused`
- When: 调用 `transition('RESUME')`
- Then: `getState()` 返回 `GameState.Playing`

### AC-4: QUIT_TO_MENU from Paused → Menu
- Given: 状态机当前状态为 `GameState.Paused`
- When: 调用 `transition('QUIT_TO_MENU')`
- Then: `getState()` 返回 `GameState.Menu`

### AC-5: LEVEL_COMPLETE from Playing → LevelComplete
- Given: 状态机当前状态为 `GameState.Playing`
- When: 调用 `transition('LEVEL_COMPLETE')`
- Then: `getState()` 返回 `GameState.LevelComplete`

### AC-6: NEXT_LEVEL from LevelComplete → Playing
- Given: 状态机当前状态为 `GameState.LevelComplete`
- When: 调用 `transition('NEXT_LEVEL', { levelId: 3 })` 且 levelId+1 关卡存在
- Then: `getState()` 返回 `GameState.Playing`
- Edge cases: NEXT_LEVEL 在末关时——`condition` 检查失败，状态保持 LevelComplete

### AC-7: REPLAY from LevelComplete → Playing
- Given: 状态机当前状态为 `GameState.LevelComplete`
- When: 调用 `transition('REPLAY', { levelId: 3 })`
- Then: `getState()` 返回 `GameState.Playing`

### AC-8: BACK_TO_MENU from LevelComplete → Menu
- Given: 状态机当前状态为 `GameState.LevelComplete`
- When: 调用 `transition('BACK_TO_MENU')`
- Then: `getState()` 返回 `GameState.Menu`

### AC-9: getState() correctness
- Given: 状态机初始化为 `GameState.Menu`
- When: 执行一系列合法转换 Menu → Playing → Paused → Playing → LevelComplete
- Then: 每步后 `getState()` 返回正确状态，始终一致

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/game-state-machine/core_transition_test.ts` — must exist and pass
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 002 (回调注册需要转换框架就位)

---

## Completion Notes
**Completed**: 2026-05-11
**Criteria**: 9/9 passing (auto-verified via 15 unit tests)
**Deviations**: None
**Test Evidence**: `tests/unit/game-state-machine/core_transition.test.ts` — 15 tests, all passing
**Code Review**: APPROVED — `/code-review` verdict: clean, ADR-compliant, ARCHITECTURE: CLEAN, SOLID: COMPLIANT
