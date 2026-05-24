# Story 001 — Zone Partition & Touch Lifecycle Tests
# test_zone_partition_* : AC9 (midline), AC10 (cross-midline lock)
# test_idle_state_* : AC1 (IDLE defaults)

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
	_touch_input.split_x = 0.0


# ── AC1: IDLE State Defaults ──

func test_idle_state_all_signals_default() -> void:
	# AC1: GIVEN no active touches, WHEN checking all 5 output signals,
	# THEN move_direction=(0,0), shoot_held=false, is_aiming=false
	# (shoot_tapped is a signal — not polled; verified via signal existence below)

	assert_eq(_touch_input.move_direction, Vector2.ZERO,
		"move_direction should be Vector2.ZERO in IDLE")
	assert_false(_touch_input.shoot_held,
		"shoot_held should be false in IDLE")
	assert_false(_touch_input.is_aiming,
		"is_aiming should be false in IDLE")


func test_shoot_tapped_signal_exists() -> void:
	# Verify the shoot_tapped signal is declared and connectable
	var signals: Array[Dictionary] = _touch_input.get_signal_list()
	var found: bool = false
	for s: Dictionary in signals:
		if s["name"] == "shoot_tapped":
			found = true
			break
	assert_true(found, "shoot_tapped signal must exist on TouchInput")


func test_idle_state_aim_position_retains_last_valid() -> void:
	# AC1: GIVEN aim_position was previously (300, 400), WHEN IDLE,
	# THEN aim_position retains (300, 400)
	_touch_input.aim_position = Vector2(300, 400)
	# Simulate all touches released
	_touch_input._active_touches.clear()
	_touch_input.is_aiming = false

	assert_eq(_touch_input.aim_position, Vector2(300, 400),
		"aim_position should retain last valid value in IDLE")


# ── AC9: Midline Attribution ──

func test_zone_partition_midline_belongs_to_right() -> void:
	# AC9: GIVEN split_x = screen_width/2, WHEN touch at exactly split_x,
	# THEN zone is "right" (>= split_x)
	var screen_width := 1080.0
	_touch_input.split_x = screen_width / 2.0  # 540.0

	# Direct _determine_zone test — position.x == split_x
	# TouchInput uses position.x >= split_x for right zone
	assert_eq(_touch_input._determine_zone(540.0), "right",
		"position.x == split_x should be right zone (>= rule)")

	assert_eq(_touch_input._determine_zone(539.0), "left",
		"position.x < split_x should be left zone")

	assert_eq(_touch_input._determine_zone(541.0), "right",
		"position.x > split_x should be right zone")


func test_zone_partition_midline_non_integer_split() -> void:
	# AC9 edge case: non-integer split_x, float precision does not affect zone
	_touch_input.split_x = 540.5

	assert_eq(_touch_input._determine_zone(540.5), "right",
		"exact float borderline should be right zone")
	assert_eq(_touch_input._determine_zone(540.499), "left",
		"just below borderline (float) should be left zone")


# ── AC10: Cross-Midline Zone Lock ──

func test_zone_lock_left_touch_drags_across_midline_stays_left() -> void:
	# AC10: GIVEN touch pressed in left zone, WHEN dragged across midline,
	# THEN touch still drives move_direction, aim_position unaffected by this touch

	var screen_width := 1080.0
	_touch_input.split_x = screen_width / 2.0  # 540.0

	# Press in left zone (x = 490, well below midline)
	var press_event := _make_touch_event(0, true, Vector2(490, 300))
	_touch_input._on_touch_pressed(press_event)

	# Verify zone assignment is "left"
	assert_eq(_touch_input._active_touches[0]["zone"], "left",
		"touch at x=490 should be left zone")
	assert_false(_touch_input.is_aiming,
		"left-zone touch should not set is_aiming")

	# Drag across midline to x = 590 (now in right zone)
	var drag_event := _make_drag_event(0, Vector2(590, 350))
	_touch_input._on_touch_dragged(drag_event)

	# Zone still "left" — locked on press
	assert_eq(_touch_input._active_touches[0]["zone"], "left",
		"zone should remain 'left' after dragging across midline")
	# aim_position should NOT be affected by left-zone drag
	assert_eq(_touch_input.aim_position, Vector2.ZERO,
		"aim_position should be unaffected by left-zone drag across midline")


