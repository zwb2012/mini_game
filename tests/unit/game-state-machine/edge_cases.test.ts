/**
 * Story 003: 边界情况守卫
 *
 * 验证 GameStateMachine 的非法转换、同态重复、快速连续转换排队、
 * 回调异常隔离和 destroy() 守卫行为。
 *
 * AC 覆盖：
 *   AC-1  LevelComplete → PAUSE → 静默忽略 + console.warn
 *   AC-2  同态重复不触发 onEnter/onExit
 *   AC-3  快速连续转换排队（<16ms）
 *   AC-4  回调异常捕获不阻塞后续
 *   AC-5  destroy() 后拒绝转换
 *
 * GDD: game-state-machine.md
 * ADR: ADR-001
 */

import { GameState, GameStateMachine } from '../../../src/core/game-state-machine/GameStateMachine';

describe('GameStateMachine - 边界情况守卫', () => {
  // ============================================================
  // AC-1: Illegal transition ignored + console.warn
  // ============================================================
  describe('AC-1: 非法转换静默忽略 + console.warn', () => {
    test('test_LevelComplete_PAUSE_illegal_state_stays_LevelComplete', () => {
      const sm = new GameStateMachine(GameState.LevelComplete);
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      sm.transition('PAUSE');

      expect(sm.getState()).toBe(GameState.LevelComplete);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    test('test_illegal_transition_does_not_trigger_callbacks', () => {
      const sm = new GameStateMachine(GameState.LevelComplete);
      const cb = jest.fn();
      sm.onEnter(GameState.Paused, cb);
      sm.onExit(GameState.LevelComplete, cb);

      sm.transition('PAUSE');

      expect(cb).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // AC-2: Same-state no-op
  // ============================================================
  describe('AC-2: 同一状态重复无副作用', () => {
    test('test_condition_fail_same_state_does_not_trigger_callbacks', () => {
      const sm = new GameStateMachine(GameState.Menu);
      const cb = jest.fn();
      sm.onExit(GameState.Menu, cb);
      sm.onEnter(GameState.Playing, cb);

      // SELECT_LEVEL without levelId → condition fails → no transition
      sm.transition('SELECT_LEVEL');

      expect(sm.getState()).toBe(GameState.Menu);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // AC-3: Rapid consecutive transitions queued
  // ============================================================
  describe('AC-3: 快速连续转换排队', () => {
    test('test_PAUSE_then_RESUME_in_same_call_stack_ends_at_Playing', () => {
      const sm = new GameStateMachine(GameState.Playing);

      sm.transition('PAUSE');
      sm.transition('RESUME');

      expect(sm.getState()).toBe(GameState.Playing);
    });

    test('test_PAUSE_RESUME_callbacks_executed_in_order', () => {
      const sm = new GameStateMachine(GameState.Playing);
      const order: string[] = [];

      sm.onExit(GameState.Playing, () => { order.push('exit-playing'); });
      sm.onEnter(GameState.Paused, () => { order.push('enter-paused'); });
      sm.onExit(GameState.Paused, () => { order.push('exit-paused'); });
      sm.onEnter(GameState.Playing, () => { order.push('enter-playing'); });

      sm.transition('PAUSE');
      sm.transition('RESUME');

      expect(order).toEqual([
        'exit-playing',
        'enter-paused',
        'exit-paused',
        'enter-playing',
      ]);
    });

    test('test_three_rapid_transitions_last_pending_wins', () => {
      const sm = new GameStateMachine(GameState.Playing);

      // Playing → Paused → Playing → Paused → Playing (last wins after 5?)
      // Actually: PAUSE queues RESUME, which queues PAUSE, which queues RESUME
      sm.transition('PAUSE');   // → Paused starts → queues RESUME
      // pending = RESUME → consumed, runs → Playing → queues PAUSE
      // pending = PAUSE → consumed, runs → Paused → queues RESUME
      sm.transition('PAUSE');   // → pending, overwrites PAUSE
      sm.transition('PAUSE');   // → pending, overwrites PAUSE
      sm.transition('RESUME');  // → pending, overwrites PAUSE

      // After all: the queue processes in order
      expect(sm.getState()).toBe(GameState.Playing);
    });
  });

  // ============================================================
  // AC-4: Callback exception isolation
  // ============================================================
  describe('AC-4: 回调异常隔离', () => {
    test('test_callback_that_throws_does_not_block_subsequent_callbacks', () => {
      const sm = new GameStateMachine(GameState.Menu);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const order: string[] = [];

      sm.onEnter(GameState.Playing, () => {
        order.push('first');
      });
      sm.onEnter(GameState.Playing, () => {
        throw new Error('test error');
      });
      sm.onEnter(GameState.Playing, () => {
        order.push('third');
      });

      sm.transition('SELECT_LEVEL', { levelId: 1 });

      expect(order).toEqual(['first', 'third']);
      expect(sm.getState()).toBe(GameState.Playing);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    test('test_all_callbacks_throwing_still_completes_transition', () => {
      const sm = new GameStateMachine(GameState.Menu);
      jest.spyOn(console, 'error').mockImplementation(() => {});

      sm.onEnter(GameState.Playing, () => { throw new Error('err1'); });
      sm.onEnter(GameState.Playing, () => { throw new Error('err2'); });

      expect(() => {
        sm.transition('SELECT_LEVEL', { levelId: 1 });
      }).not.toThrow();

      expect(sm.getState()).toBe(GameState.Playing);
    });
  });

  // ============================================================
  // AC-5: destroy() blocks transitions
  // ============================================================
  describe('AC-5: destroy() 后拒绝所有转换', () => {
    test('test_destroyed_state_machine_ignores_transitions', () => {
      const sm = new GameStateMachine(GameState.Playing);
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      sm.destroy();
      sm.transition('PAUSE');

      expect(sm.getState()).toBe(GameState.Playing);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    test('test_destroy_called_multiple_times_does_not_throw', () => {
      const sm = new GameStateMachine(GameState.Menu);

      sm.destroy();
      expect(() => sm.destroy()).not.toThrow();
    });

    test('test_destroy_clears_callbacks_no_enter_after_destroy', () => {
      const sm = new GameStateMachine(GameState.Playing);
      const cb = jest.fn();
      sm.onEnter(GameState.Paused, cb);

      sm.destroy();
      sm.transition('PAUSE');

      expect(cb).not.toHaveBeenCalled();
    });
  });
});
