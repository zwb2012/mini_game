# ADR-004: 平台适配层——WeChat API 隔离与 Web 回退

## Status
Accepted

## Date
2026-05-11

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Cocos Creator 3.8.8 |
| **Domain** | Platform |
| **Knowledge Risk** | MEDIUM — `getSystemInfoSync` 在 3.8.8+ 内置缓存，`wx.*` API 行为可能因微信客户端版本而异 |
| **References Consulted** | `docs/engine-reference/cocos/VERSION.md`, `docs/engine-reference/cocos/breaking-changes.md`, `docs/engine-reference/cocos/deprecated-apis.md` |
| **Post-Cutoff APIs Used** | `cc.sys.platform` (稳定 API，非 post-cutoff)；`wx.setStorageSync/getStorageSync` (微信原生，版本无关) |
| **Verification Required** | Web 回退实现在 Chrome DevTools 中验证读写；微信真机验证 `wx.setStorageSync` 在存储满时的异常行为 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None |
| **Enables** | ADR-006 (关卡数据格式——加载 levels.json 依赖存储读取), ADR-010 (音频预加载——静音偏好依赖存储读写) |
| **Blocks** | Epic `local-storage` — 存储系统实现依赖平台适配层 Accepted |
| **Ordering Note** | 必须在 local-storage 系统实现前 Accepted——Foundation 层中存储是关卡进度、设置、元数据的唯一持久化通道 |

## Context

### Problem Statement

数字连线运行在两种运行时环境中——微信小游戏（生产）和 Cocos Web 预览（开发/调试）。微信小游戏提供 `wx.setStorage/getStorage` API，Web 环境使用 `cc.sys.localStorage`。如果各系统直接调用平台 API，将导致三个问题：

1. **不可测试**：核心逻辑（如关卡进度读写）依赖微信 SDK 全局对象，Web 预览时 `wx` 不存在导致崩溃
2. **变更脆弱**：微信 API 更新（如 `wx.setStorage` → `wx.setStorageSync` 的行为变更）需修改所有调用点
3. **逻辑耦合**：存储策略（防抖、容量管理、数据损坏回退）与平台 API 调用混杂

### Constraints
- 微信小游戏包体限制 2MB——适配层必须 <5KB
- MVP 阶段仅需存储抽象（`wx.setStorage/getStorage/removeStorage/getStorageInfo`）
- 广告和云存储为 Alpha 层需求，MVP 不涉及
- 数据损坏或存储满时静默降级，不崩溃
- 微信 `wx.setStorageSync` 单个 key 限制 1MB，总容量限制 10MB

### Requirements
- 支持 `nl_` 前缀命名空间下的 KV 读写
- 微信环境使用 `wx.setStorageSync/getStorageSync`（同步写入确保不丢档）
- Web 环境使用 `cc.sys.localStorage`（开发调试用）
- 平台检测必须零开销（一次检测，缓存结果）
- 未来新增平台（如 Android 原生）只需新增适配器，不修改调用者

## Decision

采用**接口+适配器模式**——定义 `IPlatformStorage` 接口，提供两个实现：`WeChatStorage`（生产）和 `WebStorage`（开发/回退）。平台检测通过 `cc.sys.platform` 完成，在模块初始化时选择适配器，后续调用零分支开销。

### Architecture Diagram

```
┌──────────────────────────────────────┐
│          local-storage               │
│  (nl_ 命名空间、防抖、容量管理)        │
│                                      │
│  依赖 ──→ IPlatformStorage (接口)     │
└──────────────┬───────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│ WeChatStorage│  │ WebStorage  │
│              │  │             │
│ wx.setStorage│  │ cc.sys.     │
│ Sync/GetSync │  │ localStorage│
└──────────────┘  └─────────────┘
       │                │
  微信小游戏        Cocos Web 预览
  (生产环境)        (开发/回退)
```

### Key Interfaces

```typescript
/**
 * 平台存储抽象接口。
 * MVP 仅覆盖 KV 存储——广告和云存储为 Alpha 层扩展点。
 */
interface IPlatformStorage {
  /** 同步写入。key 已带 nl_ 前缀，value 为 JSON 字符串 */
  set(key: string, value: string): void;

  /** 同步读取。key 不存在返回 null，数据损坏返回 null */
  get(key: string): string | null;

  /** 删除指定 key */
  remove(key: string): void;

  /** 获取存储信息（已用空间/总空间/当前 keys）。Web 回退返回估算值 */
  getInfo(): StorageInfo;
}

interface StorageInfo {
  keys: string[];        // 当前所有 key
  currentSize: number;   // 已用 KB
  limitSize: number;     // 总限制 KB（Web 回退返回 5120）
}
```

**平台检测与适配器选择**：

```typescript
import { sys } from 'cc';

function createPlatformStorage(): IPlatformStorage {
  // cc.sys.platform 在 Cocos 3.8.8 中可靠返回运行平台
  if (sys.platform === sys.Platform.WECHAT_GAME) {
    return new WeChatStorage();
  }
  // 默认回退到 Web 实现（Cocos Preview、桌面浏览器等）
  return new WebStorage();
}

// 模块级单例——一次检测，后续零开销
export const platformStorage: IPlatformStorage = createPlatformStorage();
```

**WeChatStorage 实现要点**：
- 调用 `wx.setStorageSync(key, value)` / `wx.getStorageSync(key)`
- `wx.getStorageSync` 抛异常时（key 不存在或数据损坏）返回 `null`
- `getInfo()` 调用 `wx.getStorageInfoSync()` 获取真实容量数据

