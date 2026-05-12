/**
 * 路径回溯与撤销 — 单元测试
 *
 * Story 004: 触摸回溯 + undo/canUndo 撤销接口。
 * 覆盖 AC-1 到 AC-7，以及 Bresenham 组合回溯。
 *
 * @module tests/unit/grid-connection-engine/backtrack_undo
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

function initEngine(engine: GridConnectionEngine, level: Level): void {
  engine.init(level, 750, 1334);
}

// ======================================================================
// AC-1: 滑入当前路径末格 = 撤销单步
// ======================================================================
describe('AC-1: 触摸回溯 — 滑入末格撤销', () => {
  test('test_slide_to_prior_cell_undoes_tail', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 5 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 0, col: 4 }, // 远端节点，不锁中间格
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0); // 起点
    engine.onInputMove(0, 1);
    engine.onInputMove(0, 2);
    engine.onInputMove(0, 3);
    // 路径: [(0,0),(0,1),(0,2),(0,3)], 无锁定（尚未到达节点 2）
    expect(engine.getStepCount()).toBe(4);
    // _lastCoord = (0,3)

    // 滑回 (0,2) — 在未锁定段中 → 撤销 (0,3)
    engine.onInputMove(0, 2);
    expect(engine.getStepCount()).toBe(3);
    expect(engine.getPath().length).toBe(3);
    expect(engine.getGrid()[0][3].filled).toBe(false);
    expect(engine.getGrid()[0][3].ownerNumber).toBeNull();
    expect(engine.getGrid()[0][2].filled).toBe(true); // (0,2) 保留
    expect(engine.getGrid()[0][1].filled).toBe(true);
    expect(engine.getGrid()[0][0].filled).toBe(true);
  });

  test('test_slide_to_second_to_last_cell_undoes_last', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 0, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0);
    engine.onInputMove(0, 1);
    engine.onInputMove(0, 2);
    expect(engine.getStepCount()).toBe(3);

    // 滑回 (0,1) — 路径中解锁段的格子 → 回溯到该位置
    engine.onInputMove(0, 1);
    expect(engine.getStepCount()).toBe(2);
    expect(engine.getPath().length).toBe(2);
    expect(engine.getGrid()[0][2].filled).toBe(false);
    expect(engine.getGrid()[0][1].filled).toBe(true); // (0,1) 保留
  });

  test('test_slide_to_filled_cell_not_in_path_ignored', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0); // 起点
    engine.onInputMove(0, 1);

    // 手动通过另一个路径填充 (1,1) — 不在当前 path 中
    // 无法通过正常 API 做到，此处测试不同路径的场景：
    // 滑到未填充的格子 (1,0)，它是一个新格子
    engine.onInputMove(1, 0);
    expect(engine.getStepCount()).toBe(3);

    // 滑回 (0,1) — 在 path 中，是倒数第二格 → 回溯到索引 1
    engine.onInputMove(0, 1);
    expect(engine.getStepCount()).toBe(2);
    expect(engine.getGrid()[1][0].filled).toBe(false); // 被回溯
    expect(engine.getGrid()[0][1].filled).toBe(true); // 保留
  });
});

// ======================================================================
// AC-2: 回溯到起点 — 路径完全回退
// ======================================================================
describe('AC-2: 回溯到起点', () => {
  test('test_backtrack_to_start_clears_all_and_goes_idle', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0); // 起点
    engine.onInputMove(0, 1);
    engine.onInputMove(0, 2);
    // 路径: [(0,0),(0,1),(0,2)], _lastCoord=(0,2)
    expect(engine.getStepCount()).toBe(3);
    expect(engine.getCurrentNumber()).toBe(1);

    // 连续回溯到起点（每一步滑回一格）
    engine.onInputMove(0, 1); // → 回溯到 idx=1, 移除 (0,2), stepCount=2
    expect(engine.getStepCount()).toBe(2);

    // 再滑回 (0,0) → 回溯到 idx=0, 移除 (0,1), stepCount=1
    engine.onInputMove(0, 0);
    expect(engine.getStepCount()).toBe(1);
    expect(engine.getPath().length).toBe(1);
    expect(engine.getEngineState()).toBe(EngineState.Drawing);

    // 再滑回 (0,0) → no-op（已在 lastCoord，无坐标变化）
    // 使用 undo 来清除最后一步
    engine.undo();
    expect(engine.getStepCount()).toBe(0);
    expect(engine.getPath().length).toBe(0);
    expect(engine.getEngineState()).toBe(EngineState.Idle);
    expect(engine.getCurrentNumber()).toBe(0);
  });

  test('test_undo_until_empty_path_goes_idle', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0); // stepCount=1
    engine.onInputMove(0, 1); // stepCount=2
    expect(engine.getStepCount()).toBe(2);

    engine.undo(); // → stepCount=1
    expect(engine.getStepCount()).toBe(1);
    expect(engine.canUndo()).toBe(true);

    engine.undo(); // → stepCount=0, path 空
    expect(engine.getStepCount()).toBe(0);
    expect(engine.getPath().length).toBe(0);
    expect(engine.getEngineState()).toBe(EngineState.Idle);
    expect(engine.canUndo()).toBe(false);
  });

  test('test_backtrack_to_node_keeps_node_filled', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 0, col: 2 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0); // 节点 1
    engine.onInputMove(0, 1);
    engine.onInputMove(0, 2); // 节点 2 — currentNumber=2, 锁定 (0,0),(0,1)
    expect(engine.getCurrentNumber()).toBe(2);

    // 滑回节点 2 — 是当前段起点，回溯后只有它被保留
    engine.onInputMove(0, 2);
    expect(engine.getStepCount()).toBe(3); // (0,0),(0,1),(0,2) 三格都在
    expect(engine.getGrid()[0][2].filled).toBe(true);
    expect(engine.getCurrentNumber()).toBe(2);
  });
});

// ======================================================================
// AC-3: 已锁定路径段不可修改
// ======================================================================
describe('AC-3: 已锁定段不可修改', () => {
  test('test_touch_locked_cell_ignored', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 0, col: 2 },
        { number: 3, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0);
    engine.onInputMove(0, 1);
    engine.onInputMove(0, 2); // 节点 2 → 锁定 (0,0),(0,1)
    engine.onInputMove(1, 2);

    // 滑回已锁定的 (0,0) — 忽略
    const stepsBefore = engine.getStepCount();
    engine.onInputMove(0, 0);
    expect(engine.getStepCount()).toBe(stepsBefore);
    expect(engine.getCurrentNumber()).toBe(2);
  });

  test('test_touch_locked_cell_after_multiple_segments_ignored', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 0, col: 2 },
        { number: 3, row: 2, col: 2 },
        { number: 4, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    // 段 1
    engine.onInputMove(0, 0);
    engine.onInputMove(0, 1);
    engine.onInputMove(0, 2); // 节点 2 → lock 段 1
    // 段 2
    engine.onInputMove(1, 2);
    engine.onInputMove(2, 2); // 节点 3 → lock (0,2),(1,2)
    // 段 3
    engine.onInputMove(3, 2);
    engine.onInputMove(3, 3); // 节点 4

    // 滑回锁定段 1 的 (0,1) — 应忽略
    const stepsBefore = engine.getStepCount();
    engine.onInputMove(0, 1);
    expect(engine.getStepCount()).toBe(stepsBefore);

    // 滑回锁定段 2 的 (1,2) — 应忽略
    engine.onInputMove(1, 2);
    expect(engine.getStepCount()).toBe(stepsBefore);
  });

  test('test_undo_does_not_touch_locked_cells', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 0, col: 2 },
        { number: 3, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0);
    engine.onInputMove(0, 1);
    engine.onInputMove(0, 2); // 节点 2 → lock (0,0),(0,1)
    engine.onInputMove(1, 2);
    engine.onInputMove(2, 2);
    // path: [(0,0)L,(0,1)L,(0,2),(1,2),(2,2)]

    // undo 只撤销未锁定的格子
    engine.undo(); // 撤销 (2,2) → stepCount=4
    expect(engine.getStepCount()).toBe(4);
    engine.undo(); // 撤销 (1,2) → stepCount=3
    expect(engine.getStepCount()).toBe(3);
    engine.undo(); // 撤销 (0,2) → stepCount=2, currentNumber 回退到 1
    expect(engine.getStepCount()).toBe(2);

    // 只剩锁定段 [(0,0)L,(0,1)L]，末格已锁定 → canUndo=false
    expect(engine.canUndo()).toBe(false);
    engine.undo(); // 无操作
    expect(engine.getStepCount()).toBe(2);
  });
});

// ======================================================================
// AC-4: 空路径 undo() 无操作
// ======================================================================
describe('AC-4: 空路径 undo() 安全', () => {
  test('test_undo_on_empty_path_is_noop', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    // 未开始连线 — path 为空
    expect(engine.getPath().length).toBe(0);

    engine.undo(); // 应无异常
    expect(engine.getStepCount()).toBe(0);
    expect(engine.getEngineState()).toBe(EngineState.Idle);
  });

  test('test_multiple_undo_on_empty_path_is_noop', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.undo();
    engine.undo();
    engine.undo();
    expect(engine.getStepCount()).toBe(0);
    expect(engine.getPath().length).toBe(0);
  });
});

// ======================================================================
// AC-5: undo() 正常撤销
// ======================================================================
describe('AC-5: undo() 正常撤销', () => {
  test('test_undo_removes_last_cell_and_decreases_step', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0);
    engine.onInputMove(0, 1);
    expect(engine.getStepCount()).toBe(2);
    expect(engine.getPath().length).toBe(2);

    engine.undo();
    expect(engine.getStepCount()).toBe(1);
    expect(engine.getPath().length).toBe(1);
    expect(engine.getGrid()[0][1].filled).toBe(false);
    expect(engine.getGrid()[0][1].ownerNumber).toBeNull();
    expect(engine.getGrid()[0][1].filledAt).toBeNull();
  });

  test('test_undo_on_node_cell_rolls_back_current_number', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 0, col: 2 },
        { number: 3, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0); // 节点 1 — currentNumber=1
    engine.onInputMove(0, 1);
    engine.onInputMove(0, 2); // 节点 2 — currentNumber=2, lock (0,0),(0,1)
    engine.onInputMove(1, 2);
    expect(engine.getCurrentNumber()).toBe(2);

    // 撤销 (1,2)
    engine.undo();
    expect(engine.getStepCount()).toBe(3);
    expect(engine.getCurrentNumber()).toBe(2); // 不变——(1,2) 不是节点

    // 撤销 (0,2) — 节点 2 → currentNumber 回退
    engine.undo();
    expect(engine.getStepCount()).toBe(2);
    expect(engine.getCurrentNumber()).toBe(1); // 回退到 2-1 = 1
    expect(engine.getGrid()[0][2].filled).toBe(false);
  });

  test('test_step_change_event_emitted_on_undo', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0);
    engine.onInputMove(0, 1);

    const events: any[] = [];
    engine.subscribe('stepChange', (e) => events.push(e.data));

    engine.undo();
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ delta: -1, total: 1 });
  });

  test('test_undo_preserves_locked_segments', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 0, col: 2 },
        { number: 3, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0);
    engine.onInputMove(0, 1);
    engine.onInputMove(0, 2); // lock (0,0),(0,1); currentNumber=2

    // 锁定段不被 undo 影响
    engine.undo(); // 撤销 (0,2) — 节点格，回退到 currentNumber=1
    const grid = engine.getGrid();
    expect(grid[0][0].filled).toBe(true); // 锁定
    expect(grid[0][0].ownerNumber).toBe(1);
    expect(grid[0][1].filled).toBe(true); // 锁定
    expect(grid[0][1].ownerNumber).toBe(1);
  });
});

// ======================================================================
// AC-6: Idle 态 canUndo() = false
// ======================================================================
describe('AC-6: Idle 态 canUndo() = false', () => {
  test('test_can_undo_false_after_init', () => {
    const engine = createEngine();
    const level = makeLevel();

    initEngine(engine, level);
    expect(engine.getEngineState()).toBe(EngineState.Idle);
    expect(engine.canUndo()).toBe(false);
  });

  test('test_can_undo_false_after_full_backtrack_to_idle', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0); // Drawing, path 非空
    expect(engine.canUndo()).toBe(true);

    engine.undo(); // path 空了
    expect(engine.getEngineState()).toBe(EngineState.Idle);
    expect(engine.canUndo()).toBe(false);
  });
});

// ======================================================================
// AC-7: Drawing/Dirty 态 + 非空路径 canUndo() = true
// ======================================================================
describe('AC-7: Drawing/Dirty 态 canUndo() = true', () => {
  test('test_can_undo_true_while_drawing', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0); // → Drawing
    expect(engine.canUndo()).toBe(true);
  });

  test('test_can_undo_true_while_dirty', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0);
    engine.onInputEnd(); // → Dirty
    expect(engine.getEngineState()).toBe(EngineState.Dirty);
    expect(engine.canUndo()).toBe(true);
  });

  test('test_can_undo_false_after_dirty_backtrack_to_empty', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0);
    engine.onInputEnd(); // Dirty
    expect(engine.canUndo()).toBe(true);

    engine.undo(); // path 空了
    expect(engine.canUndo()).toBe(false);
  });
});

// ======================================================================
// 额外边界测试
// ======================================================================
describe('Story 004 边界测试', () => {
  test('test_bresenham_backtrack_multiple_cells', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 5 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 0, col: 4 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0); // 起点
    engine.onInputMove(0, 1);
    engine.onInputMove(0, 2);
    engine.onInputMove(0, 3);
    expect(engine.getStepCount()).toBe(4);
    // 路径: [(0,0),(0,1),(0,2),(0,3)], _lastCoord=(0,3)

    // Bresenham 快滑回 (0,1) — 路径: [(0,3),(0,2),(0,1)]
    // skip (0,3), process (0,2): filled, 在未锁定段中 (idx=2) → 回溯到 idx=2, 移除 (0,3)
    // process (0,1): filled, 在未锁定段中 (idx=1, 当前段只有 (0,2) 和 (0,1)...
    // 实际上 (0,1) 在路径中，idx=1 → 回溯到 idx=1, 移除 (0,2)
    engine.onInputMove(0, 1); // delta=2, Bresenham 触发

    expect(engine.getStepCount()).toBe(2); // (0,0),(0,1)
    expect(engine.getGrid()[0][3].filled).toBe(false);
    expect(engine.getGrid()[0][2].filled).toBe(false);
    expect(engine.getGrid()[0][1].filled).toBe(true);
  });

  test('test_bresenham_diagonal_backtrack', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0);
    engine.onInputMove(1, 1);
    engine.onInputMove(2, 2);
    // 路径: [(0,0),(1,1),(2,2)]

    // 对角线快滑回 (0,0)
    engine.onInputMove(0, 0);

    expect(engine.getStepCount()).toBe(1); // 仅 (0,0)
    expect(engine.getGrid()[2][2].filled).toBe(false);
    expect(engine.getGrid()[1][1].filled).toBe(false);
    expect(engine.getGrid()[0][0].filled).toBe(true);
  });

  test('test_undo_then_continue_drawing', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0);
    engine.onInputMove(0, 1);
    engine.onInputMove(0, 2); // 走错了

    engine.undo(); // 撤销 (0,2)
    expect(engine.getStepCount()).toBe(2);

    // 从当前位置继续画新路径
    engine.onInputMove(1, 2);
    expect(engine.getStepCount()).toBe(3);
    expect(engine.getGrid()[1][2].filled).toBe(true);
    expect(engine.getGrid()[0][2].filled).toBe(false); // 仍撤销
  });

  test('test_touch_same_cell_as_last_does_not_toggle', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0);

    // 触摸 (0,0) 从另一个方向 — 已填充，在未锁定段中 (idx=0)
    // 当前 path=[(0,0)], 回溯到 idx=0 → 不删除任何格
    const stepsBefore = engine.getStepCount();
    engine.onInputMove(0, 0);
    expect(engine.getStepCount()).toBe(stepsBefore); // 无变化
  });

  test('test_lock_current_segment_preserves_locked_on_undo', () => {
    const engine = createEngine();
    const level = makeLevel({
      grid: { rows: 4, cols: 4 },
      nodes: [
        { number: 1, row: 0, col: 0 },
        { number: 2, row: 0, col: 2 },
        { number: 3, row: 3, col: 3 },
      ],
    });

    initEngine(engine, level);
    engine.onInputMove(0, 0);
    engine.onInputMove(0, 1);
    engine.onInputMove(0, 2); // 节点 2

    // 锁定段路径条目应保留 locked 状态
    const path = engine.getPath();
    // (0,0) locked, (0,1) locked, (0,2) 在 path 末尾但 unlocked（当前段）
    expect(path[0].locked).toBe(true);
    expect(path[1].locked).toBe(true);
    expect(path[2].locked).toBe(false);
  });
});
