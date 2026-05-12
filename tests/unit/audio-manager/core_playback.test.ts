/**
 * AudioManager 核心播放 — 单元测试
 *
 * 覆盖 Story 001 所有验收标准：
 * - play() 将 AudioClip 委派给 AudioSource.playOneShot
 * - setMuted(true) 阻止播放
 * - setMuted(false) 恢复播放
 * - isMuted() 反映 setMuted() 状态
 * - 静音状态从 IPlatformStorage 恢复
 * - preload() 加载全部 3 个 AudioClip
 *
 * @module audio-manager/core_playback.test
 */

import { AudioManager } from '../../../src/core/audio-manager/AudioManager';
import { IPlatformStorage } from '../../../src/core/local-storage/PlatformStorage';
import { AudioSource, AudioClip, resources } from 'cc';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockAudioSource(): AudioSource {
  return new AudioSource();
}

function createMockStorage(
  initialData: Record<string, string> = {},
): IPlatformStorage {
  const data = { ...initialData };
  return {
    set: jest.fn((key: string, value: string) => {
      data[key] = value;
    }),
    get: jest.fn((key: string) => data[key] ?? null),
    remove: jest.fn((key: string) => {
      delete data[key];
    }),
    getInfo: jest.fn(() => ({
      keys: Object.keys(data),
      currentSize: 0,
      limitSize: 10240,
    })),
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  resources.__resetMock();
  // Override resources.load to return AudioClip instances for audio tests
  (resources.load as jest.Mock).mockImplementation(
    (_path: string, _type: any, cb: Function) => cb(null, new AudioClip()),
  );
});

afterAll(() => {
  resources.__resetMock();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AudioManager core playback', () => {
  // AC-1: play('TICK') 播放音效
  it('test_core_playback_play_TICK_calls_playOneShot_with_clip', async () => {
    const mockSource = createMockAudioSource();
    const manager = new AudioManager(mockSource);
    await manager.preload();

    manager.play('TICK');

    expect(mockSource.playOneShot).toHaveBeenCalledTimes(1);
    expect(mockSource.playOneShot).toHaveBeenCalledWith(expect.any(AudioClip));
  });

  // AC-2: setMuted(true) 后静音 — playOneShot 不应被调用
  it('test_core_playback_muted_prevents_playOneShot', async () => {
    const mockSource = createMockAudioSource();
    const manager = new AudioManager(mockSource);
    await manager.preload();

    manager.setMuted(true);
    manager.play('TICK');

    expect(mockSource.playOneShot).not.toHaveBeenCalled();
  });

  // AC-3: 取消静音后正常播放
  it('test_core_playback_unmuted_allows_play', async () => {
    const mockSource = createMockAudioSource();
    const manager = new AudioManager(mockSource);
    await manager.preload();

    manager.setMuted(true);
    manager.setMuted(false);
    manager.play('TICK');

    expect(mockSource.playOneShot).toHaveBeenCalledTimes(1);
    expect(mockSource.playOneShot).toHaveBeenCalledWith(expect.any(AudioClip));
  });

  // isMuted() 反映 setMuted() 状态
  it('test_core_playback_isMuted_reflects_setMuted', () => {
    const mockSource = createMockAudioSource();
    const manager = new AudioManager(mockSource);

    expect(manager.isMuted()).toBe(false);

    manager.setMuted(true);
    expect(manager.isMuted()).toBe(true);

    manager.setMuted(false);
    expect(manager.isMuted()).toBe(false);
  });

  // 静音状态从 storage 加载
  it('test_core_playback_muted_state_loaded_from_storage', () => {
    const mockSource = createMockAudioSource();
    const storage = createMockStorage({ nl_muted: 'true' });
    const manager = new AudioManager(mockSource, storage);

    expect(manager.isMuted()).toBe(true);
    // 验证 storage.get 被调用
    expect(storage.get).toHaveBeenCalledWith('nl_muted');
  });

  // preload() 加载全部 3 个 AudioClip
  it('test_core_playback_preload_loads_all_three_clips', async () => {
    const mockSource = createMockAudioSource();
    const manager = new AudioManager(mockSource);

    await manager.preload();

    // resources.load 应被调用 3 次
    expect(resources.load).toHaveBeenCalledTimes(3);

    // 验证三个路径都包含在调用中
    const calls = (resources.load as jest.Mock).mock.calls;
    const loadedPaths: string[] = calls.map((call: any[]) => call[0]);
    expect(loadedPaths).toContain('audio/tick');
    expect(loadedPaths).toContain('audio/level-complete');
    expect(loadedPaths).toContain('audio/ambient');

    // 加载后 play(TICK) 应触发 playOneShot（验证 clip 在 map 中）
    manager.play('TICK');
    expect(mockSource.playOneShot).toHaveBeenCalledTimes(1);
  });
});
