# Smoke Test: Critical Paths

**Purpose**: Run these checks in under 15 minutes before any QA hand-off.
**Run via**: `/smoke-check` (which reads this file)
**Update**: Add new entries when new core systems are implemented.

## Core Stability (always run)

1. Game launches without crash
2. TouchInput autoload initializes and emits default signals (all zero/false)
3. Left-zone touch produces `move_direction`
4. Right-zone touch produces `aim_position` and shoot signals
5. Multitouch (left + right simultaneously) works correctly

## Sprint 1 — Touch Input Epic + Infrastructure

6. Game state change (PLAYING → PAUSED) suppresses all touch signals
7. NOTIFICATION_APPLICATION_FOCUS_OUT resets all active touch state
8. Config file `assets/data/touch_input_config.json` loads correctly on startup
9. All existing unit/integration tests pass (run `godot --headless --script tests/gdunit4_runner.gd`)

## Data Integrity

10. Save game completes without error (once save system is implemented)
11. Load game restores correct state (once load system is implemented)

## Performance

12. No visible frame rate drops on target hardware (60fps target)
13. No memory growth over 5 minutes of play (once core loop is implemented)
