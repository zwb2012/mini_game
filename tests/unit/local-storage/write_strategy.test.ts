/**
 * Story 003: 写入策略与边界情况
 *
 * 验证最佳成绩比较、500ms 防抖、错误处理。
 *
 * AC 覆盖：
 *   AC-1  新成绩更优时更新
 *   AC-2  新成绩不更优时跳过
 *   AC-3  500ms 防抖
 *   AC-4  存储满不崩溃
 *   AC-5  数据损坏返回默认值
 *   AC-6  存储不可用不崩溃
 *
 * ADR: ADR-004
 * GDD: local-storage.md
 */

import { LocalStorage } from '../../../src/core/local-storage/LocalStorage';
import { WebStorage, IPlatformStorage } from '../../../src/core/local-storage/PlatformStorage';

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

beforeEach(() => {
  Object.keys(mockStore).forEach(k => delete mockStore[k]);
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('LocalStorage - 写入策略与边界情况', () => {
  // ============================================================
  // AC-1: Update when better
  // ============================================================
  describe('AC-1: 新成绩更优时更新', () => {
    test('better stars updates', () => {
      const storage = new LocalStorage(new WebStorage());
      storage.saveLevelProgress(1, 2, 18); // first play: 2 stars
      storage.saveLevelProgress(1, 3, 14); // replay: 3 stars (better!)

      const p = storage.getLevelProgress(1);
      expect(p.stars).toBe(3);
      expect(p.bestSteps).toBe(14);
    });

    test('same stars but fewer steps updates', () => {
      const storage = new LocalStorage(new WebStorage());
      storage.saveLevelProgress(2, 2, 20); // first play: 2 stars, 20 steps
      storage.saveLevelProgress(2, 2, 15); // replay: 2 stars, 15 steps (better steps)

      const p = storage.getLevelProgress(2);
      expect(p.stars).toBe(2);
      expect(p.bestSteps).toBe(15);
    });

    test('firstCompletedAt is preserved on replay', () => {
      const storage = new LocalStorage(new WebStorage());
      storage.saveLevelProgress(3, 1, 30);
      const firstTime = storage.getLevelProgress(3).firstCompletedAt;

      // Fast forward 1 second
      jest.advanceTimersByTime(1000);
      storage.saveLevelProgress(3, 3, 10);

      expect(storage.getLevelProgress(3).firstCompletedAt).toBe(firstTime);
    });
  });

  // ============================================================
  // AC-2: Skip when not better
  // ============================================================
  describe('AC-2: 不更优时跳过', () => {
    test('same stars and more steps does not update', () => {
      const storage = new LocalStorage(new WebStorage());
      // Manually set a good score first
      mockStore['nl_level_4'] = JSON.stringify({
        completed: true, stars: 3, bestSteps: 10, firstCompletedAt: '2026-01-01T00:00:00.000Z',
      });

      storage.saveLevelProgress(4, 3, 20); // same stars, worse steps

      const p = storage.getLevelProgress(4);
      expect(p.bestSteps).toBe(10); // unchanged
    });

    test('lower stars does not update', () => {
      const storage = new LocalStorage(new WebStorage());
      mockStore['nl_level_5'] = JSON.stringify({
        completed: true, stars: 3, bestSteps: 15, firstCompletedAt: '2026-01-01T00:00:00.000Z',
      });

      storage.saveLevelProgress(5, 2, 10); // worse stars

      const p = storage.getLevelProgress(5);
      expect(p.stars).toBe(3); // unchanged
    });
  });

  // ============================================================
  // AC-3: 500ms debounce
  // ============================================================
  describe('AC-3: 500ms 防抖', () => {
    test('multiple saveSettings within 500ms only write once', () => {
      const storage = new LocalStorage(new WebStorage());

      // Track ONLY nl_settings calls to ignore other setItem noise across suites
      const settingsSpy = jest.fn();
      const originalSetItem = (globalThis as any).window.localStorage.setItem;
      (globalThis as any).window.localStorage.setItem = function(key: string, val: string) {
        if (key === 'nl_settings') settingsSpy(key, val);
        return originalSetItem.call(this, key, val);
      };

      storage.saveSettings({ muted: true });
      jest.advanceTimersByTime(100);
      storage.saveSettings({ muted: false });
      jest.advanceTimersByTime(100);
      storage.saveSettings({ lastPlayedLevelId: 5 });

      // At 300ms, still within debounce window
      expect(settingsSpy).not.toHaveBeenCalled();

      // After 500ms from last call
      jest.advanceTimersByTime(500);
      expect(settingsSpy).toHaveBeenCalledTimes(1);

      const saved = JSON.parse(mockStore['nl_settings']);
      expect(saved.muted).toBe(false);
      expect(saved.lastPlayedLevelId).toBe(5);

      (globalThis as any).window.localStorage.setItem = originalSetItem;
    });

    test('flushSettings writes immediately', () => {
      const storage = new LocalStorage(new WebStorage());
      const settingsSpy = jest.fn();
      const origSetItem = (globalThis as any).window.localStorage.setItem;
      (globalThis as any).window.localStorage.setItem = function(k: string, v: string) {
        if (k === 'nl_settings') settingsSpy(k, v);
        return origSetItem.call(this, k, v);
      };

      storage.saveSettings({ muted: true });
      storage.flushSettings();

      expect(settingsSpy).toHaveBeenCalled();
      (globalThis as any).window.localStorage.setItem = origSetItem;
    });

    test('destroy clears pending debounce', () => {
      const storage = new LocalStorage(new WebStorage());
      const settingsSpy = jest.fn();
      const origSetItem = (globalThis as any).window.localStorage.setItem;
      (globalThis as any).window.localStorage.setItem = function(k: string, v: string) {
        if (k === 'nl_settings') settingsSpy(k, v);
        return origSetItem.call(this, k, v);
      };

      storage.saveSettings({ muted: true });
      storage.destroy();
      jest.advanceTimersByTime(1000);

      expect(settingsSpy).not.toHaveBeenCalled();
      (globalThis as any).window.localStorage.setItem = origSetItem;
    });
  });

  // ============================================================
  // AC-4/6: Error handling
  // ============================================================
  describe('AC-4/AC-6: 存储满/API 不可用', () => {
    test('set throwing error does not crash', () => {
      const throwingPlatform: IPlatformStorage = {
        set: () => { throw new Error('storage full'); },
        get: () => null,
        remove: () => {},
        getInfo: () => ({ keys: [], currentSize: 0, limitSize: 0 }),
      };
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const storage = new LocalStorage(throwingPlatform);

      expect(() => {
        storage.saveLevelProgress(1, 3, 10);
      }).not.toThrow();
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });

  // ============================================================
  // AC-5: Data corruption
  // ============================================================
  describe('AC-5: 数据损坏', () => {
    test('corrupted level progress returns defaults', () => {
      const storage = new LocalStorage(new WebStorage());
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockStore['nl_level_99'] = 'invalid json{{{';

      const p = storage.getLevelProgress(99);
      expect(p.completed).toBe(false);
      expect(p.stars).toBe(0);
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });

    test('corrupted settings returns defaults', () => {
      const storage = new LocalStorage(new WebStorage());
      mockStore['nl_settings'] = 'not-json';

      const s = storage.getSettings();
      expect(s.muted).toBe(false);
    });

    test('corrupted meta returns defaults', () => {
      const storage = new LocalStorage(new WebStorage());
      mockStore['nl_meta'] = '{broken';

      const m = storage.getMeta();
      expect(m.totalPlayTime).toBe(0);
    });
  });
});
