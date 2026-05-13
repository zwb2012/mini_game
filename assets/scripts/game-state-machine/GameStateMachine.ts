/**
 * GameStateMachine — 游戏核心状态机
 *
 * 纯 TypeScript 实现，零 Cocos API 依赖。管理 Menu / Playing / Paused / LevelComplete
 * 四状态间的合法转换，支持 onEnter/onExit 回调注册。
 *
 * 用法：
 * ```typescript
 * const sm = new GameStateMachine();
 * sm.onEnter(GameState.Playing, () => { /* 初始化网格 *\/ });
 * sm.transition('SELECT_LEVEL', { levelId: 1 });
 * console.log(sm.getState()); // GameState.Playing
 * ```
 *
 * 转换表（8 条合法规则）：
 *   Menu       -- SELECT_LEVEL  --> Playing
 *   Playing    -- PAUSE          --> Paused
 *   Paused     -- RESUME         --> Playing
 *   Paused     -- QUIT_TO_MENU   --> Menu
 *   Playing    -- LEVEL_COMPLETE --> LevelComplete
 *   LevelComplete -- NEXT_LEVEL  --> Playing    (需 levelId 有效)
 *   LevelComplete -- REPLAY      --> Playing
 *   LevelComplete -- BACK_TO_MENU --> Menu
 *
 * ADR-001: 游戏状态机架构
 * GDD: game-state-machine.md
 */

/** 游戏运行时状态枚举 */
export enum GameState {
  Menu = 'Menu',
  Playing = 'Playing',
  Paused = 'Paused',
  LevelComplete = 'LevelComplete',
}

/**
 * 状态转换回调签名。
 * @param prevState  转换前的状态
 * @param params     转换时携带的参数（如 {levelId: number}）
 */
export type StateCallback = (prevState: GameState, params?: any) => void;

/** 转换规则内部接口 */
interface TransitionRule {
  target: GameState;
  /** 可选条件函数，返回 false 则本次转换被静默忽略 */
  condition?: (params?: any) => boolean;
}

/**
 * GameStateMachine — 游戏核心状态机
 *
 * 采用回调注册模式：系统通过 onEnter/onExit 注册监听，状态转换时按注册顺序
 * 同步执行所有回调。非法转换被静默忽略（不抛异常）。
 */
export class GameStateMachine {
  /** 当前状态 */
  private _currentState: GameState;

  /** 转换表：当前状态 → (事件 → 转换规则) */
  private _transitions: Map<GameState, Map<string, TransitionRule>>;

  /** 进入回调表：状态 → 回调集合 */
  private _enterCallbacks: Map<GameState, Set<StateCallback>>;

  /** 退出回调表：状态 → 回调集合 */
  private _exitCallbacks: Map<GameState, Set<StateCallback>>;

  /** 销毁标记——destroy() 后拒绝所有转换 */
  private _destroyed: boolean;

  /** 正在转换中标记——用于快速连续转换排队 */
  private _isTransitioning: boolean;

  /** 待处理的转换请求（排队机制，覆盖前一个 pending） */
  private _pending: { event: string; params?: any } | null;

  /**
   * @param initialState 初始状态，默认 Menu
   */
  constructor(initialState: GameState = GameState.Menu) {
    this._currentState = initialState;
    this._transitions = new Map();
    this._enterCallbacks = new Map();
    this._exitCallbacks = new Map();
    this._destroyed = false;
    this._isTransitioning = false;
    this._pending = null;
    this._initTransitions();
    this._initWeChatLifecycle();
  }

  // ---- Public API ----

  /**
   * 返回当前状态。同步，O(1)。
   *
   * @example
   * ```typescript
   * const state = sm.getState();
   * if (state === GameState.Playing) { /* 处理输入 *\/ }
   * ```
   */
  getState(): GameState {
    return this._currentState;
  }

  /**
   * 触发状态转换。
   *
   * 流程：
   *   1. 根据当前状态 + 事件查转换表
   *   2. 如有 condition 则调用检查（不满足则静默忽略）
   *   3. 更新 _currentState 为目标状态
   *   4. 同步执行 onExit(上一状态) 回调链
   *   5. 同步执行 onEnter(新状态) 回调链
   *
   * 非法转换（表中不存在规则）被静默忽略。
   *
   * @param event  触发事件名（如 'SELECT_LEVEL'）
   * @param params 传递给回调的可选参数
   *
   * @example
   * ```typescript
   * sm.transition('SELECT_LEVEL', { levelId: 1 });
   * sm.transition('PAUSE');
   * ```
   */
  transition(event: string, params?: any): void {
    // 销毁守卫——destroyed 后拒绝所有转换
    if (this._destroyed) {
      console.warn('[GSM] Destroyed — rejecting transition');
      return;
    }

    // 排队守卫——正在转换时新请求排队
    if (this._isTransitioning) {
      this._pending = { event, params };
      return;
    }

    const stateTransitions = this._transitions.get(this._currentState);
    if (!stateTransitions) {
      console.warn('[GSM] Illegal transition: %s → %s', this._currentState, event);
      return;
    }

    const rule = stateTransitions.get(event);
    if (!rule) {
      console.warn('[GSM] Illegal transition: %s → %s', this._currentState, event);
      return;
    }

    // 条件检查
    if (rule.condition && !rule.condition(params)) {
      return;
    }

    // 同一状态重复检查——无副作用
    if (rule.target === this._currentState) {
      return;
    }

    this._isTransitioning = true;
    const prevState = this._currentState;
    this._currentState = rule.target;

    // 执行 onExit 回调（上一状态）
    this._executeCallbacks(this._exitCallbacks, prevState, prevState, params);

    // 执行 onEnter 回调（新状态）
    this._executeCallbacks(this._enterCallbacks, rule.target, prevState, params);

    // 转换完成后检查 pending 队列
    this._isTransitioning = false;
    if (this._pending) {
      const next = this._pending;
      this._pending = null;
      this.transition(next.event, next.params);
    }
  }

