# Story 005 — Game State Integration Tests
# AC8:  PAUSED state suppresses all touch signals
# AC11: Application focus-out resets active touch state
#
# Edge cases: DEAD suppression, PLAYING recovery without auto-input,
# idle state transitions, consecutive pause/resume, no shoot_tapped leakage

extends GutTest

var _touch_input: Node


func before_each() -> void:
	_touch_input = TouchInput
	_touch_input._active_touches.clear()
	_touch_input.move_direction = Vector2.ZERO
	_touch_input.aim_position = Vector2(300, 400)
	_touch_input.shoot_held = false
	_touch_input._shoot_tapped_pulse = false
	_touch_input._just_tapped = false
	_touch_input.is_aiming = false
	_touch_input.split_x = 540.0
	_touch_input.touch_state = TouchInput.TouchState.IDLE
	_touch_input.config = TouchInputConfig.new()
	_touch_input.config.deadzone = 20.0
	_touch_input.config.max_radius = 200.0

	# Ensure GameStateMachine is in PLAYING before each test.
	# If it's already PLAYING, transition_to returns false (same-state) — fine.
	if GameStateMachine.current_state != GameStateMachine.GameState.PLAYING:
		# Force state to PLAYING — bypass transition_to for test setup.
		GameStateMachine._current_state = GameStateMachine.GameState.PLAYING


func after_each() -> void:
	_touch_input._active_touches.clear()
	_touch_input.move_direction = Vector2.ZERO
	_touch_input.shoot_held = false
	_touch_input._shoot_tapped_pulse = false
	_touch_input._just_tapped = false
	_touch_input.is_aiming = false
	_touch_input.touch_state = TouchInput.TouchState.IDLE
	GameStateMachine._current_state = GameStateMachine.GameState.PLAYING


# ── Helpers ──

func _make_touch(index: int, pressed: bool, pos: Vector2) -> InputEventScreenTouch:
	var ev := InputEventScreenTouch.new()
	ev.index = index
	ev.pressed = pressed
	ev.position = pos
	return ev


func _make_drag(index: int, pos: Vector2) -> InputEventScreenDrag:
	var ev := InputEventScreenDrag.new()
	ev.index = index
	ev.position = pos
	return ev


func _simulate_left_move(x: float, y: float) -> void:
	# Press left zone.
	_touch_input._input(_make_touch(0, true, Vector2(x, y)))
	# Drag far enough to exceed deadzone.
	_touch_input._input(_make_drag(0, Vector2(x + 100, y)))


func _simulate_right_hold(x: float, y: float, hold_ms: int = 300) -> void:
	_touch_input._input(_make_touch(1, true, Vector2(x, y)))
	# Simulate hold by advancing time in press_time.
	var past := Time.get_ticks_msec() - hold_ms
	for key in _touch_input._active_touches:
		if _touch_input._active_touches[key]["zone"] == "right":
			_touch_input._active_touches[key]["press_time"] = past
	_touch_input._process(0.016)


# ── AC8: PAUSED State Suppression ──

func test_state_integration_paused_suppresses_move_direction() -> void:
	# Arrange
	_simulate_left_move(100, 200)
	_touch_input._process(0.016)
	assert_ne(_touch_input.move_direction, Vector2.ZERO, "move_direction should be non-zero after left drag")

	# Act: transition to PAUSED
	GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)
	_touch_input._process(0.016)

	# Assert
	assert_eq(_touch_input.move_direction, Vector2.ZERO)


func test_state_integration_paused_suppresses_shoot_held() -> void:
	_simulate_right_hold(600, 300, 300)
	_touch_input._process(0.016)
	assert_true(_touch_input.shoot_held, "shoot_held should be true for held right touch")

	GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)
	_touch_input._process(0.016)

	assert_false(_touch_input.shoot_held)


func test_state_integration_paused_suppresses_is_aiming() -> void:
	_touch_input._input(_make_touch(1, true, Vector2(600, 400)))
	_touch_input._process(0.016)
	assert_true(_touch_input.is_aiming)

	GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)
	_touch_input._process(0.016)

	assert_false(_touch_input.is_aiming)


func test_state_integration_paused_preserves_aim_position() -> void:
	_touch_input._input(_make_touch(1, true, Vector2(650, 420)))
	_touch_input._process(0.016)
	var saved_aim := _touch_input.aim_position
	assert_ne(saved_aim, Vector2.ZERO)

	GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)
	_touch_input._process(0.016)

	assert_eq(_touch_input.aim_position, saved_aim, "aim_position should retain last valid value after PAUSED")


# ── AC8 Variant: DEAD State Suppression ──

func test_state_integration_dead_suppresses_all_signals() -> void:
	_simulate_left_move(100, 200)
	_simulate_right_hold(600, 300, 300)
	_touch_input._process(0.016)
	assert_ne(_touch_input.move_direction, Vector2.ZERO)
	assert_true(_touch_input.shoot_held)

	GameStateMachine.transition_to(GameStateMachine.GameState.DEAD)
	_touch_input._process(0.016)

	assert_eq(_touch_input.move_direction, Vector2.ZERO)
	assert_false(_touch_input.shoot_held)
	assert_false(_touch_input.is_aiming)


# ── AC8 Edge: Recovery Without Auto-Input ──

func test_state_integration_paused_to_playing_no_auto_recovery() -> void:
	_simulate_left_move(100, 200)
	_touch_input._process(0.016)
	assert_ne(_touch_input.move_direction, Vector2.ZERO)

	# Pause → signals cleared.
	GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)
	_touch_input._process(0.016)
	assert_eq(_touch_input.move_direction, Vector2.ZERO)

	# Resume → signals stay zero (user must re-touch).
	GameStateMachine.transition_to(GameStateMachine.GameState.PLAYING)
	_touch_input._process(0.016)
	assert_eq(_touch_input.move_direction, Vector2.ZERO, "move_direction should stay zero after resume — no auto input")


