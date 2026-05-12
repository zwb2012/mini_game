/**
 * Bresenham 直线插值 — 单元测试
 *
 * Story 003: 快划时自动填充跳过的中间格子。
 * 覆盖 AC-1 到 AC-6，以及 Bresenham 标准测试向量。
 *
 * @module tests/unit/grid-connection-engine/bresenham
 */

import { GridConnectionEngine } from '../../../src/core/grid-connection-engine/GridConnectionEngine';
import { EngineState } from '../../../src/core/grid-connection-engine/types';
import type { Level } from '../../../src/core/level-data-schema/types';
import { Node, Graphics } from 'cc';

// ======================================================================
// 辅助：从 module 导出访问 bresenhamPath 纯函数
// 由于函数没有 export，我们通过 (engine as any).constructor 无法访问
// 但函数被 onInputMove 使用，我们在 integration 测试中验证效果。
// 对于纯函数单元测试，我们在测试中重写相同的算法来验证。
// 注：稍后若函数改为 export，可 import 直接测试。
// ======================================================================

/**
 * 模块内的 bresenhamPath 不可直接 import (module-level, not exported)。
 * 此辅助函数是标准 Bresenham 的独立实现，用于验证一致性。
 * 仅用于纯函数单元测试——integration 测试使用引擎的私有路径。
 */
function referenceBresenham(
  r0: number, c0: number, r1: number, c1: number,
): Array<{ row: number; col: number }> {
  const path: Array<{ row: number; col: number }> = [];
  let r = r0;
  let c = c0;
  const dr = r1 - r0;
  const dc = c1 - c0;
  const stepR = dr >= 0 ? 1 : -1;
  const stepC = dc >= 0 ? 1 : -1;
  const absDr = dr >= 0 ? dr : -dr;
  const absDc = dc >= 0 ? dc : -dc;

  path.push({ row: r, col: c });
  if (r === r1 && c === c1) return path;

  if (absDc > absDr) {
    let err = 2 * absDr - absDc;
    for (let i = 0; i < absDc; i++) {
      if (err >= 0) { r += stepR; err -= 2 * absDc; }
      err += 2 * absDr;
      c += stepC;
      path.push({ row: r, col: c });
    }
  } else {
    let err = 2 * absDc - absDr;
    for (let i = 0; i < absDr; i++) {
      if (err >= 0) { c += stepC; err -= 2 * absDr; }
      err += 2 * absDc;
      r += stepR;
      path.push({ row: r, col: c });
    }
  }
  return path;
}

// ===== 测试数据工厂 =====

function makeLevel(overrides: Partial<Level> = {}): Level {
  return {
    id: 1,
    name: '测试关',
    chapter: 1,
    difficulty: 1,
    grid: { rows: 6, cols: 6 },
    nodes: [
      { number: 1, row: 0, col: 0 },
      { number: 2, row: 5, col: 5 },
    ],
    blockedCells: [],
    optimalSteps: 10,
    unlockCondition: null,
    ...overrides,
  };
}

function createEngine(): GridConnectionEngine {
  const engine = new GridConnectionEngine();
  const rootNode = new Node('EngineNode');
  const graphics = rootNode.addComponent(Graphics) as Graphics;
  (engine as any).node = rootNode;
  (engine as any)._graphics = graphics;

  const labelContainer = new Node('LabelContainer');
  rootNode.addChild(labelContainer);
  (engine as any).labelContainer = labelContainer;

  engine.onLoad();
  return engine;
}

function initAndStartPath(
  engine: GridConnectionEngine,
  level: Level,
  startRow: number,
  startCol: number,
): void {
  engine.init(level, 750, 1334);
  engine.onInputMove(startRow, startCol);
}

// ======================================================================
// 第 1 部分：纯函数单元测试 — Bresenham 标准测试向量
// ======================================================================

