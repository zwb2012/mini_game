# TouchInput Autoload — Foundation Layer
# Story 001: 屏幕分区与触控点生命周期
# Story 002: 移动信号生成（move direction computation）
# Story 004: 多点触控并发（multitouch concurrency enforcement）
# Story 005: 游戏状态集成与焦点管理（state guard + focus out reset）
# Story 006: JSON 配置驱动参数（zero hardcoded tuning constants）
#
# Converts raw touch events into 5 standardized game input signals.
# Left zone (x < split_x): move | Right zone (x >= split_x): aim + shoot
#
# ADR-0009: TouchInput as Autoload; PlayerController polls continuous values
# and connects to shoot_tapped signal (single-frame pulse).
# ADR-0010: GameStateMachine integration — only processes input in PLAYING state.

extends Node

## Emitted when a right-zone tap completes (single-frame pulse).
## Connected by PlayerController — ensures no frame-order loss.
signal shoot_tapped()

## Normalized move direction, length 0–1. Vector2.ZERO when no left-zone touch.
var move_direction: Vector2 = Vector2.ZERO

## Aim point in screen coordinates. Retains last valid value when no right-zone touch.
var aim_position: Vector2 = Vector2.ZERO

## True every frame while right-zone touch is held (for continuous fire).
var shoot_held: bool = false

## Internal single-frame pulse: true on the frame a tap is detected, false thereafter.
## Public API is shoot_tapped signal — this property only for internal use and testing.
var _shoot_tapped_pulse: bool = false

## True when right zone has at least one active touch point.
var is_aiming: bool = false

## X-coordinate dividing left (move) and right (aim/shoot) zones.
## Single source of truth — all downstream systems read this value.
var split_x: float = 0.0

## Config for deadzone, max_radius. Injection point for tests;
## falls back to default TouchInputConfig in _ready() if null.
@export var config: TouchInputConfig = null

## Active touch points keyed by touch event index.
## {touch_index: {zone: "left"|"right", origin: Vector2, current: Vector2, press_time: int}}
var _active_touches: Dictionary = {}

## Internal flag: set to true in the frame a tap is detected.
## Used to skip shoot_held processing in _process when a tap just occurred,
## preventing the same frame from reporting both shoot_tapped and shoot_held.
var _just_tapped: bool = false

## Multitouch system state, updated every _process based on active touch distribution.
## 5 states: IDLE, MOVE_ONLY, AIM_ONLY, MOVE_AND_AIM, MOVE_AND_SHOOT.
## Consumers (debug HUD, game state machine) read this for context-aware behavior.
enum TouchState { IDLE, MOVE_ONLY, AIM_ONLY, MOVE_AND_AIM, MOVE_AND_SHOOT }
var touch_state: TouchState = TouchState.IDLE


# Story 006: Safe range boundaries from GDD Tuning Knobs table.
# Used for validation when loading JSON config.
const MIN_DEADZONE: float = 10.0
const MAX_DEADZONE: float = 50.0
const MIN_MAX_RADIUS: float = 100.0
const MAX_MAX_RADIUS: float = 300.0
const MIN_TAP_THRESHOLD_MS: int = 150
const MAX_TAP_THRESHOLD_MS: int = 300
const MIN_SPLIT_X_RATIO: float = 0.3
const MAX_SPLIT_X_RATIO: float = 0.7

# Default fallback values matching GDD defaults — used when JSON is missing/invalid.
const FALLBACK_DEADZONE: float = 20.0
const FALLBACK_MAX_RADIUS: float = 200.0
const FALLBACK_TAP_THRESHOLD_MS: int = 200
const FALLBACK_SPLIT_X_RATIO: float = 0.5

const CONFIG_PATH: String = "res://assets/data/touch_input_config.json"


func _ready() -> void:
	_update_split_x()
	get_tree().get_root().size_changed.connect(_update_split_x)

	# Ensure config is set — fallback to defaults if no override was provided
	if config == null:
		config = TouchInputConfig.new()

	# Story 006: Override Resource defaults with JSON config values.
	# Falls back to Resource defaults (GDD values) if JSON is missing or invalid.
	_apply_config_from_json()

	# Story 005: Subscribe to game state changes.
	# PAUSED/DEAD → suppress touch input; PLAYING → resume.
	# state_changed only fires on transition_to() calls, not at init —
	# GameStateMachine defaults to PLAYING for MVP.
	GameStateMachine.state_changed.connect(_on_state_changed)


