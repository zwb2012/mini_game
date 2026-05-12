/**
 * 步数评分系统 — 星级计算单元测试
 * ADR-007 (planned) — threshold 可配，保底 1 星
 */

const THRESHOLD_THREE_STAR = 1.0;
const THRESHOLD_TWO_STAR = 1.5;

function calculateStars(actualSteps: number, optimalSteps: number): number {
  if (actualSteps <= 0) return 1;
  if (optimalSteps <= 0) return 1; // 数据损坏防御

  const ratio = actualSteps / optimalSteps;

  if (ratio <= THRESHOLD_THREE_STAR) return 3;
  if (ratio <= THRESHOLD_TWO_STAR) return 2;
  return 1; // 保底
}

describe('星级计算', () => {
  describe('三星 (perfect)', () => {
    test('optimalSteps=12, actualSteps=12 → 3 stars', () => {
      expect(calculateStars(12, 12)).toBe(3);
    });

    test('optimalSteps=10, actualSteps=10 → 3 stars (ratio=1.0)', () => {
      expect(calculateStars(10, 10)).toBe(3);
    });

    test('optimalSteps=20, actualSteps=20 → 3 stars', () => {
      expect(calculateStars(20, 20)).toBe(3);
    });
  });

  describe('二星', () => {
    test('optimalSteps=12, actualSteps=14 → 2 stars (ratio=1.17)', () => {
      expect(calculateStars(14, 12)).toBe(2);
    });

    test('optimalSteps=10, actualSteps=15 → 2 stars (ratio=1.5, boundary)', () => {
      expect(calculateStars(15, 10)).toBe(2);
    });

    test('optimalSteps=10, actualSteps=11 → 2 stars (ratio=1.1)', () => {
      expect(calculateStars(11, 10)).toBe(2);
    });
  });

  describe('一星 (保底)', () => {
    test('optimalSteps=12, actualSteps=19 → 1 star (ratio=1.58)', () => {
      expect(calculateStars(19, 12)).toBe(1);
    });

    test('optimalSteps=5, actualSteps=50 → 1 star (ratio=10)', () => {
      expect(calculateStars(50, 5)).toBe(1);
    });
  });

  describe('边界情况', () => {
    test('actualSteps=0 → 1 star (defensive)', () => {
      expect(calculateStars(0, 10)).toBe(1);
    });

    test('optimalSteps=0 (data corruption) → 1 star, no crash', () => {
      expect(calculateStars(10, 0)).toBe(1);
    });

    test('optimalSteps=0 and actualSteps=0 → 1 star', () => {
      expect(calculateStars(0, 0)).toBe(1);
    });

    test('negative actualSteps → 1 star', () => {
      expect(calculateStars(-1, 10)).toBe(1);
    });
  });
});
