# Story 003: 边界情况守卫

> **Epic**: 游戏状态机
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Manifest Version**: 2026-05-11

## Context

**GDD**: `design/gdd/game-state-machine.md`
**Requirement**: `TR-GSM-004` (非法转换 + 快速竞态 + 异常 + 销毁)

**ADR Governing Implementation**: ADR-001: 游戏状态机架构
**ADR Decision Summary**: 非法转换静默忽略 + console.warn。同一状态重复转换无副作用。快速连续转换排队处理。回调异常捕获不阻塞后续回调。destroy() 后拒绝所有转换。

**Engine**: Cocos Creator 3.8.8 | **Risk**: LOW
**Engine Notes**: 纯 TypeScript——所有边界情况可脱离引擎单元测试。

**Control Manifest Rules (this layer)**:
- Required: 非法转换静默忽略 + console.warn — 不抛异常。同一状态重复转换无副作用。
- Required: 状态机销毁后拒绝所有后续转换 — `transition()` 调用前检查 `destroyed` 标记。
- Required: 回调同步按序执行——每个回调包裹 try-catch，一个回调抛异常不阻塞后续回调。

---

## Acceptance Criteria

*From GDD `design/gdd/game-state-machine.md`, scoped to this story:*

- [ ] **AC-1**: GIVEN 当前状态为 LevelComplete，WHEN 触发 PAUSE，THEN 请求被静默忽略，状态保持 LevelComplete，console.warn 输出
- [ ] **AC-2**: GIVEN 当前状态为 Playing，WHEN 再次触发 Playing 等效转换（同一状态重复），THEN 静默忽略，不触发 onEnter/onExit
- [ ] **AC-3**: GIVEN 当前状态为 Playing，WHEN 快速连续触发 PAUSE 和 RESUME（<16ms 间隔），THEN 最终状态为 Playing，回调按 PAUSE→RESUME 顺序执行（第二次请求排队）
- [ ] **AC-4**: GIVEN 状态机 onEnter 回调中抛异常，WHEN 触发状态转换，THEN 异常被捕获并 console.error，转换仍完成，后续回调继续执行
- [ ] **AC-5**: GIVEN 状态机已调用 destroy()，WHEN 触发任何 transition()，THEN 请求被拒绝（静默忽略 + console.warn）

---

## Implementation Notes

*Derived from ADR-001:*

1. **非法转换检查**：`transition()` 查表失败时 `console.warn('[GSM] Illegal transition: %s → %s', currentState, event)` 然后 `return`
2. **同一状态重复**：`if (rule.target === currentState) { return }` ——最早检查，早于 onExit/onEnter
3. **快速连续转换排队**：引入 `_isTransitioning` 标志位 + `_pending: {event, params} | null` 队列：
   - `transition()` 开始时设 `_isTransitioning = true`
   - 如果调用时 `_isTransitioning` 已为 true，将请求存入 `_pending`（覆盖前一个 pending）
   - 回调链执行完后检查 `_pending`，如有则递归调用 `transition()`
4. **回调异常隔离**：每回调包裹 `try { cb(prevState, params) } catch(e) { console.error('[GSM] Callback error:', e) }`
5. **destroy()**：设 `_destroyed = true`，清空全部 listener Map。`transition()` 首行检查 `if (_destroyed) { console.warn('[GSM] Destroyed — rejecting transition'); return }`

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 001: 状态枚举、转换表、transition() 核心路径
- Story 002: onEnter/onExit 注册、回调执行
- Story 004: 微信 onHide → PAUSE

---

## QA Test Cases

### AC-1: Illegal transition ignored
- Given: 状态机当前状态为 `GameState.LevelComplete`
- When: 调用 `transition('PAUSE')`
- Then: `getState()` 仍为 `GameState.LevelComplete`，console.warn 被调用
- Edge cases: 所有非法组合均静默忽略（共 4×8 - 8 = 24 种非法组合选代表性的测试）

### AC-2: Same-state no-op
- Given: 状态机当前状态为 `GameState.Playing`，注册了 onEnter/onExit
- When: 调用 `transition('SELECT_LEVEL', { levelId: 2 })`（从 Playing 出发不合法——SELECT_LEVEL 仅在 Menu 合法）
- Then: 状态保持 Playing，onEnter/onExit 均不被调用

### AC-3: Rapid consecutive transitions
- Given: 状态机当前状态为 `GameState.Playing`
- When: 同步调用 `transition('PAUSE')` 后立即调用 `transition('RESUME')`（在同一个调用栈帧中）
- Then: 最终 `getState()` 返回 `GameState.Playing`，PAUSE 的 onExit(Playing)/onEnter(Paused) 和 RESUME 的 onExit(Paused)/onEnter(Playing) 按序执行
- Edge cases: 3 次以上连续转换——最后一次 pending 生效

### AC-4: Callback exception isolation
- Given: onEnter(Playing) 注册了 cb1（抛异常）和 cb2（正常）
- When: transition 进入 Playing
- Then: cb2 被调用，转换完成，状态为 Playing，console.error 记录 cb1 的异常
- Edge cases: 全部回调抛异常——转换仍完成，状态正确

### AC-5: destroy() blocks transitions
- Given: 状态机已调用 `destroy()`
- When: 调用 `transition('PAUSE')`
- Then: 状态不变，console.warn 输出，回调不触发
- Edge cases: destroy() 可安全多次调用

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/game-state-machine/edge_cases_test.ts` — must exist and pass
**Status**: [x] Complete — `tests/unit/game-state-machine/edge_cases.test.ts` — 11 tests, all passing

---

## Dependencies

- Depends on: Story 001 (核心转换), Story 002 (回调注册)
- Unlocks: None (Foundation 层最后一块)

---

## Completion Notes
**Completed**: 2026-05-11
**Criteria**: 5/5 passing (auto-verified via 11 unit tests)
**Deviations**: None
**Test Evidence**: `tests/unit/game-state-machine/edge_cases.test.ts` — 11 tests, all passing
**Code Review**: REVIEWED as part of GameStateMachine.ts modifications — APPROVED
