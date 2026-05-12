/**
 * InputManager — 触控输入管线核心逻辑
 *
 * ADR-005: 触控输入管线
 * 提供坐标映射、死区检测、状态守卫三个纯函数 + InputEvent 类型定义。
 *
 * 用法：
 * ```typescript
 * const coord = screenToGrid(touchX, touchY, config);
 * if (coord && isPastDeadZone(lastX, lastY, touchX, touchY) && isPlaying(state)) {
 *   // publish INPUT_MOVE
 * }
 * ```
 */

// ===== Types =====

export interface GridCoord {
  row: number;
  col: number;
}

export interface GridConfig {
  originX: number;
  originY: number;
  cellSize: number;
  rows: number;
  cols: number;
}

export type InputEventType = 'INPUT_MOVE' | 'INPUT_END';

export interface InputEvent {
  type: InputEventType;
  coord: GridCoord;
}

/** 端到端延迟预算 (ms) */
export const INPUT_DEAD_ZONE_PX = 4;

// ===== Pure Functions =====

/**
 * 将触屏坐标映射到网格坐标。
 * 超出网格范围返回 null（越界丢弃）。
 *
 * gridRow = floor((touchY - originY) / cellSize)
 * gridCol = floor((touchX - originX) / cellSize)
 */
export function screenToGrid(touchX: number, touchY: number, config: GridConfig): GridCoord | null {
  const col = Math.floor((touchX - config.originX) / config.cellSize);
  const row = Math.floor((touchY - config.originY) / config.cellSize);
  if (row < 0 || row >= config.rows || col < 0 || col >= config.cols) {
    return null;
  }
  return { row, col };
}

/**
 * 检测滑动距离是否超过死区阈值。
 * 低于阈值的微动视为手指颤抖，应忽略。
 */
export function isPastDeadZone(lastX: number, lastY: number, currentX: number, currentY: number): boolean {
  const dx = currentX - lastX;
  const dy = currentY - lastY;
  return Math.hypot(dx, dy) >= INPUT_DEAD_ZONE_PX;
}

/**
 * 状态守卫——仅当状态为 Playing 时通过。
 */
export function isPlaying(state: string): boolean {
  return state === 'Playing';
}

// ===== Subscriber Types =====

export type InputSubscriber = (event: InputEvent) => void;

// ===== InputManager Pipeline Class =====

/**
 * InputManager 完整管线——管理 Cocos 触摸事件绑定、坐标映射管线、订阅发布。
 *
 * 使用方式：
 * ```typescript
 * const mgr = new InputManager(canvasNode, () => stateMachine.getState(), gridConfig);
 * mgr.subscribe((event) => engine.onInputMove(event.coord.row, event.coord.col));
 * mgr.bind();  // 开始监听
 * // ...
 * mgr.unbind(); // 组件 onDestroy 时清理
 * ```
 */
export class InputManager {
  private _activeTouchId: number | null = null;
  private _lastX: number = 0;
  private _lastY: number = 0;
  private _subscribers: InputSubscriber[] = [];

  constructor(
    private _node: any, // cc.Node — Cocos 节点
    private _getState: () => string, // 状态守卫查询函数
    private _gridConfig: GridConfig,
  ) {}

  /** 绑定 Cocos 触摸事件 */
  bind(): void {
    this._node.on('touchstart', this._onTouchStart, this);
    this._node.on('touchmove', this._onTouchMove, this);
    this._node.on('touchend', this._onTouchEnd, this);
  }

  /** 解绑 Cocos 触摸事件 */
  unbind(): void {
    this._node.off('touchstart', this._onTouchStart, this);
    this._node.off('touchmove', this._onTouchMove, this);
    this._node.off('touchend', this._onTouchEnd, this);
    this._subscribers = [];
    this._activeTouchId = null;
  }

  /** 订阅输入事件。返回 unsubscribe 函数。 */
  subscribe(cb: InputSubscriber): () => void {
    this._subscribers.push(cb);
    return () => {
      const idx = this._subscribers.indexOf(cb);
      if (idx !== -1) this._subscribers.splice(idx, 1);
    };
  }

  // ---- Touch Handlers ----

  private _onTouchStart(event: any): void {
    event.preventDefault?.();
    if (this._activeTouchId !== null) return; // 多点触摸忽略
    const touch = event.touch;
    if (!touch) return; // 微信 JSB 边界
    const loc = touch.getUILocation();
    this._activeTouchId = event.getID();
    this._lastX = loc.x;
    this._lastY = loc.y;
  }

  private _onTouchMove(event: any): void {
    event.preventDefault?.();
    if (event.getID() !== this._activeTouchId) return; // 仅处理第一指
    if (!isPlaying(this._getState())) return; // 状态守卫
    const touch = event.touch;
    if (!touch) return;
    const loc = touch.getUILocation();

    // 死区过滤
    if (!isPastDeadZone(this._lastX, this._lastY, loc.x, loc.y)) return;

    // 坐标映射
    const coord = screenToGrid(loc.x, loc.y, this._gridConfig);
    if (!coord) return; // 越界丢弃

    this._lastX = loc.x;
    this._lastY = loc.y;

    // 发布事件（使用 .slice() 快照遍历）
    this._publish({ type: 'INPUT_MOVE', coord });
  }

  private _onTouchEnd(event: any): void {
    event.preventDefault?.();
    if (event.getID() !== this._activeTouchId) return;
    this._activeTouchId = null;

    if (!isPlaying(this._getState())) return; // 状态守卫

    // 获取最终坐标
    const touch = event.touch;
    if (!touch) return;
    const loc = touch.getUILocation();
    const coord = screenToGrid(loc.x, loc.y, this._gridConfig);
    if (!coord) return;

    this._publish({ type: 'INPUT_END', coord });
  }

  /** 发布事件给所有订阅者（.slice() 快照确保回调中 unsubscribe 安全） */
  private _publish(event: InputEvent): void {
    this._subscribers.slice().forEach(cb => cb(event));
  }
}
