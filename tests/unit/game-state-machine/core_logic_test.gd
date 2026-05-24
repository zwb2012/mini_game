# Story 001 — GameStateMachine Core Logic Unit Tests
# Covers the 5x5 transition matrix: 9 legal, 11 illegal, 5 same-state,
# plus reentrant guard, current_state read-only, and is_playing() correctness.
#
# References:
#   ADR-0010: Game State Machine Architecture
#   TR-game-state-001: 5 mutually exclusive states
#   TR-game-state-002: transition_to() is the only way to change state
#   TR-game-state-003: Invalid transitions rejected, same-state ignored
#
# Each test resets GameStateMachine internal state in before_each().
# Signal tracking variables are reset in before_each() to prevent
# cross-test contamination.
#
# Note on push_error/push_warning verification:
# GUT does not have built-in capture for push_error/push_warning calls.
# Verification is done through behavioral contract: return value, state
# change, and signal emission. push_error/push_warning are documented
# per test for manual verification if needed.

extends GutTest

# Test helpers — track state_changed signal emissions
var _signal_emitted: bool = false
var _signal_old: int = -1
var _signal_new: int = -1

# Reentrant guard test helpers
var _reentrant_callback_active: bool = false
var _reentrant_result: bool = false


func before_each() -> void:
	# Disconnect any stale signal listener
	if GameStateMachine.state_changed.is_connected(_on_state_changed):
		GameStateMachine.state_changed.disconnect(_on_state_changed)

	# Reset internal state to a known clean baseline
	# Initial state is PLAYING per MVP decision (task note)
	GameStateMachine._current_state = GameStateMachine.GameState.PLAYING
	GameStateMachine._transitions = GameStateMachine.DEFAULT_TRANSITIONS.duplicate()
	GameStateMachine._is_transitioning = false

	# Reset signal tracking
	_signal_emitted = false
	_signal_old = -1
	_signal_new = -1
	_reentrant_callback_active = false
	_reentrant_result = false

	# Connect signal listener for this test
	GameStateMachine.state_changed.connect(_on_state_changed)


func after_each() -> void:
	# Clean up: disconnect signal to prevent stale callbacks
	if GameStateMachine.state_changed.is_connected(_on_state_changed):
		GameStateMachine.state_changed.disconnect(_on_state_changed)
	_reentrant_callback_active = false


# ── Signal Tracking Callback ──

func _on_state_changed(old: int, new: int) -> void:
	_signal_emitted = true
	_signal_old = old
	_signal_new = new
	if _reentrant_callback_active:
		# This path is only active during the reentrant guard test.
		# Attempt a second transition while _is_transitioning is true.
		_reentrant_result = GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)


# ════════════════════════════════════════════════════════════════
# 9 LEGAL TRANSITIONS (AC8)
# Each: GIVEN current_state = from, WHEN transition_to(to),
#       THEN returns true, state_changed emitted (old, new),
#       current_state = to
# ════════════════════════════════════════════════════════════════

# AC8-1: MAIN_MENU → PLAYING
func test_transition_main_menu_to_playing_succeeds() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.MAIN_MENU

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.PLAYING)

	# Assert
	assert_true(result, "transition_to(PLAYING) from MAIN_MENU should return true")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.PLAYING,
		"current_state should be PLAYING")
	assert_true(_signal_emitted, "state_changed should have been emitted")
	assert_eq(_signal_old, GameStateMachine.GameState.MAIN_MENU,
		"signal old should be MAIN_MENU")
	assert_eq(_signal_new, GameStateMachine.GameState.PLAYING,
		"signal new should be PLAYING")


# AC8-2: PLAYING → PAUSED
func test_transition_playing_to_paused_succeeds() -> void:
	# Arrange — current_state is already PLAYING from before_each

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)

	# Assert
	assert_true(result, "transition_to(PAUSED) from PLAYING should return true")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.PAUSED,
		"current_state should be PAUSED")
	assert_true(_signal_emitted, "state_changed should have been emitted")
	assert_eq(_signal_old, GameStateMachine.GameState.PLAYING,
		"signal old should be PLAYING")
	assert_eq(_signal_new, GameStateMachine.GameState.PAUSED,
		"signal new should be PAUSED")


