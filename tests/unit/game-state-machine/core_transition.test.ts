/**
 * Story 001: 核心状态机——状态定义与合法转换
 *
 * 验证 GameStateMachine 的 4 状态定义和 8 条合法转换规则。
 * 纯 TypeScript 逻辑，零 Cocos API 依赖。
 *
 * AC 覆盖：
 *   AC-1  Menu → SELECT_LEVEL → Playing
 *   AC-2  Playing → PAUSE → Paused
 *   AC-3  Paused → RESUME → Playing
 *   AC-4  Paused → QUIT_TO_MENU → Menu
 *   AC-5  Playing → LEVEL_COMPLETE → LevelComplete
 *   AC-6  LevelComplete → NEXT_LEVEL → Playing
 *   AC-7  LevelComplete → REPLAY → Playing
 *   AC-8  LevelComplete → BACK_TO_MENU → Menu
 *   AC-9  getState() 始终正确
 *
 * GDD: game-state-machine.md
 * ADR: ADR-001
 */

import { GameState, GameStateMachine } from '../../../src/core/game-state-machine/GameStateMachine';

describe('GameStateMachine - 核心状态转换', () => {
  // ============================================================
  // AC-1: Menu → SELECT_LEVEL → Playing
  // ============================================================
  describe('AC-1: Menu → SELECT_LEVEL → Playing', () => {
    test('test_Menu_SELECT_LEVEL_with_valid_levelId_transitions_to_Playing', () => {
      // Arrange
      const sm = new GameStateMachine();

      // Act
      sm.transition('SELECT_LEVEL', { levelId: 1 });

      // Assert
      expect(sm.getState()).toBe(GameState.Playing);
    });

    test('test_Menu_SELECT_LEVEL_without_levelId_condition_fails_state_stays_Menu', () => {
      // Arrange
      const sm = new GameStateMachine(GameState.Menu);

      // Act
      sm.transition('SELECT_LEVEL');

      // Assert
      expect(sm.getState()).toBe(GameState.Menu);
    });

    test('test_Menu_SELECT_LEVEL_with_null_levelId_condition_fails_state_stays_Menu', () => {
      // Arrange
      const sm = new GameStateMachine(GameState.Menu);

      // Act
      sm.transition('SELECT_LEVEL', { levelId: null });

      // Assert
      expect(sm.getState()).toBe(GameState.Menu);
    });
  });

  // ============================================================
  // AC-2: Playing → PAUSE → Paused
  // ============================================================
  describe('AC-2: Playing → PAUSE → Paused', () => {
    test('test_Playing_PAUSE_transitions_to_Paused', () => {
      // Arrange
      const sm = new GameStateMachine(GameState.Playing);

      // Act
      sm.transition('PAUSE');

      // Assert
      expect(sm.getState()).toBe(GameState.Paused);
    });
  });

  // ============================================================
  // AC-3: Paused → RESUME → Playing
  // ============================================================
  describe('AC-3: Paused → RESUME → Playing', () => {
    test('test_Paused_RESUME_transitions_to_Playing', () => {
      // Arrange
      const sm = new GameStateMachine(GameState.Paused);

      // Act
      sm.transition('RESUME');

      // Assert
      expect(sm.getState()).toBe(GameState.Playing);
    });
  });

  // ============================================================
  // AC-4: Paused → QUIT_TO_MENU → Menu
  // ============================================================
  describe('AC-4: Paused → QUIT_TO_MENU → Menu', () => {
    test('test_Paused_QUIT_TO_MENU_transitions_to_Menu', () => {
      // Arrange
      const sm = new GameStateMachine(GameState.Paused);

      // Act
      sm.transition('QUIT_TO_MENU');

      // Assert
      expect(sm.getState()).toBe(GameState.Menu);
    });
  });

  // ============================================================
  // AC-5: Playing → LEVEL_COMPLETE → LevelComplete
  // ============================================================
  describe('AC-5: Playing → LEVEL_COMPLETE → LevelComplete', () => {
    test('test_Playing_LEVEL_COMPLETE_transitions_to_LevelComplete', () => {
      // Arrange
      const sm = new GameStateMachine(GameState.Playing);

      // Act
      sm.transition('LEVEL_COMPLETE');

      // Assert
      expect(sm.getState()).toBe(GameState.LevelComplete);
    });
  });

  // ============================================================
  // AC-6: LevelComplete → NEXT_LEVEL → Playing
  // ============================================================
  describe('AC-6: LevelComplete → NEXT_LEVEL → Playing', () => {
    test('test_LevelComplete_NEXT_LEVEL_with_valid_levelId_transitions_to_Playing', () => {
      // Arrange
      const sm = new GameStateMachine(GameState.LevelComplete);

      // Act
      sm.transition('NEXT_LEVEL', { levelId: 5 });

      // Assert
      expect(sm.getState()).toBe(GameState.Playing);
    });

    test('test_LevelComplete_NEXT_LEVEL_without_levelId_condition_fails_state_stays_LevelComplete', () => {
      // Arrange
      const sm = new GameStateMachine(GameState.LevelComplete);

      // Act
      sm.transition('NEXT_LEVEL');

      // Assert
      expect(sm.getState()).toBe(GameState.LevelComplete);
    });
  });

  // ============================================================
  // AC-7: LevelComplete → REPLAY → Playing
  // ============================================================
  describe('AC-7: LevelComplete → REPLAY → Playing', () => {
    test('test_LevelComplete_REPLAY_with_levelId_transitions_to_Playing', () => {
      // Arrange
      const sm = new GameStateMachine(GameState.LevelComplete);

      // Act
      sm.transition('REPLAY', { levelId: 3 });

      // Assert
      expect(sm.getState()).toBe(GameState.Playing);
    });

    test('test_LevelComplete_REPLAY_without_levelId_transitions_to_Playing', () => {
      // REPLAY 无条件检查，无 levelId 也应成功转换
      // Arrange
      const sm = new GameStateMachine(GameState.LevelComplete);

      // Act
      sm.transition('REPLAY');

      // Assert
      expect(sm.getState()).toBe(GameState.Playing);
    });
  });

  // ============================================================
  // AC-8: LevelComplete → BACK_TO_MENU → Menu
  // ============================================================
  describe('AC-8: LevelComplete → BACK_TO_MENU → Menu', () => {
    test('test_LevelComplete_BACK_TO_MENU_transitions_to_Menu', () => {
      // Arrange
      const sm = new GameStateMachine(GameState.LevelComplete);

      // Act
      sm.transition('BACK_TO_MENU');

      // Assert
      expect(sm.getState()).toBe(GameState.Menu);
    });
  });

  // ============================================================
  // AC-9: getState() always correct through complex flow
  // ============================================================
  describe('AC-9: getState() 始终正确', () => {
    test('test_getState_returns_correct_state_after_each_transition_in_flow', () => {
      // Arrange: 从 Menu 开始执行完整流程
      const sm = new GameStateMachine(GameState.Menu);
      expect(sm.getState()).toBe(GameState.Menu);

      // Act & Assert: Menu → SELECT_LEVEL (valid levelId) → Playing
      sm.transition('SELECT_LEVEL', { levelId: 1 });
      expect(sm.getState()).toBe(GameState.Playing);

      // Playing → PAUSE → Paused
      sm.transition('PAUSE');
      expect(sm.getState()).toBe(GameState.Paused);

      // Paused → RESUME → Playing
      sm.transition('RESUME');
      expect(sm.getState()).toBe(GameState.Playing);

      // Playing → LEVEL_COMPLETE → LevelComplete
      sm.transition('LEVEL_COMPLETE');
      expect(sm.getState()).toBe(GameState.LevelComplete);

      // LevelComplete → BACK_TO_MENU → Menu
      sm.transition('BACK_TO_MENU');
      expect(sm.getState()).toBe(GameState.Menu);
    });

    test('test_getState_returns_initial_state_when_no_transitions_called', () => {
      // Arrange: 默认初始状态为 Menu
      const sm = new GameStateMachine();

      // Assert: 未触发任何转换时，状态为初始值
      expect(sm.getState()).toBe(GameState.Menu);
    });

    test('test_getState_returns_custom_initial_state_when_provided', () => {
      // Arrange: 自定义初始状态
      const sm = new GameStateMachine(GameState.LevelComplete);

      // Assert
      expect(sm.getState()).toBe(GameState.LevelComplete);
    });
  });
});
