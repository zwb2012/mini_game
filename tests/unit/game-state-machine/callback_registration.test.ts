/**
 * Story 002: 回调注册与同步执行
 *
 * 验证 GameStateMachine 的 onEnter/onExit 回调注册、
 * 按序执行、参数传递和 unsubscribe 功能。
 *
 * AC 覆盖：
 *   AC-1  onExit + onEnter 均在转换时被调用
 *   AC-2  回调按注册顺序同步执行
 *   AC-3  prevState 和 params 正确传递
 *   AC-4  onEnter unsubscribe 阻止回调
 *   AC-5  onExit unsubscribe 阻止回调
 *   AC-6  同一状态多回调全部按序调用
 *
 * GDD: game-state-machine.md
 * ADR: ADR-001
 */

import { GameState, GameStateMachine } from '../../../src/core/game-state-machine/GameStateMachine';

describe('GameStateMachine - 回调注册与同步执行', () => {
  // ============================================================
  // AC-1: onExit + onEnter called on transition
  // ============================================================
  describe('AC-1: onExit + onEnter called on transition', () => {
    test('test_onExit_Menu_and_onEnter_Playing_called_on_SELECT_LEVEL', () => {
      const sm = new GameStateMachine(GameState.Menu);
      const onExitMenu = jest.fn();
      const onEnterPlaying = jest.fn();
      sm.onExit(GameState.Menu, onExitMenu);
      sm.onEnter(GameState.Playing, onEnterPlaying);

      sm.transition('SELECT_LEVEL', { levelId: 1 });

      expect(onExitMenu).toHaveBeenCalledTimes(1);
      expect(onEnterPlaying).toHaveBeenCalledTimes(1);
    });

    test('test_no_callbacks_registered_does_not_crash_on_transition', () => {
      const sm = new GameStateMachine(GameState.Menu);

      expect(() => {
        sm.transition('SELECT_LEVEL', { levelId: 1 });
      }).not.toThrow();
      expect(sm.getState()).toBe(GameState.Playing);
    });
  });

  // ============================================================
  // AC-2: Callback registration order preserved
  // ============================================================
  describe('AC-2: 回调按注册顺序同步执行', () => {
    test('test_callbacks_executed_in_registration_order', () => {
      const sm = new GameStateMachine(GameState.Menu);
      const order: number[] = [];

      sm.onEnter(GameState.Playing, () => { order.push(1); });
      sm.onEnter(GameState.Playing, () => { order.push(2); });
      sm.onEnter(GameState.Playing, () => { order.push(3); });

      sm.transition('SELECT_LEVEL', { levelId: 1 });

      expect(order).toEqual([1, 2, 3]);
    });

    test('test_onExit_callbacks_executed_before_onEnter_callbacks', () => {
      const sm = new GameStateMachine(GameState.Menu);
      const order: string[] = [];

      sm.onExit(GameState.Menu, () => { order.push('exit'); });
      sm.onEnter(GameState.Playing, () => { order.push('enter'); });

      sm.transition('SELECT_LEVEL', { levelId: 1 });

      expect(order).toEqual(['exit', 'enter']);
    });
  });

  // ============================================================
  // AC-3: prevState and params correctness
  // ============================================================
  describe('AC-3: prevState 和 params 正确传递', () => {
    test('test_onEnter_receives_correct_prevState_and_params', () => {
      const sm = new GameStateMachine(GameState.Menu);
      const cb = jest.fn();
      sm.onEnter(GameState.Playing, cb);

      sm.transition('SELECT_LEVEL', { levelId: 5 });

      expect(cb).toHaveBeenCalledWith(GameState.Menu, { levelId: 5 });
    });

    test('test_onExit_receives_correct_prevState_and_params', () => {
      const sm = new GameStateMachine(GameState.Menu);
      const cb = jest.fn();
      sm.onExit(GameState.Menu, cb);

      sm.transition('SELECT_LEVEL', { levelId: 5 });

      expect(cb).toHaveBeenCalledWith(GameState.Menu, { levelId: 5 });
    });

    test('test_onEnter_LevelComplete_receives_Playing_as_prevState', () => {
      const sm = new GameStateMachine(GameState.Playing);
      const cb = jest.fn();
      sm.onEnter(GameState.LevelComplete, cb);

      sm.transition('LEVEL_COMPLETE');

      expect(cb).toHaveBeenCalledWith(GameState.Playing, undefined);
    });
  });

  // ============================================================
  // AC-4: onEnter unsubscribe stops callback
  // ============================================================
  describe('AC-4: onEnter unsubscribe 阻止回调', () => {
    test('test_unsubscribed_onEnter_callback_not_called', () => {
      const sm = new GameStateMachine(GameState.Menu);
      const cb = jest.fn();
      const unsub = sm.onEnter(GameState.Playing, cb);
      unsub();

      sm.transition('SELECT_LEVEL', { levelId: 1 });

      expect(cb).not.toHaveBeenCalled();
    });

    test('test_unsubscribe_does_not_affect_other_callbacks', () => {
      const sm = new GameStateMachine(GameState.Menu);
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      sm.onEnter(GameState.Playing, cb1);
      const unsub = sm.onEnter(GameState.Playing, cb2);
      unsub();

      sm.transition('SELECT_LEVEL', { levelId: 1 });

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).not.toHaveBeenCalled();
    });

    test('test_calling_unsubscribe_multiple_times_does_not_throw', () => {
      const sm = new GameStateMachine(GameState.Menu);
      const cb = jest.fn();
      const unsub = sm.onEnter(GameState.Playing, cb);
      unsub();
      expect(() => unsub()).not.toThrow();
    });
  });

  // ============================================================
  // AC-5: onExit unsubscribe stops callback
  // ============================================================
  describe('AC-5: onExit unsubscribe 阻止回调', () => {
    test('test_unsubscribed_onExit_callback_not_called', () => {
      const sm = new GameStateMachine(GameState.Menu);
      const cb = jest.fn();
      const unsub = sm.onExit(GameState.Menu, cb);
      unsub();

      sm.transition('SELECT_LEVEL', { levelId: 1 });

      expect(cb).not.toHaveBeenCalled();
    });

    test('test_onExit_unsubscribe_does_not_affect_other_callbacks', () => {
      const sm = new GameStateMachine(GameState.Menu);
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      sm.onExit(GameState.Menu, cb1);
      const unsub = sm.onExit(GameState.Menu, cb2);
      unsub();

      sm.transition('SELECT_LEVEL', { levelId: 1 });

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // AC-6: Multiple callbacks same state — all called in order
  // ============================================================
  describe('AC-6: 同一状态多回调全部按序调用', () => {
    test('test_multiple_onEnter_callbacks_all_invoked_in_order', () => {
      const sm = new GameStateMachine(GameState.Menu);
      const results: string[] = [];
      sm.onEnter(GameState.Playing, () => { results.push('A'); });
      sm.onEnter(GameState.Playing, () => { results.push('B'); });
      sm.onEnter(GameState.Playing, () => { results.push('C'); });

      sm.transition('SELECT_LEVEL', { levelId: 1 });

      expect(results).toEqual(['A', 'B', 'C']);
    });

    test('test_multiple_onExit_callbacks_all_invoked_in_order', () => {
      const sm = new GameStateMachine(GameState.Menu);
      const results: string[] = [];
      sm.onExit(GameState.Menu, () => { results.push('X'); });
      sm.onExit(GameState.Menu, () => { results.push('Y'); });

      sm.transition('SELECT_LEVEL', { levelId: 1 });

      expect(results).toEqual(['X', 'Y']);
    });
  });
});
