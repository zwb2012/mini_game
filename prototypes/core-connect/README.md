# Core Connect Prototype

**Question**: Can slide-to-connect on a touch grid feel responsive and satisfying?

**Date**: 2026-05-11
**Engine**: Standalone HTML5 Canvas (no Cocos dependency)
**Status**: Complete

## What This Tests

1. Touch coordinate → grid coordinate mapping
2. Bresenham interpolation for fast-swiping across cells
3. Cell fill with path color + color switching at numbered nodes
4. Backtrack undo (slide back into last path cell)
5. Step counting accuracy
6. Frame rate stability during drawing

## How to Run

Open `index.html` in any browser (desktop: mouse; mobile: touch).
Open DevTools console to see first-frame latency.

## What's Skipped

- Audio feedback
- Level loading from JSON
- Win detection (LEVEL_COMPLETE)
- UI buttons (undo, pause, hint)
- TTF font rendering (uses monospace system font)
- WeChat platform integration
- Error handling / edge cases

## Observations

See `REPORT.md` for full analysis.
