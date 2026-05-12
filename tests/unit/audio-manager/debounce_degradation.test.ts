/**
 * AudioManager 同帧防抖与静默降级 — 单元测试
 *
 * 覆盖 Story 002 所有验收标准：
 * - AC-1: 同一帧内 play('TICK') 3 次 → playOneShot 1 次
 * - AC-3: 跨帧 play('TICK') 2 次 → playOneShot 2 次
 * - LEVEL_COMPLETE 不防抖（同一帧调用多次，每次都播放）
 * - AC-2: 资源加载失败 → console.warn + playOneShot 未被调用
 * - 部分资源加载失败：TICK 失败、COMPLETE 成功 → COMPLETE 播放；TICK 静默
 *
 * @module audio-manager/debounce_degradation.test
 */

import { AudioManager } from '../../../src/core/audio-manager/AudioManager';
import { AudioSource, AudioClip, resources } from 'cc';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockAudioSource(): AudioSource {
  return new AudioSource();
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let consoleWarnSpy: jest.SpyInstance;

beforeEach(() => {
  resources.__resetMock();

  // 自定义 mock：使用 __setMockError 设置的错误表，无错误路径返回 AudioClip
  (resources.load as jest.Mock).mockImplementation(
    (path: string, _type: any, cb: Function) => {
      const err: Error | undefined = resources._mockErrors[path];
      if (err) {
        cb(err);
      } else {
        cb(null, new AudioClip());
      }
    },
  );

  consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  consoleWarnSpy.mockRestore();
});

afterAll(() => {
  resources.__resetMock();
});

// ---------------------------------------------------------------------------
// Tests: 同帧防抖 (Debounce)
// ---------------------------------------------------------------------------

describe('AudioManager TICK 同帧防抖', () => {
  // AC-1: 同一帧内调用 play('TICK') 3 次 → 仅播放 1 次
  it('test_debounce_same_frame_TICK_three_times_plays_once', async () => {
    const mockSource = createMockAudioSource();
    const manager = new AudioManager(mockSource);
    await manager.preload();

    manager.play('TICK');
    manager.play('TICK');
    manager.play('TICK');

    expect(mockSource.playOneShot).toHaveBeenCalledTimes(1);
    expect(mockSource.playOneShot).toHaveBeenCalledWith(expect.any(AudioClip));
  });

  // AC-3: 跨帧调用 play('TICK') 2 次 → 播放 2 次
  it('test_debounce_cross_frame_TICK_two_times_plays_twice', async () => {
    const mockSource = createMockAudioSource();
    const manager = new AudioManager(mockSource);
    await manager.preload();

    manager.play('TICK');   // frame 0
    manager.tick();          // advance to frame 1
    manager.play('TICK');   // frame 1

    expect(mockSource.playOneShot).toHaveBeenCalledTimes(2);
  });

  // LEVEL_COMPLETE 不防抖——同一帧多次调用，每次均应播放
  it('test_debounce_LEVEL_COMPLETE_not_debounced_on_same_frame', async () => {
    const mockSource = createMockAudioSource();
    const manager = new AudioManager(mockSource);
    await manager.preload();

    manager.play('LEVEL_COMPLETE');
    manager.play('LEVEL_COMPLETE');

    expect(mockSource.playOneShot).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Tests: 静默降级 (Degradation)
// ---------------------------------------------------------------------------

describe('AudioManager 资源缺失静默降级', () => {
  // AC-2: TICK 加载失败 → console.warn 输出
  it('test_degradation_load_failure_TICK_warns', async () => {
    resources.__setMockError('audio/tick', new Error('file not found'));

    const mockSource = createMockAudioSource();
    const manager = new AudioManager(mockSource);
    await manager.preload();

    manager.play('TICK');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[AudioManager] Clip not available for: TICK',
    );
  });

  // AC-2: TICK 加载失败 → playOneShot 不被调用
  it('test_degradation_load_failure_TICK_does_not_play', async () => {
    resources.__setMockError('audio/tick', new Error('file not found'));

    const mockSource = createMockAudioSource();
    const manager = new AudioManager(mockSource);
    await manager.preload();

    manager.play('TICK');

    expect(mockSource.playOneShot).not.toHaveBeenCalled();
  });

  // 部分加载：TICK 失败、COMPLETE 成功 → COMPLETE 可播放，TICK 静默
  it('test_degradation_partial_load_TICK_fails_COMPLETE_succeeds', async () => {
    resources.__setMockError('audio/tick', new Error('file not found'));

    const mockSource = createMockAudioSource();
    const manager = new AudioManager(mockSource);
    await manager.preload();

    // TICK 应该静默（clip 为 null）
    manager.play('TICK');
    expect(mockSource.playOneShot).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[AudioManager] Clip not available for: TICK',
    );

    // COMPLETE 应该正常播放
    manager.play('LEVEL_COMPLETE');
    expect(mockSource.playOneShot).toHaveBeenCalledTimes(1);
    expect(mockSource.playOneShot).toHaveBeenCalledWith(expect.any(AudioClip));
  });
});
