# Story 002 — Move Signal Generation Tests
# AC2: normal drag → correct move_direction value
# AC3: inside deadzone → Vector2.ZERO
# AC4: exceeds max_radius → length clamped to 1.0
# AC5: touch release → move_direction = Vector2.ZERO

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
	_touch_input.is_aiming = false
	_touch_input._shoot_tapped_pulse = false
	_touch_input.split_x = 540.0  # Standard split for 1080px screen

	# Set up test config with known values
	_touch_input.config = TouchInputConfig.new()
	_touch_input.config.deadzone = 20.0
	_touch_input.config.max_radius = 200.0


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


# ── AC2: Normal Drag Move Direction ──

func test_move_signal_normal_drag_computes_correct_value() -> void:
	# AC2: GIVEN max_radius=200, deadzone=20, WHEN left drag 100px right,
	# THEN move_direction.x=0.5, move_direction.length()=0.5

	# Arrange
	var press := _make_touch_event(0, true, Vector2(100, 200))
	_touch_input._on_touch_pressed(press)

	# Act: drag 100px right to (200, 200)
	var drag := _make_drag_event(0, Vector2(200, 200))
	_touch_input._on_touch_dragged(drag)

	# Assert
	assert_eq(_touch_input.move_direction.x, 0.5,
		"100px / 200px max_radius should yield 0.5")
	assert_eq(_touch_input.move_direction.y, 0.0,
		"pure horizontal drag should have y=0")
	assert_eq(_touch_input.move_direction.length(), 0.5,
		"length should be 0.5 for 100px offset")


# ── AC3: Deadzone Behavior ──

func test_move_signal_inside_deadzone_returns_zero() -> void:
	# AC3: GIVEN deadzone=20, WHEN offset is 5px, THEN move_direction=(0,0)

	# Arrange
	var press := _make_touch_event(0, true, Vector2(100, 200))
	_touch_input._on_touch_pressed(press)

	# Act: drag only 5px right (still inside deadzone)
	var drag := _make_drag_event(0, Vector2(105, 200))
	_touch_input._on_touch_dragged(drag)

	# Assert
	assert_eq(_touch_input.move_direction, Vector2.ZERO,
		"5px offset should be within 20px deadzone")


# ── AC4: Max Radius Clamp ──

func test_move_signal_exceeds_max_radius_clamped_to_one() -> void:
	# AC4: GIVEN max_radius=200, WHEN offset is 300px,
	# THEN move_direction.length()=1.0 (direction preserved)

	# Arrange
	var press := _make_touch_event(0, true, Vector2(100, 200))
	_touch_input._on_touch_pressed(press)

	# Act: drag 300px right (beyond max_radius of 200)
	var drag := _make_drag_event(0, Vector2(400, 200))
	_touch_input._on_touch_dragged(drag)

	# Assert
	assert_eq(_touch_input.move_direction.x, 1.0,
		"move_direction.x should be clamped to 1.0")
	assert_eq(_touch_input.move_direction.y, 0.0,
		"move_direction.y should remain 0")
	assert_eq(_touch_input.move_direction.length(), 1.0,
		"length should be clamped to 1.0")


# ── AC5: Touch Release Zero ──

func test_move_signal_release_resets_to_zero() -> void:
	# AC5: GIVEN left drag active with non-zero move_direction,
	# WHEN finger released, THEN move_direction=Vector2.ZERO

	# Arrange
	var press := _make_touch_event(0, true, Vector2(100, 200))
	_touch_input._on_touch_pressed(press)

	# Drag to establish non-zero move_direction
	var drag := _make_drag_event(0, Vector2(200, 200))
	_touch_input._on_touch_dragged(drag)
	assert_ne(_touch_input.move_direction, Vector2.ZERO,
		"setup: move_direction should be non-zero before release")

	# Act: release the touch
	var release := _make_touch_event(0, false, Vector2(200, 200))
	_touch_input._on_touch_released(release)

	# Assert
	assert_eq(_touch_input.move_direction, Vector2.ZERO,
		"release should reset move_direction to ZERO")


# ── Edge Case: Deadzone Boundary ──

func test_move_signal_deadzone_boundary_exact_returns_zero() -> void:
	# AC3 edge: GIVEN deadzone=20, WHEN offset is exactly 20px,
	# THEN move_direction=Vector2.ZERO (strict less-than)

	# Arrange
	var press := _make_touch_event(0, true, Vector2(100, 200))
	_touch_input._on_touch_pressed(press)

	# Act: drag exactly 20px right — exactly at deadzone boundary
	var drag := _make_drag_event(0, Vector2(120, 200))
	_touch_input._on_touch_dragged(drag)

	# Assert: 20px is NOT less than 20px, so stays ZERO
	assert_eq(_touch_input.move_direction, Vector2.ZERO,
		"20px offset at deadzone=20 should still be ZERO (strict <)")


# ── Edge Case: Max Radius Boundary ──

func test_move_signal_max_radius_boundary_reaches_full_speed() -> void:
	# AC4 edge: GIVEN max_radius=200, WHEN offset is exactly 200px,
	# THEN move_direction.length() = 1.0

	# Arrange
	var press := _make_touch_event(0, true, Vector2(100, 200))
	_touch_input._on_touch_pressed(press)

	# Act: drag exactly 200px right — at max_radius boundary
	var drag := _make_drag_event(0, Vector2(300, 200))
	_touch_input._on_touch_dragged(drag)

	# Assert
	assert_eq(_touch_input.move_direction.x, 1.0,
		"200px at max_radius=200 should give x=1.0")
	assert_eq(_touch_input.move_direction.length(), 1.0,
		"200px at max_radius=200 should give length=1.0")


# ── Edge Case: Diagonal (Non-Axis) Offset ──

func test_move_signal_diagonal_offset_45_degrees() -> void:
	# QA edge: GIVEN 45-degree diagonal offset of length 100px,
	# THEN x and y components = 0.5 / sqrt(2) ~ 0.354

	# Arrange
	var sqrt2_inv := 1.0 / sqrt(2.0)  # ~0.7071 (normalized direction)
	var expected_component := sqrt2_inv * (100.0 / 200.0)  # ~0.3536

	var press := _make_touch_event(0, true, Vector2(100, 200))
	_touch_input._on_touch_pressed(press)

	# Act: drag 100px at 45 degrees (offset components ~70.71 each)
	var drag := _make_drag_event(0, Vector2(100.0 + 100.0 * sqrt2_inv, 200.0 + 100.0 * sqrt2_inv))
	_touch_input._on_touch_dragged(drag)

	# Assert
	assert_almost_eq(_touch_input.move_direction.x, expected_component, 0.001,
		"x component should be ~0.354 for 45deg 100px offset")
	assert_almost_eq(_touch_input.move_direction.y, expected_component, 0.001,
		"y component should be ~0.354 for 45deg 100px offset")
	assert_almost_eq(_touch_input.move_direction.length(), 0.5, 0.001,
		"length should be 0.5 for 100px offset at max_radius=200")
