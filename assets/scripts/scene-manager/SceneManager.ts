/**
 * SceneManager — 场景生命周期管理器
 *
 * 职责：
 *   1. 监听 GameStateMachine 状态转换，自动加载对应场景
 *   2. Menu 状态 -> 加载 MenuScene，加载完成后后台预加载 GameScene
 *   3. Playing 状态 -> 加载 GameScene 并传递关卡参数（levelId）
 *
 * 依赖注入：构造函数接收 GameStateMachine 实例，不依赖全局单例。
 * 零 Cocos 运行时依赖（director 通过 import 引入，测试时由 mock 替换）。
 *
 * 场景加载流程：
 * ```
 * 初始状态 (Menu)
 *   └─ SceneManager 构造 → _loadMenuScene()
 *        ├─ director.loadScene('MenuScene', onLaunched)
 *        └─ onLaunched → director.preloadScene('GameScene')
 *             └─ _gameScenePreloaded = true
 *
 * transition('SELECT_LEVEL', { levelId })
 *   └─ onEnter(Playing) → _loadGameScene(prevState, params)
 *        ├─ _loadParams = { levelId }
 *        └─ director.loadScene('GameScene', onLaunched)
 *             └─ _currentScene = 'GameScene'
 *
 * transition('RESUME')  [Paused -> Playing]
 *   └─ prevState === Paused → 跳过重载（场景已在内存中）
 * ```
 *
 * GDD: game-state-machine.md
 * ADR-001: 游戏状态机架构
 */

import { director } from 'cc';
import { GameStateMachine, GameState } from '../game-state-machine/GameStateMachine';

export class SceneManager {
  /** 依赖的状态机实例 */
  private _stateMachine: GameStateMachine;

  /** 当前已加载的场景名称（空串表示无场景） */
  private _currentScene: string = '';

  /** GameScene 是否已完成后台预加载 */
  private _gameScenePreloaded: boolean = false;

  /**
   * 关卡加载参数缓存。
   * 由 _loadGameScene 在调用 director.loadScene 前写入，
   * 供目标场景（GameScene）的 onLoad 方法通过 getLoadParams() 读取。
   */
  private _loadParams: { levelId: number } | null = null;

  /**
   * 待处理加载 ID 计数器。
   * 每次调用 _loadMenuScene / _loadGameScene 时递增，
   * onLaunched 回调通过闭包捕获此值，与当前值比对以判断是否为陈旧回调。
   * 用于快速连续转换去重。
   */
  private _pendingLoadId: number = 0;

  /**
   * 回退加载中标志。
   * 当 GameScene 加载失败回退到 MenuScene 时设置为 true，
   * 防止 MenuScene 也失败时产生无限递归。
   */
  private _isFallbackLoading: boolean = false;

  /**
   * @param stateMachine 游戏状态机实例（依赖注入）
   *
   * @example
   * ```typescript
   * const sm = new GameStateMachine();
   * const sceneManager = new SceneManager(sm);
   * ```
   */
  constructor(stateMachine: GameStateMachine) {
    this._stateMachine = stateMachine;

    // 注册状态进入回调
    stateMachine.onEnter(GameState.Menu, () => this._loadMenuScene());
    stateMachine.onEnter(GameState.Playing, (prevState, params) =>
      this._loadGameScene(prevState, params),
    );

    // 初始状态为 Menu 时立即加载菜单场景
    if (stateMachine.getState() === GameState.Menu) {
      this._loadMenuScene();
    }
  }

  // ---- Public API ----

  /**
   * 返回当前已加载的场景名称。
   *
   * @returns 场景名称，如 'MenuScene'、'GameScene'；无场景时返回空串
   *
   * @example
   * ```typescript
   * const scene = sceneManager.getCurrentScene();
   * // 'MenuScene' | 'GameScene' | ''
   * ```
   */
  getCurrentScene(): string {
    return this._currentScene;
  }

  /**
   * GameScene 是否已完成后台预加载。
   *
   * 预加载在 MenuScene 加载完成后自动触发。
   * 为 true 时跳转关卡可实现无缝场景切换。
   *
   * @example
   * ```typescript
   * if (sceneManager.isGameScenePreloaded()) {
   *   console.log('GameScene 已就绪，无缝切换');
   * }
   * ```
   */
  isGameScenePreloaded(): boolean {
    return this._gameScenePreloaded;
  }

