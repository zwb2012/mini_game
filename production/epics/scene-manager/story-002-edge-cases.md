# Story 002: 守卫子句与错误处理

> **Epic**: scene-manager
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Manifest Version**: 2026-05-11

## Context

**GDD**: `design/gdd/scene-manager.md`
**Requirement**: `TR-SM-001`

**ADR Governing Implementation**: ADR-001: 游戏状态机架构
**ADR Decision Summary**: 非法转换静默忽略 + console.warn。状态机本身提供 destroy 后的转换拒绝。SceneManager 自身还需处理场景级冗余操作（重复加载同一场景、快速连续触发去重）。

**Engine**: Cocos Creator 3.8.8 | **Risk**: LOW
**Engine Notes**: `director.loadScene()` 在目标场景已加载时仍会触发重新加载（Cocos 默认行为）——SceneManager 需自行判断是否已在目标场景并静默忽略。

**Control Manifest Rules (this layer)**:
- Required: 非法转换静默忽略 + console.warn — 不抛异常
- Required: 状态机销毁后拒绝所有后续转换
- Forbidden: 禁止 Foundation 层反向依赖 Core/Feature/Presentation

---

## Acceptance Criteria

*From GDD `design/gdd/scene-manager.md`:*

- [ ] **GIVEN** 已在 GameScene，**WHEN** 再次触发 loadScene("GameScene")，**THEN** 请求被静默忽略
- [ ] **GIVEN** 场景加载失败（模拟资源缺失），**WHEN** loadScene 回调 error，**THEN** console.error 输出，当前场景回退到 MenuScene
- [ ] **GIVEN** 状态机快速连续触发 Menu→Playing→Menu（< 100ms），**WHEN** 场景管理器处理，**THEN** 仅处理最新的状态，中间的 loadScene 请求被取消
- [ ] **GIVEN** 微信切后台期间场景加载完成，**WHEN** 回到前台，**THEN** 场景已就绪，正常处理

---

## Implementation Notes

*Derived from ADR-001 and GDD scene-manager.md:*

- 维护 `_currentScene: string | null` 记录当前已加载的场景名
- loadScene 前检查 —— 若目标场景 === `_currentScene`，静默返回（不调用 director.loadScene）
- 快速连续转换去重：使用 `_pendingLoadId` 递增计数器，loadScene 回调中检查是否为最新请求
- 加载失败时：`console.error` → 将 `_currentScene` 重置为 `null` → 强制加载 MenuScene 作为安全回退
- 不在 loadScene 中抛异常 —— 所有错误通过 console.error 报告，游戏继续运行
- Cocos director 场景加载是异步的 —— 失败检查在 `onLaunched` 回调中通过 try-catch 包裹实现

---

## QA Test Cases

- **AC-1**: 重复加载同一场景静默忽略
  - Given: _currentScene = "GameScene"
  - When: 再次调用 loadScene("GameScene")
  - Then: 函数立即返回，不调用 director.loadScene，无 console.warn/error 输出
  - Edge cases: 加载失败后 _currentScene 被清空，需验证此时不会误触发重复忽略

- **AC-2**: 加载失败回退 MenuScene
  - Given: SceneManager 正常运行
  - When: director.loadScene("GameScene") 回调返回 error
  - Then: console.error 输出错误信息，loader 自动调用 director.loadScene("MenuScene") 回退
  - Edge cases: MenuScene 本身加载也失败——需确保不进入死循环

- **AC-3**: 快速连续转换去重
  - Given: SceneManager 正在加载 GameScene（_pendingLoadId=1）
  - When: 在加载完成前触发 2 次状态转换（_pendingLoadId 递增到 3）
  - Then: 仅 _pendingLoadId=3 的 loadScene 回调生效，中间请求的结果被丢弃
  - Edge cases: _pendingLoadId 溢出（长时间运行后）——使用 Number.MAX_SAFE_INTEGER 后回绕

- **AC-4**: 微信切后台场景就绪
  - Given: 前台触发 loadScene("GameScene")
  - When: 加载过程中切后台，回到前台时加载已完成
  - Then: onLaunched 回调正常执行，_currentScene 正确更新为 "GameScene"
  - Edge cases: 切后台期间多次状态转换——仅最后有效

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/scene-manager/edge_cases.test.ts` — must exist and pass

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001 (SceneManager 核心加载逻辑已实现)
- Unlocks: None (last story in this epic)

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 001: 核心场景加载、预加载、参数传递

---

## Completion Notes
**Completed**: 2026-05-11
**Criteria**: 4/4 passing (13 test functions cover all ACs + RESUME edge cases)
**Deviations**: None
**Test Evidence**: Logic — test file at `tests/unit/scene-manager/edge_cases.test.ts` (13 tests)
**Code Review**: Approved
