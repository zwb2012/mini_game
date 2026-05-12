# Story 002: Cocos 触摸事件管线

> **Epic**: 输入管理器
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Integration
> **Manifest Version**: 2026-05-11
> **Estimate**: M (3-4h — Cocos 事件绑定 + 管线编排)

## Context

**GDD**: `design/gdd/input-manager.md`
**Requirement**: `TR-IM-001` (事件→坐标), `TR-IM-002` (多点忽略)

**ADR Governing Implementation**: ADR-005: 触控输入管线
**ADR Decision Summary**: 4-step pipeline: TOUCH_START → coordinate mapping → dead zone → state guard → publish. Cocos EventType.TOUCH_START/MOVE/END on canvas node. Multi-touch: only first finger. Subscriber iteration uses .slice() snapshot.

**Engine**: Cocos Creator 3.8.8 | **Risk**: MEDIUM
**Engine Notes**: 使用 `touch.getUILocation()` 而非 `getLocation()`——UI 坐标系与网格渲染一致。调用前检查 `event.touch` 非 null（微信 JSB 环境已知边界）。`Node.off(EventType.TOUCH_*)` 在 onDestroy 中解绑。

**Control Manifest Rules (this layer)**:
- Required: 使用 touch.getUILocation()（非 getLocation()）——UI 坐标系与网格渲染坐标系一致。调用前检查 event.touch 非 null
- Required: 订阅者遍历使用 .slice() 快照——防止回调中 unsubscribe 导致跳过元素
- Required: onDestroy 显式解绑 Cocos 触摸事件——node.off(Node.EventType.TOUCH_*)，清空订阅者数组
- Required: 输入管线模式——触摸事件按序流经 4 个独立处理步骤：坐标映射 → 滑动阈值过滤 → Playing 状态守卫 → 发布给订阅者

---

## Acceptance Criteria

*From GDD `design/gdd/input-manager.md`, scoped to this story:*

- [ ] **AC-1**: GIVEN 状态机为 Playing，WHEN 用户在网格内 TOUCH_START + TOUCH_MOVE，THEN 订阅者收到 INPUT_MOVE 事件且包含正确 gridRow/gridCol
- [ ] **AC-2**: GIVEN 状态机为 Paused，WHEN 用户触摸屏幕，THEN 无 INPUT_MOVE 事件发出
- [ ] **AC-3**: GIVEN 第二指同时触摸，WHEN TOUCH_START 触发，THEN 静默忽略（仅处理第一指）
- [ ] **AC-4**: GIVEN 组件 onDestroy，WHEN 调用，THEN 触摸事件解绑、订阅者清空
- [ ] **AC-5**: GIVEN 订阅者回调中 unsubscribe，WHEN 遍历分发，THEN 使用 .slice() 快照不跳过元素

---

## Implementation Notes

*Derived from ADR-005:*

1. InputManager 类结构：
   ```typescript
   class InputManager {
     constructor(canvasNode: cc.Node, stateMachine: GameStateMachine, gridConfig: GridConfig)
     bind() — 注册 TOUCH_START/MOVE/END
     unbind() — 解绑事件（onDestroy）
     subscribe(cb: (event: InputEvent) => void): () => void
   }
   ```
2. TOUCH_START: 记录 touchId，初始化 dead zone tracking
3. TOUCH_MOVE: `event.touch?.getUILocation()` 读坐标 → screenToGrid() → dead zone → state guard → publish
4. TOUCH_END: emit INPUT_END 事件
5. Multi-touch guard: 只处理 `event.getID() === this._activeTouchId`
6. Subscribe: 内部数组，.slice() 快照遍历
7. onDestroy/unbind: node.off(EventType.TOUCH_START/MOVE/END)，清空订阅者

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 001: 坐标映射纯函数、死区检测、状态守卫
- grid-connection-engine epic: 网格渲染、Bresenham 插值

---

## QA Test Cases

### AC-1: Touch in bounds during Playing
- Given: Cocos mock Node + EventType.TOUCH_MOVE, state=Playing, gridConfig valid
- Given: touch.getUILocation() returns (152, 80), cellSize=72, origin=(8,8)
- When: trigger TOUCH_MOVE on mock node
- Then: subscriber called with INPUT_MOVE containing {row: 1, col: 2}

### AC-2: Touch during Paused
- Given: same setup but state=Paused
- When: trigger TOUCH_MOVE
- Then: subscriber NOT called

### AC-3: Second finger ignored
- Given: first finger touch already active (touchId=0)
- When: TOUCH_START with touchId=1
- Then: no subscriber called, state unchanged

### AC-4: onDestroy cleanup
- Given: InputManager active
- When: unbind() called
- Then: node.off called for TOUCH_START/MOVE/END, subscriber array empty

### AC-5: .slice() snapshot safety
- Given: 2 subscribers, first subscribes unsubscribes in callback
- When: event triggers
- Then: both subscribers still called (slice snapshot prevents skip)

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: `tests/integration/input-manager/touch_pipeline.test.ts` — must exist and pass
**Status**: [x] Complete — 9 tests, all 5 ACs covered + 2 edge cases

---

## Dependencies

- Depends on: Story 001 (坐标映射 + 守卫)
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-05-12
**Criteria**: 5/5 通过
**Deviations**: Advisory — 测试证据文件名 `touch_pipeline.test.ts`（Jest testMatch 要求 `.test.ts` 后缀），story 原始声明为 `_test.ts`
**Test Evidence**: `tests/integration/input-manager/touch_pipeline.test.ts` — 9 项测试全部通过，覆盖 AC-1 ~ AC-5 + 2 边界用例
**Code Review**: Skipped（lean mode）