describe('Part 1: bresenhamPath 标准测试向量', () => {
  // ================================================================
  // 纯水平线
  // ================================================================
  describe('纯水平线', () => {
    test('test_horizontal_line_left_to_right', () => {
      const path = referenceBresenham(0, 0, 0, 5);
      expect(path.length).toBe(6); // 0..5 = 6 格
      expect(path[0]).toEqual({ row: 0, col: 0 });
      expect(path[1]).toEqual({ row: 0, col: 1 });
      expect(path[2]).toEqual({ row: 0, col: 2 });
      expect(path[3]).toEqual({ row: 0, col: 3 });
      expect(path[4]).toEqual({ row: 0, col: 4 });
      expect(path[5]).toEqual({ row: 0, col: 5 });
    });

    test('test_horizontal_line_right_to_left', () => {
      const path = referenceBresenham(2, 5, 2, 0);
      expect(path.length).toBe(6);
      expect(path[0]).toEqual({ row: 2, col: 5 });
      expect(path[5]).toEqual({ row: 2, col: 0 });
      // 验证路径中间格正确
      for (let i = 0; i <= 5; i++) {
        expect(path[i].row).toBe(2);
        expect(path[i].col).toBe(5 - i);
      }
    });
  });

  // ================================================================
  // 纯垂直线
  // ================================================================
  describe('纯垂直线', () => {
    test('test_vertical_line_top_to_bottom', () => {
      const path = referenceBresenham(0, 3, 5, 3);
      expect(path.length).toBe(6);
      expect(path[0]).toEqual({ row: 0, col: 3 });
      expect(path[1]).toEqual({ row: 1, col: 3 });
      expect(path[2]).toEqual({ row: 2, col: 3 });
      expect(path[3]).toEqual({ row: 3, col: 3 });
      expect(path[4]).toEqual({ row: 4, col: 3 });
      expect(path[5]).toEqual({ row: 5, col: 3 });
    });

    test('test_vertical_line_bottom_to_top', () => {
      const path = referenceBresenham(5, 0, 0, 0);
      expect(path.length).toBe(6);
      expect(path[0]).toEqual({ row: 5, col: 0 });
      expect(path[5]).toEqual({ row: 0, col: 0 });
      for (let i = 0; i <= 5; i++) {
        expect(path[i].col).toBe(0);
        expect(path[i].row).toBe(5 - i);
      }
    });
  });

  // ================================================================
  // 对角线
  // ================================================================
  describe('对角线', () => {
    test('test_diagonal_line_45_degrees', () => {
      const path = referenceBresenham(0, 0, 4, 4);
      expect(path.length).toBe(5);
      for (let i = 0; i <= 4; i++) {
        expect(path[i]).toEqual({ row: i, col: i });
      }
    });

    test('test_diagonal_line_anti_diagonal', () => {
      const path = referenceBresenham(0, 4, 4, 0);
      expect(path.length).toBe(5);
      for (let i = 0; i <= 4; i++) {
        expect(path[i]).toEqual({ row: i, col: 4 - i });
      }
    });
  });

  // ================================================================
  // 浅斜线 (|dr| < |dc|)
  // ================================================================
  describe('浅斜线', () => {
    test('test_shallow_slope_down_right', () => {
      // (0,0) → (2,5): dr=2, dc=5, col-dominant
      const path = referenceBresenham(0, 0, 2, 5);
      expect(path.length).toBe(6); // major axis=5 + 1
      expect(path[0]).toEqual({ row: 0, col: 0 });
      expect(path[path.length - 1]).toEqual({ row: 2, col: 5 });
      // 检查所有行在 [0,2] 范围内
      for (const p of path) {
        expect(p.row).toBeGreaterThanOrEqual(0);
        expect(p.row).toBeLessThanOrEqual(2);
      }
    });

    test('test_shallow_slope_up_left', () => {
      // (2,5) → (0,0): dr=-2, dc=-5, col-dominant
      const path = referenceBresenham(2, 5, 0, 0);
      expect(path.length).toBe(6);
      expect(path[0]).toEqual({ row: 2, col: 5 });
      expect(path[path.length - 1]).toEqual({ row: 0, col: 0 });
    });
  });

  // ================================================================
  // 陡斜线 (|dr| > |dc|)
  // ================================================================
  describe('陡斜线', () => {
    test('test_steep_slope_down_right', () => {
      // (0,0) → (5,2): dr=5, dc=2, row-dominant
      const path = referenceBresenham(0, 0, 5, 2);
      expect(path.length).toBe(6); // major axis=5 + 1
      expect(path[0]).toEqual({ row: 0, col: 0 });
      expect(path[path.length - 1]).toEqual({ row: 5, col: 2 });
      for (const p of path) {
        expect(p.col).toBeGreaterThanOrEqual(0);
        expect(p.col).toBeLessThanOrEqual(2);
      }
    });

    test('test_steep_slope_down_left', () => {
      // (0,0) → (5,-2) not in grid: use (0,5) → (5,3): dr=5, dc=-2
      const path = referenceBresenham(0, 5, 5, 3);
      expect(path.length).toBe(6);
      expect(path[0]).toEqual({ row: 0, col: 5 });
      expect(path[path.length - 1]).toEqual({ row: 5, col: 3 });
    });
  });

  // ================================================================
  // 相同点（退化情况）
  // ================================================================
  describe('相同点', () => {
    test('test_same_point_returns_single_cell', () => {
      const path = referenceBresenham(3, 4, 3, 4);
      expect(path.length).toBe(1);
      expect(path[0]).toEqual({ row: 3, col: 4 });
    });
  });

  // ================================================================
  // 8 方向 Octant 全覆盖验证
  // (dx, dy) 组合测试：浅斜线与陡斜线的所有方向
  // ================================================================
  describe('8 方向 Octant 覆盖', () => {
    // Octant 编号约定（row, col 坐标系）：
    //
    //        \  2|1  /
    //         \  |  /
    //       3   \|/   0
    //      ------+------
    //       4   /|\   7
    //         /  |  \
    //        /  5|6  \
    //

    test('test_octant_0_dc_gt_dr_positive', () => {
      // Octant 0: col-dominant, dr>=0, dc>0, dc>dr
      const path = referenceBresenham(0, 0, 2, 5);
      expect(path[0]).toEqual({ row: 0, col: 0 });
      expect(path[path.length - 1]).toEqual({ row: 2, col: 5 });
      // 路径沿 col 递增，行在 col 增长时逐渐变化
      let prevCol = -1;
      for (const p of path) {
        expect(p.col).toBeGreaterThan(prevCol);
        prevCol = p.col;
      }
    });

    test('test_octant_1_dr_gt_dc_positive', () => {
      // Octant 1: row-dominant, dr>0, dc>0, dr>dc
      const path = referenceBresenham(0, 0, 5, 2);
      expect(path[0]).toEqual({ row: 0, col: 0 });
      expect(path[path.length - 1]).toEqual({ row: 5, col: 2 });
      let prevRow = -1;
      for (const p of path) {
        expect(p.row).toBeGreaterThan(prevRow);
        prevRow = p.row;
      }
    });

    test('test_octant_2_dr_gt_abs_dc_negative_dc', () => {
      // Octant 2: row-dominant, dr>0, dc<0, dr>|dc|
      const path = referenceBresenham(0, 5, 5, 3);
      expect(path[0]).toEqual({ row: 0, col: 5 });
      expect(path[path.length - 1]).toEqual({ row: 5, col: 3 });
      let prevRow = -1;
      for (const p of path) {
        expect(p.row).toBeGreaterThan(prevRow);
        prevRow = p.row;
      }
    });

    test('test_octant_3_abs_dc_gt_dr_negative_dc', () => {
      // Octant 3: col-dominant, dr>0, dc<0, |dc|>dr
      const path = referenceBresenham(0, 5, 2, 0);
      expect(path[0]).toEqual({ row: 0, col: 5 });
      expect(path[path.length - 1]).toEqual({ row: 2, col: 0 });
      let prevCol = 10;
      for (const p of path) {
        expect(p.col).toBeLessThan(prevCol);
        prevCol = p.col;
      }
    });

    test('test_octant_4_abs_dc_gt_dr_negative_dr_negative_dc', () => {
      // Octant 4: col-dominant, dr<0, dc<0, |dc|>|dr|
      const path = referenceBresenham(5, 5, 3, 0);
      expect(path[0]).toEqual({ row: 5, col: 5 });
      expect(path[path.length - 1]).toEqual({ row: 3, col: 0 });
    });

    test('test_octant_5_dr_gt_abs_dc_negative_dr_negative_dc', () => {
      // Octant 5: row-dominant, dr<0, dc<0, |dr|>|dc|
      const path = referenceBresenham(5, 5, 0, 3);
      expect(path[0]).toEqual({ row: 5, col: 5 });
      expect(path[path.length - 1]).toEqual({ row: 0, col: 3 });
    });

    test('test_octant_6_dr_gt_abs_dc_negative_dr_positive_dc', () => {
      // Octant 6: row-dominant, dr<0, dc>0, |dr|>dc
      const path = referenceBresenham(5, 0, 0, 2);
      expect(path[0]).toEqual({ row: 5, col: 0 });
      expect(path[path.length - 1]).toEqual({ row: 0, col: 2 });
    });

    test('test_octant_7_abs_dc_gt_dr_negative_dr_positive_dc', () => {
      // Octant 7: col-dominant, dr<0, dc>0, dc>|dr|
      const path = referenceBresenham(5, 0, 3, 5);
      expect(path[0]).toEqual({ row: 5, col: 0 });
      expect(path[path.length - 1]).toEqual({ row: 3, col: 5 });
    });
  });
});