func test_zone_lock_right_touch_drags_across_midline_stays_right() -> void:
	# AC10 edge case: right-zone touch dragged left across midline stays right

	var screen_width := 1080.0
	_touch_input.split_x = screen_width / 2.0  # 540.0

	# Press in right zone
	var press_event := _make_touch_event(0, true, Vector2(590, 300))
	_touch_input._on_touch_pressed(press_event)

	assert_eq(_touch_input._active_touches[0]["zone"], "right")

	# Drag left across midline
	var drag_event := _make_drag_event(0, Vector2(490, 350))
	_touch_input._on_touch_dragged(drag_event)

	assert_eq(_touch_input._active_touches[0]["zone"], "right",
		"zone should remain 'right' after dragging left across midline")
	assert_eq(_touch_input.aim_position, Vector2(490, 350),
		"aim_position should update from right-zone drag")


func test_zone_lock_drag_to_exact_midline_no_zone_change() -> void:
	# AC10 edge case: drag ends exactly at midline, zone unchanged

	var screen_width := 1080.0
	_touch_input.split_x = screen_width / 2.0

	# Press in left zone
	var press_event := _make_touch_event(0, true, Vector2(100, 300))
	_touch_input._on_touch_pressed(press_event)
	assert_eq(_touch_input._active_touches[0]["zone"], "left")

	# Drag to exact midline
	var drag_event := _make_drag_event(0, Vector2(540.0, 300))
	_touch_input._on_touch_dragged(drag_event)
	assert_eq(_touch_input._active_touches[0]["zone"], "left",
		"zone should remain 'left' when dragged to exact midline")


# ── Touch Lifecycle ──

func test_touch_press_creates_active_entry() -> void:
	_touch_input.split_x = 540.0

	var press_event := _make_touch_event(0, true, Vector2(200, 400))
	_touch_input._on_touch_pressed(press_event)

	assert_true(_touch_input._active_touches.has(0), "touch index 0 should be tracked")
	assert_eq(_touch_input._active_touches[0]["origin"], Vector2(200, 400))
	assert_eq(_touch_input._active_touches[0]["current"], Vector2(200, 400))
	assert_gt(_touch_input._active_touches[0]["press_time"], 1000000000,
		"press_time should be a valid millisecond timestamp")


func test_touch_release_removes_active_entry() -> void:
	_touch_input.split_x = 540.0

	var press := _make_touch_event(0, true, Vector2(200, 400))
	_touch_input._on_touch_pressed(press)
	assert_true(_touch_input._active_touches.has(0))

	var release := _make_touch_event(0, false, Vector2(250, 450))
	_touch_input._on_touch_released(release)
	assert_false(_touch_input._active_touches.has(0), "touch should be removed on release")


func test_release_unknown_index_does_nothing() -> void:
	_touch_input.split_x = 540.0
	var release := _make_touch_event(99, false, Vector2(100, 100))
	# Should not crash or affect state
	_touch_input._on_touch_released(release)
	# State unchanged
	assert_false(_touch_input.is_aiming)


func test_right_touch_press_updates_is_aiming_and_aim_position() -> void:
	_touch_input.split_x = 540.0

	var press := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(press)

	assert_true(_touch_input.is_aiming, "right-zone touch should set is_aiming")
	assert_eq(_touch_input.aim_position, Vector2(600, 300))


func test_right_touch_release_clears_is_aiming() -> void:
	_touch_input.split_x = 540.0

	var press := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(press)
	assert_true(_touch_input.is_aiming)

	var release := _make_touch_event(0, false, Vector2(600, 300))
	_touch_input._on_touch_released(release)
	assert_false(_touch_input.is_aiming, "is_aiming should clear when last right touch releases")


func test_right_touch_drag_updates_aim_position() -> void:
	_touch_input.split_x = 540.0

	var press := _make_touch_event(0, true, Vector2(600, 300))
	_touch_input._on_touch_pressed(press)

	var drag := _make_drag_event(0, Vector2(650, 350))
	_touch_input._on_touch_dragged(drag)

	assert_eq(_touch_input.aim_position, Vector2(650, 350))


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
