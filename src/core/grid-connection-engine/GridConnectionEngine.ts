/**
 * GridConnectionEngine — 网格连线引擎主组件
 *
 * 数字连线游戏的核心玩法实现。作为 Cocos Component 挂载到场景节点，
 * 负责：网格初始化与渲染、内部状态机管理、输入事件响应、事件发布。
 *
 * ### Story 001 实现范围：
 * - 网格数据初始化（Cell[][] 创建、节点放置、障碍格标记）
 * - 状态机 Idle→Drawing→Dirty
 * - 网格渲染（网格线 + 障碍格 + 数字标签）
 * - cellSize 自动计算
 * - subscribe()、getter 等公共 API
 * - 关卡数据校验
 *
 * ### Story 006 实现范围：
 * - 填充动画（缩放 + easeOutBack 缓动，100ms）
 * - 路径连线绘制（2px 分段着色，按 ownerNumber 分组）
 * - 通关完成闪烁（200ms 透明度脉冲 1.0→0.5→1.0，easeInOutSine 缓动）
 * - 音频同步支持（通过现有事件系统的订阅机制，不硬编码 AudioManager）
 *
 * ### 生命周期：
 * ```
 * 场景加载 → onLoad() → init(level) → onEnter(Playing)
 *       ↓
 * 每帧 update(dt) 检查脏标记 → 脏则 render()
 *       ↓
 * 场景卸载 → onDestroy() → 清理标签池 + 订阅
 * ```
 *
 * ADR-002: 网格渲染策略 — 纯 cc.Graphics API + Label 节点池
 * ADR-003: 数据流模式 — Push 事件 (subscribe) + Pull 查询 (getter)
 * ADR-005: 触控输入管线 — 引擎接收 input-manager 的 INPUT_MOVE/INPUT_END
 * GDD: grid-connection-engine.md
 *
 * @ccclass GridConnectionEngine
 */
import { _decorator, Component, Node, Graphics, Label, Font, Color, view } from 'cc';
import { Level } from '../level-data-schema/types';
import {
  Cell,
  EngineState,
  PathEntry,
  ArrowData,
  GridLayout,
  EngineEventType,
  EngineCallback,
  EngineEvent,
  StepChangeData,
} from './types';

const { ccclass, property } = _decorator;

// ===== 模块级颜色常量 =====
// ADR-002: 禁止在渲染循环中 new Color() —— 模块级预创建

/** 网格线颜色 — 1px 细灰线 #E0E0E0 */
const COLOR_GRID_LINE = new Color(0xE0, 0xE0, 0xE0);
/** 障碍格填充色 — 深灰 #9E9E9E */
const COLOR_BLOCKED = new Color(0x9E, 0x9E, 0x9E);
/** 空格背景色 — 白色 */
const COLOR_EMPTY = Color.WHITE;

/**
 * 6 色连线颜色板 — 色盲友好高对比色。
 * 索引 0-5 对应数字 1-6。
 */
const LINE_COLORS: ReadonlyArray<Color> = [
  new Color(0xE0, 0x3E, 0x2D), // 红 — 数字 1  #E03E2D
  new Color(0x21, 0x96, 0xF3), // 蓝 — 数字 2  #2196F3
  new Color(0x4C, 0xAF, 0x50), // 绿 — 数字 3  #4CAF50
  new Color(0xFF, 0x98, 0x00), // 橙 — 数字 4  #FF9800
  new Color(0x9C, 0x27, 0xB0), // 紫 — 数字 5  #9C27B0
  new Color(0x00, 0xBC, 0xD4), // 青 — 数字 6  #00BCD4
];

/** 临时颜色缓冲——供 _drawCompletionBlink 修改 alpha 使用，避免在渲染循环中 new Color() */
const _tempBlinkColors: Color[] = LINE_COLORS.map(c => new Color(c.r, c.g, c.b, c.a));

// ===== 动画缓动函数（模块级纯函数） =====

/**
 * easeOutBack 缓动函数。
 * @param t - 归一化时间 [0, 1]
 * @returns 缓动后的值 [0, 1]
 */
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * easeInOutSine 缓动函数。
 * @param t - 归一化时间 [0, 1]
 * @returns 缓动后的值 [0, 1]
 */
function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/**
 * 计算格子填充动画的缩放比例。
 * 刚填充时从 0.85 开始，经 100ms easeOutBack 动画增长到 1.0。
 *
 * @param cell  - 网格单元
 * @param nowMs - 当前时间戳 (performance.now())
 * @returns 缩放系数 [0.85, 1.0]（超出动画周期返回 1.0）
 */
function getCellScale(cell: Cell, nowMs: number): number {
  if (!cell.filledAt) return 1.0;
  const elapsed = nowMs - cell.filledAt;
  if (elapsed > 100) return 1.0;
  const t = elapsed / 100;
  return 0.85 + 0.15 * easeOutBack(t);
}

// ===== 配置常量 =====

/** 网格边距 (px) — 网格与画布边缘的最小间距 */
const GRID_MARGIN = 16;
/** 最小格子尺寸 (px) — 对应最小触控区域 44×44px */
const CELL_SIZE_MIN = 44;
/** 最大格子尺寸 (px) — 防止过大网格在屏幕外 */
const CELL_SIZE_MAX = 120;
/** 数字标签字号 */
const LABEL_FONT_SIZE = 14;

// ===== 画布默认值 =====
// 微信小游戏 canvas 典型尺寸：750 × 1334 (iPhone 6/7/8 逻辑分辨率)

