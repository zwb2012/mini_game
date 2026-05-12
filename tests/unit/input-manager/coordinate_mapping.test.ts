/**
 * Story 001: 坐标映射与输入守卫
 *
 * 验证 screenToGrid、isPastDeadZone、isPlaying 纯函数。
 *
 * AC 覆盖：AC-1 ~ AC-6
 *
 * ADR: ADR-005
 * GDD: input-manager.md
 */

import { screenToGrid, isPastDeadZone, isPlaying, GridConfig } from '../../../src/core/input-manager/InputManager';

const GRID_CONFIG: GridConfig = {
  originX: 8,
  originY: 8,
  cellSize: 72,
  rows: 6,
  cols: 6,
};

describe('InputManager - 坐标映射与输入守卫', () => {
  // ============================================================
  // AC-1: Coordinate mapping
  // ============================================================
  describe('AC-1: 坐标映射正确', () => {
    test('maps touch to correct cell', () => {
      // (152 - 8) / 72 = 2, (80 - 8) / 72 = 1
      const result = screenToGrid(152, 80, GRID_CONFIG);
      expect(result).toEqual({ row: 1, col: 2 });
    });

    test('maps origin area to (0,0)', () => {
      // (10 - 8) / 72 = 0, (10 - 8) / 72 = 0
      const result = screenToGrid(10, 10, GRID_CONFIG);
      expect(result).toEqual({ row: 0, col: 0 });
    });

    test('maps bottom-right cell (rows-1, cols-1)', () => {
      // (8 + 6*72 - 1) / 72 = 5 for both
      const result = screenToGrid(8 + 6 * 72 - 1, 8 + 6 * 72 - 1, GRID_CONFIG);
      expect(result).toEqual({ row: 5, col: 5 });
    });

    test('touch exactly on grid line floors correctly', () => {
      // (8 + 2*72) / 72 = 2 — exactly on the 3rd column's left edge
      const result = screenToGrid(8 + 2 * 72, 8 + 3 * 72, GRID_CONFIG);
      expect(result).toEqual({ row: 3, col: 2 });
    });
  });

  // ============================================================
  // AC-2: Out of bounds → null
  // ============================================================
  describe('AC-2: 越界丢弃', () => {
    test('touch above grid (row < 0) returns null', () => {
      const result = screenToGrid(100, 0, GRID_CONFIG); // row = floor((0-8)/72) = -1
      expect(result).toBeNull();
    });

    test('touch left of grid (col < 0) returns null', () => {
      const result = screenToGrid(0, 100, GRID_CONFIG); // col = floor((0-8)/72) = -1
      expect(result).toBeNull();
    });

    test('touch below grid (row >= rows) returns null', () => {
      // row = floor((8 + 6*72 + 1 - 8)/72) = 6 >= 6
      const result = screenToGrid(100, 8 + 6 * 72 + 1, GRID_CONFIG);
      expect(result).toBeNull();
    });

    test('touch right of grid (col >= cols) returns null', () => {
      const result = screenToGrid(8 + 6 * 72 + 1, 100, GRID_CONFIG);
      expect(result).toBeNull();
    });
  });

  // ============================================================
  // AC-3: Below dead zone
  // ============================================================
  describe('AC-3: 低于死区阈值忽略', () => {
    test('2px distance (below 4px threshold) returns false', () => {
      expect(isPastDeadZone(100, 100, 101, 102)).toBe(false); // dist=2.24
    });

    test('zero distance returns false', () => {
      expect(isPastDeadZone(100, 100, 100, 100)).toBe(false);
    });

    test('3.9px distance returns false', () => {
      expect(isPastDeadZone(100, 100, 103, 101)).toBe(false); // dist=3.16
    });
  });

  // ============================================================
  // AC-4: Above dead zone
  // ============================================================
  describe('AC-4: 超过阈值通过', () => {
    test('4px horizontal distance passes', () => {
      expect(isPastDeadZone(100, 100, 104, 100)).toBe(true); // dist=4
    });

    test('5px diagonal distance passes', () => {
      expect(isPastDeadZone(100, 100, 103, 104)).toBe(true); // dist=5
    });

    test('100px large distance passes', () => {
      expect(isPastDeadZone(100, 100, 200, 100)).toBe(true);
    });
  });

  // ============================================================
  // AC-5: State guard — Playing
  // ============================================================
  describe('AC-5: Playing 态守卫通过', () => {
    test('isPlaying returns true for Playing', () => {
      expect(isPlaying('Playing')).toBe(true);
    });

    test('isPlaying returns false for Paused', () => {
      expect(isPlaying('Paused')).toBe(false);
    });
  });

  // ============================================================
  // AC-6: State guard — non-Playing
  // ============================================================
  describe('AC-6: 非 Playing 态守卫拒绝', () => {
    test('isPlaying returns false for Menu', () => {
      expect(isPlaying('Menu')).toBe(false);
    });

    test('isPlaying returns false for LevelComplete', () => {
      expect(isPlaying('LevelComplete')).toBe(false);
    });

    test('isPlaying returns false for empty string', () => {
      expect(isPlaying('')).toBe(false);
    });
  });
});
