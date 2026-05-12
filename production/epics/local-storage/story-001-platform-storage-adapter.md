# Story 001: IPlatformStorage 接口与双平台适配器

> **Epic**: 本地存储
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Integration
> **Manifest Version**: 2026-05-11
> **Estimate**: S (2-3h — 接口定义 + 2 个适配器实现各 ~40 行)

## Context

**GDD**: `design/gdd/local-storage.md`
**Requirement**: `TR-LS-003`

**ADR Governing Implementation**: ADR-004: 平台适配层——WeChat API 隔离与 Web 回退
**ADR Decision Summary**: 接口 + 适配器模式——`IPlatformStorage` 接口定义 set/get/remove/getInfo，`WeChatStorage` 使用 `wx.setStorageSync/getStorageSync`，`WebStorage` 使用 `window.localStorage`。`createPlatformStorage()` 通过 `sys.platform` 一次检测选择适配器。

**Engine**: Cocos Creator 3.8.8 | **Risk**: MEDIUM (微信 API 平台差异)
**Engine Notes**: `sys.platform === sys.Platform.WECHAT_GAME` 需真机验证。`wx.setStorageSync` 写入满时抛出异常的 exact 类型未文档化——set() 必须包裹 try-catch。

**Control Manifest Rules (this layer)**:
- Required: 平台存储使用 IPlatformStorage 接口——业务代码只依赖接口，不直接调用 wx.* 或 cc.sys.localStorage
- Required: 平台检测在模块加载时完成——createPlatformStorage() 一次检测 sys.platform，后续调用零分支开销
- Required: 微信 Storage 双重守卫——sys.platform 检测 + typeof wx !== 'undefined' 双重校验
- Required: Storage 写入包裹 try-catch——存储满或数据损坏时 catch 异常、console.error、游戏不崩溃

---

## Acceptance Criteria

- [ ] **AC-1**: GIVEN 微信环境可用，WHEN 调用 WeChatStorage.set('key', 'value')，THEN get('key') 返回 'value'
- [ ] **AC-2**: GIVEN 微信环境可用，WHEN 读取不存在的 key，THEN get() 返回 null
- [ ] **AC-3**: GIVEN Web 预览环境，WHEN 调用 WebStorage.set('key', 'value')，THEN get('key') 返回 'value'
- [ ] **AC-4**: GIVEN Web 预览环境，WHEN 读取不存在的 key，THEN get() 返回 null
- [ ] **AC-5**: GIVEN 存储满，WHEN WeChatStorage.set() 调用，THEN 捕获异常 + console.error，不崩溃

---

## Implementation Notes

*Derived from ADR-004:*

1. 定义 `IPlatformStorage` 接口（~/model/platform-storage.ts）：
   ```typescript
   interface IPlatformStorage {
     set(key: string, value: string): void;
     get(key: string): string | null;
     remove(key: string): void;
     getInfo(): { keys: string[]; currentSize: number; limitSize: number; };
   }
   ```
2. `WeChatStorage` 实现：`wx.setStorageSync/wx.getStorageSync/wx.removeStorageSync/wx.getStorageInfoSync`，每个方法包裹 try-catch
3. `WebStorage` 实现：`window.localStorage.setItem/getItem/removeItem`，`getInfo()` 返回估算值 5120KB
4. 工厂函数：一次检测 `sys.platform === sys.Platform.WECHAT_GAME` + `typeof wx !== 'undefined'`，选择适配器
5. WeChatStorage.get() 捕获所有异常返回 null（key 不存在时 wx.getStorageSync 抛异常）
6. 每个写入方法包裹 try-catch——存储满时游戏不崩溃

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: nl_ 前缀拼接、LevelProgress/Settings/Meta 数据模型、默认值
- Story 003: 防抖写入策略、最佳成绩比较

---

## QA Test Cases

### AC-1: WeChatStorage set/get round-trip
- Given: mock `wx.setStorageSync` 为 jest.fn()
- When: `wechat.set('key', '{"a":1}')` + `wechat.get('key')`
- Then: setStorageSync 被调用，getStorageSync 返回已 mock 的值

### AC-2: WeChatStorage get nonexistent key
- Given: mock `wx.getStorageSync` 抛异常
- When: `wechat.get('nonexistent_key')`
- Then: 返回 null，不抛异常

### AC-3: WebStorage set/get round-trip
- Given: `window.localStorage` 可用
- When: `web.set('key', 'value')` + `web.get('key')`
- Then: get 返回 'value'

### AC-4: WebStorage get nonexistent key
- When: `web.get('nonexistent')`
- Then: 返回 null

### AC-5: Storage full handling
- Given: mock `wx.setStorageSync` 抛异常
- When: `wechat.set('key', 'value')`
- Then: console.error 被调用，不抛异常

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: `tests/unit/local-storage/platform_storage_test.ts` — must exist and pass
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None (基础接口 + 适配器)
- Unlocks: Story 002 (存储管理器依赖 IPlatformStorage 接口)