  /**
   * 注册状态进入回调。
   *
   * 每次进入 state 时，cb 会被按注册顺序同步调用。
   * 返回取消注册函数。
   *
   * @param state 要监听的状态
   * @param cb    回调函数
   * @returns 取消注册函数
   *
   * @example
   * ```typescript
   * const unsub = sm.onEnter(GameState.Playing, () => {
   *   grid.init();
   * });
   * // 不再需要时：
   * unsub();
   * ```
   */
  onEnter(state: GameState, cb: StateCallback): () => void {
    if (!this._enterCallbacks.has(state)) {
      this._enterCallbacks.set(state, new Set());
    }
    this._enterCallbacks.get(state)!.add(cb);
    return () => {
      this._enterCallbacks.get(state)?.delete(cb);
    };
  }

  /**
   * 注册状态退出回调。
   *
   * 每次退出 state 时，cb 会被按注册顺序同步调用。
   * 返回取消注册函数。
   *
   * @param state 要监听的状态
   * @param cb    回调函数
   * @returns 取消注册函数
   *
   * @example
   * ```typescript
   * const unsub = sm.onExit(GameState.Playing, () => {
   *   timer.pause();
   * });
   * ```
   */
  onExit(state: GameState, cb: StateCallback): () => void {
    if (!this._exitCallbacks.has(state)) {
      this._exitCallbacks.set(state, new Set());
    }
    this._exitCallbacks.get(state)!.add(cb);
    return () => {
      this._exitCallbacks.get(state)?.delete(cb);
    };
  }

  /**
   * 销毁状态机——标记为已销毁，清除所有回调和转换表。
   * 销毁后任何 transition() 请求被静默忽略 + console.warn。
   */
  destroy(): void {
    this._destroyed = true;
    this._enterCallbacks.clear();
    this._exitCallbacks.clear();
    this._transitions.clear();
  }

  // ---- Private ----

  /** 初始化 8 条合法转换规则 */
  private _initTransitions(): void {
    // Menu -> Playing
    this._addTransition(GameState.Menu, 'SELECT_LEVEL', {
      target: GameState.Playing,
      condition: (params) => params?.levelId != null,
    });

    // Playing -> Paused
    this._addTransition(GameState.Playing, 'PAUSE', {
      target: GameState.Paused,
    });

    // Paused -> Playing
    this._addTransition(GameState.Paused, 'RESUME', {
      target: GameState.Playing,
    });

    // Paused -> Menu
    this._addTransition(GameState.Paused, 'QUIT_TO_MENU', {
      target: GameState.Menu,
    });

    // Playing -> LevelComplete
    this._addTransition(GameState.Playing, 'LEVEL_COMPLETE', {
      target: GameState.LevelComplete,
    });

    // LevelComplete -> Playing (需 levelId 有效)
    this._addTransition(GameState.LevelComplete, 'NEXT_LEVEL', {
      target: GameState.Playing,
      condition: (params) => params?.levelId != null,
    });

    // LevelComplete -> Playing (重玩)
    this._addTransition(GameState.LevelComplete, 'REPLAY', {
      target: GameState.Playing,
    });

    // LevelComplete -> Menu
    this._addTransition(GameState.LevelComplete, 'BACK_TO_MENU', {
      target: GameState.Menu,
    });
  }

  /** 向转换表添加一条规则 */
  private _addTransition(from: GameState, event: string, rule: TransitionRule): void {
    if (!this._transitions.has(from)) {
      this._transitions.set(from, new Map());
    }
    this._transitions.get(from)!.set(event, rule);
  }

  /** 注册微信生命周期回调——切后台时自动 PAUSE（Web 预览模式静默跳过） */
  private _initWeChatLifecycle(): void {
    const wxGlobal = (globalThis as any).wx;
    if (typeof wxGlobal !== 'undefined' && typeof wxGlobal.onHide === 'function') {
      wxGlobal.onHide(() => {
        if (this._destroyed) return;
        if (this._currentState === GameState.Playing) {
          this.transition('PAUSE');
        }
      });
    }
  }

  /** 同步执行指定回调集合（每个回调包裹 try-catch，异常不阻断链） */
  private _executeCallbacks(
    map: Map<GameState, Set<StateCallback>>,
    state: GameState,
    prevState: GameState,
    params?: any,
  ): void {
    const callbacks = map.get(state);
    if (!callbacks) return;
    for (const cb of callbacks) {
      try {
        cb(prevState, params);
      } catch (e) {
        console.error('[GSM] Callback error:', e);
      }
    }
  }
}