# AC8-3: PLAYING → DEAD
func test_transition_playing_to_dead_succeeds() -> void:
	# Arrange — current_state is already PLAYING from before_each

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.DEAD)

	# Assert
	assert_true(result, "transition_to(DEAD) from PLAYING should return true")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.DEAD,
		"current_state should be DEAD")
	assert_true(_signal_emitted, "state_changed should have been emitted")
	assert_eq(_signal_old, GameStateMachine.GameState.PLAYING,
		"signal old should be PLAYING")
	assert_eq(_signal_new, GameStateMachine.GameState.DEAD,
		"signal new should be DEAD")


# AC8-4: PLAYING → LEVEL_COMPLETE
func test_transition_playing_to_level_complete_succeeds() -> void:
	# Arrange — current_state is already PLAYING from before_each

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.LEVEL_COMPLETE)

	# Assert
	assert_true(result, "transition_to(LEVEL_COMPLETE) from PLAYING should return true")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.LEVEL_COMPLETE,
		"current_state should be LEVEL_COMPLETE")
	assert_true(_signal_emitted, "state_changed should have been emitted")
	assert_eq(_signal_old, GameStateMachine.GameState.PLAYING,
		"signal old should be PLAYING")
	assert_eq(_signal_new, GameStateMachine.GameState.LEVEL_COMPLETE,
		"signal new should be LEVEL_COMPLETE")


# AC8-5: PAUSED → PLAYING
func test_transition_paused_to_playing_succeeds() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.PAUSED

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.PLAYING)

	# Assert
	assert_true(result, "transition_to(PLAYING) from PAUSED should return true")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.PLAYING,
		"current_state should be PLAYING")
	assert_true(_signal_emitted, "state_changed should have been emitted")
	assert_eq(_signal_old, GameStateMachine.GameState.PAUSED,
		"signal old should be PAUSED")
	assert_eq(_signal_new, GameStateMachine.GameState.PLAYING,
		"signal new should be PLAYING")


# AC8-6: DEAD → PLAYING
func test_transition_dead_to_playing_succeeds() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.DEAD

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.PLAYING)

	# Assert
	assert_true(result, "transition_to(PLAYING) from DEAD should return true")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.PLAYING,
		"current_state should be PLAYING")
	assert_true(_signal_emitted, "state_changed should have been emitted")
	assert_eq(_signal_old, GameStateMachine.GameState.DEAD,
		"signal old should be DEAD")
	assert_eq(_signal_new, GameStateMachine.GameState.PLAYING,
		"signal new should be PLAYING")


# AC8-7: DEAD → MAIN_MENU
func test_transition_dead_to_main_menu_succeeds() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.DEAD

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.MAIN_MENU)

	# Assert
	assert_true(result, "transition_to(MAIN_MENU) from DEAD should return true")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.MAIN_MENU,
		"current_state should be MAIN_MENU")
	assert_true(_signal_emitted, "state_changed should have been emitted")
	assert_eq(_signal_old, GameStateMachine.GameState.DEAD,
		"signal old should be DEAD")
	assert_eq(_signal_new, GameStateMachine.GameState.MAIN_MENU,
		"signal new should be MAIN_MENU")


# AC8-8: LEVEL_COMPLETE → PLAYING
func test_transition_level_complete_to_playing_succeeds() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.LEVEL_COMPLETE

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.PLAYING)

	# Assert
	assert_true(result, "transition_to(PLAYING) from LEVEL_COMPLETE should return true")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.PLAYING,
		"current_state should be PLAYING")
	assert_true(_signal_emitted, "state_changed should have been emitted")
	assert_eq(_signal_old, GameStateMachine.GameState.LEVEL_COMPLETE,
		"signal old should be LEVEL_COMPLETE")
	assert_eq(_signal_new, GameStateMachine.GameState.PLAYING,
		"signal new should be PLAYING")