const DEFAULT_CANVAS_WIDTH = 750;
const DEFAULT_CANVAS_HEIGHT = 1334;

// ============================================================
// Bresenham 直线插值（模块级纯函数）
// ============================================================

/**
 * 使用 Bresenham 整数算法计算从 (r0,c0) 到 (r1,c1) 的直线路径。
 *
 * Story 003: 快划时自动填充跳过的中间格子。
 * 纯整数运算，零浮点，零堆分配（每次调用创建一次结果数组）。
 *
 * @param r0 - 起始行号
 * @param c0 - 起始列号
 * @param r1 - 终点行号
 * @param c1 - 终点列号
 * @returns 路径上所有格子的坐标数组（含起止点），按从起点到终点的顺序排列
 *
 * @example
 * ```typescript
 * bresenhamPath(0, 0, 0, 3);
 * // Returns: [{row:0,col:0}, {row:0,col:1}, {row:0,col:2}, {row:0,col:3}]
 *
 * bresenhamPath(0, 0, 2, 2);
 * // Returns: [{row:0,col:0}, {row:1,col:1}, {row:2,col:2}]
 * ```
 */
export function bresenhamPath(
  r0: number,
  c0: number,
  r1: number,
  c1: number,
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

  // 始终包含起点
  path.push({ row: r, col: c });

  if (r === r1 && c === c1) {
    return path;
  }

  if (absDc > absDr) {
    // Col-dominant（浅斜线）：沿列方向迭代
    // 初始误差 = 2*|dr| - |dc|
    let err = 2 * absDr - absDc;
    for (let i = 0; i < absDc; i++) {
      if (err >= 0) {
        r += stepR;
        err -= 2 * absDc;
      }
      err += 2 * absDr;
      c += stepC;
      path.push({ row: r, col: c });
    }
  } else {
    // Row-dominant（陡斜线或 45 度对角线）：沿行方向迭代
    // 初始误差 = 2*|dc| - |dr|
    let err = 2 * absDc - absDr;
    for (let i = 0; i < absDr; i++) {
      if (err >= 0) {
        c += stepC;
        err -= 2 * absDr;
      }
      err += 2 * absDc;
      r += stepR;
      path.push({ row: r, col: c });
    }
  }

  return path;
}

// ============================================================
// 引擎组件
// ============================================================

@ccclass('GridConnectionEngine')
export class GridConnectionEngine extends Component {
  // ---- Cocos Editor Properties ----

  /** 数字标签容器节点——所有 Label 节点挂载到此节点下 */
  @property({ type: Node })
  labelContainer: Node | null = null;

  /** 嵌入式 TTF 字体资源（Story 001 暂不使用，Story 006 启用合批） */
  @property({ type: Font })
  numberFont: Font | null = null;

  // ---- 内部状态 ----

  /** 网格单元二维数组 grid[row][col] */
  private _grid: Cell[][] = [];
  /** 当前路径条目列表（Story 002+ 填充） */
  private _path: PathEntry[] = [];
  /** 引擎内部状态机 */
  private _engineState: EngineState = EngineState.Idle;
  /** 当前正连线的数字编号 */
  private _currentNumber: number = 0;
  /** 步数计数（每成功填充一格 +1，每撤销一格 -1） */
  private _stepCount: number = 0;
  /** 当前关卡数据引用 */
  private _level: Level | null = null;
  /** 网格布局参数 */
  private _layout: GridLayout = { originX: 0, originY: 0, cellSize: 66, rows: 0, cols: 0 };
  /** 脏标记——true 时在下一帧 update() 执行重绘 */
  private _renderDirty: boolean = false;
  /** Graphics 组件引用 */
  private _graphics: Graphics | null = null;
  /** Label 节点池 */
  private _labels: Label[] = [];
  /** 事件订阅表——事件类型 → 回调集合 */
  private _subscribers: Map<EngineEventType, Set<EngineCallback>> = new Map();
  /**
   * 上一帧触摸坐标（Story 003: Bresenham 插值用）。
   * onInputMove 中记录，onInputEnd / init 中重置。
   */
  private _lastCoord: { row: number; col: number } | null = null;
  /** 是否已初始化 */
  private _initialized: boolean = false;
  /** Story 005: 防止重复触发通关——关卡只触发一次 LEVEL_COMPLETE */
  private _levelCompleteFired: boolean = false;
  /** Story 006: 通关触发的时间戳 (ms)，用于完成闪烁动画计时 */
  private _levelCompleteTime: number = 0;

  // ================================================================
  // 公共 API
  // ================================================================

