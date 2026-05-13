/**
 * 网格连线引擎类型定义 (Grid Connection Engine Types)
 *
 * 定义网格单元、内部状态、路径条目、箭头数据、事件类型等核心类型。
 * 所有类型为零 Cocos 依赖的纯 TypeScript，可在 Jest 中独立测试。
 *
 * ADR-002: 网格渲染策略
 * ADR-003: 数据流模式 (Push/Pull)
 * GDD: grid-connection-engine.md
 *
 * @module grid-connection-engine/types
 */

// ===== 网格数据结构 =====

/**
 * 单个网格单元。
 * 每个 Cell 代表网格中的一个格子，记录其填充状态、所属数字、是否为节点/障碍等。
 */
export interface Cell {
  /** 是否已被填充（连线经过时设 true） */
  filled: boolean;
  /** 填充该格的数字编号（1-6），null 表示未填充 */
  ownerNumber: number | null;
  /** 是否为数字节点 */
  isNode: boolean;
  /** 节点上的数字编号（1-6），null 表示非节点格 */
  nodeNumber: number | null;
  /** 是否为障碍格（不可通过） */
  isBlocked: boolean;
  /** 填充时刻的时间戳（ms），用于填充动画计算；null 表示未填充 */
  filledAt: number | null;
}

// ===== 引擎状态机 =====

/**
 * 引擎内部状态。
 * Idle → Drawing → Dirty
 *
 * - Idle:    无触摸，等待玩家开始画线。onEnter(Playing) 初始化后即此状态。
 * - Drawing: 手指按下并滑动中。首次有效 INPUT_MOVE 触发 Idle→Drawing。
 * - Dirty:   手指抬起，等待继续或新路径。INPUT_END 触发 Drawing→Dirty。
 *
 * 参考 GDD: grid-connection-engine.md → States and Transitions
 */
export enum EngineState {
  /** 无触摸，等待玩家开始画线 */
  Idle = 'Idle',
  /** 手指按下并滑动中 */
  Drawing = 'Drawing',
  /** 手指抬起，等待继续或新路径 */
  Dirty = 'Dirty',
}

// ===== 路径数据 =====

/**
 * 路径条目——记录单个被填充的格子。
 * 用于路径追踪、撤销和通关检测。
 */
export interface PathEntry {
  /** 行号 */
  row: number;
  /** 列号 */
  col: number;
  /** 是否已锁定（当前数字段完成后标记锁定——Story 002） */
  locked: boolean;
}

// ===== 提示箭头数据（Story 008 实现，此处仅定义类型） =====

/**
 * 提示箭头方向。
 */
export enum ArrowDirection {
  Up = 'Up',
  Down = 'Down',
  Left = 'Left',
  Right = 'Right',
}

/**
 * 提示箭头数据——指示玩家下一步应走向哪个格子。
 * Story 008: 提示系统使用。
 */
export interface ArrowData {
  /** 箭头所在行 */
  row: number;
  /** 箭头所在列 */
  col: number;
  /** 方向指示 */
  direction: ArrowDirection;
}

// ===== 网格布局 =====

/**
 * 网格渲染布局参数。
 * 由引擎在 init() 时计算，供输入管理器（InputManager）和渲染层使用。
 */
export interface GridLayout {
  /** 网格左上角 X（Canvas 坐标） */
  originX: number;
  /** 网格左上角 Y（Canvas 坐标） */
  originY: number;
  /** 单格边长 (px)，自动计算 = min(canvasW/cols, canvasH/rows, 120) */
  cellSize: number;
  /** 网格行数 */
  rows: number;
  /** 网格列数 */
  cols: number;
}

// ===== 事件系统（ADR-003 Push 模式） =====

/**
 * 引擎可推送的事件类型。
 * - stepChange:   步数变化（每成功填充一格 +1，每撤销一格 -1）
 * - levelComplete: 通关事件（Story 005 实现）
 * - engineError:   引擎初始化失败等错误
 */
export type EngineEventType = 'stepChange' | 'levelComplete' | 'engineError';

/**
 * 引擎事件数据。
 * 通过 subscribe() 推送给订阅者。
 */
export interface EngineEvent {
  /** 事件类型 */
  type: EngineEventType;
  /** 事件相关数据（可选） */
  data?: any;
}

/**
 * 引擎事件回调签名。
 *
 * @param event - 引擎事件对象
 */
export type EngineCallback = (event: EngineEvent) => void;

/**
 * stepChange 事件的数据载荷类型。
 */
export interface StepChangeData {
  /** 步数变化量（+1 填充，-1 撤销） */
  delta: number;
  /** 当前总步数 */
  total: number;
}
