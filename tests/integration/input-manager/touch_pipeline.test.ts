/**
 * Story 002: Cocos 触摸事件管线
 *
 * 验证 InputManager 的触摸事件绑定、管线流程、多点触摸忽略等。
 * 使用 cc.mock.ts 中的 Cocos 类型 mock。
 *
 * AC 覆盖：AC-1 ~ AC-5
 *
 * ADR: ADR-005
 * GDD: input-manager.md
 */

import { InputManager, GridConfig } from '../../../src/core/input-manager/InputManager';

/** Mock Cocos Node */
function createMockNode() {
  const listeners: Record<string, { cb: Function; target: any }[]> = {};
  const result: any = {
    on: jest.fn((event: string, cb: Function, target: any) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push({ cb, target });
    }),
    off: jest.fn((event: string, cb: Function, target: any) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(
          l => l.cb !== cb || l.target !== target
        );
      }
    }),
    _listeners: listeners,
    _trigger(event: string, mockEvent: any) {
      if (listeners[event]) {
        listeners[event].forEach(({ cb, target }) => cb.call(target, mockEvent));
      }
    },
  };
  return result;
}

/** Simulate a Cocos touch event */
function makeTouchEvent(x: number, y: number, id: number = 0, hasTouch: boolean = true) {
  return {
    touch: hasTouch ? { getUILocation: () => ({ x, y }) } : null,
    getID: () => id,
    preventDefault: jest.fn(),
  };
}

const GRID: GridConfig = { originX: 8, originY: 8, cellSize: 72, rows: 6, cols: 6 };

