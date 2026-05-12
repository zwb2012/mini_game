# ADR-010: 音频预加载与降级策略

## Status
Accepted

## Date
2026-05-11

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Cocos Creator 3.8.8 |
| **Domain** | Audio |
| **Knowledge Risk** | LOW — AudioSource 组件 API 自 3.0 以来保持稳定 |
| **References Consulted** | `design/gdd/audio-manager.md`, `docs/architecture/architecture.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | 微信真机验证音频资源预加载和即时播放延迟 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-004 (平台适配层——静音偏好通过 IPlatformStorage 持久化) |
| **Enables** | Core 层 grid-connection-engine 直接调用 `play('TICK')` |
| **Blocks** | grid-connection-engine epi（TICK 音效是 Pillar 3 关键反馈） |
| **Ordering Note** | 可与 ADR-002～003 并行 |

## Context

### Problem Statement
原型验证确认：无 TICK 音频时"划线满足感"明显降级。TICK 音效是 Pillar 3（"划线本身就是奖励"）的核心实施手段。但有两个技术问题需要解决：

1. **同帧防抖**：快速滑动时，同一帧内引擎可能触发多次 `play('TICK')`（每次手指滑入新格子），不能堆叠播放
2. **静默降级**：音频文件在微信小游戏打包环境中可能加载失败（资源缺失、路径错误），不能因此阻塞游戏或崩溃

### Constraints
- 微信小游戏 2MB 包体限制——音频资源总量 <500KB
- MVP 仅 3 个音频事件：TICK、LEVEL_COMPLETE、AMBIENT
- 连音事件 TICK 在快速滑动时可能一帧触发 10+ 次
- 音频加载不能阻塞游戏启动——必须异步预加载
- 禁止使用 `cc.loader.loadRes`（3.x 已移除）——必须用 `resources.load`

### Requirements
- 同一帧内多次 `play('TICK')` 请求合并为一次播放
- 音频文件加载失败 → console.warn + 静默降级，游戏正常运行
- 被静音时任何 `play()` 调用不产生声音
- Cocos AudioSource 组件在场景切换时正确清理

## Decision

采用**同帧防抖 + 预加载失败标记降级**策略：

### 同帧防抖机制

AudioManager 维护 `_lastFramePlayed: number`（`cc.director.getFrameNumber()` 或自增帧计数器）。每次 `play('TICK')` 时检查：
- 如果 `_lastFramePlayed === currentFrame` → 跳过（同帧已播放过）
- 否则 → 播放 + 更新 `_lastFramePlayed`

`LEVEL_COMPLETE` 不防抖（单次触发），`AMBIENT` 为循环播放不适用。

### 预加载 + 降级机制

AudioManager 在初始化时调用 `resources.load()` 预加载所有音频资源（TICK 和 LEVEL_COMPLETE 同步预加载，AMBIENT 延迟到首次 `play('AMBIENT')` 前加载）。加载结果存储在 `_clips: Map<EventId, AudioClip | null>`：

- 加载成功 → `_clips.set(id, clip)`
- 加载失败 → `_clips.set(id, null)`, `console.warn`

`play(eventId)` 时：
- `_clips.get(eventId) === null` → `console.warn('Audio clip not loaded for:', eventId)`，静默返回

### Key Interfaces

```typescript
type AudioEventId = 'TICK' | 'LEVEL_COMPLETE' | 'AMBIENT';

interface IAudioManager {
  /** 播放指定音效。同帧内多次 TICK 自动合并为一次 */
  play(eventId: AudioEventId): void;

  /** 设置静音状态（持久化到 IPlatformStorage） */
  setMuted(muted: boolean): void;

  /** 查询当前静音状态 */
  isMuted(): boolean;

  /** 预加载音频资源。游戏启动后尽快调用 */
  preload(): Promise<void>;
}
```

### Architecture Diagram

```
                    AudioManager
    ┌──────────────────────────────────────────┐
    │  _clips: Map<AudioEventId, AudioClip>    │
    │  _lastFramePlayed: number                │
    │  _muted: boolean                         │
    │                                          │
    │  play(id)                                │
    │    │                                     │
    │    ├─ TICK && same frame → return        │
    │    ├─ _muted → return                    │
    │    ├─ clip not loaded → console.warn      │
    │    └─ audioSource.playOneShot(clip)      │
    │                                          │
    │  preload()                               │
    │    └─ resources.load(s) → _clips.set()   │
    └──────────────────────────────────────────┘
         │                 │
         ▼                 ▼
    AudioSource        IPlatformStorage
    (Cocos 3.x)        (ADR-004)
