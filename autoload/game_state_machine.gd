# GameStateMachine Autoload — 游戏全局状态机
# ADR-0010: enum + transition_to() + state_changed signal
# Foundation 层 — 不依赖任何其他系统
extends Node

enum GameState {
	MAIN_MENU,
	PLAYING,
	PAUSED,
	DEAD,
	LEVEL_COMPLETE
}

signal state_changed(old: GameState, new: GameState)

const DEFAULT_TRANSITIONS: Dictionary = {
	GameState.MAIN_MENU: [GameState.PLAYING],
	GameState.PLAYING: [GameState.PAUSED, GameState.DEAD, GameState.LEVEL_COMPLETE],
	GameState.PAUSED: [GameState.PLAYING],
	GameState.DEAD: [GameState.PLAYING, GameState.MAIN_MENU],
	GameState.LEVEL_COMPLETE: [GameState.PLAYING, GameState.MAIN_MENU],
}

var _current_state: GameState = GameState.PLAYING
var _transitions: Dictionary = {}
var _is_transitioning: bool = false

var current_state: GameState:
	get:
		return _current_state
	set(_value):
		push_warning("GameStateMachine: current_state is read-only. Use transition_to().")


func _ready() -> void:
	_transitions = _load_transition_table()


func _load_transition_table() -> Dictionary:
	var file_path := "res://assets/data/state_machine/transitions.json"
	if not FileAccess.file_exists(file_path):
		push_warning("GameStateMachine: transitions.json not found, using defaults.")
		return DEFAULT_TRANSITIONS.duplicate()
	var json_str := FileAccess.get_file_as_string(file_path)
	if json_str.is_empty():
		push_warning("GameStateMachine: transitions.json empty, using defaults.")
		return DEFAULT_TRANSITIONS.duplicate()
	var parsed: Variant = JSON.parse_string(json_str)
	if not parsed is Dictionary or not parsed.has("transitions"):
		push_warning("GameStateMachine: transitions.json invalid format, using defaults.")
		return DEFAULT_TRANSITIONS.duplicate()
	return _parse_transitions(parsed["transitions"])


func _parse_transitions(raw: Dictionary) -> Dictionary:
	var result: Dictionary = {}
	for state_str in raw:
		var state: GameState = GameState[state_str]
		var targets: Array[GameState] = []
		for target_str in raw[state_str]:
			targets.append(GameState[target_str])
		result[state] = targets
	return result


func transition_to(new_state: GameState) -> bool:
	if _is_transitioning:
		push_warning("GameStateMachine: reentrant transition_to() blocked (%s -> %s)" % [_current_state, new_state])
		return false
	if new_state == _current_state:
		push_warning("GameStateMachine: same-state transition ignored (%s)" % _current_state)
		return false
	var allowed: Array = _transitions.get(_current_state, [])
	if new_state not in allowed:
		push_error("GameStateMachine: illegal transition %s -> %s" % [_current_state, new_state])
		return false

	_is_transitioning = true
	var old_state := _current_state
	_current_state = new_state
	state_changed.emit(old_state, new_state)
	_is_transitioning = false
	return true


func is_playing() -> bool:
	return _current_state == GameState.PLAYING
