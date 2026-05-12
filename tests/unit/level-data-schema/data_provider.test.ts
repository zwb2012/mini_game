/**
 * LevelDataProvider — 单元测试
 *
 * 覆盖以下场景：
 * - 加载成功（resources.load 成功 + 校验通过）
 * - 加载失败（resources.load 报错）
 * - 校验失败（数据格式非法）
 * - 加载完成后按 ID 查询关卡
 * - 查询不存在的 ID 返回 null
 * - 加载后关卡计数正确
 * - 加载前关卡计数为 0
 *
 * 依赖 mock: tests/__mocks__/cc.mock.ts → resources.load
 */

import { resources } from 'cc';
import { LevelDataProvider } from '../../../src/core/level-data-schema';
import { LevelData } from '../../../src/core/level-data-schema/types';

// ============================================================
// 工厂函数：快速创建有效的默认 LevelData
// ============================================================

/**
 * 创建一份有效的最小 LevelData 用于测试。
 * 3x3 网格，2 个节点，无障碍。
 */
function makeValidData(): LevelData {
  return {
    version: '1.0',
    levels: [
      {
        id: 1,
        name: 'Test Level',
        chapter: 1,
        difficulty: 1,
        grid: { rows: 3, cols: 3 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 2, col: 2 },
        ],
        blockedCells: [],
        optimalSteps: 4,
        unlockCondition: null,
      },
    ],
  };
}

// ============================================================
// LevelDataProvider 测试
// ============================================================

