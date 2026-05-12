# Interaction Patterns — 数字连线 (Number Link)

> **Status**: Draft
> **Created**: 2026-05-11
> **Engine**: Cocos Creator 3.8.8
> **Input**: Touch only (WeChat Mini Game)
> **Accessibility**: Standard tier

---

## Pattern 1: Slide-to-Connect (Core Mechanic)

### Trigger
Player touches a numbered node and slides finger across the grid.

### States

| State | Description |
|-------|-------------|
| `Idle` | No touch active. Grid displayed, waiting for input. |
| `Drawing` | Finger down on a valid node. Path traces behind finger. |
| `Dirty` | Finger up. Path held, waiting for next touch or undo. |

### Behavior
1. **TOUCH_START on node N**: If N matches `currentNumber`, begin path. If first touch of session, `currentNumber = N`.
2. **TOUCH_MOVE**: Bresenham interpolation fills cells between last known coord and current coord. Each new cell: fill with `LINE_COLORS[currentNumber-1]`, play TICK audio, increment step counter.
3. **TOUCH_MOVE into backtrack**: If finger enters the last cell of current path segment → undo that cell (instant fill removal, reverse-TICK audio, step counter -1).
4. **TOUCH_MOVE into earlier locked cell**: Ignored — locked segments cannot be modified.
5. **TOUCH_END**: Path held. Engine enters `Dirty` state. If all non-blocked cells filled → `LEVEL_COMPLETE`.

### Constraints
- Must start from a valid numbered node
- Cannot skip numbers (currentNumber=2 cannot connect to node 4)
- Blocked cells ignored on touch
- Out-of-bounds touches discarded by input pipeline
- 4px dead zone threshold filters finger tremor

### Feedback
| Channel | Response |
|---------|----------|
| Visual | Cell fills instantly with path color. Current path draws as 2px line behind finger. |
| Audio | TICK (60ms click) per cell filled. Reverse-TICK per cell undone. |
| HUD | Step counter updates in real-time. Undo button enables/disables. |

### Accessibility
- 44×44px minimum cell size
- Touch dead zone 4px (for motor tremor)
- Color-independent: node numbers provide non-color identification
- Alternative (deferred): tap-to-draw mode

---

## Pattern 2: Button Tap

### Trigger
Player taps a UI button (undo, pause, hint, level select, next level, replay, back to menu).

### Behavior
1. **Touch down**: Button scales to 0.95 (50ms ease-out) — visual press feedback.
2. **Touch up** (within button bounds): Button scales back to 1.0 (50ms). Action fires.
3. **Touch up** (outside bounds): Button scales back to 1.0. No action (cancel).
4. **Disabled state**: Button grayed out (bg `#E0E0E0` at 50% opacity). Touch ignored.

### Button-Specific Actions

| Button | Action | Guard Condition |
|--------|--------|-----------------|
| Undo | `engine.undo()` | `canUndo() === true` + state = Drawing/Dirty |
| Pause | `stateMachine.transition('PAUSE')` | state = Playing |
| Resume | `stateMachine.transition('RESUME')` | state = Paused |
| Quit to Menu | `stateMachine.transition('QUIT_TO_MENU')` | state = Paused |
| Hint | Trigger hint BFS + render arrow | `remaining > 0` + state != Drawing |
| Next Level | `stateMachine.transition('NEXT_LEVEL', {levelId})` | next level exists |
| Replay | `stateMachine.transition('REPLAY', {levelId})` | always available |
| Back to Menu | `stateMachine.transition('BACK_TO_MENU')` | always available |

### Accessibility
- 44×44px minimum touch target
- Press animation provides haptic-like visual confirmation
- Grayed-out disabled state communicates unavailability without relying on color

---

## Pattern 3: Undo / Backtrack

### Trigger
Two paths:
1. **Slide-back**: Player slides finger back into the last cell of the current path segment (Pattern 1, step 3)
2. **Button undo**: Player taps the undo button in HUD

### Behavior
- Removes last cell from current path: `filled = false`, `ownerNumber = null`, `path.pop()`
- If cell is a node: `currentNumber -= 1` (reverts to previous segment)
- Step counter -1
- HUD refreshes (step count, undo button state)

### Constraints
- Only the current (unlocked) segment can be undone
- Locked segments from earlier numbers are immutable
- Undo on empty path: no-op, button grayed out

---

## Pattern 4: Hint Activation

### Trigger
Player taps the hint button (bulb icon) in HUD.

### State Machine
```
IDLE → (tap, remaining>0) → COMPUTING → (BFS found) → ACTIVE
IDLE → (tap, remaining=0) → COOLDOWN (toast: "今日已用完")
COMPUTING → (BFS no path) → IDLE (toast: "无路可走，试试撤销")
ACTIVE → (player move | timeout 5s | pause | re-tap) → IDLE
COOLDOWN → (calendar day reset) → IDLE
```

### Behavior
1. Compute BFS from current path end to next numbered node
2. Render arrow (triangle) at target cell, pointing direction of first step
3. Arrow disappears on any valid player move, 5s timeout, pause, or re-tap
4. If BFS finds no path (player blocked themselves): remaining refunded, toast shown

### Feedback
- Arrow: scale 0→1 (100ms), current-number color, 2px white stroke
- Hint consumed: button badge decrements (3→2→1→0)
- Out of hints: button grays, toast "今日提示已用完，明日重置"

---

## Pattern 5: Level Complete Flow

### Trigger
Engine detects all non-blocked cells filled → `LEVEL_COMPLETE` event.

### Sequence
1. Grid flash: opacity pulse 1.0→0.5→1.0 (200ms)
2. Star calculation: `actualSteps / optimalSteps` against thresholds
3. Overlay appears: semi-transparent black overlay fades in
4. Stars animate: 1-3 stars light up sequentially (200ms each, 200ms stagger)
5. Step comparison displayed: `"actualSteps / optimalSteps"` (gold if ≤optimalSteps, white otherwise)
6. Buttons shown: Next Level (if not last), Replay, Back to Menu

### Constraints
- Last level: "Next Level" button hidden. "Replay" always visible.
- Replay on already-3-star level: new lower score does not overwrite saved best.