func _exit_tree() -> void:
	if is_instance_valid(get_tree()) and get_tree().get_root():
		get_tree().get_root().size_changed.disconnect(_update_split_x)
	_active_touches.clear()
	move_direction = Vector2.ZERO
	is_aiming = false
	shoot_held = false
	_shoot_tapped_pulse = false
	_just_tapped = false
	touch_state = TouchState.IDLE
	aim_position = Vector2.ZERO


func _update_split_x() -> void:
	# Story 006: Use config-driven ratio instead of hardcoded 0.5.
	var ratio: float = config.split_x_ratio if config != null else FALLBACK_SPLIT_X_RATIO
	split_x = get_viewport().get_visible_rect().size.x * ratio


## Per-frame processing for shoot_held state, shoot_tapped pulse reset,
## and multitouch system state evaluation.
##
## Every frame:
##   1. Resets shoot_tapped property to false (pulse lasts one frame).
##   2. Evaluates and updates touch_state based on current active touches.
##   3. If _just_tapped is true (tap occurred this frame), clears it and skips
##      shoot_held processing to avoid same-frame tap+hold.
##   4. For each active right-zone touch, checks if hold_duration has exceeded
##      tap_threshold → sets shoot_held = true.
func _process(_delta: float) -> void:
	# Story 005: Only process touch signals when game is actively playing.
	if not GameStateMachine.is_playing():
		return

	# Step 1: Reset shoot_tapped pulse at the start of every frame.
	_shoot_tapped_pulse = false

	# Step 2: Update system state based on current active touches.
	_update_touch_state()

	# Step 3: If a tap just occurred in this frame's input, skip shoot_held
	# processing to prevent same-frame tap+hold coexistence.
	if _just_tapped:
		_just_tapped = false
		return

	# Step 4: Check right-zone touches for hold duration.
	var cfg := config
	if cfg == null:
		return

	var threshold_ms: int = cfg.tap_threshold_ms
	var now: int = Time.get_ticks_msec()

	for touch in _active_touches.values():
		if touch["zone"] == "right":
			var hold_duration: int = now - touch["press_time"]
			if hold_duration >= threshold_ms:
				shoot_held = true
				# Only one right touch needs to be held; exit early.
				break


func _input(event: InputEvent) -> void:
	# Story 005: Ignore touch input in non-PLAYING states.
	# MAIN_MENU events are handled by the UI layer directly.
	if not GameStateMachine.is_playing():
		return

	if event is InputEventScreenTouch:
		if event.pressed:
			_on_touch_pressed(event)
		else:
			_on_touch_released(event)
	elif event is InputEventScreenDrag:
		_on_touch_dragged(event)


func _on_touch_pressed(event: InputEventScreenTouch) -> void:
	var zone := _determine_zone(event.position.x)

	# Story 004: Same-zone 2nd touch rejection.
	# If this zone already has an active touch, ignore this new touch.
	# This ensures max 1 touch per zone (left + right = 2 concurrent max).
	for touch in _active_touches.values():
		if touch["zone"] == zone:
			return

	# origin and press_time reserved for Story 002 (deadzone) and Story 003 (tap/hold)
	_active_touches[event.index] = {
		"zone": zone,
		"origin": event.position,
		"current": event.position,
		"press_time": Time.get_ticks_msec()
	}

	if zone == "right":
		aim_position = event.position
		is_aiming = true


## AC9: position.x >= split_x → right zone (midline belongs to right).
## Extracted as a separate method so tests can verify zone logic directly
## without driving the full touch lifecycle.
func _determine_zone(x: float) -> String:
	return "right" if x >= split_x else "left"