  /**
   * 用关卡数据初始化引擎。
   *
   * 流程：
   * 1. 校验 Level 数据的完整性
   * 2. 计算网格布局（originX/Y, cellSize）
   * 3. 创建二维 Cell[][] 数组
   * 4. 放置数字节点 + 标记障碍格
   * 5. 初始化 Graphics 组件
   * 6. 创建 Label 节点池
   * 7. 标记脏 → 下一帧渲染
   *
   * @param level      - 关卡数据
   * @param canvasWidth  - 画布宽度（可选，不传则使用 view.getVisibleSize()）
   * @param canvasHeight - 画布高度（可选，不传则使用 view.getVisibleSize()）
   * @returns true 表示初始化成功，false 表示数据无效
   *
   * @example
   * ```typescript
   * const ok = engine.init(levelData);
   * if (!ok) { /* 回退到菜单 *\/ }
   * ```
   */
  init(level: Level, canvasWidth?: number, canvasHeight?: number): boolean {
    // ---- 校验 ----
    const errors = this._validateLevel(level);
    if (errors.length > 0) {
      console.error('[GridEngine] Invalid level data: ' + errors.join('; '));
      this._emit('engineError', { errors });
      return false;
    }

    this._level = level;

    // ---- 计算布局 ----
    const cw = canvasWidth ?? this._getCanvasWidth();
    const ch = canvasHeight ?? this._getCanvasHeight();
    const cellSize = GridConnectionEngine.calcCellSize(cw, ch, level.grid.rows, level.grid.cols);

    const totalW = level.grid.cols * cellSize;
    const totalH = level.grid.rows * cellSize;
    const originX = Math.floor((cw - totalW) / 2);
    const originY = Math.floor((ch - totalH) / 2);

    this._layout = {
      originX,
      originY,
      cellSize,
      rows: level.grid.rows,
      cols: level.grid.cols,
    };

    // ---- 数据初始化 ----
    this._initGrid(level);
    this._engineState = EngineState.Idle;
    this._currentNumber = 0;
    this._stepCount = 0;
    this._path = [];

    // ---- 渲染初始化 ----
    this._initGraphics();
    this._initLabels();
    this._markDirty();

    this._initialized = true;
    this._lastCoord = null;
    this._levelCompleteFired = false;
    this._levelCompleteTime = 0;
    return true;
  }

  /**
   * 处理输入移动事件。
   *
   * Story 001: 基础 Idle→Drawing 转换。
   * Story 003: 集成 Bresenham 插值——非相邻跳跃时自动填充中间格子。
   *
   * @param row - 目标格行号
   * @param col - 目标格列号
   */
  onInputMove(row: number, col: number): void {
    if (!this._initialized || !this._isValidCoord(row, col)) {
      return;
    }

    // ---- Story 003: Bresenham 插值 ----
    if (this._lastCoord) {
      const dr = Math.abs(row - this._lastCoord.row);
      const dc = Math.abs(col - this._lastCoord.col);
      if (dr > 1 || dc > 1) {
        // 非相邻跳跃：计算插值路径
        const path = bresenhamPath(
          this._lastCoord.row,
          this._lastCoord.col,
          row,
          col,
        );
        // 跳过起点 (lastCoord)——已在上一帧处理过
        for (let i = 1; i < path.length; i++) {
          this._processCoord(path[i].row, path[i].col);
        }
        this._lastCoord = { row, col };
        return;
      }
    }

    this._lastCoord = { row, col };

    // ---- 原始守卫 + 状态分发 ----
    const cell = this._grid[row][col];
    if (!cell || cell.isBlocked) {
      return;
    }

    switch (this._engineState) {
      case EngineState.Idle:
        this._handleIdleTouch(cell, row, col);
        break;

      case EngineState.Drawing:
        this._handleDrawingTouch(cell, row, col);
        break;

      case EngineState.Dirty:
        this._handleDirtyTouch(cell, row, col);
        break;
    }
  }

  /**
   * 处理输入结束事件。
   *
   * Story 001: Drawing → Dirty 转换。
   * Story 003: Bresenham _lastCoord 重置。
   */
  onInputEnd(): void {
    if (!this._initialized) {
      return;
    }

    this._lastCoord = null;

    if (this._engineState === EngineState.Drawing) {
      this._engineState = EngineState.Dirty;
    }

    // Story 005: INPUT_END 后检查通关（覆盖 "最后一格恰好在 INPUT_END 时填充" 场景）
    this._checkLevelComplete();
  }

  /**
   * 处理单个坐标的输入（供 Bresenham 插值路径循环调用）。
   *
   * Story 003: 对插值路径中的每格执行状态分发。
   * 与 onInputMove 的不同：跳过了初始守卫（调用者负责）且不更新 _lastCoord。
   *
   * @param row - 目标格行号
   * @param col - 目标格列号
   */
  private _processCoord(row: number, col: number): void {
    if (!this._isValidCoord(row, col)) {
      return;
    }

    const cell = this._grid[row][col];
    if (!cell || cell.isBlocked) {
      return;
    }

    switch (this._engineState) {
      case EngineState.Idle:
        this._handleIdleTouch(cell, row, col);
        break;

      case EngineState.Drawing:
        this._handleDrawingTouch(cell, row, col);
        break;

      case EngineState.Dirty:
        this._handleDirtyTouch(cell, row, col);
        break;
    }
  }

  /**
   * 撤销上一步操作。
   *
   * GDD 规则 6: 移除当前 path 最后一格（仅当该格未被锁定）。
   * 若该格为数字节点，currentNumber 回退。
   * 若撤销后 path 为空，引擎回到 Idle 状态。
   *
   * @remarks ADR-003 Pull 模式——HUD 撤销按钮通过 canUndo() 查询可用性后调用此方法。
   */
  undo(): void {
    if (this._path.length === 0) {
      return;
    }

    const last = this._path[this._path.length - 1];

    // 已锁定段不可撤销
    if (last.locked) {
      return;
    }

    this._undoLastCell();
  }

  /**
   * 检查是否可撤销。
   *
   * @returns true 表示当前路径非空且引擎处于 Drawing 或 Dirty 状态
   */
  canUndo(): boolean {
    return (
      this._path.length > 0 &&
      (this._engineState === EngineState.Drawing ||
        this._engineState === EngineState.Dirty) &&
      !this._path[this._path.length - 1].locked
    );
  }

