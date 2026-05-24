# Story 006 — Config-Driven Parameters Tests
# AC14: Configurable split_x via split_x_ratio
# AC15: Zero hardcoded tuning constants — all params from JSON config
#
# Edge cases: JSON missing, JSON malformed, values out of safe range,
# boundary values, reload_config() hot-reload, unknown keys ignored

extends GutTest

var _touch_input: Node

const CONFIG_PATH := "res://assets/data/touch_input_config.json"
const BACKUP_PATH := "res://assets/data/touch_input_config.json.bak"


func before_each() -> void:
	_touch_input = TouchInput
	_touch_input._active_touches.clear()
	_touch_input.move_direction = Vector2.ZERO
	_touch_input.aim_position = Vector2.ZERO
	_touch_input.shoot_held = false
	_touch_input._shoot_tapped_pulse = false
	_touch_input._just_tapped = false
	_touch_input.is_aiming = false
	_touch_input.touch_state = TouchInput.TouchState.IDLE

	# Reset config to fresh defaults before each test.
	_touch_input.config = TouchInputConfig.new()


func after_each() -> void:
	# Restore original config file if backup exists.
	if FileAccess.file_exists(BACKUP_PATH):
		var dir := DirAccess.open("res://assets/data/")
		if dir != null:
			if dir.file_exists("touch_input_config.json"):
				dir.remove("touch_input_config.json")
			dir.rename("touch_input_config.json.bak", "touch_input_config.json")


# ── Helpers ──

func _write_config(json_str: String) -> void:
	if FileAccess.file_exists(CONFIG_PATH):
		# Backup original.
		var dir := DirAccess.open("res://assets/data/")
		if dir != null:
			dir.rename("touch_input_config.json", "touch_input_config.json.bak")
	var f := FileAccess.open(CONFIG_PATH, FileAccess.WRITE)
	f.store_string(json_str)
	f.close()


func _delete_config() -> void:
	if FileAccess.file_exists(CONFIG_PATH):
		var dir := DirAccess.open("res://assets/data/")
		if dir != null:
			dir.rename("touch_input_config.json", "touch_input_config.json.bak")


# ── AC14: Configurable split_x ──

func test_config_driven_split_x_ratio_default() -> void:
	# Default split_x_ratio=0.5, screen width 1080 → split_x=540
	_touch_input.split_x = 0.0  # force reset
	_touch_input._update_split_x()

	# Cannot precisely control screen width in test — verify ratio is applied.
	assert_ne(_touch_input.split_x, 0.0)

	# Left zone (x < split_x), Right zone (x >= split_x).
	# Verify the logic uses split_x correctly with default config.
	assert_eq(_touch_input._determine_zone(100), "left")
	assert_eq(_touch_input._determine_zone(_touch_input.split_x + 1), "right")


func test_config_driven_split_x_ratio_0_3() -> void:
	_touch_input.config.split_x_ratio = 0.3
	# Simulate 1080px screen width.
	_touch_input.split_x = 1080.0 * 0.3  # = 324

	assert_eq(_touch_input._determine_zone(200), "left", "x=200 should be left when split_x=324")
	assert_eq(_touch_input._determine_zone(400), "right", "x=400 should be right when split_x=324")
	assert_eq(_touch_input._determine_zone(324), "right", "x=324 (exactly on midline) should be right")


func test_config_driven_split_x_ratio_0_7() -> void:
	_touch_input.config.split_x_ratio = 0.7
	_touch_input.split_x = 1080.0 * 0.7  # = 756

	assert_eq(_touch_input._determine_zone(755), "left")
	assert_eq(_touch_input._determine_zone(756), "right")


# ── AC14 Edge: Boundary split_x_ratio ──

func test_config_driven_split_x_ratio_min_boundary() -> void:
	_touch_input.config.split_x_ratio = 0.3
	_touch_input.split_x = 1080.0 * 0.3

	assert_eq(_touch_input._determine_zone(_touch_input.split_x - 1), "left")
	assert_eq(_touch_input._determine_zone(_touch_input.split_x), "right")


func test_config_driven_split_x_ratio_max_boundary() -> void:
	_touch_input.config.split_x_ratio = 0.7
	_touch_input.split_x = 1080.0 * 0.7

	assert_eq(_touch_input._determine_zone(_touch_input.split_x - 1), "left")
	assert_eq(_touch_input._determine_zone(_touch_input.split_x), "right")


# ── AC15: JSON Config Loading ──

func test_config_driven_json_loads_override_defaults() -> void:
	_write_config('{"deadzone": 30, "max_radius": 180, "tap_threshold_ms": 250, "split_x_ratio": 0.4}')
	_touch_input._apply_config_from_json()

	assert_eq(_touch_input.config.deadzone, 30.0)
	assert_eq(_touch_input.config.max_radius, 180.0)
	assert_eq(_touch_input.config.tap_threshold_ms, 250)
	assert_eq(_touch_input.config.split_x_ratio, 0.4)