# AC8-9: LEVEL_COMPLETE → MAIN_MENU
func test_transition_level_complete_to_main_menu_succeeds() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.LEVEL_COMPLETE

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.MAIN_MENU)

	# Assert
	assert_true(result, "transition_to(MAIN_MENU) from LEVEL_COMPLETE should return true")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.MAIN_MENU,
		"current_state should be MAIN_MENU")
	assert_true(_signal_emitted, "state_changed should have been emitted")
	assert_eq(_signal_old, GameStateMachine.GameState.LEVEL_COMPLETE,
		"signal old should be LEVEL_COMPLETE")
	assert_eq(_signal_new, GameStateMachine.GameState.MAIN_MENU,
		"signal new should be MAIN_MENU")


# ════════════════════════════════════════════════════════════════
# 11 ILLEGAL TRANSITIONS (AC10)
# Each: GIVEN current_state = from, WHEN transition_to(illegal_to),
#       THEN returns false, state unchanged, no signal emitted,
#       push_error triggered
# ════════════════════════════════════════════════════════════════

# AC10-1: DEAD → PAUSED (GDD explicit)
func test_illegal_dead_to_paused_rejected() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.DEAD

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)

	# Assert
	assert_false(result, "DEAD -> PAUSED is illegal, should return false")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.DEAD,
		"current_state should remain DEAD")
	assert_false(_signal_emitted, "state_changed should NOT be emitted for illegal transition")
	# push_error triggered: "GameStateMachine: illegal transition DEAD -> PAUSED"


# AC10-2: LEVEL_COMPLETE → PAUSED (GDD explicit)
func test_illegal_level_complete_to_paused_rejected() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.LEVEL_COMPLETE

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)

	# Assert
	assert_false(result, "LEVEL_COMPLETE -> PAUSED is illegal, should return false")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.LEVEL_COMPLETE,
		"current_state should remain LEVEL_COMPLETE")
	assert_false(_signal_emitted, "state_changed should NOT be emitted")
	# push_error triggered: "GameStateMachine: illegal transition LEVEL_COMPLETE -> PAUSED"


# MAIN_MENU → {PAUSED, DEAD, LEVEL_COMPLETE} — 3 illegal transitions
func test_illegal_main_menu_to_paused_dead_level_complete_rejected() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.MAIN_MENU

	# Act & Assert: MAIN_MENU -> PAUSED
	var result_paused: bool = GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)
	assert_false(result_paused, "MAIN_MENU -> PAUSED is illegal")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.MAIN_MENU,
		"state should remain MAIN_MENU after first illegal attempt")
	_signal_emitted = false

	# Act & Assert: MAIN_MENU -> DEAD
	var result_dead: bool = GameStateMachine.transition_to(GameStateMachine.GameState.DEAD)
	assert_false(result_dead, "MAIN_MENU -> DEAD is illegal")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.MAIN_MENU,
		"state should remain MAIN_MENU after second illegal attempt")
	assert_false(_signal_emitted, "no signal should be emitted after any illegal attempt")
	_signal_emitted = false

	# Act & Assert: MAIN_MENU -> LEVEL_COMPLETE
	var result_lc: bool = GameStateMachine.transition_to(GameStateMachine.GameState.LEVEL_COMPLETE)
	assert_false(result_lc, "MAIN_MENU -> LEVEL_COMPLETE is illegal")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.MAIN_MENU,
		"state should remain MAIN_MENU after third illegal attempt")
	assert_false(_signal_emitted, "no signal should be emitted")
	# push_error triggered 3 times (once per attempt)


# PLAYING → MAIN_MENU — 1 illegal transition
func test_illegal_playing_to_main_menu_rejected() -> void:
	# Arrange — current_state is already PLAYING from before_each

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.MAIN_MENU)

	# Assert
	assert_false(result, "PLAYING -> MAIN_MENU is illegal, should return false")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.PLAYING,
		"current_state should remain PLAYING")
	assert_false(_signal_emitted, "state_changed should NOT be emitted")
	# push_error triggered: "GameStateMachine: illegal transition PLAYING -> MAIN_MENU"


