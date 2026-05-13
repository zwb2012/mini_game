/**
 * GameBootstrap — 游戏入口组件
 *
 * 挂载到 GameScene 的 GameRoot 节点上。在 start() 中创建并连接所有系统，
 * 加载第一关，然后触控输入驱动完整游戏循环。
 *
 * 它替代了旧版模板的 bootstrap() 普通函数——Cocos Creator 的运行入口是
 * Component.start()，不是裸 TypeScript 入口。
 *
 * 生命周期：
 * ```
 * GameScene 加载
 *   → GameBootstrap.onLoad()       // 创建状态机 + 存储
 *   → GameBootstrap.start()        // 加载关卡 → init 引擎 → 激活输入
 *   → 玩家交互（输入管理器 → 引擎 → 状态机）
 *   → 通关 → LevelComplete
 *   → GameBootstrap.onDestroy()    // 清理所有系统
 * ```
 *
 * @ccclass GameBootstrap
 */

import { _decorator, AudioSource, Component, Node } from 'cc';
import { GridConnectionEngine } from '../grid-connection-engine/GridConnectionEngine';
import { GameStateMachine, GameState } from '../game-state-machine/GameStateMachine';
import { InputManager } from '../input-manager/InputManager';
import { SceneManager } from '../scene-manager/SceneManager';
import { AudioManager } from '../audio-manager/AudioManager';
import { LocalStorage } from '../local-storage/LocalStorage';
import { platformStorage } from '../local-storage/PlatformStorage';
import { LevelDataProvider } from '../level-data-schema/LevelDataProvider';

const { ccclass, property } = _decorator;

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
  // ---- Cocos Editor Properties ----

  /** GridConnectionEngine 组件引用——挂载在 GridRoot 节点上 */
  @property({ type: GridConnectionEngine })
  gridEngine: GridConnectionEngine | null = null;

  /** 画布节点——InputManager 监听其触摸事件 */
  @property({ type: Node })
  canvasNode: Node | null = null;

  // ---- 内部系统 ----

  private _stateMachine: GameStateMachine | null = null;
  private _inputManager: InputManager | null = null;
  private _audioManager: AudioManager | null = null;
  private _storage: LocalStorage | null = null;
  private _levelProvider: LevelDataProvider | null = null;
  private _sceneManager: SceneManager | null = null;

  /** 取消订阅函数集合——onDestroy 时批量清理 */
  private _unsubs: Array<() => void> = [];

  // ---- Cocos 生命周期 ----

  onLoad(): void {
    // 1. 创建状态机
    this._stateMachine = new GameStateMachine(GameState.Menu);

    // 2. 创建存储
    this._storage = new LocalStorage(platformStorage);

    // 3. 创建关卡数据提供者
    this._levelProvider = new LevelDataProvider();

    // 4. 创建场景管理器（需要状态机）
    this._sceneManager = new SceneManager(this._stateMachine);

    // 5. 注册 Playing 状态进入回调——init 引擎 + 激活输入
    this._unsubs.push(
      this._stateMachine.onEnter(GameState.Playing, (_, params) => {
        this._onEnterPlaying(params?.levelId ?? 1);
      }),
    );

    // 6. 注册 Paused 状态进入回调——停用输入
    this._unsubs.push(
      this._stateMachine.onEnter(GameState.Paused, () => {
        this._inputManager?.setActive(false);
      }),
    );

    // 7. 注册 Playing 状态退出回调——清理引擎
    this._unsubs.push(
      this._stateMachine.onExit(GameState.Playing, () => {
        this._inputManager?.setActive(false);
      }),
    );
  }

  async start(): Promise<void> {
    // 创建音频管理器并预加载
    this._audioManager = new AudioManager(this.node.getComponent(AudioSource)!, platformStorage);
    await this._audioManager.preload();

    // 启动：进入菜单
    this._stateMachine!.transition('SELECT_LEVEL', { levelId: 1 });
  }

  onDestroy(): void {
    // 清理所有订阅
    for (const unsub of this._unsubs) {
      unsub();
    }
    this._unsubs = [];

    // 销毁系统
    this._inputManager?.destroy();
    this._stateMachine?.destroy();
    this._audioManager = null;
    this._storage = null;
    this._levelProvider = null;
    this._sceneManager = null;
  }

  // ---- 私有方法 ----

  /**
   * 进入 Playing 状态时的初始化。
   *
   * 1. 加载关卡数据
   * 2. 初始化网格连线引擎
   * 3. 创建输入管理器并绑定触摸事件
   * 4. 注册音频事件订阅（stepChange → TICK, levelComplete → LEVEL_COMPLETE）
   *
   * @param levelId - 要加载的关卡 ID
   */
  private _onEnterPlaying(levelId: number): void {
    if (!this.gridEngine) {
      console.error('[GameBootstrap] gridEngine not assigned in editor');
      return;
    }

    if (!this.canvasNode) {
      console.error('[GameBootstrap] canvasNode not assigned in editor');
      return;
    }

    // 1. 加载关卡
    const level = this._levelProvider!.getLevel(levelId);
    if (!level) {
      console.error('[GameBootstrap] Level ' + levelId + ' not found');
      this._stateMachine!.transition('BACK_TO_MENU');
      return;
    }

    // 2. 初始化引擎
    const ok = this.gridEngine.init(level);
    if (!ok) {
      console.error('[GameBootstrap] Engine init failed for level ' + levelId);
      this._stateMachine!.transition('BACK_TO_MENU');
      return;
    }

    // 3. 创建输入管理器
    const layout = this.gridEngine.getGridLayout();
    const gridConfig = {
      originX: layout.originX,
      originY: layout.originY,
      cellSize: layout.cellSize,
      rows: layout.rows,
      cols: layout.cols,
    };

    if (this._inputManager) {
      this._inputManager.destroy();
    }

    this._inputManager = new InputManager(
      this.canvasNode,
      () => this._stateMachine!.getState() === GameState.Playing ? 'Playing' : this._stateMachine!.getState(),
      gridConfig,
    );

    // 绑定触摸事件 → 引擎 onInputMove/onInputEnd
    this._inputManager.subscribe((event) => {
      if (event.type === 'INPUT_MOVE') {
        this.gridEngine!.onInputMove(event.coord.row, event.coord.col);
      } else if (event.type === 'INPUT_END') {
        this.gridEngine!.onInputEnd();
      }
    });

    // 注册输入管理器
    this._inputManager.bind();

    // 4. 注册引擎事件 → 音频同步
    if (this._audioManager) {
      // 步数变化 → 音频咔嗒
      this._unsubs.push(
        this.gridEngine.subscribe('stepChange', (event) => {
          const data = event.data;
          if (data && data.delta > 0) {
            this._audioManager!.play('TICK');
          } else if (data && data.delta < 0) {
            this._audioManager!.play('TICK'); // Story 006: undo audio
          }
        }),
      );

      // 通关 → 通关音效
      this._unsubs.push(
        this.gridEngine.subscribe('levelComplete', () => {
          this._audioManager!.play('LEVEL_COMPLETE');
          this._stateMachine!.transition('LEVEL_COMPLETE', {
            levelId,
            finalSteps: this.gridEngine!.getStepCount(),
          });
        }),
      );
    }

    // 5. 引擎错误 → 回到菜单
    this._unsubs.push(
      this.gridEngine.subscribe('engineError', () => {
        console.error('[GameBootstrap] Engine error — returning to menu');
        this._stateMachine!.transition('BACK_TO_MENU');
      }),
    );
  }
}
