# Story 001: 核心场景加载器

> **Epic**: scene-manager
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 3-4 hours
> **Manifest Version**: 2026-05-11

## Context

**GDD**: `design/gdd/scene-manager.md`
**Requirement**: `TR-SM-001`, `TR-SM-002`

**ADR Governing Implementation**: ADR-001: 游戏状态机架构
**ADR Decision Summary**: 状态机通过 `onEnter(state, cb)` / `onExit(state, cb)` 注册回调，状态转换时按注册顺序同步执行。SceneManager 注册 onEnter(Menu) 和 onEnter(Playing) 回调驱动场景切换。

**Engine**: Cocos Creator 3.8.8 | **Risk**: LOW
**Engine Notes**: `director.loadScene()` 和 `director.preloadScene()` 是 Cocos 3.0+ 核心 API，版本稳定性高。纯 TS 逻辑部分可脱离引擎单元测试。

**Control Manifest Rules (this layer)**:
- Required: 状态机使用回调注册模式 — `onEnter(state, cb)` 注册监听，回调返回 unsubscribe 函数
- Required: 回调同步按序执行 — 每个回调包裹 try-catch
- Forbidden: 禁止 Foundation 层反向依赖 Core/Feature/Presentation
- Forbidden: 禁用全局 EventBus 替代状态机回调
- Guardrail: 状态转换 <0.01ms/次

---

## Acceptance Criteria

*From GDD `design/gdd/scene-manager.md`:*

- [ ] **GIVEN** 状态机进入 Menu 态，**WHEN** 场景管理器响应，**THEN** 当前场景为 MenuScene
- [ ] **GIVEN** 状态机从 Menu 进入 Playing 态，**WHEN** 传入 levelId=5，**THEN** 当前场景为 GameScene，且引擎收到 levelId=5
- [ ] **GIVEN** GameScene 预加载完成，**WHEN** 触发 Menu→Playing 状态转换，**THEN** 场景切换在 100ms 内完成（无网络加载延迟）

---

## Implementation Notes

*Derived from ADR-001 Implementation Guidelines:*

- SceneManager 构造函数接收 `GameStateMachine` 实例（依赖注入，便于单元测试 mock）
- 注册 `onEnter(GameState.Menu, () => director.loadScene("MenuScene"))` 
- 注册 `onEnter(GameState.Playing, (prev, params) => director.loadScene("GameScene", params))` —— `params` 包含 `{levelId: number}`
- MenuScene 显示后异步调用 `director.preloadScene("GameScene")` —— 非阻塞
- 预加载完成标记 `_gameScenePreloaded = true`
- 使用 `director.loadScene(name, onLaunched)` 回调检测加载完成
- Paused 和 LevelComplete 状态不触发场景切换（它们在 GameScene 内覆盖 UI 层）
- 场景参数通过 loadScene 的第二参数传递，目标场景在 `onLoad()` 中从 `director.getScene().params` 读取

---

## QA Test Cases

- **AC-1**: 状态机进入 Menu 态加载 MenuScene
  - Given: 状态机初始为 Menu 态
  - When: SceneManager 初始化并注册 onEnter 回调
  - Then: director.loadScene("MenuScene") 被调用
  - Edge cases: 若已在 MenuScene，再次触发 Menu 不重新加载

- **AC-2**: Playing 态加载 GameScene 并传递 levelId
  - Given: 状态机当前为 Menu 态
  - When: transition('SELECT_LEVEL', { levelId: 5 })
  - Then: director.loadScene("GameScene") 被调用，onLaunched 回调中场景参数 levelId=5 可读取
  - Edge cases: levelId 为 0 或负数时的行为

- **AC-3**: 预加载 GameScene
  - Given: SceneManager 已注册 onEnter(Menu) 回调
  - When: MenuScene 加载完成
  - Then: director.preloadScene("GameScene") 被调用，预加载完成后 _gameScenePreloaded = true
  - Edge cases: 预加载失败时 _gameScenePreloaded 保持 false，切换时走即时加载路径

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/scene-manager/core_scene_loader.test.ts` — must exist and pass

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: **game-state-machine epic complete** (GameStateMachine 实例可用)
- Unlocks: Story 002 (edge cases — duplicate guard, error handling)

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: 重复加载忽略、快速连续转换去重、加载失败回退 MenuScene

---

## Completion Notes
**Completed**: 2026-05-11
**Criteria**: 3/3 passing
**Deviations**: None
**Test Evidence**: Logic — test file at `tests/unit/scene-manager/core_scene_loader.test.ts` (11 tests)
**Code Review**: Approved
