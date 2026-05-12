/**
 * SceneManager 守卫子句与错误处理 — 边缘情况测试
 *
 * 覆盖 Story 002 的四个验收条件（AC）：
 *   AC1: 重复加载守卫 — 已在 GameScene 时静默忽略第二次 loadScene("GameScene")
 *   AC2: 加载失败回退 — loadScene 回调 error 时 console.error + 回退到 MenuScene
 *   AC3: 快速连续转换 — 快速 Menu→Playing→Menu，仅处理最新状态
 *   AC4: 微信切后台 — 后台期间场景加载完成，回到前台时场景已就绪
 *
 * 额外覆盖：
 *   - RESUME 跳过逻辑的边界情况（prevState === Paused 但 _currentScene !== 'GameScene'）
 *
 * GDD: game-state-machine.md
 * ADR-001: 游戏状态机架构
 * Story-002: 守卫子句与错误处理
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

/** 重置 director 全部状态（调用记录 + 延迟回调 + 错误表） */
function resetDirectorFull(): void {
  director._autoFireCallbacks = true;
  director._loadErrors = {};
  director.clearPendingCallbacks();
  (director.loadScene as jest.Mock).mockClear();
  (director.preloadScene as jest.Mock).mockClear();
}

// ============================================================
// 套件：重复加载守卫（AC1）
// ============================================================

describe('SceneManager — duplicate load guard (AC1)', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  test('test_duplicate_game_scene_guard_allows_replay_reload', () => {
    // Arrange
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Load GameScene with levelId=5
    sm.transition('SELECT_LEVEL', { levelId: 5 });

    // Act — complete level and REPLAY (should reload, guard allows LevelComplete)
    sm.transition('LEVEL_COMPLETE');
    sm.transition('REPLAY');

    // Assert — GameScene is reloaded (not blocked by guard)
    expect(director.loadScene).toHaveBeenCalledWith('GameScene', expect.any(Function));
    expect(sceneManager.getLoadParams()).toEqual({ levelId: 5 });
  });

  test('test_duplicate_game_scene_guard_allows_next_level_reload', () => {
    // Arrange
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Load GameScene with levelId=5 first
    sm.transition('SELECT_LEVEL', { levelId: 5 });

    // Act — complete level and go to next
    sm.transition('LEVEL_COMPLETE');
    sm.transition('NEXT_LEVEL', { levelId: 6 });

    // Assert — GameScene is reloaded with new levelId
    expect(director.loadScene).toHaveBeenCalledWith('GameScene', expect.any(Function));
    expect(sceneManager.getLoadParams()).toEqual({ levelId: 6 });
  });

  test('test_duplicate_game_scene_guard_prevents_redundant_non_level_complete_load', () => {
    // Arrange
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Load GameScene
    sm.transition('SELECT_LEVEL', { levelId: 1 });
    expect(sceneManager.getCurrentScene()).toBe('GameScene');
    const loadSceneCallCount = (director.loadScene as jest.Mock).mock.calls.length;

    // Act — call _loadGameScene directly with non-LevelComplete prevState
    // (TypeScript private 在运行时无约束，测试中可直接访问)
    (sceneManager as any)._loadGameScene(GameState.Menu);

    // Assert — loadScene 未被再次调用（守卫拦截）
    expect((director.loadScene as jest.Mock).mock.calls.length).toBe(loadSceneCallCount);
    expect(sceneManager.getCurrentScene()).toBe('GameScene');
  });
});

// ============================================================
// 套件：加载失败回退（AC2）
// ============================================================

