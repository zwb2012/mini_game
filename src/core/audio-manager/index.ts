/**
 * 音频管理器模块 — barrel export
 *
 * 统一导出所有类型定义和实现类。
 * 外部模块通过此文件引用本模块的公开 API。
 *
 * 用法:
 * ```typescript
 * import { AudioManager, IAudioManager, AudioEventId } from '@core/audio-manager';
 * ```
 *
 * @module audio-manager
 */

export type { AudioEventId, IAudioManager } from './types';
export { AudioManager } from './AudioManager';
