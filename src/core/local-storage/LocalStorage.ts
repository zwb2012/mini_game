/**
 * LocalStorage — 本地存储管理器
 *
 * ADR-004: 平台适配层
 * 管理 nl_ 前缀、LevelProgress/Settings/MetaData 三种数据模型、
 * JSON 序列化与反序列化、默认值返回。
 *
 * 依赖注入 IPlatformStorage——可测试、可替换底层存储。
 */

import { IPlatformStorage } from './PlatformStorage';

// ===== Data Models =====

export interface LevelProgress {
  completed: boolean;
  stars: number;        // [0, 3]
  bestSteps: number;    // 最佳步数
  firstCompletedAt: string; // ISO8601
}

export interface Settings {
  muted: boolean;
  lastPlayedLevelId: number;
}

export interface MetaData {
  totalPlayTime: number;       // 秒
  totalLevelsCompleted: number;
  installDate: string;         // ISO8601
}

// ===== Defaults =====

export const DEFAULT_LEVEL_PROGRESS: LevelProgress = {
  completed: false,
  stars: 0,
  bestSteps: 0,
  firstCompletedAt: '',
};

export const DEFAULT_SETTINGS: Settings = {
  muted: false,
  lastPlayedLevelId: 1,
};

export const DEFAULT_META: MetaData = {
  totalPlayTime: 0,
  totalLevelsCompleted: 0,
  installDate: '',
};

// ===== Key Constants =====

const PREFIX = 'nl_';
const KEY_LEVEL = (id: number) => `${PREFIX}level_${id}`;
const KEY_SETTINGS = `${PREFIX}settings`;
const KEY_META = `${PREFIX}meta`;

// ===== LocalStorage =====

export class LocalStorage {
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _debounceData: Partial<Settings> | null = null;

  constructor(private _platform: IPlatformStorage) {}

  // ---- Level Progress ----

  getLevelProgress(levelId: number): LevelProgress {
    const raw = this._platform.get(KEY_LEVEL(levelId));
    if (raw === null) return { ...DEFAULT_LEVEL_PROGRESS };
    try {
      return { ...DEFAULT_LEVEL_PROGRESS, ...JSON.parse(raw) };
    } catch (e) {
      console.error('[LocalStorage] level progress parse error:', e);
      return { ...DEFAULT_LEVEL_PROGRESS };
    }
  }

  saveLevelProgress(levelId: number, stars: number, bestSteps: number): void {
    // 仅在新成绩更优时更新
    const existing = this.getLevelProgress(levelId);
    if (existing.completed && stars <= existing.stars && bestSteps >= existing.bestSteps) {
      return; // 不更优，跳过写入
    }

    const data: LevelProgress = {
      completed: true,
      stars: Math.max(stars, existing.stars),
      bestSteps: existing.bestSteps > 0 ? Math.min(bestSteps, existing.bestSteps) : bestSteps,
      firstCompletedAt: existing.firstCompletedAt || new Date().toISOString(),
    };
    try {
      this._platform.set(KEY_LEVEL(levelId), JSON.stringify(data));
    } catch (e) {
      console.error('[LocalStorage] save level progress failed:', e);
    }
  }

  // ---- Settings ----

  getSettings(): Settings {
    const raw = this._platform.get(KEY_SETTINGS);
    if (raw === null) return { ...DEFAULT_SETTINGS };
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {
      console.error('[LocalStorage] settings parse error:', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  saveSettings(settings: Partial<Settings>): void {
    // 防抖：500ms 内连续调用只写入最后一次
    this._debounceData = { ...this._debounceData, ...settings };
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this._flushSettings();
    }, 500);
  }

  /** 立即写入防抖中的设置（用于会话结束等场景） */
  flushSettings(): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    if (this._debounceData) {
      this._flushSettings();
    }
  }

  /** 销毁——清理防抖定时器 */
  destroy(): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    this._debounceData = null;
  }

  private _flushSettings(): void {
    if (!this._debounceData) return;
    const current = this.getSettings();
    const merged = { ...current, ...this._debounceData };
    this._debounceData = null;
    try {
      this._platform.set(KEY_SETTINGS, JSON.stringify(merged));
    } catch (e) {
      console.error('[LocalStorage] save settings failed:', e);
    }
  }

  // ---- Meta ----

  getMeta(): MetaData {
    const raw = this._platform.get(KEY_META);
    if (raw === null) return { ...DEFAULT_META };
    try {
      return { ...DEFAULT_META, ...JSON.parse(raw) };
    } catch (e) {
      console.error('[LocalStorage] meta parse error:', e);
      return { ...DEFAULT_META };
    }
  }

  saveMeta(meta: Partial<MetaData>): void {
    const current = this.getMeta();
    const merged = { ...current, ...meta };
    try {
      this._platform.set(KEY_META, JSON.stringify(merged));
    } catch (e) {
      console.error('[LocalStorage] save meta failed:', e);
    }
  }
}
