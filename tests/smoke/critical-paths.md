# Smoke Test: Critical Paths — 数字连线

**Purpose**: Run these checks in under 15 minutes before any QA hand-off.
**Run via**: `/smoke-check`
**Update**: Add new entries when new core systems are implemented.

## Core Stability (always run)

1. Game launches to level select screen without crash
2. Level 1 can be selected and loads successfully
3. Level select screen responds to all touch inputs

## Core Mechanic (MVP)

4. Player can draw a line from node 1 to node 2 by sliding finger
5. Grid cells fill with correct color along the path
6. Undo removes the last filled cell and step count decreases
7. All cells filled → level complete overlay appears

## Data Integrity

8. Level progress is saved after completing a level (wx.setStorageSync)
9. Level progress persists after app restart (wx.getStorageSync)
10. Settings (mute) persist after restart

## UI

11. Step counter updates in real-time during play
12. Pause button triggers pause menu overlay
13. Level complete overlay shows stars and step comparison
14. "Next Level" button loads the next level
15. Star rating displays correctly on level select after completion

## Performance

16. No visible frame rate drops on target hardware (60fps target) during gameplay
17. Grid rendering completes within 1 frame of touch input
