# Story 001: AudioManager 核心播放

> **Epic**: audio-manager
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Manifest Version**: 2026-05-11
> **Estimate**: 2-3 hours

## Context

**GDD**: `design/gdd/audio-manager.md`
**Requirements**: `TR-AM-001` (音频事件定义 — TICK/LEVEL_COMPLETE 预加载, AMBIENT 延迟加载), `TR-AM-002` (播放接口 — play、setMuted、isMuted)

**ADR Governing Implementation**: ADR-010: 音频预加载与降级策略, ADR-004: 平台适配层
**ADR Decision Summary**: AudioManager 封装 Cocos AudioSource。play(eventId) 为统一播放入口。静音偏好通过 ADR-004 的 IPlatformStorage 持久化。

**Engine**: Cocos Creator 3.8.8 | **Risk**: LOW
**Engine Notes**: AudioSource 组件 API 自 3.0 以来稳定。resources.load(AudioClip) 是标准 API。需在 onLoad 中获取 AudioSource 引用以避免场景切换后组件不可用。

**Control Manifest Rules (this layer)**:
- Required: 平台存储使用 IPlatformStorage 接口
- Required: Storage 写入包裹 try-catch
- Forbidden: 禁止条件分支模式（if wx）内联到业务逻辑
- Forbidden: 禁止仅使用 cc.sys.localStorage（绕过适配层）

---

## Acceptance Criteria

*From GDD `design/gdd/audio-manager.md`:*

- [ ] **GIVEN** 音频管理器已初始化，**WHEN** 调用 `play('TICK')`，**THEN** tick.mp3 播放（可听到）
- [ ] **GIVEN** 音频管理器已初始化，**WHEN** 调用 `setMuted(true)` 后调用 `play('TICK')`，**THEN** 无声音输出
- [ ] **GIVEN** 音频管理器已初始化，**WHEN** 调用 `setMuted(true)` 后调用 `setMuted(false)` 再调用 `play('TICK')`，**THEN** tick.mp3 正常播放

---

## Implementation Notes

*Derived from ADR-010:*

```typescript
type AudioEventId = 'TICK' | 'LEVEL_COMPLETE' | 'AMBIENT';

interface IAudioManager {
  play(eventId: AudioEventId): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  preload(): Promise<void>;
}
```

- AudioManager 在构造函数或 onLoad 中获取 AudioSource 组件引用
- `preload()` 调用 `resources.load('audio/tick', AudioClip)` 等预加载所有音频资源
- `play(eventId)` 调用 `audioSource.playOneShot(clip)` — 但需先检查 _muted 状态
- `setMuted(bool)` 通过 ADR-004 的 IPlatformStorage 持久化静音偏好
- TICK 音频时长 ≤ 80ms（GDD 约定）
- 初始化时从 IPlatformStorage 读取静音偏好恢复状态
- 使用 `IAudioManager` 接口实现依赖注入

---

## QA Test Cases

- **AC-1**: play('TICK') 播放音效
  - Given: AudioManager 已初始化且预加载完成
  - When: play('TICK')
  - Then: audioSource.playOneShot(tickClip) 被调用
  - Edge cases: 预加载未完成时调用 play → 静默忽略

- **AC-2**: setMuted(true) 后静音
  - Given: AudioManager 已初始化
  - When: setMuted(true) → play('TICK')
  - Then: audioSource.playOneShot 未被调用
  - Edge cases: 静音状态通过 IPlatformStorage 持久化，下次启动恢复静音

- **AC-3**: 取消静音后正常播放
  - Given: AudioManager 已静音
  - When: setMuted(false) → play('TICK')
  - Then: audioSource.playOneShot 被调用

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/audio-manager/core_playback.test.ts` — must exist and pass

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: ADR-004 (IPlatformStorage 已实现), ADR-010 (Accepted)
- Unlocks: Story 002 (TICK 同帧防抖, 降级处理)
