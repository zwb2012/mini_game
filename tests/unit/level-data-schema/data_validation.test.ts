/**
 * 关卡数据校验 — 单元测试
 *
 * 覆盖 ADR-006 定义的全部校验规则：
 * - version/levels 结构校验
 * - grid 范围 [3,10]
 * - nodes 连续性
 * - 坐标不重复
 * - 坐标在网格范围内
 * - optimalSteps >= 1
 * - blockedCells 不覆盖所有空格
 *
 * 所有测试使用纯 TypeScript，无 Cocos API 依赖。
 */

import { validateLevelData } from '../../../src/core/level-data-schema/validation';
import { LevelData } from '../../../src/core/level-data-schema/types';

// ============================================================
// 工厂函数：快速创建有效的默认 LevelData
// ============================================================

/**
 * 创建一份有效的最小 LevelData 用于测试。
 * 调用方可覆盖特定字段以构造非法数据。
 */
function makeValidLevelData(overrides?: Partial<LevelData>): LevelData {
  return {
    version: '1.0',
    levels: [
      {
        id: 1,
        name: 'Test Level',
        chapter: 1,
        difficulty: 1,
        grid: { rows: 5, cols: 5 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 4, col: 4 },
        ],
        blockedCells: [],
        optimalSteps: 10,
        unlockCondition: null,
      },
    ],
    ...overrides,
  };
}

// ============================================================
// 验收标准 AC-1: 有效 LevelData 校验通过
// ============================================================

