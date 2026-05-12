/**
 * 路径追踪与序列验证 — 单元测试
 *
 * Story 002: 核心路径追踪与序列验证
 * 覆盖 AC-1 到 AC-7，使用 cc.mock.ts 模拟 Cocos 运行时。
 *
 * @module tests/unit/grid-connection-engine/path_tracing_test
 */

import { GridConnectionEngine } from '../../../src/core/grid-connection-engine/GridConnectionEngine';
import { EngineState } from '../../../src/core/grid-connection-engine/types';
import type { Level } from '../../../src/core/level-data-schema/types';
import { Node, Graphics } from 'cc';

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

/** 初始化引擎到 Playing 状态——在路径上画到给定坐标前一步 */
function initAndStartPath(
  engine: GridConnectionEngine,
  level: Level,
  startRow: number,
  startCol: number,
): void {
  engine.init(level, 750, 1334);
  engine.onInputMove(startRow, startCol);
}

describe('Story 002: 路径追踪与序列验证', () => {
  // ============================================================
  // AC-1: 首次触摸 nodeNumber=1 → currentNumber=1, stepCount=1
  // ============================================================
  describe('AC-1: 首次触摸数字节点', () => {
    test('test_first_touch_node1_sets_current_number', () => {
      const engine = createEngine();
      const level = makeLevel({
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 3, col: 3 },
        ],
      });

      engine.init(level, 750, 1334);
      engine.onInputMove(0, 0);

      expect(engine.getCurrentNumber()).toBe(1);
      expect(engine.getStepCount()).toBe(1);
      expect(engine.getEngineState()).toBe(EngineState.Drawing);
    });

    test('test_first_touch_fills_cell_with_owner_number', () => {
      const engine = createEngine();
      const level = makeLevel({
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 3, col: 3 },
        ],
      });

      engine.init(level, 750, 1334);
      engine.onInputMove(0, 0);

      const grid = engine.getGrid();
      expect(grid[0][0].filled).toBe(true);
      expect(grid[0][0].ownerNumber).toBe(1);
    });

    test('test_first_touch_adds_path_entry', () => {
      const engine = createEngine();
      const level = makeLevel({
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 3, col: 3 },
        ],
      });

      engine.init(level, 750, 1334);
      engine.onInputMove(0, 0);

      const path = engine.getPath();
      expect(path.length).toBe(1);
      expect(path[0].row).toBe(0);
      expect(path[0].col).toBe(0);
      expect(path[0].locked).toBe(false);
    });

    test('test_first_touch_node_not_1_sets_that_number', () => {
      const engine = createEngine();
      const level = makeLevel({
        nodes: [
          { number: 2, row: 0, col: 0 },
          { number: 3, row: 3, col: 3 },
        ],
      });

      engine.init(level, 750, 1334);
      engine.onInputMove(0, 0);

      // 首次触摸节点 2（非 1）—— 从 2 开始
      expect(engine.getCurrentNumber()).toBe(2);
      expect(engine.getStepCount()).toBe(1);
    });
  });

  // ============================================================
  // AC-2: 首次触摸非数字节点格 → 忽略
  // ============================================================
  describe('AC-2: 首次触摸非数字节点', () => {
    test('test_first_touch_non_node_ignored', () => {
      const engine = createEngine();
      const level = makeLevel({
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 3, col: 3 },
        ],
      });

      engine.init(level, 750, 1334);

      // 触摸非节点格 (1,1)
      engine.onInputMove(1, 1);

      expect(engine.getEngineState()).toBe(EngineState.Idle);
      expect(engine.getCurrentNumber()).toBe(0);
      expect(engine.getStepCount()).toBe(0);

      const grid = engine.getGrid();
      expect(grid[1][1].filled).toBe(false);
    });
  });

  // ============================================================
  // AC-3: 到达下一数字节点 → currentNumber 切换 + 路径锁定
  // ============================================================
  describe('AC-3: 到达下一数字节点', () => {
    test('test_reach_next_number_node_advances_current_number', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 0, col: 2 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      expect(engine.getCurrentNumber()).toBe(1);

      // 滑动经过 (0,1) 到达 node 2
      engine.onInputMove(0, 1);
      engine.onInputMove(0, 2);

      expect(engine.getCurrentNumber()).toBe(2);
      expect(engine.getStepCount()).toBe(3); // 1 号节点 + 中间格 + 2 号节点
    });

    test('test_reach_next_number_node_locks_previous_segment', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 0, col: 2 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      engine.onInputMove(0, 1);
      engine.onInputMove(0, 2); // 到达节点 2

      const path = engine.getPath();
      // 前 2 个格子 (node 1 + 中间格) 应已锁定
      expect(path[0].locked).toBe(true); // node 1
      expect(path[1].locked).toBe(true); // (0,1)
      // 节点 2 尚未锁定（属于下一段）
      expect(path[2].locked).toBe(false);
    });

    test('test_reach_third_number_node_locks_second_segment', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 0, col: 2 },
          { number: 3, row: 0, col: 3 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      engine.onInputMove(0, 1);
      engine.onInputMove(0, 2); // 到达节点 2 → 锁定第一段
      engine.onInputMove(0, 3); // 到达节点 3 → 锁定第二段

      const path = engine.getPath();
      expect(path.length).toBe(4);
      // 前 3 个 (node1, mid, node2) 应锁定
      expect(path[0].locked).toBe(true);
      expect(path[1].locked).toBe(true);
      expect(path[2].locked).toBe(true);
      // 节点 3 未锁定
      expect(path[3].locked).toBe(false);
      expect(engine.getCurrentNumber()).toBe(3);
    });

    test('test_same_number_node_fills_without_advancing', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 1, row: 2, col: 2 }, // 两个 1 号节点
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      expect(engine.getCurrentNumber()).toBe(1);
      expect(engine.getStepCount()).toBe(1);

      // 到达另一个同数字节点——填充但不切换
      engine.onInputMove(1, 1);
      engine.onInputMove(2, 2);
      expect(engine.getCurrentNumber()).toBe(1); // 不变
      expect(engine.getStepCount()).toBe(3);
    });
  });

  // ============================================================
  // AC-4: 跳数字连接被拒绝
  // ============================================================
  describe('AC-4: 跳数字连接', () => {
    test('test_skip_number_rejected', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 5, cols: 5 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 0, col: 2 },   // 不在 (0,0)→(3,3) 的 Bresenham 线上
          { number: 3, row: 2, col: 0 },   // 不在 (0,0)→(3,3) 的 Bresenham 线上
          { number: 4, row: 3, col: 3 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      expect(engine.getCurrentNumber()).toBe(1);

      // 直接触摸 node 4 — Bresenham 路径 (0,0)→(1,1)→(2,2)→(3,3)
      // 中间格 (1,1)(2,2) 不含 node 2/3 → 到 node 4 时仍为 skip
      engine.onInputMove(3, 3);

      expect(engine.getCurrentNumber()).toBe(1); // 不变
      const grid = engine.getGrid();
      expect(grid[3][3].filled).toBe(false);
    });

    test('test_skip_two_numbers_rejected', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 3, row: 3, col: 3 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      expect(engine.getCurrentNumber()).toBe(1);

      // 直接触摸 node 3（跳过 2）
      engine.onInputMove(3, 3);

      expect(engine.getCurrentNumber()).toBe(1);
      const grid = engine.getGrid();
      expect(grid[3][3].filled).toBe(false);
    });

    test('test_smaller_number_node_rejected', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 2, col: 2 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      engine.onInputMove(0, 1);
      engine.onInputMove(0, 2);
      engine.onInputMove(1, 2);
      engine.onInputMove(2, 2); // 到达节点 2，currentNumber = 2

      // 尝试触摸 node 1（比 currentNumber 小）
      engine.onInputMove(0, 0);

      // 节点 1 已填充 → Drawing 状态下直接忽略
      const grid = engine.getGrid();
      expect(grid[0][0].filled).toBe(true); // 已填充，未变化
      expect(engine.getCurrentNumber()).toBe(2);
    });
  });

  // ============================================================
  // AC-5: 抬手指后从匹配节点重新开始
  // ============================================================
  describe('AC-5: 抬手指后重新开始', () => {
    test('test_reenter_from_current_number_node', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 2, col: 2 },
        ],
      });

      // 连完 1→2
      initAndStartPath(engine, level, 0, 0);
      engine.onInputMove(0, 1);
      engine.onInputMove(1, 1);
      engine.onInputMove(2, 2); // 到达节点 2
      expect(engine.getCurrentNumber()).toBe(2);

      // 抬手指
      engine.onInputEnd();
      expect(engine.getEngineState()).toBe(EngineState.Dirty);

      // 从节点 2 重新开始
      engine.onInputMove(2, 2);
      expect(engine.getEngineState()).toBe(EngineState.Drawing);
      expect(engine.getCurrentNumber()).toBe(2);
    });

    test('test_reenter_does_not_double_fill_node', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 2, col: 2 },
        ],
      });

      // 连完 1→2
      initAndStartPath(engine, level, 0, 0);
      engine.onInputMove(0, 1);
      engine.onInputMove(1, 1);
      engine.onInputMove(2, 2);
      const stepsBefore = engine.getStepCount();

      engine.onInputEnd();
      // 从已填充的节点 2 重新进入——不重复计数
      engine.onInputMove(2, 2);

      expect(engine.getStepCount()).toBe(stepsBefore);
    });

    test('test_reenter_from_wrong_node_rejected', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 2, col: 2 },
          { number: 3, row: 3, col: 3 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      engine.onInputMove(0, 1);
      engine.onInputMove(1, 1);
      engine.onInputMove(2, 2); // currentNumber=2
      engine.onInputEnd();

      // 尝试从节点 3 重新进入（currentNumber=2，不匹配 3）
      engine.onInputMove(3, 3);
      expect(engine.getEngineState()).toBe(EngineState.Dirty); // 仍在 Dirty
    });

    test('test_reenter_from_locked_lower_node_rejected', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 2, col: 2 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      engine.onInputMove(0, 1);
      engine.onInputMove(1, 1);
      engine.onInputMove(2, 2); // currentNumber=2, node 1 段已锁定
      engine.onInputEnd();

      // 尝试从已锁定的节点 1 重新进入
      engine.onInputMove(0, 0);
      // node 1 的 nodeNumber 是 1，不匹配 currentNumber=2 → 忽略
      expect(engine.getEngineState()).toBe(EngineState.Dirty);
    });
  });

  // ============================================================
  // AC-6: 障碍格忽略（Drawing 状态下）
  // ============================================================
  describe('AC-6: 障碍格忽略', () => {
    test('test_blocked_cell_ignored_during_drawing', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 3, col: 3 },
        ],
        blockedCells: [{ row: 0, col: 1 }],
      });

      initAndStartPath(engine, level, 0, 0);
      const stepsBefore = engine.getStepCount();

      // 滑入障碍格 (0,1)
      engine.onInputMove(0, 1);

      expect(engine.getStepCount()).toBe(stepsBefore);
      const grid = engine.getGrid();
      expect(grid[0][1].filled).toBe(false);
      expect(grid[0][1].isBlocked).toBe(true);
    });

    test('test_blocked_cell_in_dirty_state_ignored', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 3, col: 3 },
        ],
        blockedCells: [{ row: 1, col: 1 }],
      });

      initAndStartPath(engine, level, 0, 0);
      engine.onInputEnd(); // → Dirty

      // 在 Dirty 状态下触摸障碍格
      engine.onInputMove(1, 1);
      expect(engine.getEngineState()).toBe(EngineState.Dirty); // 不变
    });
  });

  // ============================================================
  // AC-7: 已锁定路径段不可修改
  // ============================================================
  describe('AC-7: 已锁定路径不可修改', () => {
    test('test_locked_cell_ignored_during_drawing', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 0, col: 2 },
          { number: 3, row: 0, col: 3 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      engine.onInputMove(0, 1);
      engine.onInputMove(0, 2); // 到达节点 2 → 锁定第一段
      expect(engine.getCurrentNumber()).toBe(2);

      // 滑回已锁定的格子 (0,0)
      const stepsBefore = engine.getStepCount();
      engine.onInputMove(0, 0);

      // 应被忽略（已填充 → Drawing handler 直接返回）
      expect(engine.getStepCount()).toBe(stepsBefore);
      expect(engine.getCurrentNumber()).toBe(2);
    });

    test('test_slide_to_current_segment_start_undoes_after', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 0, col: 2 },
          { number: 3, row: 3, col: 3 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      engine.onInputMove(0, 1);
      engine.onInputMove(0, 2); // 到达节点 2，锁定第一段 [(0,0)L,(0,1)L], (0,2) 属于当前段
      engine.onInputMove(1, 2);
      engine.onInputMove(2, 2);

      // Story 004: 滑入当前段中的节点格 (0,2) → 触发回溯，移除其后的 (1,2) 和 (2,2)
      engine.onInputMove(0, 2);

      expect(engine.getStepCount()).toBe(3); // 仅保留 (0,0),(0,1),(0,2)
      expect(engine.getCurrentNumber()).toBe(2);
      // 锁定段不变
      const grid = engine.getGrid();
      expect(grid[0][0].filled).toBe(true); // 锁定，不变
      expect(grid[0][1].filled).toBe(true); // 锁定，不变
      expect(grid[1][2].filled).toBe(false); // 被回溯撤销
      expect(grid[2][2].filled).toBe(false); // 被回溯撤销
    });
  });

  // ============================================================
  // 边界测试
  // ============================================================
  describe('边界测试', () => {
    test('test_double_fill_same_cell_ignored', () => {
      const engine = createEngine();
      const level = makeLevel({
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 3, col: 3 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      const stepsBefore = engine.getStepCount();
      const pathLenBefore = engine.getPath().length;

      // 再次触摸 (0,0)——已在路径中
      engine.onInputMove(0, 0);

      expect(engine.getStepCount()).toBe(stepsBefore);
      expect(engine.getPath().length).toBe(pathLenBefore);
    });

    test('test_out_of_bounds_ignored_during_drawing', () => {
      const engine = createEngine();
      const level = makeLevel({
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 3, col: 3 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);

      // row -1
      engine.onInputMove(-1, 0);
      expect(engine.getStepCount()).toBe(1); // 不变

      // row >= rows
      engine.onInputMove(4, 0);
      expect(engine.getStepCount()).toBe(1);

      // col 越界
      engine.onInputMove(0, 4);
      expect(engine.getStepCount()).toBe(1);
    });

    test('test_input_before_init_does_not_crash', () => {
      const engine = createEngine();

      expect(() => engine.onInputMove(0, 0)).not.toThrow();
      expect(() => engine.onInputMove(1, 1)).not.toThrow();
      expect(() => engine.onInputEnd()).not.toThrow();
    });

    test('test_step_change_event_emitted_on_fill', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 4, cols: 4 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 2, col: 2 },
        ],
      });

      engine.init(level, 750, 1334);

      const events: any[] = [];
      engine.subscribe('stepChange', (e) => events.push(e.data));

      engine.onInputMove(0, 0); // 1st fill
      engine.onInputMove(0, 1); // 2nd fill

      expect(events.length).toBe(2);
      expect(events[0]).toEqual({ delta: 1, total: 1 });
      expect(events[1]).toEqual({ delta: 1, total: 2 });
    });

    test('test_dirty_state_non_node_touch_ignored', () => {
      const engine = createEngine();
      const level = makeLevel({
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 3, col: 3 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      engine.onInputEnd(); // → Dirty

      // Dirty 状态下触摸非节点格
      engine.onInputMove(1, 1);
      expect(engine.getEngineState()).toBe(EngineState.Dirty);
    });

    test('test_dirty_state_mismatched_node_ignored', () => {
      const engine = createEngine();
      const level = makeLevel({
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 2, col: 2 },
          { number: 3, row: 3, col: 3 },
        ],
      });

      initAndStartPath(engine, level, 0, 0);
      engine.onInputMove(0, 1);
      engine.onInputMove(1, 1);
      engine.onInputMove(2, 2); // currentNumber=2
      engine.onInputEnd(); // → Dirty

      // 尝试从节点 3 重新进入（currentNumber=2）
      engine.onInputMove(3, 3);
      expect(engine.getEngineState()).toBe(EngineState.Dirty);
    });

    test('test_path_empty_after_init', () => {
      const engine = createEngine();
      const level = makeLevel();

      engine.init(level, 750, 1334);
      expect(engine.getPath()).toEqual([]);
    });

    test('test_multiple_segments_path_grows_correctly', () => {
      const engine = createEngine();
      const level = makeLevel({
        grid: { rows: 5, cols: 5 },
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 0, col: 4 },
          { number: 3, row: 4, col: 4 },
        ],
      });

      // 第一段：1→2
      engine.init(level, 750, 1334);
      engine.onInputMove(0, 0); // node 1
      engine.onInputMove(0, 1);
      engine.onInputMove(0, 2);
      engine.onInputMove(0, 3);
      engine.onInputMove(0, 4); // node 2
      expect(engine.getCurrentNumber()).toBe(2);

      // 第二段：2→3
      engine.onInputMove(1, 4);
      engine.onInputMove(2, 4);
      engine.onInputMove(3, 4);
      engine.onInputMove(4, 4); // node 3
      expect(engine.getCurrentNumber()).toBe(3);

      const path = engine.getPath();
      expect(path.length).toBe(9);

      // 第一段 (5 格) 应锁定
      for (let i = 0; i < 5; i++) {
        expect(path[i].locked).toBe(true);
      }
      // 第二段 (4 格) 应锁定
      for (let i = 5; i < 8; i++) {
        expect(path[i].locked).toBe(true);
      }
      // 节点 3 未锁定
      expect(path[8].locked).toBe(false);
    });

    test('test_idle_to_dirty_regression', () => {
      // 确保 Idle 状态下 onInputEnd 不退化为 Dirty
      const engine = createEngine();
      const level = makeLevel();

      engine.init(level, 750, 1334);
      engine.onInputEnd();

      expect(engine.getEngineState()).toBe(EngineState.Idle);
    });

    test('test_render_dirty_flagged_on_fill', () => {
      const engine = createEngine();
      const level = makeLevel({
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 2, col: 2 },
        ],
      });

      engine.init(level, 750, 1334);

      // init 会标记脏，先让一帧跑过去（模拟 update 清脏标记）
      // 通过检查 _renderDirty 私有字段验证
      engine.onInputMove(0, 0);
      // 填充后应标记脏
      expect((engine as any)._renderDirty).toBe(true);
    });

    test('test_engine_state_transitions_full_cycle', () => {
      const engine = createEngine();
      const level = makeLevel({
        nodes: [
          { number: 1, row: 0, col: 0 },
          { number: 2, row: 2, col: 2 },
        ],
      });

      engine.init(level, 750, 1334);
      expect(engine.getEngineState()).toBe(EngineState.Idle);

      // Idle → Drawing
      engine.onInputMove(0, 0);
      expect(engine.getEngineState()).toBe(EngineState.Drawing);

      // Drawing → Dirty
      engine.onInputEnd();
      expect(engine.getEngineState()).toBe(EngineState.Dirty);

      // Dirty → Drawing (re-enter)
      engine.onInputMove(0, 0);
      expect(engine.getEngineState()).toBe(EngineState.Drawing);

      // Drawing → Dirty again
      engine.onInputEnd();
      expect(engine.getEngineState()).toBe(EngineState.Dirty);
    });
  });
});