func _on_touch_released(event: InputEventScreenTouch) -> void:
	if not _active_touches.has(event.index):
		return

	var zone: String = _active_touches[event.index]["zone"]

	# Tap vs hold discrimination (Story 003): read press data BEFORE erasing.
	if zone == "right":
		var touch_data: Dictionary = _active_touches[event.index]
		var hold_duration: int = Time.get_ticks_msec() - touch_data["press_time"]
		var hold_distance: float = (event.position - touch_data["origin"]).length()

		var cfg := config
		if cfg != null and hold_duration < cfg.tap_threshold_ms and hold_distance < cfg.deadzone:
			# This is a tap: emit shoot_tapped signal + set pulse property.
			_shoot_tapped_pulse = true
			_just_tapped = true
			shoot_tapped.emit()

	_active_touches.erase(event.index)

	if zone == "right" and not _has_active_right_touch():
		is_aiming = false
		shoot_held = false

	if zone == "left" and not _has_active_left_touch():
		move_direction = Vector2.ZERO


# AC10: touch zone is locked on press — dragging across the midline does
# not change zone assignment. The stored zone in _active_touches is used,
# not re-evaluated from current position.
func _on_touch_dragged(event: InputEventScreenDrag) -> void:
	if not _active_touches.has(event.index):
		return

	_active_touches[event.index]["current"] = event.position
	var zone: String = _active_touches[event.index]["zone"]

	if zone == "right":
		aim_position = event.position
	elif zone == "left":
		_update_move_direction(event.index)


## Computes move_direction from the current offset of the given left-zone touch.
## Formula from ADR-0009:
##   raw_offset / offset_length * clamp(offset_length / max_radius, 0, 1)
## Returns Vector2.ZERO when offset_length < deadzone.
func _update_move_direction(touch_index: int) -> void:
	if not _active_touches.has(touch_index):
		return

	var touch: Dictionary = _active_touches[touch_index]
	if touch["zone"] != "left":
		return

	var cfg := config
	if cfg == null:
		move_direction = Vector2.ZERO
		return

	var raw_offset: Vector2 = touch["current"] - touch["origin"]
	var offset_length: float = raw_offset.length()

	if offset_length <= cfg.deadzone:
		move_direction = Vector2.ZERO
	else:
		move_direction = (raw_offset / offset_length) * clampf(offset_length / cfg.max_radius, 0.0, 1.0)


## Evaluates the current multitouch system state based on active touch distribution.
##
## State determination from Story 004:
## - IDLE: 0 active touches
## - MOVE_ONLY: only left-zone touch active
## - AIM_ONLY: only right-zone touch active
## - MOVE_AND_AIM: left + right active, right not yet held long enough
## - MOVE_AND_SHOOT: left + right active, right held >= tap_threshold
func _update_touch_state() -> void:
	var has_left := false
	var has_right := false
	var right_held_enough := false

	var cfg := config
	var now := Time.get_ticks_msec()
	var threshold_ms: int = cfg.tap_threshold_ms if cfg != null else 200

	for touch in _active_touches.values():
		match touch["zone"]:
			"left":
				has_left = true
			"right":
				has_right = true
				if cfg != null and (now - touch["press_time"]) >= threshold_ms:
					right_held_enough = true

	if has_left and has_right and right_held_enough:
		touch_state = TouchState.MOVE_AND_SHOOT
	elif has_left and has_right:
		touch_state = TouchState.MOVE_AND_AIM
	elif has_left:
		touch_state = TouchState.MOVE_ONLY
	elif has_right:
		touch_state = TouchState.AIM_ONLY
	else:
		touch_state = TouchState.IDLE


