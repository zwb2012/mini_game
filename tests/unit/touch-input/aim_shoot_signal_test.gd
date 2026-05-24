# Story 003 — Aim & Shoot Signal Generation Tests
# AC4: Quick tap -> shoot_tapped pulse (signal emit + property pulse)
# AC5: Hold -> shoot_held continuous state
# AC13: Hold + drag -> shoot_held + aim_position updates
#
# Edge cases: exactly 200ms threshold, displacement >= deadzone quick release,
# tap property resets next frame, hold+drag updates aim

extends GutTest

var _touch_input: Node


func before_each() -> void:
	# TouchInput is an Autoload — access it directly
	_touch_input = TouchInput
	# Reset state between tests
	_touch_input._active_touches.clear()
	_touch_input.move_direction = Vector2.ZERO
	_touch_input.aim_position = Vector2.ZERO
	_touch_input.shoot_held = false
	_touch_input._shoot_tapped_pulse = false
	_touch_input._just_tapped = false
	_touch_input.is_aiming = false
	_touch_input.split_x = 540.0  # Standard split for 1080px screen

	# Set up test config with known values
	_touch_input.config = TouchInputConfig.new()
	_touch_input.config.deadzone = 20.0
	_touch_input.config.max_radius = 200.0
	# tap_threshold defaults to 0.2 (200ms), which is correct for these tests.


# ── Helpers ──

func _make_touch_event(index: int, pressed: bool, position: Vector2) -> InputEventScreenTouch:
	var ev := InputEventScreenTouch.new()
	ev.index = index
	ev.pressed = pressed
	ev.position = position
	return ev


func _make_drag_event(index: int, position: Vector2) -> InputEventScreenDrag:
	var ev := InputEventScreenDrag.new()
	ev.index = index
	ev.position = position
	return ev


# ── AC4: Quick Tap -> shoot_tapped Pulse ──

func test_shoot_signal_quick_tap_emits_signal() -> void:
	# AC4: GIVEN tap_threshold=200ms, WHEN right-zone press+release with
	# small duration (<200ms) and small displacement (<deadzone),
	# THEN shoot_tapped signal is emitted and shoot_tapped property is true.

	# Arrange
	watch_signals(_touch_input)
	var press := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(press)

	# Act: release quickly with 5px displacement (well within deadzone=20)
	# Real time between press and release is <1ms, easily under 200ms threshold.
	var release := _make_touch_event(0, false, Vector2(605, 300))
	_touch_input._on_touch_released(release)

	# Assert: signal emitted + property set
	assert_signal_emitted(_touch_input, "shoot_tapped",
		"shoot_tapped signal must be emitted on quick tap")
	assert_true(_touch_input._shoot_tapped_pulse,
		"shoot_tapped property should be true after quick tap")
	assert_false(_touch_input.shoot_held,
		"shoot_held should remain false after a quick tap")


func test_shoot_signal_tap_property_resets_next_frame() -> void:
	# AC4: GIVEN a tap was detected, WHEN next _process runs,
	# THEN shoot_tapped becomes false (single-frame pulse).

	# Arrange: perform a quick tap
	var press := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(press)

	var release := _make_touch_event(0, false, Vector2(605, 300))
	_touch_input._on_touch_released(release)

	# Verify property is true immediately after tap
	assert_true(_touch_input._shoot_tapped_pulse,
		"setup: shoot_tapped should be true immediately after tap")

	# Act: simulate next frame's _process
	_touch_input._process(0.016)

	# Assert: property reset
	assert_false(_touch_input._shoot_tapped_pulse,
		"shoot_tapped should be false after next _process (single-frame pulse)")


func test_shoot_signal_tap_resets_is_aiming_and_aim_position_retained() -> void:
	# AC4 integration: GIVEN a quick tap, THEN is_aiming clears,
	# aim_position retains last value (from press).

	# Arrange: set a previous aim_position to verify retention
	_touch_input.aim_position = Vector2(999, 999)
	watch_signals(_touch_input)

	var press := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(press)
	assert_true(_touch_input.is_aiming,
		"setup: is_aiming should be true after right-zone press")

	# Act: quick tap release
	var release := _make_touch_event(0, false, Vector2(600, 300))  # same position = 0 displacement
	_touch_input._on_touch_released(release)

	# Assert: signal emitted, is_aiming false, aim_position retains last press position
	assert_signal_emitted(_touch_input, "shoot_tapped",
		"shoot_tapped signal must be emitted on quick tap")
	assert_false(_touch_input.is_aiming,
		"is_aiming should be false after right-zone release")
	assert_eq(_touch_input.aim_position, Vector2(600, 300),
		"aim_position should retain the press position after tap release")


# ── AC5: Hold -> shoot_held Continuous ──