  /**
   * 获取网格当前快照。
   *
   * @returns 二维 Cell 数组引用（只读——调用者不得修改）
   *
   * @remarks ADR-003 Pull 规则 2: 返回当前快照，调用者不得缓存跨帧使用。
   */
  getGrid(): Cell[][] {
    return this._grid;
  }

  /**
   * 获取当前正连线的数字编号。
   *
   * @returns 当前数字（1-6），0 表示尚未开始连线
   */
  getCurrentNumber(): number {
    return this._currentNumber;
  }

  /**
   * 获取当前步数。
   *
   * @returns 步数计数
   */
  getStepCount(): number {
    return this._stepCount;
  }

  /**
   * 获取网格布局参数。
   *
   * @returns GridLayout 对象
   */
  getGridLayout(): GridLayout {
    return this._layout;
  }

  /**
   * 获取引擎内部状态。
   *
   * @returns 当前 EngineState
   */
  getEngineState(): EngineState {
    return this._engineState;
  }

  /**
   * 获取当前路径快照。
   *
   * @returns PathEntry 数组引用（只读——调用者不得修改）
   *
   * @remarks ADR-003 Pull 规则: 返回当前快照，调用者不得缓存跨帧使用。
   */
  getPath(): PathEntry[] {
    return this._path;
  }

  /**
   * 订阅引擎事件。
   *
   * 支持的事件类型：
   * - 'stepChange':    步数变化，data 为 StepChangeData
   * - 'levelComplete': 通关，data 为 finalStepCount
   * - 'engineError':   引擎错误，data 为错误信息
   *
   * @param event    - 事件类型
   * @param callback - 事件回调，同步执行
   * @returns 取消订阅函数
   *
   * @example
   * ```typescript
   * const unsub = engine.subscribe('stepChange', (event) => {
   *   console.log('Steps:', event.data.total);
   * });
   * // 不再需要时:
   * unsub();
   * ```
   */
  subscribe(event: EngineEventType, callback: EngineCallback): () => void {
    if (!this._subscribers.has(event)) {
      this._subscribers.set(event, new Set());
    }
    this._subscribers.get(event)!.add(callback);
    return () => {
      this._subscribers.get(event)?.delete(callback);
    };
  }

  /**
   * 计算最佳格子尺寸（纯静态函数）。
   *
   * 公式：cellSize = min(floor((canvasW - 2*margin)/cols),
   *                       floor((canvasH - 2*margin)/rows),
   *                       120)
   *
   * @param canvasW - 画布宽度 (px)
   * @param canvasH - 画布高度 (px)
   * @param rows    - 网格行数
   * @param cols    - 网格列数
   * @returns 最佳格子尺寸 (px)，下限 44，上限 120
   *
   * @example
   * ```typescript
   * const sz = GridConnectionEngine.calcCellSize(750, 1334, 4, 4);
   * // Returns Math.min(Math.floor((750-32)/4), Math.floor((1334-32)/4), 120)
   * // = Math.min(179, 325, 120) = 120
   * ```
   */
  static calcCellSize(canvasW: number, canvasH: number, rows: number, cols: number): number {
    const maxByWidth = Math.floor((canvasW - 2 * GRID_MARGIN) / cols);
    const maxByHeight = Math.floor((canvasH - 2 * GRID_MARGIN) / rows);
    const cellSize = Math.min(maxByWidth, maxByHeight, CELL_SIZE_MAX);
    return Math.max(cellSize, CELL_SIZE_MIN); // 保底 ≥44px（最小触控区域）
  }

  // ================================================================
  // Cocos 组件生命周期
  // ================================================================

  /**
   * 组件加载时调用。
   * Story 001: Graphics 和 Label 池在 init() 中初始化，onLoad 仅做基础准备。
   */
  onLoad(): void {
    // Story 001: 所有初始化在 init() 中完成
  }

  /**
   * 组件销毁时调用。
   * 清理 Label 节点池、取消所有订阅、释放 Graphics 引用。
   */
  onDestroy(): void {
    this._destroyLabels();
    this._subscribers.clear();
    this._graphics = null;
    this._initialized = false;
  }

  /**
   * 每帧更新——脏标记为 true 时执行重绘。
   *
   * @param dt - 帧间隔时间 (秒)
   */
  update(_dt: number): void {
    if (!this._initialized) {
      return;
    }

    // Story 006: 通关闪烁期间强制每帧重绘（200ms 脉冲窗口）
    if (this._levelCompleteFired) {
      const elapsed = performance.now() - this._levelCompleteTime;
      if (elapsed <= 200) {
        this._markDirty();
      }
    }

    if (this._renderDirty) {
      this._render();
      this._renderDirty = false;
    }
  }

  // ================================================================
  // 私有方法：Idle 状态下的触摸处理
  // ================================================================

  /**
   * 处理 Idle 状态下的触摸。
   * 首次触摸必须落在数字节点上，否则忽略。
   *
   * @param cell - 触摸的网格单元
   * @param row  - 行号
   * @param col  - 列号
   */
  private _handleIdleTouch(cell: Cell, row: number, col: number): void {
    // 必须从数字节点开始连线
    if (!cell.isNode || cell.nodeNumber == null) {
      return;
    }

    // 数字节点已被填充 / 已被障碍格覆盖 → 不应发生，但防御判断
    if (cell.isBlocked) {
      return;
    }

    // 开始新路径
    this._currentNumber = cell.nodeNumber;
    this._engineState = EngineState.Drawing;

    // 填充当前格
    cell.filled = true;
    cell.ownerNumber = this._currentNumber;
    cell.filledAt = performance.now();

    // 步数 +1
    this._stepCount++;
    this._path.push({ row, col, locked: false });

    // 推送事件
    this._emit('stepChange', { delta: 1, total: this._stepCount } as StepChangeData);
    this._markDirty();

    // Story 005: 每步填充后检查通关
    this._checkLevelComplete();
  }