# ── AC8 Edge: Consecutive Pause/Resume ──

func test_state_integration_consecutive_pause_resume() -> void:
	# First pause
	_simulate_left_move(100, 200)
	_touch_input._process(0.016)
	GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)
	_touch_input._process(0.016)
	assert_eq(_touch_input.move_direction, Vector2.ZERO)

	# Resume + new touch
	GameStateMachine.transition_to(GameStateMachine.GameState.PLAYING)
	_simulate_left_move(100, 200)
	_touch_input._process(0.016)
	assert_ne(_touch_input.move_direction, Vector2.ZERO)

	# Second pause
	GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)
	_touch_input._process(0.016)
	assert_eq(_touch_input.move_direction, Vector2.ZERO)
	assert_false(_touch_input.is_aiming)


# ── AC8 Edge: DEAD Blocks All New Touches ──

func test_state_integration_dead_blocks_new_touches() -> void:
	GameStateMachine.transition_to(GameStateMachine.GameState.DEAD)
	_touch_input._process(0.016)

	# Try to start a new touch while DEAD.
	_touch_input._input(_make_touch(0, true, Vector2(100, 200)))
	_touch_input._input(_make_drag(0, Vector2(200, 200)))
	_touch_input._process(0.016)

	assert_eq(_touch_input.move_direction, Vector2.ZERO)
	assert_false(_touch_input.is_aiming)
	assert_eq(_touch_input.touch_state, TouchInput.TouchState.IDLE)


# ── AC8 Edge: Idle State Transition No Side Effect ──

func test_state_integration_idle_state_transition_no_side_effect() -> void:
	# No active touches.
	assert_eq(_touch_input.touch_state, TouchInput.TouchState.IDLE)

	GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)
	_touch_input._process(0.016)

	assert_eq(_touch_input.touch_state, TouchInput.TouchState.IDLE)
	assert_eq(_touch_input.move_direction, Vector2.ZERO)
	assert_false(_touch_input.shoot_held)


# ── AC8 Edge: No shoot_tapped Leak During State Switch ──

func test_state_integration_no_shoot_tapped_leak_on_state_switch() -> void:
	# Set up right-zone touch so a tap could theoretically fire.
	_touch_input._input(_make_touch(1, true, Vector2(600, 400)))
	_touch_input._process(0.016)

	GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)
	_touch_input._process(0.016)

	assert_false(_touch_input._shoot_tapped_pulse, "shoot_tapped should not leak after state change")


# ── AC11: Focus Out Reset ──

func test_state_integration_focus_out_resets_all_signals() -> void:
	_simulate_left_move(100, 200)
	_simulate_right_hold(600, 300, 300)
	_touch_input._process(0.016)
	var saved_aim := _touch_input.aim_position
	assert_ne(_touch_input.move_direction, Vector2.ZERO)
	assert_true(_touch_input.shoot_held)
	assert_true(_touch_input.is_aiming)

	# Simulate focus out.
	_touch_input._notification(MainLoop.NOTIFICATION_APPLICATION_FOCUS_OUT)

	assert_eq(_touch_input.move_direction, Vector2.ZERO)
	assert_false(_touch_input._shoot_tapped_pulse)
	assert_false(_touch_input.shoot_held)
	assert_false(_touch_input.is_aiming)
	assert_eq(_touch_input.aim_position, saved_aim, "aim_position should be preserved after focus out")


func test_state_integration_focus_out_preserves_aim_position() -> void:
	_touch_input._input(_make_touch(1, true, Vector2(700, 350)))
	_touch_input._process(0.016)
	var saved_aim := _touch_input.aim_position

	_touch_input._notification(MainLoop.NOTIFICATION_APPLICATION_FOCUS_OUT)

	assert_eq(_touch_input.aim_position, saved_aim)


# ── AC11 Edge: Focus Out Clears Active Touches ──

func test_state_integration_focus_out_clears_active_touches() -> void:
	_touch_input._input(_make_touch(0, true, Vector2(100, 200)))
	_touch_input._input(_make_touch(1, true, Vector2(600, 300)))
	assert_eq(_touch_input._active_touches.size(), 2)

	_touch_input._notification(MainLoop.NOTIFICATION_APPLICATION_FOCUS_OUT)

	assert_eq(_touch_input._active_touches.size(), 0)


# ── AC11 Edge: No shoot_tapped Leak on Focus Out ──

func test_state_integration_focus_out_no_shoot_tapped_leak() -> void:
	# Set up right-zone touch that could produce a tap.
	_touch_input._input(_make_touch(1, true, Vector2(600, 400)))
	_touch_input._process(0.016)
	assert_true(_touch_input.is_aiming)

	_touch_input._notification(MainLoop.NOTIFICATION_APPLICATION_FOCUS_OUT)

	assert_false(_touch_input._shoot_tapped_pulse)


# ── Input Guard: Non-PLAYING Blocks _process and _input ──

func test_state_integration_paused_input_events_ignored() -> void:
	GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)
	_touch_input._process(0.016)

	# Touch events in PAUSED should be ignored.
	_touch_input._input(_make_touch(0, true, Vector2(100, 200)))
	_touch_input._input(_make_drag(0, Vector2(200, 200)))
	_touch_input._process(0.016)

	assert_eq(_touch_input._active_touches.size(), 0)
	assert_eq(_touch_input.touch_state, TouchInput.TouchState.IDLE)