describe('AC-1: 有效 LevelData 校验通过', () => {
  test('标准有效数据返回 ok=true', () => {
    const data = makeValidData();
    const result = validateLevelData(data);

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('多关卡有效数据通过校验', () => {
    const data = makeValidData();
    data.levels.push({
      id: 2,
      name: 'Level 2',
      chapter: 1,
      difficulty: 2,
      grid: { rows: 8, cols: 8 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 7, col: 7 },
        { number: 3, row: 3, col: 3 },
      ],
      blockedCells: [{ row: 1, col: 1 }],
      optimalSteps: 15,
      unlockCondition: { type: 'stars', value: 3 },
    });
    const result = validateLevelData(data);

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('levels 为空数组（无关卡）→ 校验通过（但应警告）', () => {
    const data = makeValidData();
    data.levels = [];
    const result = validateLevelData(data);

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

// ============================================================
// 验收标准 AC-2: nodes 连续 [1,2,3] 校验通过
// ============================================================

describe('AC-2: nodes 连续校验通过', () => {
  test('nodes = [1,2,3] 连续通过', () => {
    const data = makeValidData();
    data.levels[0].nodes = [
      { number: 1, row: 0, col: 0 },
      { number: 2, row: 0, col: 1 },
      { number: 3, row: 0, col: 2 },
    ];
    const result = validateLevelData(data);

    expect(result.ok).toBe(true);
  });

  test('nodes = [1,2,3,4,5] 连续通过', () => {
    const data = makeValidData();
    data.levels[0].nodes = [
      { number: 1, row: 0, col: 0 },
      { number: 2, row: 0, col: 1 },
      { number: 3, row: 0, col: 2 },
      { number: 4, row: 0, col: 3 },
      { number: 5, row: 0, col: 4 },
    ];
    const result = validateLevelData(data);

    expect(result.ok).toBe(true);
  });
});

// ============================================================
// 验收标准 AC-3: nodes 不连续校验拒绝
// ============================================================

describe('AC-3: nodes 不连续校验拒绝', () => {
  test('nodes = [1,3] 不连续 → 错误信息包含 "expected 2, got 3"', () => {
    const data = makeValidData();
    data.levels[0].nodes = [
      { number: 1, row: 0, col: 0 },
      { number: 3, row: 0, col: 1 },
    ];
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    const hasExpectedError = result.errors.some(
      (e) => e.includes('expected 2') && e.includes('got 3'),
    );
    expect(hasExpectedError).toBe(true);
  });

  test('nodes = [1,2,5] 不连续 → 错误信息包含 "expected 3, got 5"', () => {
    const data = makeValidData();
    data.levels[0].nodes = [
      { number: 1, row: 0, col: 0 },
      { number: 2, row: 0, col: 1 },
      { number: 5, row: 0, col: 2 },
    ];
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    const hasExpectedError = result.errors.some(
      (e) => e.includes('expected 3') && e.includes('got 5'),
    );
    expect(hasExpectedError).toBe(true);
  });

  test('nodes = [2,3] 不从 1 开始 → 错误信息包含 "expected 1, got 2"', () => {
    const data = makeValidData();
    data.levels[0].nodes = [
      { number: 2, row: 0, col: 0 },
      { number: 3, row: 0, col: 1 },
    ];
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    const hasExpectedError = result.errors.some(
      (e) => e.includes('expected 1') && e.includes('got 2'),
    );
    expect(hasExpectedError).toBe(true);
  });
});

// ============================================================
// 验收标准 AC-4: grid 范围检查
// ============================================================

describe('AC-4: grid 范围检查', () => {
  test('grid.rows = 12 → 校验拒绝，错误包含 "out of [3,10]"', () => {
    const data = makeValidData();
    data.levels[0].grid.rows = 12;
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('out of [3,10]')),
    ).toBe(true);
  });

  test('grid.cols = 12 → 校验拒绝', () => {
    const data = makeValidData();
    data.levels[0].grid.cols = 12;
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('out of [3,10]')),
    ).toBe(true);
  });

  test('grid.rows = 2 → 校验拒绝', () => {
    const data = makeValidData();
    data.levels[0].grid.rows = 2;
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('out of [3,10]')),
    ).toBe(true);
  });

  test('grid.rows = 3 → 边界值通过', () => {
    const data = makeValidData();
    data.levels[0].grid.rows = 3;
    // node(4,4) 超出 3 行范围——需要将节点移到合法坐标
    data.levels[0].nodes = [
      { number: 1, row: 0, col: 0 },
      { number: 2, row: 2, col: 4 },
    ];
    const result = validateLevelData(data);

    expect(result.ok).toBe(true);
  });

  test('grid.rows = 10 → 边界值通过', () => {
    const data = makeValidData();
    data.levels[0].grid.rows = 10;
    const result = validateLevelData(data);

    expect(result.ok).toBe(true);
  });
});

// ============================================================
// 验收标准 AC-5: 节点坐标重复
// ============================================================

describe('AC-5: 节点坐标重复', () => {
  test('两个节点坐标相同 → 错误包含 "duplicate node"', () => {
    const data = makeValidData();
    data.levels[0].nodes = [
      { number: 1, row: 2, col: 2 },
      { number: 2, row: 2, col: 2 }, // 坐标与 node 1 相同
    ];
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    const hasDuplicateError = result.errors.some(
      (e) => e.includes('duplicate node') && e.includes('(2,2)'),
    );
    expect(hasDuplicateError).toBe(true);
  });

  test('三个节点中两个坐标重复 → 校验拒绝', () => {
    const data = makeValidData();
    data.levels[0].nodes = [
      { number: 1, row: 0, col: 0 },
      { number: 2, row: 1, col: 1 },
      { number: 3, row: 0, col: 0 }, // 与 node 1 重复
    ];
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('duplicate node')),
    ).toBe(true);
  });
});

// ============================================================
// 验收标准 AC-6: optimalSteps >= 1
// ============================================================

describe('AC-6: optimalSteps >= 1', () => {
  test('optimalSteps = 0 → 校验拒绝，错误包含 "must be >= 1"', () => {
    const data = makeValidData();
    data.levels[0].optimalSteps = 0;
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    const hasError = result.errors.some(
      (e) => e.includes('must be >= 1') || e.includes('optimalSteps 0'),
    );
    expect(hasError).toBe(true);
  });

  test('optimalSteps = -5 → 校验拒绝', () => {
    const data = makeValidData();
    data.levels[0].optimalSteps = -5;
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('must be >= 1')),
    ).toBe(true);
  });

  test('optimalSteps = 1 → 边界值通过', () => {
    const data = makeValidData();
    data.levels[0].optimalSteps = 1;
    const result = validateLevelData(data);

    expect(result.ok).toBe(true);
  });
});