describe('InputManager - Cocos 触摸事件管线', () => {
  // ============================================================
  // AC-1: Touch → correct INPUT_MOVE
  // ============================================================
  describe('AC-1: 触摸发送正确 INPUT_MOVE', () => {
    test('touch move in bounds during Playing', () => {
      const node = createMockNode();
      let currentState = 'Playing';
      const im = new InputManager(node, () => currentState, GRID);
      const events: any[] = [];
      im.subscribe(e => events.push(e));
      im.bind();

      // TOUCH_START at (100, 100)
      node._trigger('touchstart', makeTouchEvent(100, 100));

      // TOUCH_MOVE to (152, 80) → cell (1, 2) — past 4px dead zone
      node._trigger('touchmove', makeTouchEvent(152, 80));

      expect(events.length).toBe(1);
      expect(events[0].type).toBe('INPUT_MOVE');
      expect(events[0].coord).toEqual({ row: 1, col: 2 });
    });
  });

  // ============================================================
  // AC-2: Paused → no event
  // ============================================================
  describe('AC-2: Paused 态无事件', () => {
    test('touch move during Paused does not produce events', () => {
      const node = createMockNode();
      let currentState = 'Paused';
      const im = new InputManager(node, () => currentState, GRID);
      const events: any[] = [];
      im.subscribe(e => events.push(e));
      im.bind();

      node._trigger('touchstart', makeTouchEvent(100, 100));
      node._trigger('touchmove', makeTouchEvent(152, 80));

      expect(events.length).toBe(0);
    });

    test('playing → pause → touch move: events stop during pause', () => {
      const node = createMockNode();
      let currentState = 'Playing';
      const im = new InputManager(node, () => currentState, GRID);
      const events: any[] = [];
      im.subscribe(e => events.push(e));
      im.bind();

      // Touch during Playing
      node._trigger('touchstart', makeTouchEvent(100, 100));
      node._trigger('touchmove', makeTouchEvent(152, 80));
      expect(events.length).toBe(1);

      // Now paused
      currentState = 'Paused';
      node._trigger('touchmove', makeTouchEvent(224, 152)); // should be ignored

      expect(events.length).toBe(1); // still 1
    });
  });

  // ============================================================
  // AC-3: Multi-touch ignored
  // ============================================================
  describe('AC-3: 多点触摸忽略', () => {
    test('second finger touch start is ignored', () => {
      const node = createMockNode();
      let currentState = 'Playing';
      const im = new InputManager(node, () => currentState, GRID);
      const events: any[] = [];
      im.subscribe(e => events.push(e));
      im.bind();

      // First finger starts
      node._trigger('touchstart', makeTouchEvent(100, 100, 0));
      // Second finger starts
      node._trigger('touchstart', makeTouchEvent(200, 200, 1));

      // First finger moves
      node._trigger('touchmove', makeTouchEvent(152, 80, 0));
      expect(events.length).toBe(1);

      // Second finger moves (ignored)
      node._trigger('touchmove', makeTouchEvent(224, 152, 1));
      expect(events.length).toBe(1); // not increased

      // First finger ends
      node._trigger('touchend', makeTouchEvent(152, 80, 0));
      expect(events.length).toBe(2); // INPUT_END

      // Second finger can now start fresh
      node._trigger('touchstart', makeTouchEvent(200, 200, 1));
      node._trigger('touchmove', makeTouchEvent(224, 152, 1));
      expect(events.length).toBe(3); // new INPUT_MOVE from second finger
    });
  });

  // ============================================================
  // AC-4: onDestroy cleanup
  // ============================================================
  describe('AC-4: unbind 清理', () => {
    test('unbind removes event listeners', () => {
      const node = createMockNode();
      const im = new InputManager(node, () => 'Playing', GRID);
      im.bind();
      expect(node.on).toHaveBeenCalledTimes(3);
      expect(node.on).toHaveBeenCalledWith('touchstart', expect.any(Function), im);
      expect(node.on).toHaveBeenCalledWith('touchmove', expect.any(Function), im);
      expect(node.on).toHaveBeenCalledWith('touchend', expect.any(Function), im);

      im.unbind();
      expect(node.off).toHaveBeenCalledTimes(3);
      expect(node.off).toHaveBeenCalledWith('touchstart', expect.any(Function), im);
    });

    test('subscribers cleared after unbind', () => {
      const node = createMockNode();
      const im = new InputManager(node, () => 'Playing', GRID);
      const cb = jest.fn();
      im.subscribe(cb);
      im.unbind();
      // Re-bind and trigger
      im.bind();
      node._trigger('touchstart', makeTouchEvent(100, 100, 0));
      node._trigger('touchmove', makeTouchEvent(152, 80, 0));
      expect(cb).not.toHaveBeenCalled(); // subscribers cleared
    });
  });

  // ============================================================
  // AC-5: .slice() snapshot safety
  // ============================================================
  describe('AC-5: .slice() 快照安全', () => {
    test('unsubscribe during callback does not skip other subscribers', () => {
      const node = createMockNode();
      let currentState = 'Playing';
      const im = new InputManager(node, () => currentState, GRID);
      const calls: number[] = [];

      const sub1 = im.subscribe(() => {
        calls.push(1);
        sub1(); // self-unsubscribe
      });
      im.subscribe(() => calls.push(2));

      im.bind();
      node._trigger('touchstart', makeTouchEvent(100, 100, 0));
      node._trigger('touchmove', makeTouchEvent(152, 80, 0));

      // Both should be called (slice snapshot preserves both)
      expect(calls).toEqual([1, 2]);
    });
  });

  // ============================================================
  // Edge: touch without touch object (WeChat JSB boundary)
  // ============================================================
  describe('边界: touch 为 null 不崩溃', () => {
    test('touch move with null touch does not crash', () => {
      const node = createMockNode();
      let currentState = 'Playing';
      const im = new InputManager(node, () => currentState, GRID);
      const cb = jest.fn();
      im.subscribe(cb);
      im.bind();

      node._trigger('touchstart', makeTouchEvent(100, 100));
      // touch = null — should be silently ignored
      node._trigger('touchmove', makeTouchEvent(152, 80, 0, false));
      expect(cb).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Edge: Dead zone filters micro-movement
  // ============================================================
  describe('边界: 死区过滤微动', () => {
    test('movement below 4px threshold does not publish', () => {
      const node = createMockNode();
      let currentState = 'Playing';
      const im = new InputManager(node, () => currentState, GRID);
      const events: any[] = [];
      im.subscribe(e => events.push(e));
      im.bind();

      node._trigger('touchstart', makeTouchEvent(100, 100));
      // Move only 2px — below 4px dead zone
      node._trigger('touchmove', makeTouchEvent(101, 102));
      expect(events.length).toBe(0);
    });
  });
});