  /**
   * 返回当前关卡加载参数。
   *
   * 供目标场景（GameScene）在其 onLoad 生命周期中调用，
   * 获取本次跳转的关卡 ID。
   *
   * @returns { levelId: number } | null — 有挂载参数时返回对象，否则 null
   *
   * @example
   * ```typescript
   * // 在 GameScene 组件中：
   * const params = sceneManager.getLoadParams();
   * if (params) {
   *   this.initLevel(params.levelId);
   * }
   * ```
   */
  getLoadParams(): { levelId: number } | null {
    return this._loadParams;
  }

  // ---- Private ----

  /**
   * 加载菜单场景。
   *
   * 调用 Cocos director.loadScene 加载 MenuScene。
   * 每次调用递增 _pendingLoadId，onLaunched 闭包捕获当前值用于陈旧回调判断。
   * 加载完成后自动触发 GameScene 后台预加载。
   */
  private _loadMenuScene(): void {
    const loadId = ++this._pendingLoadId;

    director.loadScene('MenuScene', (err) => {
      // 快速连续转换去重：闭包 loadId 与当前 _pendingLoadId 不一致则丢弃
      if (this._pendingLoadId !== loadId) {
        return;
      }

      if (err) {
        console.error('[SceneManager] Failed to load MenuScene:', err);
        return;
      }
      this._currentScene = 'MenuScene';
      this._preloadGameScene();
    });
  }

  /**
   * 后台预加载 GameScene（仅执行一次）。
   *
   * 使用 director.preloadScene 在 MenuScene 展示期间静默加载 GameScene，
   * 玩家选择关卡后可直接无缝切换到 GameScene。
   */
  private _preloadGameScene(): void {
    if (this._gameScenePreloaded) {
      return;
    }

    director.preloadScene('GameScene', (err) => {
      if (err) {
        console.error('[SceneManager] Failed to preload GameScene:', err);
        return;
      }
      this._gameScenePreloaded = true;
    });
  }

  /**
   * 加载游戏场景。
   *
   * 处理逻辑：
   *   - RESUME（Paused -> Playing）：场景已在内存中，跳过重载
   *   - 重复加载守卫（GameScene 已加载且非 LevelComplete 来源）：静默忽略
   *   - REPLAY（LevelComplete -> Playing）：使用缓存的 levelId 重载场景
   *   - SELECT_LEVEL / NEXT_LEVEL：使用 params.levelId
   *   - 加载失败：回退到 MenuScene（带无限循环守卫）
   *
   * @param prevState 转换前状态（用于判断 RESUME 场景）
   * @param params    转换参数（可能包含 levelId）
   */
  private _loadGameScene(prevState: GameState, params?: any): void {
    // RESUME 恢复：场景已在内存中，无需重载
    if (prevState === GameState.Paused && this._currentScene === 'GameScene') {
      return;
    }

    // 重复加载守卫：已在 GameScene 且非 LevelComplete 来源的重载，静默忽略
    if (this._currentScene === 'GameScene' && prevState !== GameState.LevelComplete) {
      return;
    }

    // 确定关卡 ID：优先 params.levelId，其次缓存的 _loadParams.levelId
    const levelId = params?.levelId ?? this._loadParams?.levelId;

    if (levelId == null) {
      console.warn('[SceneManager] No levelId available — skipping GameScene load');
      return;
    }

    // 缓存关卡参数（供 GameScene.onLoad 使用）
    this._loadParams = { levelId };
    const loadId = ++this._pendingLoadId;

    director.loadScene('GameScene', (err) => {
      // 快速连续转换去重：闭包 loadId 与当前 _pendingLoadId 不一致则丢弃
      if (this._pendingLoadId !== loadId) {
        return;
      }

      if (err) {
        console.error('[SceneManager] Failed to load GameScene:', err);
        this._fallbackToMenuScene();
        return;
      }
      this._currentScene = 'GameScene';
    });
  }

  /**
   * 回退到菜单场景。
   *
   * 在 GameScene 加载失败时调用，尝试加载 MenuScene 作为兜底。
   * 使用 _isFallbackLoading 标志防止 MenuScene 也失败时产生无限递归。
   */
  private _fallbackToMenuScene(): void {
    if (this._isFallbackLoading) {
      console.error('[SceneManager] Already attempting fallback to MenuScene — aborting');
      return;
    }

    this._isFallbackLoading = true;
    const loadId = ++this._pendingLoadId;

    director.loadScene('MenuScene', (err) => {
      this._isFallbackLoading = false;

      // 陈旧回调丢弃
      if (this._pendingLoadId !== loadId) {
        return;
      }

      if (err) {
        console.error('[SceneManager] Fallback to MenuScene also failed:', err);
        return;
      }
      this._currentScene = 'MenuScene';
      this._preloadGameScene();
    });
  }
}
