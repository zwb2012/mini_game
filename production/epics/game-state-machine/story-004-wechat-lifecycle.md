# Story 004: 微信生命周期集成——切后台自动暂停

> **Epic**: 游戏状态机
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Integration
> **Manifest Version**: 2026-05-11

## Context

**GDD**: `design/gdd/game-state-machine.md`
**Requirement**: `TR-GSM-004` (微信切后台自动 PAUSE)

**ADR Governing Implementation**: ADR-001: 游戏状态机架构
**ADR Decision Summary**: 监听 `wx.onHide` 回调，触发 `transition('PAUSE')`。恢复前台时引擎从 onEnter(Playing) 恢复路径状态。

**Engine**: Cocos Creator 3.8.8 | **Risk**: LOW (微信 API 稳定)
**Engine Notes**: 在 Web 预览模式下 `wx` 不存在——需要 `typeof wx !== 'undefined'` 守卫。`wx.onHide` / `wx.onShow` 为微信小游戏标准生命周期 API。

**Control Manifest Rules (this layer)**:
- Required: 微信切后台自动 PAUSE — 监听 `wx.onHide` 回调，触发 `transition('PAUSE')`。恢复前台时引擎从 onEnter(Playing) 恢复路径状态。
- Required: 平台检测在模块加载时完成 — `createPlatformStorage()` 一次检测 `sys.platform`，后续调用零分支开销。

---

## Acceptance Criteria

*From GDD `design/gdd/game-state-machine.md`, scoped to this story:*

- [ ] **AC-1**: GIVEN 当前状态为 Playing，WHEN 微信触发 onHide（切后台），THEN 状态自动变为 Paused
- [ ] **AC-2**: GIVEN 当前状态为 Menu，WHEN 微信触发 onHide，THEN 不触发 PAUSE（Menu 态无需暂停）
- [ ] **AC-3**: GIVEN 微信环境不可用（Web 预览），WHEN 在浏览器中运行，THEN 不崩溃，`wx` 不存在被安全跳过
- [ ] **AC-4**: GIVEN 状态机已 destroy()，WHEN 微信 onHide 触发，THEN 不执行 transition

---

## Implementation Notes

*Derived from ADR-001 + ADR-004:*

1. 在 `GameStateMachine` 构造函数或 `init()` 中：
   ```typescript
   if (typeof wx !== 'undefined' && wx.onHide) {
     wx.onHide(() => {
       if (this._destroyed) return;
       if (this._currentState === GameState.Playing) {
         this.transition('PAUSE');
       }
     });
     // 可选：wx.onShow 不需要主动 RESUME——玩家手动点击"继续"
   }
   ```
2. `wx.onHide` 注册在构造函数中——仅注册一次。不需要 `wx.offHide`（微信生命周期回调随小游戏生命周期自动管理）
3. Web 预览模式下 `typeof wx === 'undefined'`——静默跳过，不抛异常
4. 在 `destroy()` 中不需要显式解绑 `wx.onHide`——微信 API 回调在页面销毁后不再触发

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 001–003: 状态机核心逻辑（transition、回调、边界守卫）
- 网格连线引擎的路径保存/恢复——属于 grid-connection-engine epic

---

## QA Test Cases

### AC-1: onHide triggers PAUSE during Playing
- Given: 状态机当前状态为 `GameState.Playing`，mock `wx.onHide` 保存回调
- When: 调用 mock 的 onHide 回调
- Then: `getState()` 返回 `GameState.Paused`，onExit(Playing) 和 onEnter(Paused) 按序执行
- Edge cases: 连续两次 onHide——第二次不触发（状态已是 Paused，重复 PAUSE 非法，静默忽略）

### AC-2: onHide does NOT trigger PAUSE during Menu
- Given: 状态机当前状态为 `GameState.Menu`
- When: 调用 mock 的 onHide 回调
- Then: `getState()` 仍为 `GameState.Menu`，不触发 transition
- Edge cases: 在 Paused 或 LevelComplete 状态收到 onHide——同样不触发

### AC-3: Web fallback — no wx object
- Given: 全局无 `wx` 对象（Web 预览环境）
- When: 创建 GameStateMachine 实例
- Then: 构造成功，不抛异常，状态机正常运作（仅无自动 PAUSE 功能）
- Edge cases: `wx` 存在但 `wx.onHide` 不存在（降级微信版本）——安全跳过

### AC-4: Destroyed state machine ignores onHide
- Given: 状态机在 Playing 态，已调用 `destroy()`
- When: mock onHide 回调触发
- Then: `transition()` 不被调用，状态保持 destroy 前的值
- Edge cases: destroy 后 `_destroyed = true` 首行守卫生效

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: `tests/integration/game-state-machine/wechat_lifecycle_test.ts` — must exist and pass
**Status**: [x] Complete — `tests/integration/game-state-machine/wechat_lifecycle.test.ts` — 9 tests, all passing

---

## Dependencies

- Depends on: Story 001 (核心转换), Story 003 (destroy 守卫)
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-05-11
**Criteria**: 4/4 passing (auto-verified via 9 integration tests)
**Deviations**: None — used `(globalThis as any).wx` instead of raw `wx` for TypeScript compatibility
**Test Evidence**: `tests/integration/game-state-machine/wechat_lifecycle.test.ts` — 9 tests, all passing
**Code Review**: REVIEWED as part of GameStateMachine.ts — APPROVED
