/**
 * Story 004: 微信生命周期集成——切后台自动暂停
 *
 * 验证 wx.onHide → 自动 PAUSE 行为。
 * 在测试环境中 mock 全局 wx.onHide 来模拟微信生命周期。
 *
 * AC 覆盖：
 *   AC-1  Playing 时 onHide → Paused
 *   AC-2  Menu 时 onHide → 不触发
 *   AC-3  Web 预览无 wx → 不崩溃
 *   AC-4  destroy() 后 onHide → 忽略
 *
 * GDD: game-state-machine.md
 * ADR: ADR-001
 */

import { GameState, GameStateMachine } from '../../../src/core/game-state-machine/GameStateMachine';

describe('GameStateMachine - 微信生命周期集成', () => {
  // ============================================================
  // AC-1: Playing → onHide → Paused
  // ============================================================
  describe('AC-1: Playing 态 onHide → Paused', () => {
    test('test_Playing_onHide_triggers_PAUSE', () => {
      let onHideCb: (() => void) | null = null;

      // Mock wx.onHide to capture the callback
      const originalWx = (globalThis as any).wx;
      (globalThis as any).wx = {
        onHide: (cb: () => void) => { onHideCb = cb; },
      };

      const sm = new GameStateMachine(GameState.Playing);
      expect(onHideCb).not.toBeNull();

      // Simulate WeChat hide event
      onHideCb!();
      expect(sm.getState()).toBe(GameState.Paused);

      // Cleanup
      (globalThis as any).wx = originalWx;
    });

    test('test_double_onHide_second_is_ignored', () => {
      let onHideCb: (() => void) | null = null;
      const originalWx = (globalThis as any).wx;
      (globalThis as any).wx = {
        onHide: (cb: () => void) => { onHideCb = cb; },
      };

      const sm = new GameStateMachine(GameState.Playing);
      const cb = jest.fn();
      sm.onExit(GameState.Playing, cb);

      onHideCb!(); // First: Playing → Paused
      onHideCb!(); // Second: Paused → PAUSE is illegal → ignored

      expect(sm.getState()).toBe(GameState.Paused);
      // onExit(Playing) should only be called once (first transition)
      expect(cb).toHaveBeenCalledTimes(1);

      (globalThis as any).wx = originalWx;
    });
  });

  // ============================================================
  // AC-2: Menu → onHide → no PAUSE
  // ============================================================
  describe('AC-2: Menu 态 onHide 不触发 PAUSE', () => {
    test('test_Menu_onHide_does_not_change_state', () => {
      let onHideCb: (() => void) | null = null;
      const originalWx = (globalThis as any).wx;
      (globalThis as any).wx = {
        onHide: (cb: () => void) => { onHideCb = cb; },
      };

      const sm = new GameStateMachine(GameState.Menu);

      onHideCb!();
      expect(sm.getState()).toBe(GameState.Menu);

      (globalThis as any).wx = originalWx;
    });

    test('test_Paused_onHide_does_not_trigger_again', () => {
      let onHideCb: (() => void) | null = null;
      const originalWx = (globalThis as any).wx;
      (globalThis as any).wx = {
        onHide: (cb: () => void) => { onHideCb = cb; },
      };

      const sm = new GameStateMachine(GameState.Paused);

      onHideCb!();
      expect(sm.getState()).toBe(GameState.Paused);

      (globalThis as any).wx = originalWx;
    });
  });

  // ============================================================
  // AC-3: Web fallback — no wx object
  // ============================================================
  describe('AC-3: Web 预览无 wx 不崩溃', () => {
    test('test_no_wx_creates_state_machine_without_error', () => {
      const originalWx = (globalThis as any).wx;
      (globalThis as any).wx = undefined;

      expect(() => {
        const sm = new GameStateMachine(GameState.Menu);
        sm.transition('SELECT_LEVEL', { levelId: 1 });
        expect(sm.getState()).toBe(GameState.Playing);
      }).not.toThrow();

      (globalThis as any).wx = originalWx;
    });

    test('test_wx_without_onHide_creates_state_machine_without_error', () => {
      const originalWx = (globalThis as any).wx;
      (globalThis as any).wx = { no_onHide: true };

      expect(() => {
        const sm = new GameStateMachine();
        expect(sm.getState()).toBe(GameState.Menu);
      }).not.toThrow();

      (globalThis as any).wx = originalWx;
    });
  });

  // ============================================================
  // AC-4: destroy() → onHide ignored
  // ============================================================
  describe('AC-4: destroy() 后 onHide 忽略', () => {
    test('test_destroyed_machine_ignores_onHide', () => {
      let onHideCb: (() => void) | null = null;
      const originalWx = (globalThis as any).wx;
      (globalThis as any).wx = {
        onHide: (cb: () => void) => { onHideCb = cb; },
      };

      const sm = new GameStateMachine(GameState.Playing);
      sm.destroy();

      onHideCb!();
      expect(sm.getState()).toBe(GameState.Playing); // Stayed at Playing

      (globalThis as any).wx = originalWx;
    });
  });
});