**WebStorage 实现要点**：
- 直接使用 `window.localStorage.setItem(key, value)` / `getItem(key)`——已确认不在微信环境，无需经过 Cocos 存储抽象
- 容量估算：`limitSize = 5120` (5MB，浏览器 localStorage 典型限制)
- JSON 解析失败时（数据损坏）返回 `null`

## Alternatives Considered

### Alternative 1: 条件分支模式（无适配层）
- **Description**: 在每个 `wx.*` 调用点用 `if (typeof wx !== 'undefined')` 判断，直接内联平台分支
- **Pros**: 零抽象开销，代码量最少，快速实现
- **Cons**: 存储策略（防抖、容量管理）与平台判断混杂——local-storage 的 150 行中约 30 行是 `if (wx)` 分支；Web 预览时 `wx` 未定义需全局 mock；新增平台需修改每个调用点
- **Rejection Reason**: 违反"平台安全"架构原则——平台代码应与业务逻辑隔离。此模式在只有 1 个调用点时可行（local-storage 是唯一消费者），但 `wx.setStorageSync` 的行为差异（异常类型、容量限制、key 命名规则）会被埋入业务逻辑，调试困难。

### Alternative 2: Cocos sys 统一抽象（无微信特有 API）
- **Description**: 仅使用 `cc.sys.localStorage`，放弃 `wx.setStorage`，完全依赖 Cocos 的跨平台抽象
- **Pros**: 零平台检测，Cocos 已处理平台差异；代码最简
- **Cons**: `sys.localStorage` 在微信小游戏中的行为未明确文档化——不知道其底层是否调用 `wx.setStorageSync` 还是使用内存存储；放弃 `wx.getStorageInfoSync`（容量监控）和未来的微信云存储扩展能力；触发微信存储上限时无法捕获平台级错误
- **Rejection Reason**: 微信小游戏文档推荐使用 `wx.*` API 进行存储操作以获得最佳兼容性。`sys.localStorage` 在微信环境的底层实现不透明——如果它使用内存存储而非 `wx.setStorage`，进程被杀后数据丢失。这违背了"不丢档"的 GDD 硬需求。

## Consequences

### Positive
- 平台 API 变更仅影响适配器文件（`WeChatStorage.ts` ~40 行），不影响 local-storage 和其他消费者
- Web 预览可完整测试存储逻辑（读写、防抖、数据损坏回退）——不需要微信开发者工具
- 未来新增平台（Android 原生、抖音小游戏等）仅需新增一个适配器实现
- 接口明确标记了平台依赖点——代码审查时一眼可见哪些代码触碰平台边界

### Negative
- 增加一层抽象——`IPlatformStorage` 接口 + 2 个实现 ≈ 80 行代码（vs 条件分支的零额外代码）
- 接口方法签名限定为同步——未来若需异步存储（如云存储同步）需要接口演进或新接口
- WebStorage 的容量估算不精确（浏览器 localStorage 限制因浏览器而异）

### Risks
- `sys.platform === sys.Platform.WECHAT_GAME` 在某些 Cocos 版本或构建配置下可能误判
  - **缓解**: 启动时打印检测结果到 console，开发阶段即可发现误判
- `wx.setStorageSync` 在极端情况（存储满）下的异常类型未文档化
  - **缓解**: WeChatStorage 的 set() 包裹 try-catch，任何异常均 console.error + 静默吞下
- WebStorage 使用 `window.localStorage`——标准 DOM API，所有浏览器一致支持，不依赖 Cocos 封装

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| local-storage.md | `nl_` 前缀命名空间 (TR-LS-001) | local-storage 层负责前缀拼接——platform 层仅处理原始 set/get，职责分离 |
| local-storage.md | 通关同步写入 + 500ms 防抖 (TR-LS-002) | 写入策略由 local-storage 控制——platform 层提供同步 set()，不参与策略决策 |
| local-storage.md | wx.setStorage 优先 + cc.sys.localStorage 回退 (TR-LS-003) | 架构的核心——WeChatStorage 优先，WebStorage 为回退，通过 cc.sys.platform 自动选择 |
| audio-manager.md | 静音偏好持久化 (TR-AM-002) | 通过 local-storage 间接依赖——平台适配层保证静音设置在不同环境下可读写 |

## Performance Implications
- **CPU**: 零开销——平台检测在模块加载时执行一次，后续调用无分支
- **Memory**: <1KB（接口 vtable + 两个实例的单例引用）
- **Load Time**: 微秒级——仅在 `import` 时执行一次 `sys.platform` 比较
- **Network**: 无

## Migration Plan
不适用——项目尚无存储实现，无现有代码需要迁移。local-storage 系统在实现时直接依赖 `IPlatformStorage` 接口。

## Validation Criteria
- `sys.platform === sys.Platform.WECHAT_GAME` 在微信开发者工具中正确返回 `true`
- WeChatStorage.set() 写入后，WeChatStorage.get() 返回相同值
- WebStorage.set() 写入后，WebStorage.get() 返回相同值（Chrome DevTools 验证）
- WebStorage 写入 `nl_level_1` 后，Chrome DevTools → Application → Local Storage 可见该 key
- 存储满时 WeChatStorage.set() 不抛异常——try-catch 捕获 + console.error
- 数据损坏时 get() 返回 null——不崩溃

## Related Decisions
- ADR-001: 游戏状态机架构——平台适配层与状态机无直接依赖
- ADR-006 (planned): 关卡数据格式与校验策略——依赖 local-storage 读取 levels.json
- ADR-010 (planned): 音频资源预加载与降级策略——静音偏好依赖 local-storage 读写
