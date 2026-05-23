# TouchInput Autoload — Foundation Layer
# Story 001: 屏幕分区与触控点生命周期
# Story 002: 移动信号生成（move direction computation）
#
# Converts raw touch events into 5 standardized game input signals.
# Left zone (x < split_x): move | Right zone (x >= split_x): aim + shoot
#
# ADR-0009: TouchInput as Autoload; PlayerController polls continuous values
# and connects to shoot_tapped signal (single-frame pulse).

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


func _ready() -> void:
	_update_split_x()
	get_tree().get_root().size_changed.connect(_update_split_x)

	# Ensure config is set — fallback to defaults if no override was provided
	if config == null:
		config = TouchInputConfig.new()


func _exit_tree() -> void:
	_active_touches.clear()
	move_direction = Vector2.ZERO
	is_aiming = false
	shoot_held = false


func _update_split_x() -> void:
	split_x = get_viewport().get_visible_rect().size.x / 2.0


func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed:
			_on_touch_pressed(event)
		else:
			_on_touch_released(event)
	elif event is InputEventScreenDrag:
		_on_touch_dragged(event)


func _on_touch_pressed(event: InputEventScreenTouch) -> void:
	var zone := _determine_zone(event.position.x)

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
