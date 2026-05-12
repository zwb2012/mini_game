# Story 002: 存储管理器——数据模型与 CRUD

> **Epic**: 本地存储
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
> **Manifest Version**: 2026-05-11
> **Estimate**: S (2-3h — 数据模型 + CRUD + 前缀处理)

## Context

**GDD**: `design/gdd/local-storage.md`
**Requirement**: `TR-LS-001`

**ADR Governing Implementation**: ADR-004: 平台适配层
**ADR Decision Summary**: `IPlatformStorage` 接口处理原始 set/get，local-storage 层负责 `nl_` 前缀拼接和数据模型序列化。职责分离——platform 层不关心 key 命名和数据格式。

**Engine**: Cocos Creator 3.8.8 | **Risk**: LOW (纯 TS 逻辑)
**Engine Notes**: 纯 TypeScript——数据模型定义、JSON 序列化、key 拼接，无 Cocos API 依赖。

**Control Manifest Rules (this layer)**:
- Required: Storage 写入包裹 try-catch——存储满或数据损坏时 catch 异常、console.error、游戏不崩溃
- Required: 平台存储使用 IPlatformStorage 接口——业务代码只依赖接口

---

## Acceptance Criteria

*From GDD `design/gdd/local-storage.md`, scoped to this story:*

- [ ] **AC-1**: GIVEN 玩家首次启动游戏，WHEN 读取 `nl_level_1`，THEN 返回默认值（completed=false, stars=0, bestSteps=0）
- [ ] **AC-2**: GIVEN 玩家通关第 5 关获得 3 星，WHEN 调用 saveLevelProgress(5, 3, 14)，THEN 数据成功写入，再次读取时 stars=3, bestSteps=14
- [ ] **AC-3**: GIVEN 读取设置，WHEN 首次启动，THEN 返回默认设置（muted=false）
- [ ] **AC-4**: GIVEN 元数据不存在，WHEN 读取 meta，THEN 返回默认值（totalPlayTime=0）
- [ ] **AC-5**: 所有写入的 key 自动添加 `nl_` 前缀——业务逻辑不关心原始 key

---

## Implementation Notes

*Derived from ADR-004:*

1. 数据模型定义（~/model/storage-data.ts）：
   ```typescript
   interface LevelProgress { completed: boolean; stars: number; bestSteps: number; firstCompletedAt: string; }
   interface Settings { muted: boolean; lastPlayedLevelId: number; }
   interface MetaData { totalPlayTime: number; totalLevelsCompleted: number; installDate: string; }
   ```
2. `LocalStorage` 类，构造时接收 `IPlatformStorage` 实例（依赖注入，便于测试）
3. Key 前缀处理——内部所有 key 自动添加 `nl_`：`saveLevelProgress(id)` → 实际 key `nl_level_${id}`
4. 读取不存在 key → 返回类型安全的默认值（全 False/0/空字符串）
5. 写入时 JSON.stringify，读取时 JSON.parse + try-catch（数据损坏回退到默认值）
6. 所有 public 方法：getLevelProgress, saveLevelProgress, getSettings, saveSettings, getMeta, saveMeta

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 001: IPlatformStorage 接口 + WeChat/Web 适配器
- Story 003: 防抖写入、最佳成绩比较、存储满异常

---

## QA Test Cases

### AC-1: Default values for new player
- Given: mock `platformStorage.get` 返回 null
- When: `storage.getLevelProgress(1)`
- Then: 返回 `{completed: false, stars: 0, bestSteps: 0, firstCompletedAt: ''}`

### AC-2: Save and read level progress
- Given: mock `platformStorage` set/get
- When: `storage.saveLevelProgress(5, 3, 14)` + `storage.getLevelProgress(5)`
- Then: get 返回 `{completed: true, stars: 3, bestSteps: 14}`
- Edge cases: 存储的 key 包含 `nl_` 前缀——实际调用 `platformStorage.set('nl_level_5', ...)`

### AC-3: Default settings
- Given: mock `platformStorage.get` 返回 null
- When: `storage.getSettings()`
- Then: 返回 `{muted: false, lastPlayedLevelId: 1}`

### AC-4: Default meta
- Given: mock `platformStorage.get` 返回 null
- When: `storage.getMeta()`
- Then: 返回 `{totalPlayTime: 0, totalLevelsCompleted: 0, installDate: ''}`

### AC-5: nl_ prefix check
- Given: mock `platformStorage`
- When: `storage.saveLevelProgress(1, 2, 10)`
- Then: `platformStorage.set` 以 `nl_level_1` 作为 key 被调用

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/local-storage/storage_manager_test.ts` — must exist and pass
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001 (IPlatformStorage 接口)
- Unlocks: Story 003 (写入策略依赖基础 CRUD)
