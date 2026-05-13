/**
 * AudioManager — 音频管理器实现
 *
 * 实现 IAudioManager 接口。通过依赖注入获取 AudioSource 组件引用，
 * 使用 IPlatformStorage 持久化静音偏好。遵循 Foundation 层规则：
 * - 存储访问包裹 try-catch（ADR-004）
 * - 零分支开销的平台检测（由 IPlatformStorage 封装）
 * - 所有公共 API 带文档注释
 *
 * 依赖:
 * - Cocos AudioSource 组件（构造函数注入）
 * - (可选) IPlatformStorage 存储适配层（静音持久化）
 *
 * 用法:
 * ```typescript
 * import { AudioManager } from './audio-manager';
 * import { platformStorage } from './local-storage/PlatformStorage';
 * import { AudioSource } from 'cc';
 *
 * // 在场景组件中
 * const audioSource = this.getComponent(AudioSource)!;
 * const audioManager = new AudioManager(audioSource, platformStorage);
 * await audioManager.preload();
 * audioManager.play('TICK');
 * ```
 *
 * @module audio-manager
 */

import { AudioSource, AudioClip, resources } from 'cc';
import { IPlatformStorage } from '../local-storage/PlatformStorage';
import { AudioEventId, IAudioManager } from './types';

/** 静音偏好存储 key —— 带 nl_ 前缀以符合 ADR-004 命名约定 */
const MUTED_STORAGE_KEY = 'nl_muted';

/**
 * 音频事件到 assets/resources 目录下音频文件路径的映射。
 * 文件扩展名由 Cocos 构建管线自动处理（.mp3/.ogg/.wav 等），
 * resources.load 时只需指定路径前缀。
 */
const AUDIO_PATHS: Record<AudioEventId, string> = {
  TICK: 'audio/tick',
  LEVEL_COMPLETE: 'audio/level-complete',
  AMBIENT: 'audio/ambient',
};

export class AudioManager implements IAudioManager {
  private _audioSource: AudioSource;
  private _storage: IPlatformStorage | null;
  private _muted: boolean;
  private _clips: Map<AudioEventId, AudioClip | null> = new Map();

  /** 帧计数器 —— 由 tick() 每帧递增，用于 TICK 同帧防抖 */
  private _currentFrame: number = 0;
  /** 上次播放 TICK 的帧号。-1 确保首次调用不被防抖误杀 */
  private _lastFramePlayed: number = -1;

  /**
   * @param audioSource  Cocos AudioSource 组件引用（依赖注入，可 mock）
   * @param storage      可选的平台存储实例，用于持久化静音偏好
   */
  constructor(audioSource: AudioSource, storage?: IPlatformStorage) {
    this._audioSource = audioSource;
    this._storage = storage ?? null;
    this._muted = this._loadMutedState();
  }

  /**
   * 从 IPlatformStorage 读取初始静音状态。
   * 读取失败时容错返回 false（默认非静音）。
   * 符合 ADR-004：Storage 写入/读取包裹 try-catch。
   */
  private _loadMutedState(): boolean {
    if (!this._storage) return false;
    try {
      const val = this._storage.get(MUTED_STORAGE_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  }

  /**
   * 预加载所有音频资源。
   *
   * 使用 _loadClip 逐個加载 TICK、LEVEL_COMPLETE、AMBIENT 三个 AudioClip。
   * 每个文件独立加载——任一加载失败不影响其他文件（静默降级）。
   * 加载完成后可通过 play() 立即播放。
   *
   * @returns 所有音频加载完成后 resolve（单个文件失败不 reject）
   */
  async preload(): Promise<void> {
    const entries = Object.entries(AUDIO_PATHS) as [AudioEventId, string][];
    await Promise.all(entries.map(([id, path]) => this._loadClip(id, path)));
  }

  /**
   * 加载单个音频资源并存入 _clips 映射表。
   *
   * 加载成功 → 存储 AudioClip
   * 加载失败 → console.warn + 存储 null（标记失败，后续 play() 静默返回）
   *
   * 始终 resolve 不 reject，保证 preload() 整体不会因单个文件失败而拒绝。
   *
   * @param id   音频事件 ID
   * @param path resources.load 的路径
   */
  private _loadClip(id: AudioEventId, path: string): Promise<void> {
    return new Promise<void>(resolve => {
      resources.load(path, AudioClip, (err: Error | null, clip: AudioClip) => {
        if (err) {
          console.warn('[AudioManager] Failed to load ' + id + ': ' + err.message);
          this._clips.set(id, null);
        } else {
          this._clips.set(id, clip);
        }
        resolve();
      });
    });
  }

  /**
   * 播放指定事件 ID 的音频。
   *
   * TICK 事件具有同帧防抖机制：同一帧内多次调用仅播放一次。
   * LEVEL_COMPLETE 和 AMBIENT 不防抖（单次触发 / 循环播放）。
   *
   * 以下情况静默忽略（不抛异常）：
   * - 静音状态（_muted === true）
   * - 对应 AudioClip 为 null 或 undefined（加载失败或未预加载），此时 console.warn
   *
   * @param eventId 要播放的音频事件 ID
   */
  play(eventId: AudioEventId): void {
    // TICK 同帧防抖：同一帧内重复请求静默合并
    if (eventId === 'TICK') {
      if (this._currentFrame === this._lastFramePlayed) return;
      this._lastFramePlayed = this._currentFrame;
    }

    if (this._muted) return;

    const clip = this._clips.get(eventId);
    if (clip === null || clip === undefined) {
      console.warn('[AudioManager] Clip not available for: ' + eventId);
      return;
    }

    this._audioSource.playOneShot(clip);
  }

  /**
   * 帧推进——每帧由外部驱动调用一次。
   *
   * 游戏主循环应确保每帧调用此方法，使 TICK 同帧防抖机制正确工作。
   * 通常由场景的 update() 或专用的帧循环系统调用。
   */
  tick(): void {
    this._currentFrame++;
  }

  /**
   * 设置静音状态并通过 IPlatformStorage 持久化。
   *
   * 值存储为字符串 'true' / 'false'。
   * 写入失败时打印错误但不抛异常（容错）。
   *
   * @param muted true 为静音，false 为取消静音
   */
  setMuted(muted: boolean): void {
    this._muted = muted;
    if (this._storage) {
      try {
        this._storage.set(MUTED_STORAGE_KEY, muted ? 'true' : 'false');
      } catch (e) {
        console.error('[AudioManager] Failed to persist mute state', e);
      }
    }
  }

  /** 返回当前静音状态 */
  isMuted(): boolean {
    return this._muted;
  }
}