func test_shoot_signal_hold_becomes_true_after_threshold() -> void:
	# AC5: GIVEN tap_threshold=200ms, WHEN right touch held for 300ms,
	# THEN _process sets shoot_held = true.

	# Arrange: create a right-zone touch
	var press := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(press)

	# Fake press_time to 300ms ago to simulate a long hold
	_touch_input._active_touches[0]["press_time"] = Time.get_ticks_msec() - 300

	# Act: call _process to evaluate hold duration
	_touch_input._process(0.016)

	# Assert: shoot_held should be set
	assert_true(_touch_input.shoot_held,
		"shoot_held should be true after 300ms hold (>=200ms threshold)")
	assert_true(_touch_input.is_aiming,
		"is_aiming should remain true while right touch is active")


func test_shoot_signal_hold_clears_on_release() -> void:
	# AC5: GIVEN shoot_held is true from a long hold,
	# WHEN finger releases, THEN shoot_held becomes false.

	# Arrange: create and hold a right-zone touch
	var press := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(press)

	# Fake press_time to 300ms ago
	_touch_input._active_touches[0]["press_time"] = Time.get_ticks_msec() - 300

	# Process to set shoot_held
	_touch_input._process(0.016)
	assert_true(_touch_input.shoot_held,
		"setup: shoot_held should be true before release")

	# Act: release the touch (large displacement to avoid tap detection)
	watch_signals(_touch_input)
	var release := _make_touch_event(0, false, Vector2(700, 400))
	_touch_input._on_touch_released(release)

	# Assert: shoot_held false, no shoot_tapped signal
	assert_false(_touch_input.shoot_held,
		"shoot_held should be false after release")
	assert_false(_touch_input.is_aiming,
		"is_aiming should be false after release")
	assert_signal_not_emitted(_touch_input, "shoot_tapped",
		"long hold release should NOT emit shoot_tapped signal")


func test_shoot_signal_hold_not_active_before_threshold() -> void:
	# AC5 edge: GIVEN a press just occurred (0ms hold), WHEN _process runs,
	# THEN shoot_held remains false (duration below threshold).

	# Arrange: fresh press
	var press := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(press)

	# Act: _process immediately (hold_duration ~0ms, far below 200ms threshold)
	_touch_input._process(0.016)

	# Assert
	assert_false(_touch_input.shoot_held,
		"shoot_held should be false immediately after press (0ms hold)")


# ── AC13: Hold + Drag -> shoot_held + aim_position Update ──

func test_shoot_signal_hold_and_drag_updates_aim_position() -> void:
	# AC13: GIVEN active right hold, WHEN dragging finger,
	# THEN shoot_held remains true and aim_position updates.

	# Arrange: create a right-zone touch held for 300ms
	var press := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(press)
	_touch_input._active_touches[0]["press_time"] = Time.get_ticks_msec() - 300

	# Act: process to set shoot_held
	_touch_input._process(0.016)
	assert_true(_touch_input.shoot_held,
		"setup: shoot_held should be true after 300ms hold")
	assert_eq(_touch_input.aim_position, Vector2(600, 300),
		"setup: aim_position should be at press position before drag")

	# Act: drag to new position
	var drag := _make_drag_event(0, Vector2(700, 400))
	_touch_input._on_touch_dragged(drag)

	# Assert: aim_position updated, shoot_held still true
	assert_eq(_touch_input.aim_position, Vector2(700, 400),
		"aim_position should update to drag position (700, 400)")
	assert_true(_touch_input.shoot_held,
		"shoot_held should remain true during drag while hold is active")

	# Act: drag again
	var drag2 := _make_drag_event(0, Vector2(350, 500))
	_touch_input._on_touch_dragged(drag2)

	# Assert: aim_position updates further
	assert_eq(_touch_input.aim_position, Vector2(350, 500),
		"aim_position should update to second drag position (350, 500)")


func test_shoot_signal_hold_and_drag_small_movement_still_held() -> void:
	# AC13 edge: GIVEN hold+drag with very small displacement (< deadzone),
	# THEN shoot_held remains true, aim_position updates incrementally.

	# Arrange
	var press := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(press)
	_touch_input._active_touches[0]["press_time"] = Time.get_ticks_msec() - 300
	_touch_input._process(0.016)
	assert_true(_touch_input.shoot_held,
		"setup: shoot_held should be true")

	# Act: tiny drag (5px, well within 20px deadzone)
	var drag := _make_drag_event(0, Vector2(605, 300))
	_touch_input._on_touch_dragged(drag)

	# Assert
	assert_true(_touch_input.shoot_held,
		"shoot_held should remain true during tiny drag")
	assert_eq(_touch_input.aim_position, Vector2(605, 300),
		"aim_position should update even for tiny drag movements")


