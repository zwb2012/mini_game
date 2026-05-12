# Story 002: 回调注册与同步执行

> **Epic**: 游戏状态机
> **Status**: Complete
> **Note**: 实现代码在 Story 001 中随核心状态机一同完成（onEnter/onExit 属于 ADR-001 定义的核心 API）。本 Story 新增专用测试 14 个。
> **Layer**: Foundation
> **Type**: Logic
> **Manifest Version**: 2026-05-11

## Context

**GDD**: `design/gdd/game-state-machine.md`
**Requirement**: `TR-GSM-003`

**ADR Governing Implementation**: ADR-001: 游戏状态机架构
**ADR Decision Summary**: `onEnter(state, cb)` / `onExit(state, cb)` 注册回调，返回 unsubscribe 函数。状态转换时按注册顺序同步执行所有回调，每个回调包裹 try-catch。

**Engine**: Cocos Creator 3.8.8 | **Risk**: LOW
**Engine Notes**: 纯 TypeScript，不依赖 Cocos API。

**Control Manifest Rules (this layer)**:
- Required: 状态机使用回调注册模式 — `onEnter(state, cb)` / `onExit(state, cb)` 注册监听，`transition(event, params)` 触发转换。回调返回 unsubscribe 函数。
- Required: 回调同步按序执行——每个回调包裹 try-catch，一个回调抛异常不阻塞后续回调。

---

## Acceptance Criteria

*From GDD `design/gdd/game-state-machine.md`, scoped to this story:*

- [ ] **AC-1**: GIVEN 当前状态为 Menu，WHEN 触发 SELECT_LEVEL 且 levelId 有效，THEN onExit(Menu) 和 onEnter(Playing) 回调均被调用
- [ ] **AC-2**: 回调按 `onEnter()` / `onExit()` 注册顺序同步执行——先注册的先调用
- [ ] **AC-3**: 回调收到正确的 `prevState` 和 `params` 参数
- [ ] **AC-4**: `onEnter(state, cb)` 返回 unsubscribe 函数——调用后该回调不再触发
- [ ] **AC-5**: `onExit(state, cb)` 返回 unsubscribe 函数——调用后该回调不再触发
- [ ] **AC-6**: 同一状态注册多个回调——全部按序调用

---

## Implementation Notes

*Derived from ADR-001 Implementation Guidelines:*

1. 内部数据结构：
   ```typescript
   private _enterListeners: Map<GameState, Set<StateCallback>>
   private _exitListeners: Map<GameState, Set<StateCallback>>
   ```
2. `onEnter(state, cb)`：
   - 创建/追加 cb 到 `_enterListeners.get(state)`
   - 返回 `() => this._enterListeners.get(state)?.delete(cb)`
3. `onExit(state, cb)`：同上，操作 `_exitListeners`
4. 在 `transition()` 方法中集成（对 Story 001 的扩展）：
   - 切换状态前：执行 `_exitListeners.get(currentState)` 中的全部回调（按 Set 迭代顺序）
   - 切换状态后：执行 `_enterListeners.get(currentState)` 中的全部回调
   - 每个回调包裹 `try { cb(prevState, params) } catch(e) { console.error(...) }`

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 001: 状态枚举、转换表、transition() 核心逻辑
- Story 003: 回调异常捕获（try-catch 在 Story 002 中实现，但边缘测试在 003）
- Story 004: 微信生命周期

---

## QA Test Cases

### AC-1: onExit + onEnter called on transition
- Given: 注册 `onExit(GameState.Menu, cb1)` 和 `onEnter(GameState.Playing, cb2)`
- When: `transition('SELECT_LEVEL', { levelId: 1 })` from Menu
- Then: cb1 被调用（参数: Menu, {levelId: 1}），cb2 被调用（参数: Menu, {levelId: 1}）
- Edge cases: 无回调注册时不崩溃

### AC-2: Registration order preserved
- Given: 按序注册 cb1, cb2, cb3 到 `onEnter(GameState.Playing, ...)`
- When: transition 进入 Playing
- Then: 调用顺序为 cb1 → cb2 → cb3
- Edge cases: 中间回调抛异常——后续回调仍执行

### AC-3: prevState and params correctness
- Given: 从 Menu 转换到 Playing，携带 `{levelId: 5}`
- When: onEnter(Playing) 回调执行
- Then: 回调收到 `prevState = GameState.Menu`, `params = {levelId: 5}`

### AC-4: Unsubscribe stops callback
- Given: `const unsub = onEnter(GameState.Playing, cb)`，然后调用 `unsub()`
- When: 再次 transition 进入 Playing
- Then: cb 不被调用
- Edge cases: 多次调用 unsub() 不抛异常

### AC-5: Same for onExit
- Given: `const unsub = onExit(GameState.Menu, cb)`，然后调用 `unsub()`
- When: transition 离开 Menu
- Then: cb 不被调用

### AC-6: Multiple callbacks same state
- Given: 注册 cb1, cb2 到 `onEnter(GameState.Playing, ...)`
- When: transition 进入 Playing
- Then: cb1 和 cb2 都被调用

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/game-state-machine/callback_registration_test.ts` — must exist and pass
**Status**: [x] Complete — `tests/unit/game-state-machine/callback_registration.test.ts` — 14 tests, all passing

---

## Dependencies

- Depends on: Story 001 (核心转换)
- Unlocks: Story 003 (边界守卫可测试)

---

## Completion Notes
**Completed**: 2026-05-11
**Criteria**: 6/6 passing (auto-verified via 14 unit tests)
**Deviations**: None — implementation code contributed to Story 001 (onEnter/onExit are ADR-001 core API)
**Test Evidence**: `tests/unit/game-state-machine/callback_registration.test.ts` — 14 tests, all passing
**Code Review**: Code reviewed as part of GameStateMachine.ts (Story 001) — APPROVED
