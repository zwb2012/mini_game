# Story 004 — Multitouch Concurrency Tests
# AC6: Dual finger independent operation (left→move, right→aim)
# AC7: Same-zone 2nd touch ignored
# AC12: MOVE_AND_SHOOT state — both active + right held
#
# Edge cases: release order independence, right-zone 2nd touch ignored,
# state transitions on release, touch_state enum coverage

extends GutTest

var _touch_input: Node


func before_each() -> void:
	_touch_input = TouchInput
	_touch_input._active_touches.clear()
	_touch_input.move_direction = Vector2.ZERO
	_touch_input.aim_position = Vector2.ZERO
	_touch_input.shoot_held = false
	_touch_input._shoot_tapped_pulse = false
	_touch_input._just_tapped = false
	_touch_input.is_aiming = false
	_touch_input.split_x = 540.0
	_touch_input.touch_state = TouchInput.TouchState.IDLE

	_touch_input.config = TouchInputConfig.new()
	_touch_input.config.deadzone = 20.0
	_touch_input.config.max_radius = 200.0
	# tap_threshold defaults to 0.2 (200ms)


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


# ── AC6: Dual Finger Independent Operation ──

func test_ac6_dual_finger_independent_move_and_aim() -> void:
	# AC6: GIVEN left at L0, right at R0, WHEN left→L1 AND right→R1,
	# THEN move_direction only from L0→L1, aim_position = R1.

	# Arrange: press left finger at (100, 300) and right finger at (600, 300)
	var left_press := _make_touch_event(0, true, Vector2(100, 300))
	var right_press := _make_touch_event(1, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(left_press)
	_touch_input._on_touch_pressed(right_press)

	# Act: drag left to (200, 300) and right to (700, 200)
	var left_drag := _make_drag_event(0, Vector2(200, 300))
	var right_drag := _make_drag_event(1, Vector2(700, 200))
	_touch_input._on_touch_dragged(left_drag)
	_touch_input._on_touch_dragged(right_drag)

	# _process evaluates touch_state — required before state assertions
	_touch_input._process(0.016)

	# Assert: move_direction driven by left, aim_position by right
	# offset (100, 0), deadzone=20, max_radius=200 → (0.5, 0.0)
	assert_almost_eq(_touch_input.move_direction.x, 0.5, 0.01,
		"move_direction.x should be 0.5 from 100px leftward drag")
	assert_eq(_touch_input.move_direction.y, 0.0,
		"move_direction.y should be 0.0 from purely horizontal drag")
	assert_eq(_touch_input.aim_position, Vector2(700, 200),
		"aim_position should be exactly right finger position")
	assert_eq(_touch_input.touch_state, TouchInput.TouchState.MOVE_AND_AIM,
		"touch_state should be MOVE_AND_AIM with both fingers active")


func test_ac6_move_updates_only_from_left_finger() -> void:
	# AC6 edge case: only left finger moves, right stays still.
	# move_direction updates, aim_position stays at right finger position.

	var left_press := _make_touch_event(0, true, Vector2(100, 300))
	var right_press := _make_touch_event(1, true, Vector2(600, 400))
	_touch_input._on_touch_pressed(left_press)
	_touch_input._on_touch_pressed(right_press)

	# Only drag left finger
	_touch_input._on_touch_dragged(_make_drag_event(0, Vector2(100, 200)))

	# offset (0, -100), deadzone=20, max_radius=200 → (0.0, -0.5)
	assert_almost_eq(_touch_input.move_direction.y, -0.5, 0.01,
		"move_direction.y should be -0.5 from 100px upward drag")
	assert_eq(_touch_input.move_direction.x, 0.0,
		"move_direction.x should be 0.0 from purely vertical drag")
	assert_eq(_touch_input.aim_position, Vector2(600, 400),
		"aim_position should remain at right finger position when right hasn't moved")


func test_ac6_aim_updates_only_from_right_finger() -> void:
	# AC6 edge case: only right finger moves, left stays still.
	# aim_position updates, move_direction stays at left finger value.

	var left_press := _make_touch_event(0, true, Vector2(100, 300))
	var right_press := _make_touch_event(1, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(left_press)
	_touch_input._on_touch_pressed(right_press)

	# Only drag right finger
	_touch_input._on_touch_dragged(_make_drag_event(1, Vector2(800, 100)))

	assert_eq(_touch_input.aim_position, Vector2(800, 100),
		"aim_position should update from right finger drag")
	assert_eq(_touch_input.move_direction, Vector2.ZERO,
		"move_direction should stay at zero since left finger hasn't moved past deadzone")


# ── AC7: Same-Zone 2nd Touch Ignored ──

func test_ac7_same_zone_second_left_touch_ignored() -> void:
	# AC7: GIVEN left zone has 1 active touch, WHEN 2nd touch in same zone,
	# THEN 2nd is ignored, 1st continues driving move_direction.

	# Arrange: first left touch active
	var first := _make_touch_event(0, true, Vector2(100, 300))
	_touch_input._on_touch_pressed(first)
	assert_eq(_touch_input._active_touches.size(), 1,
		"one touch should be registered")

	# Act: second left touch at different position
	var second := _make_touch_event(2, true, Vector2(200, 400))
	_touch_input._on_touch_pressed(second)

	# Assert: second touch NOT registered
	assert_eq(_touch_input._active_touches.size(), 1,
		"second same-zone touch should not be added to _active_touches")
	assert_false(_touch_input._active_touches.has(2),
		"touch index 2 should not exist in _active_touches")


func test_ac7_same_zone_second_right_touch_ignored() -> void:
	# AC7 edge case: right-zone 2nd touch also ignored.

	# Arrange: first right touch active
	var first := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(first)

	# Act: second right touch
	var second := _make_touch_event(1, true, Vector2(700, 400))
	_touch_input._on_touch_pressed(second)

	# Assert: second touch not registered
	assert_eq(_touch_input._active_touches.size(), 1,
		"second same-zone right touch should not be registered")


func test_ac7_first_touch_continues_after_second_rejected() -> void:
	# AC7: After 2nd same-zone touch is rejected, 1st touch continues normally.

	# Arrange: left touch active and dragging
	var first_press := _make_touch_event(0, true, Vector2(100, 300))
	_touch_input._on_touch_pressed(first_press)
	_touch_input._on_touch_dragged(_make_drag_event(0, Vector2(200, 300)))

	var move_before := _touch_input.move_direction

	# Act: 2nd left touch rejected, then 1st continues to drag
	_touch_input._on_touch_pressed(_make_touch_event(2, true, Vector2(50, 200)))
	_touch_input._on_touch_dragged(_make_drag_event(0, Vector2(250, 300)))

	# Assert: move_direction continues updating from 1st touch
	assert_gt(_touch_input.move_direction.x, move_before.x,
		"move_direction should continue increasing from 1st touch after 2nd rejected")


func test_ac7_rejected_touch_release_has_no_effect() -> void:
	# AC7 edge case: a touch that was never registered (rejected) has no
	# effect on release — no crash, no state change.

	# Arrange: left touch active
	_touch_input._on_touch_pressed(_make_touch_event(0, true, Vector2(100, 300)))

	# Act: release a non-existent touch index (simulating rejected touch release)
	var release := _make_touch_event(2, false, Vector2(200, 400))
	_touch_input._on_touch_released(release)

	# Assert: no crash, existing touch still active
	assert_eq(_touch_input._active_touches.size(), 1,
		"releasing a never-registered touch should not affect active touches")
	assert_true(_touch_input._active_touches.has(0),
		"original touch should still be active")


# ── AC12: MOVE_AND_SHOOT State ──

func test_ac12_move_and_shoot_state_both_active_right_held() -> void:
	# AC12: GIVEN left active + right held ≥ tap_threshold,
	# WHEN both move, THEN move_direction updates + shoot_held stays true.

	# Arrange: left touch + right touch pressed
	_touch_input._on_touch_pressed(_make_touch_event(0, true, Vector2(100, 300)))
	_touch_input._on_touch_pressed(_make_touch_event(1, true, Vector2(600, 300)))

	# Simulate right hold beyond tap_threshold by manipulating press_time
	var right_touch: Dictionary = _touch_input._active_touches[1]
	right_touch["press_time"] = Time.get_ticks_msec() - 300  # 300ms ago

	# Act: run _process to evaluate state
	_touch_input._process(0.016)

	# Assert: MOVE_AND_SHOOT state
	assert_eq(_touch_input.touch_state, TouchInput.TouchState.MOVE_AND_SHOOT,
		"touch_state should be MOVE_AND_SHOOT when left active + right held")
	assert_true(_touch_input.shoot_held,
		"shoot_held should be true when right held >= tap_threshold")


func test_ac12_move_updates_during_shoot_state() -> void:
	# AC12: move_direction continues updating while in MOVE_AND_SHOOT state.

	# Arrange
	_touch_input._on_touch_pressed(_make_touch_event(0, true, Vector2(100, 300)))
	_touch_input._on_touch_pressed(_make_touch_event(1, true, Vector2(600, 300)))

	var right_touch: Dictionary = _touch_input._active_touches[1]
	right_touch["press_time"] = Time.get_ticks_msec() - 300

	# Act: drag left finger
	_touch_input._on_touch_dragged(_make_drag_event(0, Vector2(200, 300)))
	_touch_input._process(0.016)

	# Assert: move_direction updated, shoot_held still true
	assert_gt(_touch_input.move_direction.x, 0.0,
		"move_direction should update from left drag during MOVE_AND_SHOOT")
	assert_true(_touch_input.shoot_held,
		"shoot_held should remain true during MOVE_AND_SHOOT")
	assert_eq(_touch_input.touch_state, TouchInput.TouchState.MOVE_AND_SHOOT,
		"state should remain MOVE_AND_SHOOT")


func test_ac12_right_release_exits_shoot_state() -> void:
	# AC12 edge case: right finger lifts → shoot_held=false, state→MOVE_ONLY.

	# Arrange: MOVE_AND_SHOOT state
	_touch_input._on_touch_pressed(_make_touch_event(0, true, Vector2(100, 300)))
	_touch_input._on_touch_pressed(_make_touch_event(1, true, Vector2(600, 300)))

	var right_touch: Dictionary = _touch_input._active_touches[1]
	right_touch["press_time"] = Time.get_ticks_msec() - 300
	_touch_input._process(0.016)

	# Act: release right finger
	_touch_input._on_touch_released(_make_touch_event(1, false, Vector2(600, 300)))

	# _process evaluates touch_state — required before state assertions
	_touch_input._process(0.016)

	# Assert: state degrades to MOVE_ONLY
	assert_eq(_touch_input.touch_state, TouchInput.TouchState.MOVE_ONLY,
		"state should be MOVE_ONLY after right finger released")
	assert_false(_touch_input.shoot_held,
		"shoot_held should be false after right finger released")
	assert_false(_touch_input.is_aiming,
		"is_aiming should be false after right finger released")


func test_ac12_left_release_exits_to_aim_only() -> void:
	# AC12 edge case: left finger lifts → move_direction=zero, state→AIM_ONLY.

	# Arrange: MOVE_AND_SHOOT state
	_touch_input._on_touch_pressed(_make_touch_event(0, true, Vector2(100, 300)))
	_touch_input._on_touch_pressed(_make_touch_event(1, true, Vector2(600, 300)))

	var right_touch: Dictionary = _touch_input._active_touches[1]
	right_touch["press_time"] = Time.get_ticks_msec() - 300
	_touch_input._process(0.016)

	# Act: release left finger
	_touch_input._on_touch_released(_make_touch_event(0, false, Vector2(100, 300)))

	# _process evaluates touch_state — required before state assertions
	_touch_input._process(0.016)

	# Assert: state degrades to AIM_ONLY
	assert_eq(_touch_input.touch_state, TouchInput.TouchState.AIM_ONLY,
		"state should be AIM_ONLY after left finger released")
	assert_eq(_touch_input.move_direction, Vector2.ZERO,
		"move_direction should be zero after left finger released")
	assert_true(_touch_input.is_aiming,
		"is_aiming should remain true — right finger still active")


# ── TouchState Enum Coverage ──

func test_touch_state_idle_when_no_active_touches() -> void:
	_touch_input._process(0.016)
	assert_eq(_touch_input.touch_state, TouchInput.TouchState.IDLE,
		"state should be IDLE with 0 active touches")


func test_touch_state_move_only_when_left_only_active() -> void:
	_touch_input._on_touch_pressed(_make_touch_event(0, true, Vector2(100, 300)))
	_touch_input._process(0.016)
	assert_eq(_touch_input.touch_state, TouchInput.TouchState.MOVE_ONLY,
		"state should be MOVE_ONLY with only left touch active")


func test_touch_state_aim_only_when_right_only_active() -> void:
	_touch_input._on_touch_pressed(_make_touch_event(0, true, Vector2(600, 300)))
	_touch_input._process(0.016)
	assert_eq(_touch_input.touch_state, TouchInput.TouchState.AIM_ONLY,
		"state should be AIM_ONLY with only right touch active")


func test_touch_state_move_and_aim_when_both_active_not_held() -> void:
	_touch_input._on_touch_pressed(_make_touch_event(0, true, Vector2(100, 300)))
	_touch_input._on_touch_pressed(_make_touch_event(1, true, Vector2(600, 300)))
	_touch_input._process(0.016)
	assert_eq(_touch_input.touch_state, TouchInput.TouchState.MOVE_AND_AIM,
		"state should be MOVE_AND_AIM with both active but right not held enough")


# ── Release Order Independence ──

func test_release_order_left_first_then_right() -> void:
	# Release order doesn't matter — left first, then right.
	_touch_input._on_touch_pressed(_make_touch_event(0, true, Vector2(100, 300)))
	_touch_input._on_touch_pressed(_make_touch_event(1, true, Vector2(600, 300)))

	# Release left first
	_touch_input._on_touch_released(_make_touch_event(0, false, Vector2(100, 300)))
	assert_false(_touch_input._has_active_left_touch(),
		"no left touch should remain")
	assert_true(_touch_input._has_active_right_touch(),
		"right touch should still be active")

	# Release right second
	_touch_input._on_touch_released(_make_touch_event(1, false, Vector2(600, 300)))
	_touch_input._process(0.016)
	assert_eq(_touch_input._active_touches.size(), 0,
		"no touches should remain")
	assert_eq(_touch_input.touch_state, TouchInput.TouchState.IDLE,
		"state should be IDLE after all released")


func test_release_order_right_first_then_left() -> void:
	# Release order doesn't matter — right first, then left.
	_touch_input._on_touch_pressed(_make_touch_event(0, true, Vector2(100, 300)))
	_touch_input._on_touch_pressed(_make_touch_event(1, true, Vector2(600, 300)))

	# Release right first
	_touch_input._on_touch_released(_make_touch_event(1, false, Vector2(600, 300)))
	assert_false(_touch_input._has_active_right_touch(),
		"no right touch should remain")
	assert_true(_touch_input._has_active_left_touch(),
		"left touch should still be active")

	# Release left second
	_touch_input._on_touch_released(_make_touch_event(0, false, Vector2(100, 300)))
	_touch_input._process(0.016)
	assert_eq(_touch_input._active_touches.size(), 0,
		"no touches should remain")
	assert_eq(_touch_input.touch_state, TouchInput.TouchState.IDLE,
		"state should be IDLE after all released")
	assert_false(_touch_input.is_aiming,
		"is_aiming should be false after all fingers released")