describe('LevelDataProvider', () => {
  let provider: LevelDataProvider;

  beforeEach(() => {
    provider = new LevelDataProvider();
    resources.__resetMock();
    jest.clearAllMocks();
  });

  // ============================================================
  // AC-1: loadLevels 加载成功
  // ============================================================

  describe('AC-1: loadLevels 加载成功', () => {
    test('loadLevels resolves with valid LevelData on success', async () => {
      const data = makeValidData();
      resources.__setMockData('levels', data);

      const result = await provider.loadLevels();

      expect(result).toEqual(data);
      expect(resources.load).toHaveBeenCalledWith(
        'levels',
        expect.anything(),
        expect.any(Function),
      );
    });

    test('after loadLevels, getLevel returns correct level by id', async () => {
      const data = makeValidData();
      resources.__setMockData('levels', data);
      await provider.loadLevels();

      const level = provider.getLevel(1);
      expect(level).not.toBeNull();
      expect(level!.id).toBe(1);
      expect(level!.name).toBe('Test Level');
      expect(level!.grid.rows).toBe(3);
    });

    test('after loadLevels, getLevelCount returns correct count', async () => {
      const data = makeValidData();
      resources.__setMockData('levels', data);
      await provider.loadLevels();

      expect(provider.getLevelCount()).toBe(1);
    });

    test('loadLevels resolves with multi-level data', async () => {
      const data = makeValidData();
      data.levels.push({
        id: 2,
        name: 'Level 2',
        chapter: 1,
        difficulty: 2,
        grid: { rows: 5, cols: 5 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 4, col: 4 },
          { number: 3, row: 2, col: 2 },
        ],
        blockedCells: [{ row: 1, col: 1 }],
        optimalSteps: 10,
        unlockCondition: { type: 'stars', value: 3 },
      });
      resources.__setMockData('levels', data);

      const result = await provider.loadLevels();

      expect(result.levels.length).toBe(2);
      expect(provider.getLevelCount()).toBe(2);
      expect(provider.getLevel(2)?.name).toBe('Level 2');
    });
  });

  // ============================================================
  // AC-2: loadLevels 加载失败
  // ============================================================

  describe('AC-2: loadLevels 加载失败', () => {
    test('loadLevels rejects when resources.load returns an error', async () => {
      resources.__setMockError('levels', new Error('Asset not found'));

      await expect(provider.loadLevels()).rejects.toThrow(
        '[LevelData] Failed to load levels.json',
      );
    });

    test('loadLevels does not store data when load fails', async () => {
      resources.__setMockError('levels', new Error('Network error'));

      try {
        await provider.loadLevels();
      } catch {
        // expected
      }

      expect(provider.getLevelCount()).toBe(0);
      expect(provider.getLevel(1)).toBeNull();
    });
  });

  // ============================================================
  // AC-3: loadLevels 校验失败
  // ============================================================

  describe('AC-3: loadLevels 校验失败', () => {
    test('loadLevels rejects when data validation fails', async () => {
      const invalidData = makeValidData();
      invalidData.version = ''; // 非法 version
      resources.__setMockData('levels', invalidData);

      await expect(provider.loadLevels()).rejects.toThrow(
        '[LevelData] Validation failed',
      );
    });

    test('loadLevels does not store data when validation fails', async () => {
      const invalidData = makeValidData();
      invalidData.levels[0].optimalSteps = 0;
      resources.__setMockData('levels', invalidData);

      try {
        await provider.loadLevels();
      } catch {
        // expected
      }

      expect(provider.getLevelCount()).toBe(0);
      expect(provider.getLevel(1)).toBeNull();
    });

    test('rejection error contains validation details', async () => {
      const invalidData = makeValidData();
      invalidData.version = '';
      invalidData.levels[0].optimalSteps = 0;
      resources.__setMockData('levels', invalidData);

      await expect(provider.loadLevels()).rejects.toThrow(/version/);
      await expect(provider.loadLevels()).rejects.toThrow(/optimalSteps/);
    });
  });

  // ============================================================
  // AC-4: getLevel 查询
  // ============================================================

  describe('AC-4: getLevel 查询行为', () => {
    test('getLevel returns null for non-existent id after loading', async () => {
      const data = makeValidData();
      resources.__setMockData('levels', data);
      await provider.loadLevels();

      expect(provider.getLevel(999)).toBeNull();
    });

    test('getLevel returns null before loadLevels is called', () => {
      expect(provider.getLevel(1)).toBeNull();
    });

    test('getLevel returns null after failed load attempt', async () => {
      resources.__setMockError('levels', new Error('fail'));
      try {
        await provider.loadLevels();
      } catch {
        // expected
      }

      expect(provider.getLevel(1)).toBeNull();
    });
  });

  // ============================================================
  // AC-5: getLevelCount 边界行为
  // ============================================================

  describe('AC-5: getLevelCount 边界行为', () => {
    test('getLevelCount returns 0 before loadLevels is called', () => {
      expect(provider.getLevelCount()).toBe(0);
    });

    test('getLevelCount returns 0 after failed load attempt', async () => {
      resources.__setMockError('levels', new Error('fail'));
      try {
        await provider.loadLevels();
      } catch {
        // expected
      }

      expect(provider.getLevelCount()).toBe(0);
    });

    test('getLevelCount returns 0 after validation failure', async () => {
      resources.__setMockData('levels', { version: '', levels: [] });
      try {
        await provider.loadLevels();
      } catch {
        // expected
      }

      expect(provider.getLevelCount()).toBe(0);
    });
  });

  // ============================================================
  // AC-6: 多次调用 loadLevels
  // ============================================================

  describe('AC-6: 多次调用 loadLevels', () => {
    test('subsequent loadLevels call replaces previous data on success', async () => {
      const data1 = makeValidData();
      resources.__setMockData('levels', data1);
      await provider.loadLevels();
      expect(provider.getLevelCount()).toBe(1);

      const data2 = makeValidData();
      data2.levels[0].id = 2;
      data2.levels[0].name = 'Replaced';
      resources.__setMockData('levels', data2);
      await provider.loadLevels();

      expect(provider.getLevelCount()).toBe(1);
      expect(provider.getLevel(1)).toBeNull();
      expect(provider.getLevel(2)?.name).toBe('Replaced');
    });

    test('data from failed second load does not corrupt previous data', async () => {
      const goodData = makeValidData();
      resources.__setMockData('levels', goodData);
      await provider.loadLevels();

      resources.__setMockError('levels', new Error('second load fails'));
      try {
        await provider.loadLevels();
      } catch {
        // expected
      }

      // 之前加载的数据应保持不变
      expect(provider.getLevelCount()).toBe(1);
      expect(provider.getLevel(1)).not.toBeNull();
    });
  });
});