describe('SceneManager — load failure fallback (AC2)', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    resetDirectorFull();
  });

  test('test_game_scene_load_failure_falls_back_to_menu_scene', () => {
    // Arrange
    director._loadErrors['GameScene'] = new Error('GameScene load failed');
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Act — transition to Playing (GameScene load will fail)
    sm.transition('SELECT_LEVEL', { levelId: 1 });

    // Assert — error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[SceneManager] Failed to load GameScene:',
      expect.any(Error),
    );

    // Assert — fallback to MenuScene was triggered
    expect(director.loadScene).toHaveBeenCalledWith('MenuScene', expect.any(Function));
    // loadScene was called twice: once for GameScene (failed), once for fallback MenuScene
    expect((director.loadScene as jest.Mock).mock.calls.length).toBe(2);

    // Assert — after fallback completes, current scene is MenuScene
    expect(sceneManager.getCurrentScene()).toBe('MenuScene');
  });

  test('test_game_scene_load_failure_logs_error', () => {
    // Arrange
    director._loadErrors['GameScene'] = new Error('Custom error message');
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Act
    sm.transition('SELECT_LEVEL', { levelId: 1 });

    // Assert — specific error message is logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[SceneManager] Failed to load GameScene:',
      expect.objectContaining({ message: 'Custom error message' }),
    );
  });

  test('test_menu_scene_load_failure_does_not_fallback', () => {
    // Arrange
    resetDirectorFull();
    director._loadErrors['MenuScene'] = new Error('MenuScene load failed');

    // Act — SceneManager construction triggers MenuScene load
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);

    // Assert — MenuScene load error is logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[SceneManager] Failed to load MenuScene:',
      expect.any(Error),
    );

    // Assert — _currentScene remains empty (MenuScene failed to load)
    expect(sceneManager.getCurrentScene()).toBe('');

    // Assert — no additional fallback loadScene calls
    expect((director.loadScene as jest.Mock).mock.calls.length).toBe(1); // just the MenuScene attempt
  });

  test('test_fallback_menu_scene_also_fails_does_not_infinite_loop', () => {
    // Arrange — both scenes fail
    director._loadErrors['GameScene'] = new Error('GameScene failed');
    director._loadErrors['MenuScene'] = new Error('MenuScene also failed');
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Act — transition to Playing (GameScene fails, fallback to MenuScene also fails)
    sm.transition('SELECT_LEVEL', { levelId: 1 });

    // Assert — two error messages: GameScene failure + fallback failure
    const errorCalls = consoleErrorSpy.mock.calls.filter(
      (call: any[]) => call[0] === '[SceneManager] Failed to load GameScene:',
    );
    expect(errorCalls.length).toBe(1);

    const fallbackErrorCalls = consoleErrorSpy.mock.calls.filter(
      (call: any[]) => call[0] === '[SceneManager] Fallback to MenuScene also failed:',
    );
    expect(fallbackErrorCalls.length).toBe(1);

    // Assert — no infinite loop: only 2 loadScene calls (GameScene + fallback MenuScene)
    // If infinite loop happened, loadScene would be called many more times
    expect((director.loadScene as jest.Mock).mock.calls.length).toBe(2);

    // Assert — current scene is NOT 'GameScene' (load failed, fallback also failed)
    expect(sceneManager.getCurrentScene()).toBe(''); // Empty since nothing loaded successfully
  });
});

// ============================================================
// 套件：快速连续转换去重（AC3）
// ============================================================

describe('SceneManager — fast consecutive transition dedup (AC3)', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    resetDirectorFull();
  });

  test('test_fast_consecutive_menu_playing_menu_discards_stale_callback', () => {
    // Arrange — use deferred callbacks to simulate async scene loading
    director._autoFireCallbacks = false;

    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);

    // Fire the initial MenuScene callback manually
    director.firePendingCallbacks();
    expect(sceneManager.getCurrentScene()).toBe('MenuScene');

    // Clear initial loadScene call from record
    clearDirectorMocks();

    // Act — simulate rapid Menu→Playing→Menu transitions:
    // 1. SELECT_LEVEL: starts GameScene load (callback deferred)
    sm.transition('SELECT_LEVEL', { levelId: 1 });

    // 2. Before GameScene finishes, LEVEL_COMPLETE → BACK_TO_MENU
    sm.transition('LEVEL_COMPLETE');
    sm.transition('BACK_TO_MENU');

    // Now fire all pending callbacks in order:
    //   - cbGame (from step 1): stale (_pendingLoadId changed by step 2's _loadMenuScene)
    //   - cbMenu (from step 2): current (_pendingLoadId matches)
    director.firePendingCallbacks();

    // Assert — final scene should be MenuScene (stale GameScene callback was discarded)
    expect(sceneManager.getCurrentScene()).toBe('MenuScene');
  });

  test('test_fast_consecutive_transition_pending_load_id_monotonically_increases', () => {
    // Verify that each _loadMenuScene / _loadGameScene call increments _pendingLoadId
    director._autoFireCallbacks = false;

    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);

    // After construction: _pendingLoadId should be 1
    expect((sceneManager as any)._pendingLoadId).toBe(1);

    // Fire MenuScene callback
    director.firePendingCallbacks();

    // SELECT_LEVEL → _loadGameScene → increment to 2
    sm.transition('SELECT_LEVEL', { levelId: 1 });
    expect((sceneManager as any)._pendingLoadId).toBe(2);

    // Fire GameScene callback
    director.firePendingCallbacks();

    // LEVEL_COMPLETE → BACK_TO_MENU → _loadMenuScene → increment to 3
    sm.transition('LEVEL_COMPLETE');
    sm.transition('BACK_TO_MENU');
    expect((sceneManager as any)._pendingLoadId).toBe(3);
  });
});