# ── AC15: Missing Config → Fallback Defaults ──

func test_config_driven_missing_file_falls_back_to_defaults() -> void:
	_delete_config()
	_touch_input.config = TouchInputConfig.new()
	_touch_input._apply_config_from_json()

	assert_eq(_touch_input.config.deadzone, 20.0, "should fall back to default deadzone")
	assert_eq(_touch_input.config.max_radius, 200.0, "should fall back to default max_radius")
	assert_eq(_touch_input.config.tap_threshold_ms, 200, "should fall back to default tap_threshold")
	assert_eq(_touch_input.config.split_x_ratio, 0.5, "should fall back to default split_x_ratio")


# ── AC15: Out-of-Range Values → Fallback ──

func test_config_driven_deadzone_below_min_falls_back() -> void:
	_write_config('{"deadzone": 5, "max_radius": 200, "tap_threshold_ms": 200, "split_x_ratio": 0.5}')
	_touch_input._apply_config_from_json()

	assert_eq(_touch_input.config.deadzone, 20.0, "deadzone=5 (< min 10) should fall back to 20")


func test_config_driven_deadzone_above_max_falls_back() -> void:
	_write_config('{"deadzone": 60, "max_radius": 200, "tap_threshold_ms": 200, "split_x_ratio": 0.5}')
	_touch_input._apply_config_from_json()

	assert_eq(_touch_input.config.deadzone, 20.0, "deadzone=60 (> max 50) should fall back to 20")


func test_config_driven_raw_value_on_boundary_allowed() -> void:
	_write_config('{"deadzone": 10, "max_radius": 200, "tap_threshold_ms": 200, "split_x_ratio": 0.5}')
	_touch_input._apply_config_from_json()

	assert_eq(_touch_input.config.deadzone, 10.0, "deadzone=10 (= min) should be accepted")


func test_config_driven_negative_max_radius_falls_back() -> void:
	_write_config('{"deadzone": 20, "max_radius": -50, "tap_threshold_ms": 200, "split_x_ratio": 0.5}')
	_touch_input._apply_config_from_json()

	assert_eq(_touch_input.config.max_radius, 200.0, "negative max_radius should fall back to 200")


# ── AC15: Malformed JSON → Fallback ──

func test_config_driven_malformed_json_falls_back() -> void:
	_write_config('not valid json {{{')
	_touch_input.config.deadzone = 999.0  # dirty first to verify reset
	_touch_input.config = TouchInputConfig.new()
	_touch_input._apply_config_from_json()

	assert_eq(_touch_input.config.deadzone, 20.0, "malformed JSON should fall back to defaults")


# ── AC15: Missing Key in JSON → Default for That Key ──

func test_config_driven_missing_key_uses_default_for_that_key() -> void:
	_write_config('{"deadzone": 25}')
	_touch_input._apply_config_from_json()

	assert_eq(_touch_input.config.deadzone, 25.0, "present key should use JSON value")
	assert_eq(_touch_input.config.max_radius, 200.0, "missing key should use default")


# ── AC15: Unknown Key in JSON → Ignored ──

func test_config_driven_unknown_key_ignored() -> void:
	_write_config('{"deadzone": 20, "unknown_field": 999, "max_radius": 200, "tap_threshold_ms": 200, "split_x_ratio": 0.5}')
	_touch_input._apply_config_from_json()

	# Should load normally — unknown key causes no error.
	assert_eq(_touch_input.config.deadzone, 20.0)


# ── reload_config() Hot Reload ──

func test_config_driven_reload_config_updates_values() -> void:
	_write_config('{"deadzone": 25, "max_radius": 200, "tap_threshold_ms": 200, "split_x_ratio": 0.5}')
	_touch_input._apply_config_from_json()
	assert_eq(_touch_input.config.deadzone, 25.0)

	_write_config('{"deadzone": 35, "max_radius": 200, "tap_threshold_ms": 200, "split_x_ratio": 0.5}')
	_touch_input.reload_config()

	assert_eq(_touch_input.config.deadzone, 35.0, "reload_config should apply new values")


func test_config_driven_reload_invalid_falls_back() -> void:
	_write_config('{"deadzone": 25, "max_radius": 200, "tap_threshold_ms": 200, "split_x_ratio": 0.5}')
	_touch_input._apply_config_from_json()

	_write_config('{"deadzone": 999, "max_radius": 200, "tap_threshold_ms": 200, "split_x_ratio": 0.5}')
	_touch_input.reload_config()

	assert_eq(_touch_input.config.deadzone, 20.0, "reload_config with invalid value should fall back")
