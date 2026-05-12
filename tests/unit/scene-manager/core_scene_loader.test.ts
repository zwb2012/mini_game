/**
 * SceneManager 单元测试
 *
 * 覆盖场景：
 *   1. 初始 Menu 状态自动加载 MenuScene
 *   2. MenuScene 加载完成后后台预加载 GameScene
 *   3. SELECT_LEVEL 跳转加载 GameScene 并传递 levelId
 *   4. RESUME（Paused -> Playing）跳过场景重载
 *   5. 关卡参数缓存可供目标场景读取
 *   6. 预加载仅执行一次（多次进入 Menu 不重复 preload）
 *
 * 测试原则：
 *   - 所有 Cocos director API 已 mock，回调同步执行
 *   - 每个验收条件对应 >=1 条测试用例
 *   - 测试命名：test_[场景]_[预期结果]
 *   - 三段式：Arrange / Act / Assert
 *
 * GDD: game-state-machine.md
 * ADR-001: 游戏状态机架构
 */

import { director } from 'cc';
import { GameStateMachine, GameState } from '../../../src/core/game-state-machine/GameStateMachine';
import { SceneManager } from '../../../src/core/scene-manager/SceneManager';

// ============================================================
// 辅助函数
// ============================================================

/** 重置所有 director mock 的调用记录（保留 mock 实现） */
function clearDirectorMocks(): void {
  (director.loadScene as jest.Mock).mockClear();
  (director.preloadScene as jest.Mock).mockClear();
}

// ============================================================
// 套件：初始状态 & 菜单加载
// ============================================================

describe('SceneManager — initial state & menu loading', () => {
  test('test_scene_manager_initial_menu_loads_menu_scene', () => {
    // Arrange
    const sm = new GameStateMachine();

    // Act
    new SceneManager(sm);

    // Assert
    expect(director.loadScene).toHaveBeenCalledWith('MenuScene', expect.any(Function));
  });

  test('test_scene_manager_after_menu_loaded_current_scene_is_menu_scene', () => {
    // Arrange
    const sm = new GameStateMachine();

    // Act
    const sceneManager = new SceneManager(sm);

    // Assert — onLaunched callback fires synchronously in mock
    expect(sceneManager.getCurrentScene()).toBe('MenuScene');
  });
});

// ============================================================
// 套件：GameScene 后台预加载
// ============================================================

describe('SceneManager — GameScene preloading', () => {
  test('test_scene_manager_menu_load_triggers_game_scene_preload', () => {
    // Arrange & Act
    const sm = new GameStateMachine();
    new SceneManager(sm);

    // Assert — preloadScene should have been called after loadScene's onLaunched
    expect(director.preloadScene).toHaveBeenCalledWith('GameScene', expect.any(Function));
  });

  test('test_scene_manager_preload_sets_game_scene_preloaded_flag', () => {
    // Arrange & Act
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);

    // Assert — onFinished callback fires synchronously in mock
    expect(sceneManager.isGameScenePreloaded()).toBe(true);
  });

  test('test_scene_manager_preload_only_once_when_returning_to_menu', () => {
    // Arrange
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Act — transition to Playing and back to Menu
    sm.transition('SELECT_LEVEL', { levelId: 1 });
    clearDirectorMocks();
    sm.transition('LEVEL_COMPLETE');
    sm.transition('BACK_TO_MENU');

    // Assert — preloadScene should NOT be called again
    expect(director.preloadScene).not.toHaveBeenCalled();
  });
});

// ============================================================
// 套件：Playing 状态 & 关卡加载
// ============================================================

describe('SceneManager — Playing state & level loading', () => {
  test('test_scene_manager_select_level_loads_game_scene', () => {
    // Arrange
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Act
    sm.transition('SELECT_LEVEL', { levelId: 3 });

    // Assert
    expect(director.loadScene).toHaveBeenCalledWith('GameScene', expect.any(Function));
    expect(sceneManager.getLoadParams()).toEqual({ levelId: 3 });
  });

  test('test_scene_manager_after_game_scene_loaded_current_scene_is_game_scene', () => {
    // Arrange
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Act
    sm.transition('SELECT_LEVEL', { levelId: 3 });

    // Assert — onLaunched fires synchronously in mock
    expect(sceneManager.getCurrentScene()).toBe('GameScene');
  });

  test('test_scene_manager_select_level_stores_level_id_params', () => {
    // Arrange
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Act
    sm.transition('SELECT_LEVEL', { levelId: 7 });

    // Assert — getLoadParams returns the correct levelId
    expect(sceneManager.getLoadParams()).toEqual({ levelId: 7 });
  });
});

// ============================================================
// 套件：RESUME 跳过重载
// ============================================================

describe('SceneManager — RESUME skips reload', () => {
  test('test_scene_manager_resume_from_paused_does_not_reload_game_scene', () => {
    // Arrange
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Load GameScene
    sm.transition('SELECT_LEVEL', { levelId: 1 });
    clearDirectorMocks();

    // Act — pause and resume
    sm.transition('PAUSE');
    sm.transition('RESUME');

    // Assert — loadScene should not have been called again
    expect(director.loadScene).not.toHaveBeenCalled();
    expect(sceneManager.getCurrentScene()).toBe('GameScene');
  });
});

// ============================================================
// 套件：REPLAY 使用缓存的 levelId
// ============================================================

describe('SceneManager — REPLAY uses cached levelId', () => {
  test('test_scene_manager_replay_reloads_game_scene_with_cached_level_id', () => {
    // Arrange
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Load GameScene with levelId=5
    sm.transition('SELECT_LEVEL', { levelId: 5 });
    clearDirectorMocks();

    // Act — complete level and replay
    sm.transition('LEVEL_COMPLETE');
    sm.transition('REPLAY');

    // Assert — GameScene is reloaded (not skipped like RESUME)
    expect(director.loadScene).toHaveBeenCalledWith('GameScene', expect.any(Function));
    expect(sceneManager.getLoadParams()).toEqual({ levelId: 5 });
  });
});

// ============================================================
// 套件：NEXT_LEVEL 使用新 levelId
// ============================================================

describe('SceneManager — NEXT_LEVEL uses new levelId', () => {
  test('test_scene_manager_next_level_loads_game_scene_with_new_level_id', () => {
    // Arrange
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Load GameScene with levelId=5 first
    sm.transition('SELECT_LEVEL', { levelId: 5 });
    clearDirectorMocks();

    // Act — complete level and go to next
    sm.transition('LEVEL_COMPLETE');
    sm.transition('NEXT_LEVEL', { levelId: 6 });

    // Assert — GameScene is reloaded with new levelId
    expect(director.loadScene).toHaveBeenCalledWith('GameScene', expect.any(Function));
    expect(sceneManager.getLoadParams()).toEqual({ levelId: 6 });
  });
});