# Story 006: Loads JSON config file and overrides TouchInputConfig Resource values.
# Validates each value against GDD safe ranges. Falls back to Resource defaults
# (which match GDD defaults) when JSON is missing, malformed, or out of range.
func _apply_config_from_json() -> void:
	if config == null:
		return

	if not FileAccess.file_exists(CONFIG_PATH):
		push_warning("TouchInput: config file not found at %s, using defaults." % CONFIG_PATH)
		return

	var json_str := FileAccess.get_file_as_string(CONFIG_PATH)
	if json_str.is_empty():
		push_warning("TouchInput: config file empty, using defaults.")
		return

	var parsed: Variant = JSON.parse_string(json_str)
	if not parsed is Dictionary:
		push_warning("TouchInput: config JSON invalid format, using defaults.")
		return

	config.deadzone = _clamp_config_float(parsed.get("deadzone"), FALLBACK_DEADZONE, MIN_DEADZONE, MAX_DEADZONE, "deadzone")
	config.max_radius = _clamp_config_float(parsed.get("max_radius"), FALLBACK_MAX_RADIUS, MIN_MAX_RADIUS, MAX_MAX_RADIUS, "max_radius")
	config.split_x_ratio = _clamp_config_float(parsed.get("split_x_ratio"), FALLBACK_SPLIT_X_RATIO, MIN_SPLIT_X_RATIO, MAX_SPLIT_X_RATIO, "split_x_ratio")

	var tap_ms: Variant = parsed.get("tap_threshold_ms")
	if tap_ms is int or tap_ms is float:
		var clamped_ms: int = clampi(int(tap_ms), MIN_TAP_THRESHOLD_MS, MAX_TAP_THRESHOLD_MS)
		if int(tap_ms) != clamped_ms:
			push_warning("TouchInput: tap_threshold_ms %d out of range [%d, %d], using default %d." % [int(tap_ms), MIN_TAP_THRESHOLD_MS, MAX_TAP_THRESHOLD_MS, FALLBACK_TAP_THRESHOLD_MS])
			config.tap_threshold = FALLBACK_TAP_THRESHOLD_MS / 1000.0
		else:
			config.tap_threshold = clamped_ms / 1000.0
	else:
		push_warning("TouchInput: tap_threshold_ms missing or invalid type, using default %d." % FALLBACK_TAP_THRESHOLD_MS)
		config.tap_threshold = FALLBACK_TAP_THRESHOLD_MS / 1000.0

	_update_split_x()


func _clamp_config_float(raw_value: Variant, fallback: float, min_val: float, max_val: float, name: String) -> float:
	if not (raw_value is float or raw_value is int):
		push_warning("TouchInput: %s missing or invalid type, using default %.1f." % [name, fallback])
		return fallback
	var clamped: float = clampf(float(raw_value), min_val, max_val)
	if float(raw_value) != clamped:
		push_warning("TouchInput: %s %.1f out of range [%.1f, %.1f], using default %.1f." % [name, float(raw_value), min_val, max_val, fallback])
		return fallback
	return clamped


## Reloads the JSON config file and re-applies values at runtime.
## Intended for A/B testing and tuning without restarting the game.
func reload_config() -> void:
	_apply_config_from_json()


# Story 005: Called when GameStateMachine emits state_changed signal.
# PLAYING → resume (do nothing — wait for user touch).
# PAUSED/DEAD → clear all active touches and reset output signals.
# MAIN_MENU → same suppression as PAUSED (touch events are handled by UI layer).
func _on_state_changed(_old_state: GameStateMachine.GameState, new_state: GameStateMachine.GameState) -> void:
	match new_state:
		GameStateMachine.GameState.PLAYING:
			# Resume — no automatic input recovery. Wait for fresh touches.
			pass
		_:
			# PAUSED, DEAD, MAIN_MENU, LEVEL_COMPLETE — suppress all touch input.
			_reset_all_signals()


# Story 005: Handle application focus loss (phone call, notification, etc.).
# Godot sends touch release events automatically on focus out,
# but we also do an explicit reset to guarantee consistency.
func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		_reset_all_signals()


# Resets all output signals and clears active touch state.
# aim_position is intentionally preserved — allows the aiming line
# to remain at its last valid position when the game is paused
# or focus is lost.
func _reset_all_signals() -> void:
	_active_touches.clear()
	move_direction = Vector2.ZERO
	shoot_held = false
	_shoot_tapped_pulse = false
	_just_tapped = false
	is_aiming = false
	touch_state = TouchState.IDLE
	# aim_position intentionally NOT reset — retains last valid value.


func _has_active_left_touch() -> bool:
	for touch in _active_touches.values():
		if touch["zone"] == "left":
			return true
	return false


func _has_active_right_touch() -> bool:
	for touch in _active_touches.values():
		if touch["zone"] == "right":
			return true
	return false
