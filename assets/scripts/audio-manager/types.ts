/**
 * AudioManager 类型定义
 *
 * 定义游戏中所有可播放的音频事件 ID 和统一播放接口。
 * 用法参见 AudioManager 实现。
 *
 * @module audio-manager/types
 */

/** 音频事件 ID —— 从预加载资源池中选择播放的音频 */
export type AudioEventId = 'TICK' | 'LEVEL_COMPLETE' | 'AMBIENT';

/**
 * 音频管理器接口
 *
 * 统一音频播放入口。依赖 Cocos AudioSource 组件（通过构造函数注入）和
 * IPlatformStorage（可选，用于静音偏好持久化）。
 *
 * 用法:
 * ```typescript
 * const manager: IAudioManager = new AudioManager(audioSource, platformStorage);
 * await manager.preload();
 * manager.play('TICK');
 * manager.setMuted(true);
 * ```
 */
export interface IAudioManager {
  /** 播放指定事件 ID 对应的音频。静音状态下静默忽略 */
  play(eventId: AudioEventId): void;

  /** 设置静音状态并通过 IPlatformStorage 持久化 */
  setMuted(muted: boolean): void;

  /** 查询当前静音状态 */
  isMuted(): boolean;

  /**
   * 预加载所有音频资源（TICK, LEVEL_COMPLETE, AMBIENT）。
   * 应在游戏启动时调用一次，确保后续 play() 调用命中缓存的 AudioClip。
   */
  preload(): Promise<void>;
}
