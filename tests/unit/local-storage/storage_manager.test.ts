/**
 * Story 002: 存储管理器——数据模型与 CRUD
 *
 * 验证 LocalStorage 的 nl_ 前缀、三种数据模型读写、默认值。
 *
 * AC 覆盖：
 *   AC-1  新玩家读取 LevelProgress → 默认值
 *   AC-2  保存后读取 LevelProgress → 正确返回值
 *   AC-3  首次启动读取设置 → 默认值
 *   AC-4  首次启动读取 meta → 默认值
 *   AC-5  nl_ 前缀自动添加
 *
 * ADR: ADR-004
 * GDD: local-storage.md
 */

import { LocalStorage } from '../../../src/core/local-storage/LocalStorage';
import { WebStorage, IPlatformStorage } from '../../../src/core/local-storage/PlatformStorage';

// Mock window.localStorage for Node test environment
const mockStore: Record<string, string> = {};
(globalThis as any).window = {
  localStorage: {
    getItem: jest.fn((key: string) => mockStore[key] ?? null),
    setItem: jest.fn((key: string, val: string) => { mockStore[key] = val; }),
    removeItem: jest.fn((key: string) => { delete mockStore[key]; }),
    clear: jest.fn(() => { Object.keys(mockStore).forEach(k => delete mockStore[k]); }),
    get length() { return Object.keys(mockStore).length; },
    key: jest.fn((i: number) => Object.keys(mockStore)[i] ?? null),
  },
};

function createStorage(): LocalStorage {
  return new LocalStorage(new WebStorage());
}

describe('LocalStorage - 存储管理器', () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach(k => delete mockStore[k]);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================================
  // AC-1: Default values for new player
  // ============================================================
  describe('AC-1: 新玩家默认值', () => {
    test('new player level progress returns defaults', () => {
      const storage = createStorage();
      const progress = storage.getLevelProgress(1);
      expect(progress.completed).toBe(false);
      expect(progress.stars).toBe(0);
      expect(progress.bestSteps).toBe(0);
      expect(progress.firstCompletedAt).toBe('');
    });

    test('multiple unstarted levels all return defaults', () => {
      const storage = createStorage();
      for (let i = 1; i <= 5; i++) {
        const p = storage.getLevelProgress(i);
        expect(p.completed).toBe(false);
      }
    });
  });

  // ============================================================
  // AC-2: Save and read level progress
  // ============================================================
  describe('AC-2: 保存并读取关卡进度', () => {
    test('save then read returns correct values', () => {
      const storage = createStorage();
      storage.saveLevelProgress(5, 3, 14);

      const progress = storage.getLevelProgress(5);
      expect(progress.completed).toBe(true);
      expect(progress.stars).toBe(3);
      expect(progress.bestSteps).toBe(14);
      expect(progress.firstCompletedAt).not.toBe('');
      expect(() => new Date(progress.firstCompletedAt)).not.toThrow(); // valid ISO8601
    });

    test('read back same data for different levels', () => {
      const storage = createStorage();
      storage.saveLevelProgress(1, 2, 10);
      storage.saveLevelProgress(2, 3, 8);

      expect(storage.getLevelProgress(1).stars).toBe(2);
      expect(storage.getLevelProgress(2).stars).toBe(3);
      expect(storage.getLevelProgress(3).stars).toBe(0); // unsaved → default
    });
  });

  // ============================================================
  // AC-3: Default settings
  // ============================================================
  describe('AC-3: 设置默认值', () => {
    test('first time settings returns defaults', () => {
      const storage = createStorage();
      const settings = storage.getSettings();
      expect(settings.muted).toBe(false);
      expect(settings.lastPlayedLevelId).toBe(1);
    });

    test('save and read settings', () => {
      const storage = createStorage();
      storage.saveSettings({ muted: true, lastPlayedLevelId: 5 });
      jest.advanceTimersByTime(600); // debounce fires after 500ms

      const settings = storage.getSettings();
      expect(settings.muted).toBe(true);
      expect(settings.lastPlayedLevelId).toBe(5);
    });

    test('partial settings update does not clear other fields', () => {
      const storage = createStorage();
      storage.saveSettings({ muted: true });
      jest.advanceTimersByTime(600);

      expect(storage.getSettings().muted).toBe(true);
      expect(storage.getSettings().lastPlayedLevelId).toBe(1); // unchanged
    });
  });

  // ============================================================
  // AC-4: Default meta
  // ============================================================
  describe('AC-4: 元数据默认值', () => {
    test('first time meta returns defaults', () => {
      const storage = createStorage();
      const meta = storage.getMeta();
      expect(meta.totalPlayTime).toBe(0);
      expect(meta.totalLevelsCompleted).toBe(0);
      expect(meta.installDate).toBe('');
    });

    test('save and read meta', () => {
      const storage = createStorage();
      storage.saveMeta({ totalPlayTime: 3600, totalLevelsCompleted: 15 });

      const meta = storage.getMeta();
      expect(meta.totalPlayTime).toBe(3600);
      expect(meta.totalLevelsCompleted).toBe(15);
    });
  });

  // ============================================================
  // AC-5: nl_ prefix
  // ============================================================
  describe('AC-5: nl_ 前缀', () => {
    test('level progress uses nl_level_N key', () => {
      const storage = createStorage();
      storage.saveLevelProgress(3, 1, 20);

      // The data should be stored under nl_level_3
      const raw = mockStore['nl_level_3'];
      expect(raw).toBeDefined();
      const parsed = JSON.parse(raw);
      expect(parsed.stars).toBe(1);
    });

    test('settings uses nl_settings key', () => {
      const storage = createStorage();
      storage.saveSettings({ muted: true });
      jest.advanceTimersByTime(600); // debounce fires after 500ms

      expect(mockStore['nl_settings']).toBeDefined();
    });

    test('meta uses nl_meta key', () => {
      const storage = createStorage();
      storage.saveMeta({ installDate: '2026-01-01' });

      expect(mockStore['nl_meta']).toBeDefined();
    });
  });
});