  /**
   * 处理 Drawing 状态下的触摸——路径追踪核心循环。
   *
   * GDD 规则 2 实现：
   * 1. 已填充 → 忽略（Story 004 处理回溯）
   * 2. 障碍格 → 忽略
   * 3. 节点格跳数字检测 → nodeNumber > currentNumber + 1 则拒绝
   * 4. 到达下个数字节点 → 锁定当前段 + 推进 currentNumber
   * 5-8. 填充格子、步数 +1、推入 path、标记脏
   *
   * @param cell - 触摸的网格单元
   * @param row  - 行号
   * @param col  - 列号
   */
  private _handleDrawingTouch(cell: Cell, row: number, col: number): void {
    // Story 004: 已填充格 → 检查是否可回溯
    if (cell.filled) {
      const idx = this._findInUnlockedPath(row, col);
      if (idx !== -1) {
        this._backtrackToIndex(idx);
      }
      // 不在当前解锁段中（已锁定或不在 path 中）→ 忽略
      return;
    }

    // Step 2: 障碍格 → 忽略
    if (cell.isBlocked) {
      return;
    }

    // Step 3-4: 数字节点处理
    if (cell.isNode && cell.nodeNumber != null) {
      const nodeNum = cell.nodeNumber;

      // 跳数字 → 忽略（nodeNumber > currentNumber + 1）
      if (nodeNum > this._currentNumber + 1) {
        return;
      }

      // 比 currentNumber 小的数字节点 → 拒绝
      if (nodeNum < this._currentNumber) {
        return;
      }

      // 到达下一数字节点 → 锁定当前段 + 推进 currentNumber
      if (nodeNum === this._currentNumber + 1) {
        this._lockCurrentSegment();
        this._currentNumber = nodeNum;
      }
      // nodeNum === currentNumber: 同数字节点，不做特殊处理，照常填充
    }

    // Step 5: 填充该格
    cell.filled = true;
    cell.ownerNumber = this._currentNumber;
    cell.filledAt = performance.now();

    // Step 6: 步数 +1 + emit
    this._stepCount++;
    this._emit('stepChange', { delta: 1, total: this._stepCount } as StepChangeData);

    // Step 7: 推入 path
    this._path.push({ row, col, locked: false });

    // Step 8: 标记脏
    this._markDirty();

    // Story 005: 每步填充后检查通关
    this._checkLevelComplete();
  }

  /**
   * 处理 Dirty 状态下的触摸——抬手指后重新开始。
   *
   * GDD 规则 3: 玩家可分段操作——抬手指后从匹配的数字节点继续。
   * 仅当触摸落在 nodeNumber == currentNumber 的节点格上时才重新进入 Drawing。
   *
   * @param cell - 触摸的网格单元
   * @param row  - 行号
   * @param col  - 列号
   */
  private _handleDirtyTouch(cell: Cell, row: number, col: number): void {
    // 障碍格 → 忽略
    if (cell.isBlocked) {
      return;
    }

    // 必须触摸匹配的数字节点
    if (!cell.isNode || cell.nodeNumber == null) {
      return;
    }

    if (cell.nodeNumber !== this._currentNumber) {
      return;
    }

    // 匹配的数字节点 → 重新进入 Drawing
    this._engineState = EngineState.Drawing;

    // 如果该节点格尚未填充，则填充它
    if (!cell.filled) {
      cell.filled = true;
      cell.ownerNumber = this._currentNumber;
      cell.filledAt = performance.now();
      this._stepCount++;
      this._emit('stepChange', { delta: 1, total: this._stepCount } as StepChangeData);
      this._path.push({ row, col, locked: false });
      this._markDirty();

      // Story 005: 重入节点格也可能触发通关
      this._checkLevelComplete();
    }
  }

  /**
   * 锁定当前数字段路径。
   *
   * 将所有 path 中 locked=false 的条目标记为 locked=true。
   * 在到达下一数字节点时调用，防止已完成的路径段被修改。
   */
  private _lockCurrentSegment(): void {
    for (const entry of this._path) {
      entry.locked = true;
    }
  }