# PAUSED → {DEAD, LEVEL_COMPLETE, MAIN_MENU} — 3 illegal transitions
func test_illegal_paused_to_others_rejected() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.PAUSED

	# Act & Assert: PAUSED -> DEAD
	var result_dead: bool = GameStateMachine.transition_to(GameStateMachine.GameState.DEAD)
	assert_false(result_dead, "PAUSED -> DEAD is illegal")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.PAUSED,
		"state should remain PAUSED after first illegal attempt")
	_signal_emitted = false

	# Act & Assert: PAUSED -> LEVEL_COMPLETE
	var result_lc: bool = GameStateMachine.transition_to(GameStateMachine.GameState.LEVEL_COMPLETE)
	assert_false(result_lc, "PAUSED -> LEVEL_COMPLETE is illegal")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.PAUSED,
		"state should remain PAUSED after second illegal attempt")
	assert_false(_signal_emitted, "no signal should be emitted")
	_signal_emitted = false

	# Act & Assert: PAUSED -> MAIN_MENU
	var result_mm: bool = GameStateMachine.transition_to(GameStateMachine.GameState.MAIN_MENU)
	assert_false(result_mm, "PAUSED -> MAIN_MENU is illegal")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.PAUSED,
		"state should remain PAUSED after third illegal attempt")
	assert_false(_signal_emitted, "no signal should be emitted")
	# push_error triggered 3 times (once per attempt)


# DEAD → LEVEL_COMPLETE — 1 illegal transition (DEAD -> PAUSED tested separately as AC10-1)
func test_illegal_dead_to_level_complete_rejected() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.DEAD

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.LEVEL_COMPLETE)

	# Assert
	assert_false(result, "DEAD -> LEVEL_COMPLETE is illegal, should return false")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.DEAD,
		"current_state should remain DEAD")
	assert_false(_signal_emitted, "state_changed should NOT be emitted")
	# push_error triggered: "GameStateMachine: illegal transition DEAD -> LEVEL_COMPLETE"


# LEVEL_COMPLETE → DEAD — 1 illegal transition (LEVEL_COMPLETE -> PAUSED tested separately as AC10-2)
func test_illegal_level_complete_to_dead_rejected() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.LEVEL_COMPLETE

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.DEAD)

	# Assert
	assert_false(result, "LEVEL_COMPLETE -> DEAD is illegal, should return false")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.LEVEL_COMPLETE,
		"current_state should remain LEVEL_COMPLETE")
	assert_false(_signal_emitted, "state_changed should NOT be emitted")
	# push_error triggered: "GameStateMachine: illegal transition LEVEL_COMPLETE -> DEAD"


# ════════════════════════════════════════════════════════════════
# 5 SAME-STATE TRANSITIONS (AC9)
# Each: GIVEN current_state = X, WHEN transition_to(X),
#       THEN returns false, no signal, state unchanged,
#       push_warning triggered
# ════════════════════════════════════════════════════════════════

# AC9-1: MAIN_MENU → MAIN_MENU
func test_same_state_main_menu_ignored() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.MAIN_MENU

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.MAIN_MENU)

	# Assert
	assert_false(result, "same-state MAIN_MENU -> MAIN_MENU should return false")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.MAIN_MENU,
		"current_state should remain MAIN_MENU")
	assert_false(_signal_emitted, "state_changed should NOT be emitted for same-state transition")
	# push_warning triggered: "GameStateMachine: same-state transition ignored (MAIN_MENU)"


# AC9-2: PLAYING → PLAYING
func test_same_state_playing_ignored() -> void:
	# Arrange — current_state is already PLAYING from before_each

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.PLAYING)

	# Assert
	assert_false(result, "same-state PLAYING -> PLAYING should return false")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.PLAYING,
		"current_state should remain PLAYING")
	assert_false(_signal_emitted, "state_changed should NOT be emitted for same-state transition")
	# push_warning triggered: "GameStateMachine: same-state transition ignored (PLAYING)"


# AC9-3: PAUSED → PAUSED
func test_same_state_paused_ignored() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.PAUSED

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)

	# Assert
	assert_false(result, "same-state PAUSED -> PAUSED should return false")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.PAUSED,
		"current_state should remain PAUSED")
	assert_false(_signal_emitted, "state_changed should NOT be emitted for same-state transition")
	# push_warning triggered: "GameStateMachine: same-state transition ignored (PAUSED)"


