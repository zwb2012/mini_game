# Story 002: 同帧防抖与静默降级

> **Epic**: audio-manager
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Manifest Version**: 2026-05-11
> **Estimate**: 2 hours

## Context

**GDD**: `design/gdd/audio-manager.md`
**Requirements**: `TR-AM-003` (TICK 同帧防抖 — 同一帧多次请求合并为一次播放), `TR-AM-004` (资源缺失静默降级 — 加载失败 console.warn, 游戏不崩溃)

**ADR Governing Implementation**: ADR-010: 音频预加载与降级策略
**ADR Decision Summary**: 使用 `_lastFramePlayed` 帧计数器防抖（同帧内重复 `play('TICK')` 静默忽略）。资源加载失败 `console.warn` + 后续 `play()` 调用静默返回。

**Engine**: Cocos Creator 3.8.8 | **Risk**: LOW
**Engine Notes**: 帧计数器可使用 `director.getFrameNumber()` 或 AudioManager 内部自增计数器。自增计数器更便于单元测试（无 Cocos mock 依赖）。

**Control Manifest Rules (this layer)**:
- Required: 所有公共方法必须可单元测试
- Forbidden: 禁止 Foundation 层反向依赖 Core/Feature/Presentation

---

## Acceptance Criteria

*From GDD `design/gdd/audio-manager.md`:*

- [ ] **GIVEN** 同一帧内调用 `play('TICK')` 3 次，**WHEN** 该帧结束，**THEN** 仅播放 1 次
- [ ] **GIVEN** tick.mp3 加载失败，**WHEN** 调用 `play('TICK')`，**THEN** console.warn 输出，游戏不崩溃
- [ ] **GIVEN** 跨帧调用 `play('TICK')` 2 次，**WHEN** 两帧各 1 次，**THEN** 播放 2 次（每帧各 1 次）

---

## Implementation Notes

*Derived from ADR-010:*

**同帧防抖**:
```typescript
private _lastFramePlayed: number = 0;
private _currentFrame: number = 0;

play(eventId: AudioEventId): void {
  // TICK 同帧防抖
  if (eventId === 'TICK') {
    if (this._currentFrame === this._lastFramePlayed) return;
    this._lastFramePlayed = this._currentFrame;
  }
  // ... rest of play logic
}

// 每帧开始时调用（通过 Cocos 或外部驱动）
tick(): void {
  this._currentFrame++;
}
```

**静默降级**:
```typescript
private _clips: Map<AudioEventId, AudioClip | null> = new Map();

preload(): Promise<void> {
  return Promise.all([
    this._loadClip('TICK', 'audio/tick'),
    this._loadClip('LEVEL_COMPLETE', 'audio/complete'),
    this._loadClip('AMBIENT', 'audio/ambient'),
  ]).then(() => {});
}

private _loadClip(id: AudioEventId, path: string): Promise<void> {
  return new Promise(resolve => {
    resources.load(path, AudioClip, (err, clip) => {
      if (err) {
        console.warn(`[AudioManager] Failed to load ${id}: ${err.message}`);
        this._clips.set(id, null);
      } else {
        this._clips.set(id, clip);
      }
      resolve();
    });
  });
}
```

- `play()` 中检查 `_clips.get(eventId) === null` → console.warn + 静默返回
- LEVEL_COMPLETE 和 AMBIENT 不防抖（单次触发或循环播放）

---

## QA Test Cases

- **AC-1**: 同帧多次 play('TICK') 合并
  - Given: AudioManager 已初始化
  - When: 同一帧内调用 play('TICK') 3 次
  - Then: audioSource.playOneShot 被调用 1 次
  - Edge cases: 跨帧调用正常播放（帧计数器不同）

- **AC-2**: 资源加载失败降级
  - Given: resources.load 返回 error
  - When: play('TICK')
  - Then: console.warn 输出，不抛异常，不崩溃
  - Edge cases: 部分资源加载成功 + 部分失败 → 成功的可播放，失败的静默

- **AC-3**: 跨帧正常播放
  - Given: AudioManager 已初始化
  - When: 帧 1 调用 play('TICK') → 进入下一帧 → 帧 2 调用 play('TICK')
  - Then: playOneShot 被调用 2 次

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/audio-manager/debounce_degradation.test.ts` — must exist and pass

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001 (AudioManager 核心播放实现)
- Unlocks: None (last story in this epic)