# ── Edge Cases: Threshold Boundaries ──

func test_shoot_signal_hold_starts_at_exact_threshold() -> void:
	# Edge: GIVEN hold_duration == tap_threshold (200ms), WHEN _process runs,
	# THEN shoot_held = true (>= threshold means hold, not tap).
	# (Strict less-than for tap vs greater-or-equal for hold.)

	# Arrange
	var press := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(press)

	# Set press_time to exactly 200ms ago (duration_at_threshold = 200ms)
	_touch_input._active_touches[0]["press_time"] = Time.get_ticks_msec() - 200

	# Act: _process evaluates duration == tap_threshold
	_touch_input._process(0.016)

	# Assert: >= 200ms is a hold
	assert_true(_touch_input.shoot_held,
		"hold_duration == tap_threshold should set shoot_held (>= rule)")


func test_shoot_signal_exactly_threshold_not_a_tap() -> void:
	# Edge: GIVEN hold_duration == tap_threshold, WHEN finger releases,
	# THEN no shoot_tapped signal (tap requires strictly < threshold).

	# Arrange: press + set press_time to 200ms ago
	var press := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(press)
	_touch_input._active_touches[0]["press_time"] = Time.get_ticks_msec() - 200

	# Act: release with small displacement
	watch_signals(_touch_input)
	var release := _make_touch_event(0, false, Vector2(600, 300))
	_touch_input._on_touch_released(release)

	# Assert: NOT a tap (duration >= threshold) AND shoot_held not
	# entered (release before _process could set it)
	assert_signal_not_emitted(_touch_input, "shoot_tapped",
		"hold_duration == threshold should NOT emit shoot_tapped (strict < required)")
	assert_false(_touch_input._shoot_tapped_pulse,
		"shoot_tapped property should be false after threshold-hold release")
	assert_false(_touch_input.shoot_held,
		"shoot_held should be false after release at exact threshold (never entered hold state)")


func test_shoot_signal_large_displacement_no_tap() -> void:
	# Edge: GIVEN quick release but displacement >= deadzone,
	# THEN no shoot_tapped (moving finger is not a tap).

	# Arrange: quick press
	var press := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(press)

	# Act: release with 30px displacement (deadzone=20)
	watch_signals(_touch_input)
	var release := _make_touch_event(0, false, Vector2(630, 300))
	_touch_input._on_touch_released(release)

	# Assert: NOT a tap (displacement >= deadzone)
	assert_signal_not_emitted(_touch_input, "shoot_tapped",
		"30px displacement quick release should NOT emit shoot_tapped (>= deadzone)")
	assert_false(_touch_input._shoot_tapped_pulse,
		"shoot_tapped should be false after large-displacement release")


# ── Edge Cases: _just_tapped De-duplication ──

func test_shoot_signal_just_tapped_skips_hold_in_same_frame() -> void:
	# Guardrail: GIVEN a tap just occurred (setting _just_tapped=true),
	# WHEN _process runs in the same frame, THEN shoot_held is NOT set
	# (prevents same-frame tap+hold coexistence).

	# Arrange: quick tap
	var press := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(press)

	var release := _make_touch_event(0, false, Vector2(605, 300))
	_touch_input._on_touch_released(release)

	assert_true(_touch_input._shoot_tapped_pulse,
		"setup: shoot_tapped should be true after tap")
	assert_true(_touch_input._just_tapped,
		"setup: _just_tapped should be set after tap")

	# Act: _process runs (same frame)
	_touch_input._process(0.016)

	# Assert: _just_tapped was cleared, no shoot_held set
	assert_false(_touch_input._just_tapped,
		"_just_tapped should be cleared by _process")
	assert_false(_touch_input.shoot_held,
		"shoot_held should not be set in the same frame as a tap")


# ── Edge Cases: No Interference with Left Zone ──

func test_shoot_signal_left_zone_tap_does_not_affect_shoot() -> void:
	# Edge: GIVEN a left-zone tap, WHEN released, THEN no shoot signals fire.
	# Left zone is exclusively for movement, never for shooting.

	# Arrange
	watch_signals(_touch_input)
	var press := _make_touch_event(0, true, Vector2(100, 300))
	_touch_input._on_touch_pressed(press)

	# Act: quick release in left zone
	var release := _make_touch_event(0, false, Vector2(100, 300))
	_touch_input._on_touch_released(release)

	# Assert: no shoot signals affected
	assert_signal_not_emitted(_touch_input, "shoot_tapped",
		"left-zone tap should NOT emit shoot_tapped")
	assert_false(_touch_input._shoot_tapped_pulse,
		"shoot_tapped should remain false after left-zone tap")
	assert_false(_touch_input.shoot_held,
		"shoot_held should remain false after left-zone tap")