# AC9-4: DEAD → DEAD
func test_same_state_dead_ignored() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.DEAD

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.DEAD)

	# Assert
	assert_false(result, "same-state DEAD -> DEAD should return false")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.DEAD,
		"current_state should remain DEAD")
	assert_false(_signal_emitted, "state_changed should NOT be emitted for same-state transition")
	# push_warning triggered: "GameStateMachine: same-state transition ignored (DEAD)"


# AC9-5: LEVEL_COMPLETE → LEVEL_COMPLETE
func test_same_state_level_complete_ignored() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.LEVEL_COMPLETE

	# Act
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.LEVEL_COMPLETE)

	# Assert
	assert_false(result, "same-state LEVEL_COMPLETE -> LEVEL_COMPLETE should return false")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.LEVEL_COMPLETE,
		"current_state should remain LEVEL_COMPLETE")
	assert_false(_signal_emitted, "state_changed should NOT be emitted for same-state transition")
	# push_warning triggered: "GameStateMachine: same-state transition ignored (LEVEL_COMPLETE)"


# ════════════════════════════════════════════════════════════════
# REENTRANT GUARD
# GIVEN state_changed callback calls transition_to(),
# WHEN initial transition executes,
# THEN first transition succeeds, second is blocked by guard
# ════════════════════════════════════════════════════════════════

# Guard-1: state_changed callback reentrant transition_to blocked
func test_reentrant_guard_blocks_second_transition() -> void:
	# Arrange: start from MAIN_MENU, activate reentrant callback
	GameStateMachine._current_state = GameStateMachine.GameState.MAIN_MENU
	_reentrant_callback_active = true

	# Act: transition_to triggers state_changed, which triggers _on_state_changed,
	# which calls _reentrant_callback which calls transition_to(PAUSED) again.
	var first_result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.PLAYING)

	# Assert: first transition succeeds
	assert_true(first_result, "first transition MAIN_MENU -> PLAYING should succeed")
	assert_false(_reentrant_result,
		"reentrant transition PLAYING -> PAUSED should be blocked by _is_transitioning guard")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.PLAYING,
		"final state should be PLAYING (not PAUSED from reentrant attempt)")
	# push_warning triggered for blocked reentrant transition:
	# "GameStateMachine: reentrant transition_to() blocked (PLAYING -> PAUSED)"


# ════════════════════════════════════════════════════════════════
# CURRENT_STATE READ-ONLY
# GIVEN external code assigns current_state directly,
# WHEN setter is invoked,
# THEN push_warning, value unchanged
# ════════════════════════════════════════════════════════════════

# ReadOnly-1: direct assignment rejected
func test_current_state_direct_assignment_rejected() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.PLAYING

	# Act: try to assign directly (setter should warn)
	GameStateMachine.current_state = GameStateMachine.GameState.PAUSED

	# Assert: value unchanged despite direct assignment
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.PLAYING,
		"current_state should still be PLAYING after direct assignment attempt")
	# push_warning triggered: "GameStateMachine: current_state is read-only. Use transition_to()."


# ════════════════════════════════════════════════════════════════
# IS_PLAYING() CORRECTNESS
# is_playing() returns true ONLY for PLAYING state
# ════════════════════════════════════════════════════════════════

func test_is_playing_returns_true_when_playing() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.PLAYING

	# Act & Assert
	assert_true(GameStateMachine.is_playing(),
		"is_playing() should return true when current_state is PLAYING")


func test_is_playing_returns_false_when_main_menu() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.MAIN_MENU

	# Act & Assert
	assert_false(GameStateMachine.is_playing(),
		"is_playing() should return false when current_state is MAIN_MENU")


func test_is_playing_returns_false_when_paused() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.PAUSED

	# Act & Assert
	assert_false(GameStateMachine.is_playing(),
		"is_playing() should return false when current_state is PAUSED")


func test_is_playing_returns_false_when_dead() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.DEAD

	# Act & Assert
	assert_false(GameStateMachine.is_playing(),
		"is_playing() should return false when current_state is DEAD")


func test_is_playing_returns_false_when_level_complete() -> void:
	# Arrange
	GameStateMachine._current_state = GameStateMachine.GameState.LEVEL_COMPLETE

	# Act & Assert
	assert_false(GameStateMachine.is_playing(),
		"is_playing() should return false when current_state is LEVEL_COMPLETE")
