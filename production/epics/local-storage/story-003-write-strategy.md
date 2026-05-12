# Story 003: 写入策略与边界情况

> **Epic**: 本地存储
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
> **Manifest Version**: 2026-05-11
> **Estimate**: S (2-3h — 防抖 + 最佳成绩 + 错误处理)

## Context

**GDD**: `design/gdd/local-storage.md`
**Requirement**: `TR-LS-002` (写入策略 + 防抖)

**ADR Governing Implementation**: ADR-004: 平台适配层
**ADR Decision Summary**: 写入策略由 local-storage 控制——platform 层提供同步 set()，不参与策略决策。通关同步写入确保不丢档，设置变更防抖降低写入频率。

**Engine**: Cocos Creator 3.8.8 | **Risk**: LOW
**Engine Notes**: 防抖是纯 JS 逻辑，不受引擎版本影响。

**Control Manifest Rules (this layer)**:
- Required: Storage 写入包裹 try-catch——存储满或数据损坏时 catch 异常、console.error、游戏不崩溃

---

## Acceptance Criteria

*From GDD `design/gdd/local-storage.md`, scoped to this story:*

- [ ] **AC-1**: GIVEN 第 3 关已有 2 星记录（stars=2, bestSteps=18），WHEN 重玩获得 3 星（3, 14），THEN 更新为 stars=3, bestSteps=14（新成绩更优时更新）
- [ ] **AC-2**: GIVEN 第 3 关已有 3 星记录，WHEN 重玩获得 2 星，THEN 不更新（仅新成绩 > 旧成绩时更新）
- [ ] **AC-3**: GIVEN 设置变更，WHEN 500ms 内连续多次调用 saveSettings，THEN 仅在最后一次变更后 500ms 写入一次
- [ ] **AC-4**: GIVEN 微信存储满，WHEN 调用 saveLevelProgress，THEN console.error 输出，游戏不崩溃，游戏继续运行
- [ ] **AC-5**: GIVEN 存储数据损坏（JSON 解析失败），WHEN 读取该数据，THEN 返回默认值，console.error 输出
- [ ] **AC-6**: GIVEN 微信存储 API 不可用，WHEN 调用存储，THEN 静默降级，不崩溃

---

## Implementation Notes

*Derived from ADR-004 + GDD local-storage.md:*

1. **最佳成绩比较**——在 saveLevelProgress 中：
   ```typescript
   // 仅在新成绩更优时更新
   const existing = this.getLevelProgress(levelId);
   if (existing.completed && newStars <= existing.stars && newBestSteps >= existing.bestSteps) {
     return; // 跳过写入
   }
   ```
2. **防抖写入**——对 saveSettings 实现 500ms 防抖：
   ```typescript
   private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
   saveSettings(settings: Partial<Settings>): void {
     Object.assign(this._settings, settings);
     if (this._debounceTimer) clearTimeout(this._debounceTimer);
     this._debounceTimer = setTimeout(() => {
       this._platform.set('nl_settings', JSON.stringify(this._settings));
       this._debounceTimer = null;
     }, 500);
   }
   ```
   saveSettingsImmediate() 跳过防抖（"立即保存"的场景不考虑在当前 MVP 中）
3. **错误处理**——所有 `this._platform.set()` 调用包裹 try-catch（story-001 已经在适配器层做了 try-catch，但 local-storage 层再加一层兜底）
4. **数据损坏恢复**——`getLevelProgress()` 等读取方法中 JSON.parse 包裹 try-catch，解析失败 console.error + 返回默认值

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 001: IPlatformStorage 接口 + 底层适配器
- Story 002: 数据模型定义、基础 CRUD、默认值

---

## QA Test Cases

### AC-1: Update only when better (stars increased)
- Given: `storage.saveLevelProgress(3, 2, 18)` 已写入
- When: `storage.saveLevelProgress(3, 3, 14)` (better stars AND steps)
- Then: platformStorage.set 被调用，写入新值

### AC-2: Don't update when not better
- Given: `storage.saveLevelProgress(3, 3, 14)` 已写入
- When: `storage.saveLevelProgress(3, 2, 20)` (worse)
- Then: platformStorage.set 不被调用
- Edge cases: 相同星级 + 相同步数 → 不写入

### AC-3: 500ms debounce
- Given: `storage.saveSettings({muted: true})` + 立即 `saveSettings({muted: false})`
- When: 50ms 后检查
- Then: platformStorage.set 尚未调用
- When: 600ms 后检查
- Then: platformStorage.set 被调用一次，值为 {muted: false}
- Edge cases: 防抖期间组件卸载——clearTimeout

### AC-4: Storage full
- Given: mock platformStorage.set 抛异常
- When: `storage.saveLevelProgress(1, 1, 5)`
- Then: console.error 被调用，不抛异常，游戏继续

### AC-5: Data corruption
- Given: mock platformStorage.get 返回 'invalid json{{{'
- When: `storage.getLevelProgress(1)`
- Then: 返回默认值 `{completed: false, stars: 0, bestSteps: 0}`
- Edge cases: JSON.parse 抛异常 → console.error + 返回默认值

### AC-6: Storage unavailable
- Given: mock platformStorage.set 抛异常（微信 API 不可用）
- When: `storage.saveLevelProgress(5, 3, 14)`
- Then: 不崩溃，错误被 console.error 记录

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/local-storage/write_strategy_test.ts` — must exist and pass
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 002 (存储管理器基础 CRUD)
- Unlocks: None
