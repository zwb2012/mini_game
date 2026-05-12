/**
 * 网格初始化与状态机 — 集成测试
 *
 * Story 001: Grid Init & State Machine
 * 覆盖 AC-1 到 AC-7，使用 cc.mock.ts 模拟 Cocos 运行时。
 *
 * @module tests/integration/grid-connection-engine/grid_init_test
 */

import { GridConnectionEngine } from '../../src/core/grid-connection-engine/GridConnectionEngine';
import { EngineState } from '../../src/core/grid-connection-engine/types';
import type { Level } from '../../src/core/level-data-schema/types';
import { Node, Graphics, Label, Font, Color, view } from 'cc';

// ===== 测试数据工厂 =====

function makeLevel(overrides: Partial<Level> = {}): Level {
  return {
    id: 1,
    name: '测试关',
    chapter: 1,
    difficulty: 1,
    grid: { rows: 4, cols: 4 },
    nodes: [
      { number: 1, row: 0, col: 0 },
      { number: 2, row: 3, col: 3 },
      { number: 3, row: 1, col: 2 },
    ],
    blockedCells: [],
    optimalSteps: 8,
    unlockCondition: null,
    ...overrides,
  };
}

/**
 * 创建一个最小化可工作的引擎实例用于测试。
 * 手动构造 Node + Graphics，绕过 Cocos 装饰器系统。
 */
function createEngine(): GridConnectionEngine {
  const engine = new GridConnectionEngine();

  // 模拟 Cocos Component 的生命周期：设置 node + 注入 Graphics
  const rootNode = new Node('EngineNode');
  const graphics = rootNode.addComponent(Graphics) as Graphics;
  // addComponent 会把 graphics.node 设为 rootNode
  // 但 engine.node 需要是 rootNode
  (engine as any).node = rootNode;
  (engine as any)._graphics = graphics;

  // 创建 labelContainer 节点
  const labelContainer = new Node('LabelContainer');
  rootNode.addChild(labelContainer);
  (engine as any).labelContainer = labelContainer;

  engine.onLoad();
  return engine;
}