```

## Alternatives Considered

### Alternative 1: 节流（throttle，最小间隔 80ms）
- **Description**: 限制 TICK 播放频率，两次播放之间至少间隔 80ms（对应 TICK 音频时长）
- **Pros**: 防止任何频率的高频播放，即使不同帧也受限
- **Cons**: 快速滑动跨越不同帧时可能漏播，违背 Pillar 3 的"每格都有反馈"期望；需要 `performance.now()` 或 `Date.now()` 计时
- **Rejection Reason**: 同帧防抖已足够——快速滑动时每帧仅一次播放，恰好对应每帧进入的一个格子。节流会额外丢失反馈。同帧防抖更简单（纯帧计数，无定时器）

### Alternative 2: 队列播放
- **Description**: 维护播放队列，每次 `play('TICK')` 将请求加入队列，音频源从队列中消费
- **Pros**: 不会丢失任何播放请求
- **Cons**: 队列可能追赶不上快速滑动速度，导致延迟累积；实现复杂（需要消费定时器）
- **Rejection Reason**: 过度设计——同帧合并已消除同一帧内的堆叠，跨帧请求自然用 AudioSource 新播放覆盖。队列对 TICK 音效无实际收益

## Consequences

### Positive
- 同帧防抖干净解决快速滑动音效堆叠问题——单行代码 `if (frame === _lastFramePlayed) return`
- 降级路径使游戏在资源缺失时不崩溃——对微信小游戏资源打包环境尤为重要
- 预加载 + 延迟加载平衡启动速度和资源可用性
- 静音偏好通过 ADR-004 的 IPlatformStorage 接口持久化，不直接调用 wx.*

### Negative
- 预加载增加启动时间（~30ms 加载 3 个音频文件）但可被 preloadScene 隐藏
- 资源缺失时玩家得到静默降级——无 UI 提示说明"音频未加载"（MDM 标准不要求）

### Risks
- 微信小游戏环境中 AudioSource 的 `playOneShot` 可能有延迟（低端 Android 设备实测）
  - **缓解**: 预加载确保 AudioClip 已缓存到内存，降低播放延迟
- 场景切换后 AudioSource 组件可能被销毁——`play()` 调用需检查组件可用性
  - **缓解**: AudioManager 在场景 onLoad 中重新获取 AudioSource 引用

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| audio-manager.md | TICK 同帧防抖 — 同一帧多次请求合并为一次播放 (TR-AM-003) | `_lastFramePlayed` 帧计数器——同帧内的重复 `play('TICK')` 被静默忽略 |
| audio-manager.md | 资源缺失静默降级 — 加载失败 console.warn, 游戏不崩溃 (TR-AM-004) | `_clips` 存储 null 标记失败资源，`play()` 中检查并 console.warn 后返回 |
| audio-manager.md | 音频事件定义 — TICK/LEVEL_COMPLETE 预加载, AMBIENT 延迟加载 (TR-AM-001) | `preload()` 预加载 TICK/LEVEL_COMPLETE，AMBIENT 延迟到首次 `play('AMBIENT')` |
| audio-manager.md | 播放接口 — play(eventId), setMuted(bool), isMuted() (TR-AM-002) | `IAudioManager` 接口 + `setMuted`/`isMuted` 通过 ADR-004 IPlatformStorage 持久化 |

## Performance Implications
- **CPU**: 帧计数器检查 < 0.001ms/次（整数比较）；`playOneShot` 调用 < 0.5ms
- **Memory**: 3 个 AudioClip 对象 + MP3 文件原生缓冲区（~500KB 总量）
- **Load Time**: 预加载 ~30ms（3 个文件，微信真机环境）
- **Network**: 无（本地打包音频资源）

## Migration Plan
不适用——项目尚无音频实现。AudioManager 直接实现 IAudioManager 接口。

## Validation Criteria
- `play('TICK')` 同一帧调用 3 次 → 仅听到 1 次播放（jest.fn().toHaveBeenCalledTimes(1)）
- `play('TICK')` 跨帧调用 2 次 → 听到 2 次播放（不同帧正常播放）
- 音频加载失败后 `play('TICK')` → console.warn 输出，游戏不崩溃
- `setMuted(true)` 后 `play('TICK')` → 无声音输出
- 微信开发者工具中验证 AudioSource.playOneShot 功能正常

## Related Decisions
- ADR-004: 平台适配层——静音偏好通过 IPlatformStorage 存储
- ADR-003: 数据流模式——audioManager 不实现 Push/Pull 接口（纯输出，不生产数据）