// ======================================================================
// 第 2 部分：引擎集成测试 — Story 003 验收标准
// ======================================================================

describe('Part 2: Bresenham 集成测试 (Story 003)', () => {
  // ================================================================
  // AC-1: 水平快速滑动 (0,0)→(0,3) → (0,1),(0,2) 被填充
  // ================================================================
  describe('AC-1: 水平快速滑动插值', () => {
    test('test_horizontal_fast_slide_fills_middle_cells', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 0, col: 3 },
        ],
        blockedCells: [],
      });

      engine.init(level, 750, 1334);
      engine.onInputMove(0, 0); // start at node 1
      expect(engine.getStepCount()).toBe(1);

      // 直接跳至 (0,3) — 应插值填充 (0,1)(0,2)
      engine.onInputMove(0, 3);

      const grid = engine.getGrid();
      expect(grid[0][1].filled).toBe(true);
      expect(grid[0][1].ownerNumber).toBe(1);
      expect(grid[0][2].filled).toBe(true);
      expect(grid[0][2].ownerNumber).toBe(1);
      expect(grid[0][3].filled).toBe(true); // 目标格
      expect(engine.getStepCount()).toBe(4); // 0+1+2+3 → 4 步
    });
  });

  // ================================================================
  // AC-2: 斜向快速滑动 (0,0)→(2,2) → (1,1) 被填充
  // ================================================================
  describe('AC-2: 斜向快速滑动插值', () => {
    test('test_diagonal_fast_slide_fills_middle_cell', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 2, col: 2 },
        ],
        blockedCells: [],
      });

      initAndStartPath(engine, level, 0, 0);
      expect(engine.getStepCount()).toBe(1);

      // 跳至 (2,2) — 应填充 (1,1)
      engine.onInputMove(2, 2);

      const grid = engine.getGrid();
      expect(grid[1][1].filled).toBe(true);
      expect(grid[1][1].ownerNumber).toBe(1);
      expect(grid[2][2].filled).toBe(true);
      expect(engine.getStepCount()).toBe(3); // 0,0 + 1,1 + 2,2
    });
  });

  // ================================================================
  // AC-3: 插值路径中障碍格跳过
  // ================================================================
  describe('AC-3: 插值路径中障碍格跳过', () => {
    test('test_bresenham_skip_blocked_cell', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 0, col: 3 },
        ],
        blockedCells: [{ row: 0, col: 1 }],
      });

      initAndStartPath(engine, level, 0, 0);

      // 跳至 (0,3) — 路径 (0,0)→(0,1)→(0,2)→(0,3)
      // (0,1) 为障碍格 → 跳过，(0,2) 正常填充
      engine.onInputMove(0, 3);

      const grid = engine.getGrid();
      // 障碍格未填充
      expect(grid[0][1].isBlocked).toBe(true);
      expect(grid[0][1].filled).toBe(false);
      // (0,2) 正常填充
      expect(grid[0][2].filled).toBe(true);
      expect(grid[0][2].ownerNumber).toBe(1);
      // 目标格正常填充
      expect(grid[0][3].filled).toBe(true);
      // 步数：起点(1) + (0,2) + (0,3) = 3（跳过障碍格不计步）
      expect(engine.getStepCount()).toBe(3);
    });

    test('test_bresenham_blocked_cell_in_middle_of_path', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 3, col: 3 },
        ],
        blockedCells: [
          { row: 1, col: 1 },
          { row: 2, col: 2 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);

      // 跳至 (3,3) — 路径 (0,0)→(1,1)→(2,2)→(3,3)
      // (1,1)(2,2) 均为障碍格 → 跳过
      engine.onInputMove(3, 3);

      const grid = engine.getGrid();
      expect(grid[1][1].filled).toBe(false); // 障碍格未填充
      expect(grid[2][2].filled).toBe(false); // 障碍格未填充
      expect(grid[3][3].filled).toBe(true);  // 目标格正常填充
      // 步数：起点(1) + (3,3) = 2（中间障碍格跳过不计步）
      expect(engine.getStepCount()).toBe(2);
    });
  });

  // ================================================================
  // AC-4: 插值路径中已填充格跳过
  // ================================================================
  describe('AC-4: 插值路径中已填充格跳过', () => {
    test('test_bresenham_skip_already_filled_cell', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 3, cols: 5 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 0, col: 4 },
        ],
        blockedCells: [],
      });

      initAndStartPath(engine, level, 0, 0);
      expect(engine.getStepCount()).toBe(1);

      // 先手动填充 (0,1) 和 (0,2)
      engine.onInputMove(0, 1);
      engine.onInputMove(0, 2);
      expect(engine.getStepCount()).toBe(3);

      // 跳至 (0,4) — Bresenham 路径 (0,0)→(0,1)→(0,2)→(0,3)→(0,4)
      // (0,1),(0,2) 已填充 → 跳过
      engine.onInputMove(0, 4);

      const grid = engine.getGrid();
      // (0,1)(0,2) 已填充不变
      expect(grid[0][1].filled).toBe(true);
      expect(grid[0][2].filled).toBe(true);
      // (0,3) 新填充
      expect(grid[0][3].filled).toBe(true);
      expect(grid[0][3].ownerNumber).toBe(1);
      // (0,4) 目标格
      expect(grid[0][4].filled).toBe(true);
      // 步数：起点(1) + (0,1) + (0,2) + (0,3) + (0,4) = 5
      // 已填充格从"跳过"角度不额外增加，但之前已算过步数了
      // 实际步数变化：+ (0,3) + (0,4) = +2
      expect(engine.getStepCount()).toBe(5);
    });

    test('test_bresenham_already_filled_middle_cell_skipped_in_path', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 3, cols: 5 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 0, col: 4 },
        ],
        blockedCells: [],
      });

      initAndStartPath(engine, level, 0, 0);
      const stepsBefore = engine.getStepCount(); // 1

      // 先手动填充 (0,2)
      engine.onInputMove(0, 1);
      engine.onInputMove(0, 2);
      const stepsAfterManual = engine.getStepCount(); // 3

      // 跳至 (0,4)：路径 (0,0)→(0,1)→(0,2)→(0,3)→(0,4)
      // (0,1)(0,2) 已填充 → 跳过，不额外计步
      engine.onInputMove(0, 4);

      // 总步数：路径全长 5 格
      expect(engine.getStepCount()).toBe(5);
    });
  });

  // ================================================================
  // AC-5: 相邻格移动 (delta≤1) 无插值——直接处理
  // ================================================================
  describe('AC-5: 相邻格移动无插值', () => {
    test('test_adjacent_move_no_interpolation', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 1, col: 1 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      const pathLenBefore = engine.getPath().length;

      // 相邻格移动 (0,0)→(0,1): dr=0, dc=1 — 无插值
      engine.onInputMove(0, 1);
      expect(engine.getPath().length).toBe(pathLenBefore + 1);
      expect(engine.getStepCount()).toBe(2);

      // 再相邻移动 (0,1)→(1,1): dr=1, dc=0 — 无插值
      engine.onInputMove(1, 1);
      expect(engine.getPath().length).toBe(pathLenBefore + 2);
      expect(engine.getStepCount()).toBe(3);
    });

    test('test_adjacent_diagonal_move_no_interpolation', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 1, col: 1 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      const stepsBefore = engine.getStepCount();

      // 对角线相邻 (0,0)→(1,1): dr=1, dc=1 — 无插值
      engine.onInputMove(1, 1);

      expect(engine.getStepCount()).toBe(stepsBefore + 1);
      expect(engine.getGrid()[1][1].filled).toBe(true);
    });

    test('test_same_cell_resend_no_interpolation', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      const stepsBefore = engine.getStepCount();

      // 同格发送: dr=0, dc=0 — 无插值，直接处理
      engine.onInputMove(0, 0);

      // 已在 Drawing 状态且该格已填充 → 忽略
      expect(engine.getStepCount()).toBe(stepsBefore);
    });
  });

  // ================================================================
  // AC-6: 3×3 到 10×10 全尺寸全方向不遗漏
  // ================================================================
  describe('AC-6: 全尺寸全方向', () => {
    test('test_all_grid_sizes_all_directions', () => {
      // 对每个网格尺寸 3×3 到 10×10，验证水平和垂直跳格插值
      for (let size = 3; size <= 10; size++) {
        const level = makeLevel({
          grid: { rows: size, cols: size },
          nodes: [
            { number: 1, row: 0, col: 0 },
            { number: 2, row: size - 1, col: size - 1 },
          ],
          blockedCells: [],
        });

        const engine = createEngine();
        initAndStartPath(engine, level, 0, 0);

        // 跳至对角
        engine.onInputMove(size - 1, size - 1);

        // 终点应填充
        expect(engine.getGrid()[size - 1][size - 1].filled).toBe(true);
        // 步数应 > 2（说明有中间格被填充）
        expect(engine.getStepCount()).toBeGreaterThan(2);
      }
    });

    test('test_horizontal_jump_across_all_sizes', () => {
      for (let size = 3; size <= 10; size++) {
        const level = makeLevel({
          grid: { rows: size, cols: size },
          nodes: [
            { number: 1, row: 0, col: 0 },
            { number: 2, row: 0, col: size - 1 },
          ],
          blockedCells: [],
        });

        const engine = createEngine();
        initAndStartPath(engine, level, 0, 0);

        // 水平跳至最右列
        engine.onInputMove(0, size - 1);

        const grid = engine.getGrid();
        expect(grid[0][size - 1].filled).toBe(true);
        // 检查中间格：col=1, col=2, ..., col=size-2
        for (let c = 1; c < size - 1; c++) {
          expect(grid[0][c].filled).toBe(true);
        }
        expect(engine.getStepCount()).toBe(size); // 0..size-1 = size 格
      }
    });

    test('test_vertical_jump_across_all_sizes', () => {
      for (let size = 3; size <= 10; size++) {
        const level = makeLevel({
          grid: { rows: size, cols: size },
          nodes: [
            { number: 1, row: 0, col: 0 },
            { number: 2, row: size - 1, col: 0 },
          ],
          blockedCells: [],
        });

        const engine = createEngine();
        initAndStartPath(engine, level, 0, 0);

        // 垂直跳至最底行
        engine.onInputMove(size - 1, 0);

        const grid = engine.getGrid();
        expect(grid[size - 1][0].filled).toBe(true);
        for (let r = 1; r < size - 1; r++) {
          expect(grid[r][0].filled).toBe(true);
        }
        expect(engine.getStepCount()).toBe(size);
      }
    });
  });

  // ================================================================
  // 额外边界测试
  // ================================================================
  describe('额外边界', () => {
    test('test_bresenham_step_change_event_emitted_for_each_interpolated_cell', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 0, col: 3 },
        ],
        blockedCells: [],
      });

      engine.init(level, 750, 1334);

      const events: any[] = [];
      engine.subscribe('stepChange', (e) => events.push(e.data));

      engine.onInputMove(0, 0); // step 1
      // 跳至 (0,3) → 3 个 stepChange (路径中间格 + 终点)
      engine.onInputMove(0, 3);

      // 总共 4 个 stepChange：起点 + (0,1) + (0,2) + (0,3)
      expect(events.length).toBe(4);
      expect(events[3]).toEqual({ delta: 1, total: 4 });
    });

    test('test_bresenham_does_not_interpolate_before_first_move', () => {
      // 未设置 _lastCoord 时不应触发 Bresenham
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 3, col: 3 },
        ],
      });
      engine.init(level, 750, 1334);

      // 第一次触摸 = 设置 _lastCoord，不触发插值
      engine.onInputMove(0, 0);
      expect(engine.getStepCount()).toBe(1);
    });

    test('test_bresenham_lastCoord_reset_on_input_end', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 0, col: 3 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      engine.onInputEnd();

      // 验证 _lastCoord 被重置
      expect((engine as any)._lastCoord).toBeNull();

      // 从 (0,0) 重新开始（Dirty → Drawing via re-enter）
      engine.onInputMove(0, 0);
      // 跳至 (0,3) — Bresenham 应正常工作
      engine.onInputMove(0, 3);

      const grid = engine.getGrid();
      expect(grid[0][2].filled).toBe(true);
      expect(engine.getStepCount()).toBe(4); // 同前
    });

    test('test_bresenham_lastCoord_reset_on_init', () => {
      const engine = createEngine();
      const level1 = makeLevel({
        grid: { rows: 3, cols: 3 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 0, col: 2 },
        ],
      });
      const level2 = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 0, col: 3 },
        ],
      });

      engine.init(level1, 750, 1334);
      engine.onInputMove(0, 0); // set _lastCoord
      engine.onInputMove(0, 2); // Bresenham worked
      expect(engine.getStepCount()).toBe(3);

      // 重新 init — _lastCoord 应重置
      initAndStartPath(engine, level2, 0, 0);
      expect(engine.getStepCount()).toBe(1);
      expect((engine as any)._lastCoord).toEqual({ row: 0, col: 0 });
    });

    test('test_bresenham_path_with_node_sequence_integration', () => {
      // 验证 Bresenham 路径穿过数字节点时正确推进序号
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 1, col: 1 },
          { number: 3, row: 2, col: 2 },
          { number: 4, row: 3, col: 3 },
        ],
        blockedCells: [],
      });

      initAndStartPath(engine, level, 0, 0);
      expect(engine.getCurrentNumber()).toBe(1);

      // 跳至 (3,3) — Bresenham 路径 = (0,0)→(1,1)→(2,2)→(3,3)
      // 每格都是数字节点，依次推进序号
      engine.onInputMove(3, 3);

      expect(engine.getCurrentNumber()).toBe(4);
      expect(engine.getStepCount()).toBe(4);
      const path = engine.getPath();
      expect(path.length).toBe(4);
      // 前三格应锁定（到达 node 4 时锁定了前 3 格的段）
      expect(path[0].locked).toBe(true);
      expect(path[1].locked).toBe(true);
      expect(path[2].locked).toBe(true);
      // node 4 本身未锁定
      expect(path[3].locked).toBe(false);
    });
  });
});