describe('Story 001: 网格初始化与状态机', () => {
  // ============================================================
  // AC-1: 网格初始化 — 4×4 网格 + 3 个数字节点在正确位置
  // ============================================================
  describe('AC-1: 网格初始化', () => {
    test('test_grid_init_4x4_creates_correct_dimensions', () => {
      const engine = createEngine();
      const level = makeLevel({ grid: { rows: 4, cols: 4 } });

      const ok = engine.init(level, 750, 1334);
      expect(ok).toBe(true);

      const grid = engine.getGrid();
      expect(grid.length).toBe(4);
      for (const row of grid) {
        expect(row.length).toBe(4);
      }
    });

    test('test_grid_init_places_nodes_at_correct_positions', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 3, col: 3 },
          { number: 3, row: 1, col: 2 },
        ],
      });

      engine.init(level, 750, 1334);
      const grid = engine.getGrid();

      // 节点 1 在 (0,0)
      expect(grid[0][0].isNode).toBe(true);
      expect(grid[0][0].nodeNumber).toBe(1);

      // 节点 2 在 (3,3)
      expect(grid[3][3].isNode).toBe(true);
      expect(grid[3][3].nodeNumber).toBe(2);

      // 节点 3 在 (1,2)
      expect(grid[1][2].isNode).toBe(true);
      expect(grid[1][2].nodeNumber).toBe(3);

      // 非节点格
      expect(grid[0][1].isNode).toBe(false);
      expect(grid[0][1].nodeNumber).toBeNull();
    });

    test('test_grid_init_all_cells_start_unfilled', () => {
      const engine = createEngine();
      const level = makeLevel();

      engine.init(level, 750, 1334);
      const grid = engine.getGrid();

      for (const row of grid) {
        for (const cell of row) {
          if (!cell.isBlocked) {
            expect(cell.filled).toBe(false);
            expect(cell.ownerNumber).toBeNull();
            expect(cell.filledAt).toBeNull();
          }
        }
      }
    });
  });

  // ============================================================
  // AC-2: 障碍格标记
  // ============================================================
  describe('AC-2: 障碍格', () => {
    test('test_blocked_cells_marked_correctly', () => {
      const engine = createEngine();
      const level = makeLevel({
        blockedCells: [{ row: 1, col: 1 }],
      });

      engine.init(level, 750, 1334);
      const grid = engine.getGrid();

      expect(grid[1][1].isBlocked).toBe(true);
      // 其余格应为非障碍
      expect(grid[0][0].isBlocked).toBe(false);
      expect(grid[3][3].isBlocked).toBe(false);
    });

    test('test_blocked_cells_ignored_by_touch', () => {
      const engine = createEngine();
      const level = makeLevel({
        blockedCells: [{ row: 1, col: 1 }],
      });

      engine.init(level, 750, 1334);

      // 触摸障碍格——应被忽略
      engine.onInputMove(1, 1);
      const grid = engine.getGrid();
      expect(grid[1][1].filled).toBe(false);
      expect(engine.getEngineState()).toBe(EngineState.Idle);
    });

    test('test_zero_blocked_cells_all_grid_open', () => {
      const engine = createEngine();
      const level = makeLevel({ blockedCells: [] });

      engine.init(level, 750, 1334);
      const grid = engine.getGrid();

      for (const row of grid) {
        for (const cell of row) {
          expect(cell.isBlocked).toBe(false);
        }
      }
    });
  });

  // ============================================================
  // AC-3: 初始状态为 Idle
  // ============================================================
  describe('AC-3: 初始状态 Idle', () => {
    test('test_initial_state_is_idle', () => {
      const engine = createEngine();
      const level = makeLevel();

      engine.init(level, 750, 1334);
      expect(engine.getEngineState()).toBe(EngineState.Idle);
    });

    test('test_idle_state_no_touch_input_does_nothing', () => {
      const engine = createEngine();
      const level = makeLevel();

      engine.init(level, 750, 1334);

      // 在 Idle 状态触摸一个非节点格
      engine.onInputMove(2, 2);
      expect(engine.getEngineState()).toBe(EngineState.Idle);
      expect(engine.getStepCount()).toBe(0);
    });
  });

  // ============================================================
  // AC-4: Idle → Drawing 转换
  // ============================================================
  describe('AC-4: Idle → Drawing', () => {
    test('test_idle_to_drawing_on_valid_node_touch', () => {
      const engine = createEngine();
      const level = makeLevel({
        nodes: [{ number: 1, row: 0, col: 0 }, { number: 2, row: 3, col: 3 }],
      });

      engine.init(level, 750, 1334);

      // 触摸 nodeNumber=1 的节点格
      engine.onInputMove(0, 0);

      expect(engine.getEngineState()).toBe(EngineState.Drawing);
      expect(engine.getCurrentNumber()).toBe(1);
      expect(engine.getStepCount()).toBe(1);
    });

    test('test_idle_touch_non_node_ignored', () => {
      const engine = createEngine();
      const level = makeLevel({
        nodes: [{ number: 1, row: 0, col: 0 }, { number: 2, row: 3, col: 3 }],
      });

      engine.init(level, 750, 1334);

      // 触摸非节点格 (1,1)——不是节点
      engine.onInputMove(1, 1);

      expect(engine.getEngineState()).toBe(EngineState.Idle);
      expect(engine.getCurrentNumber()).toBe(0);
      expect(engine.getStepCount()).toBe(0);
    });

    test('test_idle_touch_fills_first_cell', () => {
      const engine = createEngine();
      const level = makeLevel({
        nodes: [{ number: 1, row: 0, col: 0 }, { number: 2, row: 3, col: 3 }],
      });

      engine.init(level, 750, 1334);
      engine.onInputMove(0, 0);

      const grid = engine.getGrid();
      expect(grid[0][0].filled).toBe(true);
      expect(grid[0][0].ownerNumber).toBe(1);
    });
  });

  // ============================================================
  // AC-5: Drawing → Dirty 转换
  // ============================================================
  describe('AC-5: Drawing → Dirty', () => {
    test('test_drawing_to_dirty_on_input_end', () => {
      const engine = createEngine();
      const level = makeLevel({
        nodes: [{ number: 1, row: 0, col: 0 }, { number: 2, row: 3, col: 3 }],
      });

      engine.init(level, 750, 1334);

      // 进入 Drawing
      engine.onInputMove(0, 0);
      expect(engine.getEngineState()).toBe(EngineState.Drawing);

      // INPUT_END
      engine.onInputEnd();
      expect(engine.getEngineState()).toBe(EngineState.Dirty);
    });

    test('test_input_end_in_idle_does_nothing', () => {
      const engine = createEngine();
      const level = makeLevel();

      engine.init(level, 750, 1334);

      // 在 Idle 状态直接 INPUT_END
      engine.onInputEnd();
      expect(engine.getEngineState()).toBe(EngineState.Idle);
    });

    test('test_input_end_before_init_does_not_crash', () => {
      const engine = createEngine();

      // 未初始化时调用 onInputEnd——不应崩溃
      expect(() => engine.onInputEnd()).not.toThrow();
    });
  });

  // ============================================================
  // AC-6: 关卡数据校验异常
  // ============================================================
  describe('AC-6: 数据校验异常', () => {
    test('test_missing_rows_returns_false', () => {
      const engine = createEngine();
      const invalidLevel = {
        id: 1,
        grid: { cols: 4 }, // 缺少 rows
        nodes: [{ number: 1, row: 0, col: 0 }, { number: 2, row: 3, col: 3 }],
      } as any;

      const ok = engine.init(invalidLevel, 750, 1334);
      expect(ok).toBe(false);
    });

    test('test_missing_nodes_returns_false', () => {
      const engine = createEngine();
      const invalidLevel = {
        id: 1,
        grid: { rows: 4, cols: 4 },
        nodes: [],
      } as any;

      const ok = engine.init(invalidLevel, 750, 1334);
      expect(ok).toBe(false);
    });

    test('test_level_null_returns_false', () => {
      const engine = createEngine();
      const ok = engine.init(null as any, 750, 1334);
      expect(ok).toBe(false);
    });

    test('test_rows_out_of_range_returns_false', () => {
      const engine = createEngine();

      // 小于 3
      const tooSmall = makeLevel({ grid: { rows: 2, cols: 4 } });
      expect(engine.init(tooSmall, 750, 1334)).toBe(false);

      // 大于 10
      const tooLarge = makeLevel({ grid: { rows: 11, cols: 4 } });
      expect(engine.init(tooLarge, 750, 1334)).toBe(false);
    });

    test('test_invalid_level_emits_engine_error_event', () => {
      const engine = createEngine();
      const errors: any[] = [];

      engine.subscribe('engineError', (event) => {
        errors.push(event.data);
      });

      engine.init(null as any, 750, 1334);
      expect(errors.length).toBe(1);
      expect(errors[0].errors).toBeDefined();
    });
  });

  // ============================================================
  // AC-7: cellSize 自动计算
  // ============================================================
  describe('AC-7: cellSize 自动计算', () => {
    test('test_cellsize_3x3_grid_within_range', () => {
      const result = GridConnectionEngine.calcCellSize(750, 1334, 3, 3);
      // maxByWidth = floor((750-32)/3) = 239
      // maxByHeight = floor((1334-32)/3) = 434
      // min(239, 434, 120) = 120
      expect(result).toBe(120);
      expect(result).toBeGreaterThanOrEqual(44);
      expect(result).toBeLessThanOrEqual(120);
    });

    test('test_cellsize_10x10_grid_within_range', () => {
      const result = GridConnectionEngine.calcCellSize(750, 1334, 10, 10);
      // maxByWidth = floor(718/10) = 71
      // maxByHeight = floor(1302/10) = 130
      // min(71, 130, 120) = 71
      expect(result).toBe(71);
      expect(result).toBeGreaterThanOrEqual(44);
      expect(result).toBeLessThanOrEqual(120);
    });

    test('test_cellsize_tiny_canvas_clamps_to_min_44', () => {
      // 极小画布 320×320 + 10×10 网格
      // maxByWidth = floor((320-32)/10) = floor(288/10) = 28
      // maxByHeight = floor((320-32)/10) = 28
      // min(28, 28, 120) = 28 → clamp to 44
      const result = GridConnectionEngine.calcCellSize(320, 320, 10, 10);
      expect(result).toBe(44); // 保底 44px
    });

    test('test_cellsize_5x5_grid_within_range', () => {
      const result = GridConnectionEngine.calcCellSize(750, 1334, 5, 5);
      // maxByWidth = floor(718/5) = 143
      // min(143, 260, 120) = 120
      expect(result).toBe(120);
      expect(result).toBeGreaterThanOrEqual(44);
    });

    test('test_cellsize_all_grid_sizes_in_range', () => {
      // 全尺寸验证 3×3 → 10×10
      for (let size = 3; size <= 10; size++) {
        const result = GridConnectionEngine.calcCellSize(750, 1334, size, size);
        expect(result).toBeGreaterThanOrEqual(44);
        expect(result).toBeLessThanOrEqual(120);
      }
    });
  });

  // ============================================================
  // 公共 API 测试
  // ============================================================
  describe('公共 API', () => {
    test('test_get_grid_layout_returns_correct_layout', () => {
      const engine = createEngine();
      const level = makeLevel({ grid: { rows: 4, cols: 4 } });

      engine.init(level, 750, 1334);
      const layout = engine.getGridLayout();

      expect(layout.rows).toBe(4);
      expect(layout.cols).toBe(4);
      expect(layout.cellSize).toBeGreaterThanOrEqual(44);
      expect(layout.originX).toBeGreaterThanOrEqual(0);
      expect(layout.originY).toBeGreaterThanOrEqual(0);
    });

    test('test_subscribe_returns_unsubscribe_function', () => {
      const engine = createEngine();
      const level = makeLevel({ nodes: [{ number: 1, row: 0, col: 0 }, { number: 2, row: 3, col: 3 }] });
      engine.init(level, 750, 1334);

      const events: any[] = [];
      const unsub = engine.subscribe('stepChange', (e) => events.push(e.data));

      // 触发 stepChange
      engine.onInputMove(0, 0);
      expect(events.length).toBe(1);
      expect(events[0].delta).toBe(1);

      // 取消订阅
      unsub();

      // 不应该再收到事件
      engine.onInputEnd();
      expect(events.length).toBe(1);
    });

    test('test_can_undo_false_when_idle', () => {
      const engine = createEngine();
      const level = makeLevel();
      engine.init(level, 750, 1334);
      expect(engine.canUndo()).toBe(false);
    });

    test('test_undo_on_empty_path_does_not_crash', () => {
      const engine = createEngine();
      const level = makeLevel();
      engine.init(level, 750, 1334);
      expect(() => engine.undo()).not.toThrow();
    });

    test('test_subscriber_error_does_not_block_other_subscribers', () => {
      const engine = createEngine();
      const level = makeLevel({ nodes: [{ number: 1, row: 0, col: 0 }, { number: 2, row: 3, col: 3 }] });
      engine.init(level, 750, 1334);

      const called: string[] = [];

      // 第一个订阅者抛异常
      engine.subscribe('stepChange', () => {
        throw new Error('boom');
      });

      // 第二个订阅者正常
      engine.subscribe('stepChange', () => {
        called.push('second');
      });

      // 不应抛异常，第二个订阅者应被调用
      expect(() => engine.onInputMove(0, 0)).not.toThrow();
      expect(called).toContain('second');
    });
  });

  // ============================================================
  // 越界坐标处理
  // ============================================================
  describe('边界处理', () => {
    test('test_out_of_bounds_input_ignored', () => {
      const engine = createEngine();
      const level = makeLevel({ grid: { rows: 4, cols: 4 } });

      engine.init(level, 750, 1334);

      // row 越界
      engine.onInputMove(-1, 0);
      expect(engine.getEngineState()).toBe(EngineState.Idle);

      engine.onInputMove(4, 0); // rows=4, 有效索引 0-3
      expect(engine.getEngineState()).toBe(EngineState.Idle);

      // col 越界
      engine.onInputMove(0, 4);
      expect(engine.getEngineState()).toBe(EngineState.Idle);
    });
  });
});