  /**
   * 在 path 的解锁段中查找指定坐标。
   *
   * Story 004: 仅搜索 locked === false 的条目——已锁定段不可回溯。
   *
   * @param row - 行号
   * @param col - 列号
   * @returns 在 path 中的索引，-1 表示未找到或位于锁定段中
   */
  private _findInUnlockedPath(row: number, col: number): number {
    for (let i = this._path.length - 1; i >= 0; i--) {
      const entry = this._path[i];
      if (entry.locked) {
        return -1; // 已锁定——停止搜索
      }
      if (entry.row === row && entry.col === col) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 回溯路径到指定索引——移除索引之后的所有条目。
   *
   * Story 004: 支持触摸回溯（滑入当前路径解锁段中的格子）和 Bresenham 快速回溯。
   * 每移除一格：恢复 Cell 为未填充、步数 -1、推送 stepChange(-1)、标记脏。
   * 若移除的格为数字节点，currentNumber 回退。
   * 若回溯后 path 为空，引擎回到 Idle 状态。
   *
   * @param keepIdx - 保留的最后一个索引（该格保留在 path 中，其后的所有格被移除）
   */
  private _backtrackToIndex(keepIdx: number): void {
    while (this._path.length - 1 > keepIdx) {
      this._undoLastCell();
    }
  }

  /**
   * 撤销 path 中的最后一格。
   *
   * 恢复 Cell 状态、减少步数、推送事件、标记脏。
   * 若撤销的是数字节点，currentNumber 回退到 nodeNumber - 1。
   * 若撤销后 path 为空：currentNumber 置 0，状态回到 Idle。
   */
  private _undoLastCell(): void {
    const last = this._path.pop()!;
    const cell = this._grid[last.row][last.col];

    cell.filled = false;
    cell.ownerNumber = null;
    cell.filledAt = null;

    this._stepCount--;
    this._emit('stepChange', { delta: -1, total: this._stepCount } as StepChangeData);

    if (last.locked) {
      // 解锁：回退锁定段
      last.locked = false;
    }

    // 若该格是数字节点，回退 currentNumber
    if (cell.isNode && cell.nodeNumber != null) {
      this._currentNumber = cell.nodeNumber - 1;
    }

    this._markDirty();

    // 路径完全空 → 回到 Idle
    if (this._path.length === 0) {
      this._engineState = EngineState.Idle;
      this._currentNumber = 0;
    }
  }

  /**
   * 检测通关——所有非障碍格均已填充时触发 LEVEL_COMPLETE 事件。
   *
   * Story 005: 每次有效填充后、INPUT_END 后调用。
   * 使用 `_levelCompleteFired` 标记防止重复触发。
   * Push 模式（ADR-003）：通过 subscribe('levelComplete', finalSteps) 推送给订阅者。
   *
   * @remarks 引擎不自行转换状态——将 finalStepCount 推送给状态机和评分系统。
   * 全程使用网格尺寸 `_layout` 而非 `_level.grid`——纯整数运算，<0.1ms。
   */
  private _checkLevelComplete(): void {
    if (this._levelCompleteFired) {
      return;
    }

    const { rows, cols } = this._layout;

    for (let r = 0; r < rows; r++) {
      const row = this._grid[r];
      for (let c = 0; c < cols; c++) {
        const cell = row[c];
        if (!cell.isBlocked && !cell.filled) {
          return; // 还有非障碍格未填充——未通关
        }
      }
    }

    // 全部非障碍格已填充
    this._levelCompleteFired = true;
    this._levelCompleteTime = performance.now();
    this._emit('levelComplete', this._stepCount);
  }

  // ================================================================
  // 私有方法：关卡数据校验
  // ================================================================

  /**
   * 校验关卡数据完整性。
   *
   * 检查项：
   * - Level 对象非空
   * - grid.rows/cols 存在且在 [3, 10] 范围内
   * - nodes 数组存在且 >= 2
   * - blockedCells 为数组（若有）
   *
   * @param level - 待校验的关卡数据
   * @returns 错误字符串数组——为空表示通过
   */
  private _validateLevel(level: Level): string[] {
    const errors: string[] = [];

    if (!level) {
      errors.push('Level is null or undefined');
      return errors;
    }

    if (!level.grid) {
      errors.push('Missing grid');
    } else {
      if (typeof level.grid.rows !== 'number' || level.grid.rows < 3 || level.grid.rows > 10) {
        errors.push(`rows ${level.grid.rows} out of range [3, 10]`);
      }
      if (typeof level.grid.cols !== 'number' || level.grid.cols < 3 || level.grid.cols > 10) {
        errors.push(`cols ${level.grid.cols} out of range [3, 10]`);
      }
    }

    if (!Array.isArray(level.nodes) || level.nodes.length < 2) {
      errors.push(`nodes must be an array with at least 2 entries, got ${level.nodes?.length ?? 0}`);
    }

    if (level.blockedCells != null && !Array.isArray(level.blockedCells)) {
      errors.push('blockedCells must be an array');
    }

    return errors;
  }

  // ================================================================
  // 私有方法：网格数据初始化
  // ================================================================

  /**
   * 创建二维网格 Cell 数组。
   * 遍历所有格子，标记数字节点和障碍格。
   *
   * @param level - 关卡数据
   */
  private _initGrid(level: Level): void {
    const { rows, cols } = level.grid;
    this._grid = [];

    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          filled: false,
          ownerNumber: null,
          isNode: false,
          nodeNumber: null,
          isBlocked: false,
          filledAt: null,
        });
      }
      this._grid.push(row);
    }

    // 放置数字节点
    for (const node of level.nodes) {
      if (node.row >= 0 && node.row < rows && node.col >= 0 && node.col < cols) {
        this._grid[node.row][node.col].isNode = true;
        this._grid[node.row][node.col].nodeNumber = node.number;
      }
    }

    // 标记障碍格
    if (Array.isArray(level.blockedCells)) {
      for (const cell of level.blockedCells) {
        if (cell.row >= 0 && cell.row < rows && cell.col >= 0 && cell.col < cols) {
          this._grid[cell.row][cell.col].isBlocked = true;
        }
      }
    }
  }

  // ================================================================
  // 私有方法：渲染初始化
  // ================================================================

  /**
   * 初始化 Graphics 组件。
   * 如果节点上已有 Graphics 则复用，否则创建新组件。
   */
  private _initGraphics(): void {
    let graphics = this.node.getComponent(Graphics);
    if (!graphics) {
      graphics = this.node.addComponent(Graphics);
    }
    this._graphics = graphics;
  }

  /**
   * 创建 Label 节点池。
   * 为每个数字节点创建一个 Label，挂载到 labelContainer 下。
   * 使用嵌入式 TTF 字体优先，降级到系统字体。
   */
  private _initLabels(): void {
    this._destroyLabels();

    if (!this._level || !this.labelContainer) {
      return;
    }

    const nodeCount = this._level.nodes.length;

    for (let i = 0; i < nodeCount; i++) {
      const labelNode = new Node(`NodeLabel_${i + 1}`);
      const label = labelNode.addComponent(Label);

      label.string = '';
      label.fontSize = LABEL_FONT_SIZE;
      label.color = Color.WHITE;
      label.horizontalAlign = Label.HorizontalAlign.CENTER;
      label.verticalAlign = Label.VerticalAlign.CENTER;

      if (this.numberFont) {
        label.font = this.numberFont;
      } else {
        console.warn(
          '[GridEngine] numberFont not assigned — falling back to SystemFont. ' +
          'Label batching will NOT work (ADR-002). Assign an embedded TTF font to ' +
          'the "Number Font" property in the editor.',
        );
      }

      this.labelContainer.addChild(labelNode);
      this._labels.push(label);
    }
  }

  /**
   * 销毁所有 Label 节点。
   */
  private _destroyLabels(): void {
    for (const label of this._labels) {
      if (label && label.node && label.node.isValid) {
        label.node.destroy();
      }
    }
    this._labels = [];
  }

  // ================================================================
  // 私有方法：渲染（每帧脏时执行）
  // ================================================================

  /**
   * 执行全量脏重绘。
   * 绘制顺序（ADR-002 + Story 006）：
   * 1. graphics.clear()
   * 2. 网格线（1px 灰线）
   * 3. 障碍格（深灰填充）
   * 4. 已填充格（带填充缩放动画）
   * 5. 路径连线（2px 分段着色）
   * 6. 通关闪烁（完成时叠加透明度脉冲）
   * 7. 数字标签位置更新
   */
  private _render(): void {
    if (!this._graphics) {
      return;
    }

    const g = this._graphics;
    const nowMs = performance.now();

    g.clear();

    this._drawGridLines(g);
    this._drawBlockedCells(g);
    this._drawFilledCells(g, nowMs);
    this._drawPathLine(g);
    this._drawCompletionBlink(g, nowMs);
    this._updateLabels();
  }

  /**
   * 绘制网格线。
   * 水平 rows+1 条 + 垂直 cols+1 条，1px 细灰线 #E0E0E0。
   *
   * @param g - Graphics 组件
   */
  private _drawGridLines(g: Graphics): void {
    const { originX, originY, cellSize, rows, cols } = this._layout;

    g.strokeColor = COLOR_GRID_LINE;
    g.lineWidth = 1;

    // 水平线
    for (let r = 0; r <= rows; r++) {
      const y = originY + r * cellSize;
      g.moveTo(originX, y);
      g.lineTo(originX + cols * cellSize, y);
    }

    // 垂直线
    for (let c = 0; c <= cols; c++) {
      const x = originX + c * cellSize;
      g.moveTo(x, originY);
      g.lineTo(x, originY + rows * cellSize);
    }

    g.stroke();
  }

  /**
   * 绘制障碍格。
   * 使用深灰 (#9E9E9E) 填充所有 isBlocked 的格子。
   *
   * @param g - Graphics 组件
   */
  private _drawBlockedCells(g: Graphics): void {
    const { originX, originY, cellSize } = this._layout;

    g.fillColor = COLOR_BLOCKED;

    for (let r = 0; r < this._grid.length; r++) {
      const row = this._grid[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c].isBlocked) {
          g.rect(
            originX + c * cellSize,
            originY + r * cellSize,
            cellSize,
            cellSize,
          );
        }
      }
    }

    g.fill();
  }

  /**
   * 更新数字标签位置和文字。
   * 根据当前布局和关卡节点数据，刷新每个 Label 的位置和文本。
   */
  private _updateLabels(): void {
    if (!this._level) {
      return;
    }

    const { originX, originY, cellSize } = this._layout;
    const nodes = this._level.nodes;
    const count = Math.min(this._labels.length, nodes.length);

    for (let i = 0; i < count; i++) {
      const label = this._labels[i];
      const node = nodes[i];

      label.string = String(node.number);
      label.node.setPosition(
        originX + node.col * cellSize + cellSize / 2,
        originY + node.row * cellSize + cellSize / 2,
      );
    }
  }

  // ================================================================
  // 私有方法：Story 006 视觉增强渲染
  // ================================================================

  /**
   * 绘制已填充格（带填充缩放动画）。
   *
   * Story 006 AC-1: 填充动画。
   * 刚填充时 scale = 0.85，经 100ms easeOutBack 增长到 1.0。
   * 按 ownerNumber 分组批量绘制，最小化 fillColor 切换次数。
   *
   * @param g     - Graphics 组件
   * @param nowMs - 当前时间戳 (performance.now())
   */
  private _drawFilledCells(g: Graphics, nowMs: number): void {
    const { originX, originY, cellSize, rows, cols } = this._layout;

    for (let num = 1; num <= 6; num++) {
      g.fillColor = LINE_COLORS[num - 1];
      let hasAny = false;

      for (let r = 0; r < rows; r++) {
        const row = this._grid[r];
        for (let c = 0; c < cols; c++) {
          const cell = row[c];
          if (cell.ownerNumber === num && cell.filled) {
            const scale = getCellScale(cell, nowMs);
            const drawSize = cellSize * scale;
            const offset = (cellSize - drawSize) / 2;
            g.rect(
              originX + c * cellSize + offset,
              originY + r * cellSize + offset,
              drawSize,
              drawSize,
            );
            hasAny = true;
          }
        }
      }

      if (hasAny) {
        g.fill();
      }
    }
  }

  /**
   * 绘制路径连线。
   *
   * Story 006 AC-2: 路径线段。
   * 2px 连续折线，经过 path 中每个格子的中心点。
   * 按 ownerNumber 分段着色——锁定段可能使用不同颜色（锁定时的数字编号）。
   *
   * @param g - Graphics 组件
   */
  private _drawPathLine(g: Graphics): void {
    if (this._path.length < 2) {
      return;
    }

    const { originX, originY, cellSize } = this._layout;
    let i = 0;

    while (i < this._path.length) {
      const entry = this._path[i];
      const cell = this._grid[entry.row][entry.col];
      const ownerNum = cell.ownerNumber ?? 1;
      g.strokeColor = LINE_COLORS[ownerNum - 1];
      g.lineWidth = 2;

      g.moveTo(
        originX + entry.col * cellSize + cellSize / 2,
        originY + entry.row * cellSize + cellSize / 2,
      );

      // 按 ownerNumber 分组连续线段，颜色变化时 stroke() 并开始新线段
      let j = i + 1;
      while (j < this._path.length) {
        const nextEntry = this._path[j];
        const nextCell = this._grid[nextEntry.row][nextEntry.col];
        const nextOwnerNum = nextCell.ownerNumber ?? 1;

        if (nextOwnerNum !== ownerNum) {
          break; // 颜色变化——结束当前段
        }

        g.lineTo(
          originX + nextEntry.col * cellSize + cellSize / 2,
          originY + nextEntry.row * cellSize + cellSize / 2,
        );
        j++;
      }

      g.stroke();
      i = j;
    }
  }

  /**
   * 绘制通关完成闪烁。
   *
   * Story 006 AC-5: 通关闪烁。
   * 当 _levelCompleteFired = true 时，对所有已填充格叠加透明度脉冲：
   * 透明度 1.0 -> 0.5 -> 1.0，持续 200ms，easeInOutSine 缓动。
   * 单次脉冲（不循环）。
   *
   * @param g     - Graphics 组件
   * @param nowMs - 当前时间戳 (performance.now())
   */
  private _drawCompletionBlink(g: Graphics, nowMs: number): void {
    if (!this._levelCompleteFired) {
      return;
    }

    const elapsed = nowMs - this._levelCompleteTime;
    if (elapsed > 200) {
      return;
    }

    const t = elapsed / 200;
    const alpha = 1.0 - 0.5 * easeInOutSine(1 - Math.abs(2 * t - 1));
    const alphaByte = Math.round(alpha * 255);

    const { originX, originY, cellSize, rows, cols } = this._layout;

    for (let num = 1; num <= 6; num++) {
      // 复用 _tempBlinkColors，避免渲染循环中 new Color()
      const baseColor = LINE_COLORS[num - 1];
      const blinkColor = _tempBlinkColors[num - 1];
      blinkColor.r = baseColor.r;
      blinkColor.g = baseColor.g;
      blinkColor.b = baseColor.b;
      blinkColor.a = alphaByte;
      g.fillColor = blinkColor;

      let hasAny = false;

      for (let r = 0; r < rows; r++) {
        const row = this._grid[r];
        for (let c = 0; c < cols; c++) {
          const cell = row[c];
          if (cell.ownerNumber === num && cell.filled) {
            const scale = getCellScale(cell, nowMs);
            const drawSize = cellSize * scale;
            const offset = (cellSize - drawSize) / 2;
            g.rect(
              originX + c * cellSize + offset,
              originY + r * cellSize + offset,
              drawSize,
              drawSize,
            );
            hasAny = true;
          }
        }
      }

      if (hasAny) {
        g.fill();
      }
    }
  }

  // ================================================================
  // 私有方法：辅助函数
  // ================================================================

  /**
   * 标记渲染脏——下一帧 update() 执行全量重绘。
   */
  private _markDirty(): void {
    this._renderDirty = true;
  }

  /**
   * 获取画布宽度。
   * 在 Cocos 运行时使用 view.getVisibleSize()，测试时可注入。
   *
   * @returns 画布宽度 (px)
   */
  private _getCanvasWidth(): number {
    const size = view.getVisibleSize();
    return size.width;
  }

  /**
   * 获取画布高度。
   *
   * @returns 画布高度 (px)
   */
  private _getCanvasHeight(): number {
    const size = view.getVisibleSize();
    return size.height;
  }

  /**
   * 检查网格坐标是否合法。
   *
   * @param row - 行号
   * @param col - 列号
   * @returns true 表示坐标在网格范围内
   */
  private _isValidCoord(row: number, col: number): boolean {
    return row >= 0 && row < this._layout.rows && col >= 0 && col < this._layout.cols;
  }

  /**
   * 推送事件给所有订阅者。
   * 按注册顺序同步执行回调，每个回调包裹 try-catch 防止单点崩溃。
   *
   * @param eventType - 事件类型
   * @param data      - 事件数据（可选）
   */
  private _emit(eventType: EngineEventType, data?: any): void {
    const subscribers = this._subscribers.get(eventType);
    if (!subscribers) {
      return;
    }

    const event: EngineEvent = { type: eventType, data };
    for (const cb of subscribers) {
      try {
        cb(event);
      } catch (e) {
        console.error('[GridEngine] Subscriber error:', e);
      }
    }
  }
}