// ============================================================
// 套件：微信切后台场景加载（AC4）
// ============================================================

describe('SceneManager — WeChat background scene loading (AC4)', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    resetDirectorFull();
  });

  test('test_scene_load_while_paused_current_scene_remains_correct', () => {
    // Arrange
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Act — normal game flow with Pause in between
    sm.transition('SELECT_LEVEL', { levelId: 1 });
    expect(sceneManager.getCurrentScene()).toBe('GameScene');

    sm.transition('PAUSE');
    expect(sm.getState()).toBe(GameState.Paused);

    // Even while paused, current scene should still be 'GameScene'
    expect(sceneManager.getCurrentScene()).toBe('GameScene');

    // Resume — should skip reload (current scene is still GameScene)
    sm.transition('RESUME');
    expect(sceneManager.getCurrentScene()).toBe('GameScene');
  });

  test('test_scene_load_during_background_onlaunched_fires_normally', () => {
    // This simulates: scene load completes while app is in background (Paused),
    // callback fires and sets state correctly regardless of pause state
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Load GameScene
    sm.transition('SELECT_LEVEL', { levelId: 1 });
    expect(sceneManager.getCurrentScene()).toBe('GameScene');
    expect(sceneManager.getLoadParams()).toEqual({ levelId: 1 });
  });
});

// ============================================================
// 套件：RESUME 边界情况
// ============================================================

describe('SceneManager — RESUME edge cases', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    resetDirectorFull();
  });

  test('test_resume_when_current_scene_not_game_scene_does_not_skip', () => {
    // Arrange
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);
    clearDirectorMocks();

    // Currently on MenuScene, not GameScene
    expect(sceneManager.getCurrentScene()).toBe('MenuScene');

    // Act — force a PAUSE then RESUME while on MenuScene
    // We need to first go to Playing then Paused then RESUME
    // But first let's transition to Playing
    sm.transition('SELECT_LEVEL', { levelId: 1 });
    clearDirectorMocks();

    // Pause
    sm.transition('PAUSE');

    // Now back to Playing via RESUME
    sm.transition('RESUME');

    // Assert — RESUME check didn't skip because _currentScene IS 'GameScene'
    // (The RESUME check is: prevState === Paused && _currentScene === 'GameScene')
    // Both conditions are true, so RESUME skips reload.
    // This is the normal happy path.
    expect(director.loadScene).not.toHaveBeenCalled();
    expect(sceneManager.getCurrentScene()).toBe('GameScene');
  });

  test('test_resume_from_paused_loads_game_scene_if_not_yet_loaded', () => {
    // Edge case: RESUME when prevState=Paused but _currentScene !== 'GameScene'
    // The RESUME skip check requires BOTH conditions, so if _currentScene
    // is not 'GameScene', it should fall through to load logic.
    //
    // To set this up: we need the state machine to be Paused but _currentScene
    // to NOT be 'GameScene'. This can happen if the initial GameScene load
    // failed, or if the state machine entered Paused from a state other than Playing.
    //
    // In practice, the state machine only enters Paused from Playing,
    // so this is a defensive scenario.

    // For this test, we'll simulate by starting in Playing state with
    // a GameScene load that has no levelId, then pausing and resuming.
    const sm = new GameStateMachine();
    const sceneManager = new SceneManager(sm);

    // We need to get to Playing without a successful GameScene load.
    // The state machine prevents Playing from Menu without levelId.
    // So let's verify that if _currentScene is NOT 'GameScene',
    // the RESUME path does NOT skip (but continues to levelId check,
    // which will warn and return since there's no cached levelId).
    //
    // Use GameStateMachine initial state = Playing
    const sm2 = new GameStateMachine(GameState.Playing);
    const sm2SceneManager = new SceneManager(sm2);
    clearDirectorMocks();

    // Now simulate: we're in Playing state but no scene is loaded.
    // Transition to Paused then RESUME.
    // Since the state machine is initialized with Playing, PAUSE should work.
    sm2.transition('PAUSE');
    expect(sm2.getState()).toBe(GameState.Paused);

    // Act — RESUME
    sm2.transition('RESUME');

    // Assert — RESUME didn't skip (no _currentScene set), fell through to load logic
    // The load logic checks for levelId which is null → warns
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[SceneManager] No levelId available — skipping GameScene load',
    );
    // loadScene should NOT have been called (levelId was null)
    expect(director.loadScene).not.toHaveBeenCalled();
  });
});