// ============================================================
// 额外边界情况
// ============================================================

describe('额外边界情况', () => {
  test('version 为空字符串 → 校验拒绝', () => {
    const data = makeValidData();
    data.version = '';
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('version')),
    ).toBe(true);
  });

  test('version 为 null → 校验拒绝', () => {
    const data = makeValidData();
    data.version = null as unknown as string;
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('version')),
    ).toBe(true);
  });

  test('levels 不是数组（传对象）→ 校验拒绝', () => {
    const data = makeValidData();
    data.levels = null as unknown as LevelData['levels'];
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('levels must be an array')),
    ).toBe(true);
  });

  test('nodes.length < 2 → 校验拒绝', () => {
    const data = makeValidData();
    data.levels[0].nodes = [{ number: 1, row: 0, col: 0 }];
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    const hasError = result.errors.some(
      (e) => e.includes('must have at least 2 nodes') || e.includes('must have'),
    );
    expect(hasError).toBe(true);
  });

  test('nodes 坐标超出网格范围 → 校验拒绝', () => {
    const data = makeValidData();
    data.levels[0].grid = { rows: 5, cols: 5 };
    data.levels[0].nodes = [
      { number: 1, row: 0, col: 0 },
      { number: 2, row: 10, col: 3 }, // row 超出 [0,4]
    ];
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('out of')),
    ).toBe(true);
  });

  test('blockedCells 覆盖所有剩余空格 → 校验拒绝', () => {
    // grid = 3x3 = 9 格；2 个节点占 2 格 → 剩余 7 格
    // blockedCells = 7 → 没有路径空间
    const data = makeValidData();
    data.levels[0].grid = { rows: 3, cols: 3 };
    data.levels[0].nodes = [
      { number: 1, row: 0, col: 0 },
      { number: 2, row: 2, col: 2 },
    ];
    data.levels[0].blockedCells = [
      { row: 0, col: 1 }, { row: 0, col: 2 },
      { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
      { row: 2, col: 0 }, { row: 2, col: 1 },
    ];
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('too many blocked cells')),
    ).toBe(true);
  });

  test('blockedCells 不覆盖所有空格 → 校验通过', () => {
    // grid = 3x3 = 9 格；2 个节点占 2 格 → 剩余 7 格
    // blockedCells = 6 → 还有 1 格剩余
    const data = makeValidData();
    data.levels[0].grid = { rows: 3, cols: 3 };
    data.levels[0].nodes = [
      { number: 1, row: 0, col: 0 },
      { number: 2, row: 2, col: 2 },
    ];
    data.levels[0].blockedCells = [
      { row: 0, col: 1 }, { row: 0, col: 2 },
      { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
      { row: 2, col: 0 },
    ];
    const result = validateLevelData(data);

    expect(result.ok).toBe(true);
  });

  test('多个校验失败同时报告所有错误', () => {
    const data = makeValidData();
    data.version = '';
    data.levels[0].grid.rows = 15;
    data.levels[0].optimalSteps = 0;
    data.levels[0].nodes = [
      { number: 1, row: 0, col: 0 },
      { number: 3, row: 0, col: 1 },
    ];
    const result = validateLevelData(data);

    expect(result.ok).toBe(false);
    // 应同时包含 version 错误、grid 错误、nodes 连续性错误、optimalSteps 错误
    expect(
      result.errors.some((e) => e.includes('version')),
    ).toBe(true);
    expect(
      result.errors.some((e) => e.includes('out of')),
    ).toBe(true);
    expect(
      result.errors.some((e) => e.includes('not consecutive')),
    ).toBe(true);
    expect(
      result.errors.some((e) => e.includes('optimalSteps')),
    ).toBe(true);
    // 至少 4 条不同错误
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });
});

// ============================================================
// 辅助函数
// ============================================================

/**
 * 创建一份完整有效关卡数据（5x5 网格，2 个节点，无障碍）
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
        grid: { rows: 5, cols: 5 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 4, col: 4 },
        ],
        blockedCells: [],
        optimalSteps: 10,
        unlockCondition: null,
      },
    ],
  };
}
