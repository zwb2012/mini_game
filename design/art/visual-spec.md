# Visual Spec — 数字连线 (Number Link)

> **Status**: Draft
> **Created**: 2026-05-11
> **Replaces**: design/art/art-bible.md (MVP 不需要完整美术圣经)
> **References**: ADR-002 (rendering), ADR-006 (data), accessibility-requirements.md

---

## 1. Color Palette & Assignment

### Primary — 6 Path Colors (colorblind-friendly, verified protanopia/deuteranopia/tritanopia)

| # | Hex | Usage | Lightness |
|---|-----|-------|-----------|
| 1 | `#E03E2D` | Path 1 (node 1→2) | 35% |
| 2 | `#2196F3` | Path 2 (node 2→3) | 59% |
| 3 | `#4CAF50` | Path 3 (node 3→4) | 65% |
| 4 | `#FF9800` | Path 4 (node 4→5) | 67% |
| 5 | `#9C27B0` | Path 5 (node 5→6) | 28% |
| 6 | `#00BCD4` | Path 6 (node 6→7) | 72% |

All 6 colors have ≥30% lightness difference — distinguishable even in complete color blindness.

### Neutral — Grid & UI

| Color | Hex | Usage |
|-------|-----|-------|
| Grid line | `#E0E0E0` | 1px grid strokes |
| Blocked cell | `#9E9E9E` | Obstacle cell fill |
| Empty cell | `#FFFFFF` | Default cell background |
| Dim text | `#999999` | Unconnected node numbers |
| Gold star | `#FFD700` | Active star fill |
| Gray star | `#BDBDBD` | Inactive star fill |
| Overlay | `rgba(0,0,0,0.5)` | Pause/completion overlay |
| Toast | `rgba(0,0,0,0.7)` | Hint toast background |

---

## 2. UI Component Specs

### Buttons

| Property | Value |
|----------|-------|
| Min touch size | 44×44px |
| Border radius | 8px (rounded rect) |
| Background (active) | Current path color or `#FFFFFF` |
| Background (disabled) | `#E0E0E0` with 50% opacity |
| Text color | `#333333` on white, `#FFFFFF` on colored |
| Press state | Scale 1.0 → 0.95 (50ms ease-out) |

### Level Select Buttons

| State | Background | Border | Text |
|-------|-----------|--------|------|
| Locked | `#E0E0E0` 50% | none | Level number (dim) |
| Unlocked | `#FFFFFF` | 1px `#BDBDBD` | Level number |
| Completed (1★) | `#FFFFFF` | 1px Gold `#FFD700` | Level number + ★ |
| Completed (3★) | `#FFFFFF` | 2px Gold `#FFD700` | Level number + ★★★ |

### Stars (Level Complete & Level Select)

| State | Fill | Size |
|-------|------|------|
| Active | `#FFD700` (Gold) | 24×24px |
| Inactive | `#BDBDBD` (Gray) | 24×24px |
| Spacing | 8px between stars | — |
| Animation | Scale 0→1.2→1.0 (200ms per star, sequential 200ms delay) | — |

### Hint Arrow

| Property | Value |
|----------|-------|
| Shape | Equilateral triangle |
| Size | cellSize × 0.6 |
| Fill | Current path color |
| Stroke | 2px `#FFFFFF` |
| Offset | 4px from cell center toward target direction |
| Animation | Scale 0→1 (100ms ease-out) |
| Fade out | Opacity 1→0 (300ms ease-in) |

### Toast Notification

| Property | Value |
|----------|-------|
| Background | `rgba(0,0,0,0.7)` |
| Text | `#FFFFFF`, 14px |
| Padding | 12px H, 8px V |
| Position | Screen center |
| Duration | 1500ms |
| Animation | Fade in 200ms, hold 1100ms, fade out 200ms |

---

## 3. Typography

| Role | Font | Size | Weight | Color |
|------|------|------|--------|-------|
| Node number (grid) | TTF embedded | 14px | Bold | `#FFFFFF` (connected) / `#999999` (unconnected) |
| Step counter (HUD) | TTF embedded | 28px | Bold | `#333333` |
| Level title (overlay) | TTF embedded | 20px | Bold | `#FFFFFF` |
| Button label | TTF embedded | 16px | Medium | `#333333` / `#FFFFFF` |
| Star count (overlay) | TTF embedded | 18px | Medium | `#FFFFFF` |
| Toast text | TTF embedded | 14px | Medium | `#FFFFFF` |

Font file: single TTF containing digits + basic Latin (A-Z, a-z), ≤150KB compressed.

---

## 4. Layout Constants

| Constant | Value | Notes |
|----------|-------|-------|
| Grid margin | 16px | From canvas edge to first cell |
| cellSize range | [44, 120] px | Auto-calculated: `min((canvasW-32)/cols, (canvasH-32)/rows, 120)` |
| HUD padding | 16px from top/bottom safe area | WeChat mini-game safe area |
| Level select columns | 3 | Scrollable vertically |
| Level select button size | ≥44×44px | Touch minimum |
| Level select gap | 8px | Between buttons |

---

## 5. Animation Timing

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Cell fill | 100ms | easeOutBack | On cell filled |
| Cell undo | 0ms (instant) | — | On backtrack |
| Star reveal | 200ms each, 200ms stagger | easeOutBack | Level complete |
| Level complete flash | 200ms (2× opacity pulse) | easeInOut | All cells filled |
| Arrow appear | 100ms | easeOut | Hint activated |
| Arrow disappear | 300ms | easeIn | Timeout or input |
| Button press | 50ms | easeOut | Touch down |
| Toast fade | 200ms in, 200ms out | ease | Toast triggered |
