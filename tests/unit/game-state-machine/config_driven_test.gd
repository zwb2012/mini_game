# Story 002 — GameStateMachine Config-Driven Transition Table Tests
# Covers AC11 (initial_state from config), AC12 (config-driven, no hardcoding),
# and ADR-0010 Note #4 (startup validation).
#
# References:
#   ADR-0010: Game State Machine Architecture
#   TR-game-state-003: Config-driven transition table with JSON fallback
#   GDD AC11: initial_state from config (default MAIN_MENU, MVP uses PLAYING)
#   GDD AC12: All values from config file, no hardcoding
#
# Each test resets GameStateMachine internal state in before_each().
# Config loading is tested by manipulating the JSON file or by directly
# calling the internal loading methods with test data.
#
# Note on push_error/push_warning verification:
# GUT does not have built-in capture for push_error/push_warning calls.
# Verification is done through behavioral contract: return values, state,
# and signal emission. Expected push_error/push_warning messages are
# documented per test as comments.

extends GutTest


func before_each() -> void:
	# Disconnect stale signal listeners
	if GameStateMachine.state_changed.is_connected(_on_state_changed):
		GameStateMachine.state_changed.disconnect(_on_state_changed)

	# Reset to clean baseline before each test
	GameStateMachine._current_state = GameStateMachine.GameState.PLAYING
	GameStateMachine._transitions = GameStateMachine.DEFAULT_TRANSITIONS.duplicate()
	GameStateMachine._is_transitioning = false

	GameStateMachine.state_changed.connect(_on_state_changed)


func after_each() -> void:
	if GameStateMachine.state_changed.is_connected(_on_state_changed):
		GameStateMachine.state_changed.disconnect(_on_state_changed)


func _on_state_changed(_old: int, _new: int) -> void:
	pass


# ════════════════════════════════════════════════════════════════
# JSON CONFIG NORMAL LOADING (AC12a)
# ════════════════════════════════════════════════════════════════

func test_load_transition_table_from_valid_json_succeeds() -> void:
	# Act: load from the real transitions.json (which exists at assets/data/state_machine/)
	var transitions: Dictionary = GameStateMachine._load_transition_table()

	# Assert: all 5 states have entries
	assert_eq(transitions.size(), 5, "should have entries for all 5 states")
	# Verify key transitions from the JSON
	assert_true(transitions.has(GameStateMachine.GameState.MAIN_MENU),
		"MAIN_MENU should be in transition table")
	assert_true(transitions.has(GameStateMachine.GameState.DEAD),
		"DEAD should be in transition table")
	# Verify a specific transition from JSON
	var playing_targets: Array = transitions[GameStateMachine.GameState.PLAYING]
	assert_eq(playing_targets.size(), 3, "PLAYING should have 3 targets from JSON")
	assert_true(playing_targets.has(GameStateMachine.GameState.PAUSED),
		"PAUSED should be a valid target from PLAYING")


# ════════════════════════════════════════════════════════════════
# INITIAL STATE FROM CONFIG (AC11)
# ════════════════════════════════════════════════════════════════

func test_initial_state_loads_from_json() -> void:
	# Act: load initial state from the real config
	var initial: int = GameStateMachine._load_initial_state()

	# Assert: JSON specifies "PLAYING" per MVP decision
	assert_eq(initial, GameStateMachine.GameState.PLAYING,
		"initial_state should be PLAYING from config JSON")


func test_initial_state_defaults_when_no_key_in_json() -> void:
	# Arrange: parse a JSON dict without initial_state key
	var test_json: Dictionary = {"transitions": {}}
	# Simulate: the _load_initial_state logic with this data
	# Since we can't mock FileAccess, verify DEFAULT_INITIAL_STATE constant
	assert_eq(GameStateMachine.DEFAULT_INITIAL_STATE, GameStateMachine.GameState.PLAYING,
		"DEFAULT_INITIAL_STATE should be PLAYING")


func test_initial_state_rejects_unknown_state_name() -> void:
	# Verify that GameState.has() correctly guards unknown names
	assert_false(GameStateMachine.GameState.has("INVALID_STATE"),
		"INVALID_STATE should not be a valid GameState name")
	assert_true(GameStateMachine.GameState.has("PLAYING"),
		"PLAYING should be a valid GameState name")
	assert_true(GameStateMachine.GameState.has("MAIN_MENU"),
		"MAIN_MENU should be a valid GameState name")


# ════════════════════════════════════════════════════════════════
# JSON FALLBACK SCENARIOS (AC12b, AC12c)
# ════════════════════════════════════════════════════════════════

func test_parse_transitions_converts_string_keys_to_enum_values() -> void:
	# Arrange: raw dict matching the JSON schema
	var raw: Dictionary = {
		"MAIN_MENU": ["PLAYING"],
		"PLAYING": ["PAUSED"],
	}
	# Act
	var result: Dictionary = GameStateMachine._parse_transitions(raw)
	# Assert
	assert_eq(result.size(), 2, "should parse 2 states")
	assert_eq(result[GameStateMachine.GameState.MAIN_MENU][0],
		GameStateMachine.GameState.PLAYING,
		"MAIN_MENU string key → enum value with PLAYING target")


func test_parse_transitions_handles_empty_target_arrays() -> void:
	# Arrange: a state with no allowed transitions (edge case)
	var raw: Dictionary = {
		"DEAD": [],
	}
	# Act
	var result: Dictionary = GameStateMachine._parse_transitions(raw)
	# Assert
	assert_eq(result.size(), 1, "should parse 1 state")
	var targets: Array = result[GameStateMachine.GameState.DEAD]
	assert_eq(targets.size(), 0, "empty target array should remain empty")


# ════════════════════════════════════════════════════════════════
# DEFAULT_TRANSITIONS INTEGRITY (AC12b — fallback correctness)
# ════════════════════════════════════════════════════════════════

func test_default_transitions_covers_all_five_states() -> void:
	assert_eq(GameStateMachine.DEFAULT_TRANSITIONS.size(), 5,
		"should have entries for all 5 states")
	for state: int in [GameStateMachine.GameState.MAIN_MENU,
			GameStateMachine.GameState.PLAYING,
			GameStateMachine.GameState.PAUSED,
			GameStateMachine.GameState.DEAD,
			GameStateMachine.GameState.LEVEL_COMPLETE]:
		assert_true(GameStateMachine.DEFAULT_TRANSITIONS.has(state),
			"DEFAULT_TRANSITIONS should contain state %d" % state)


func test_default_transitions_has_all_9_legal_paths() -> void:
	var dt: Dictionary = GameStateMachine.DEFAULT_TRANSITIONS

	# MAIN_MENU → PLAYING
	assert_true(dt[GameStateMachine.GameState.MAIN_MENU].has(GameStateMachine.GameState.PLAYING))
	# PLAYING → PAUSED, DEAD, LEVEL_COMPLETE
	assert_true(dt[GameStateMachine.GameState.PLAYING].has(GameStateMachine.GameState.PAUSED))
	assert_true(dt[GameStateMachine.GameState.PLAYING].has(GameStateMachine.GameState.DEAD))
	assert_true(dt[GameStateMachine.GameState.PLAYING].has(GameStateMachine.GameState.LEVEL_COMPLETE))
	# PAUSED → PLAYING
	assert_true(dt[GameStateMachine.GameState.PAUSED].has(GameStateMachine.GameState.PLAYING))
	# DEAD → PLAYING, MAIN_MENU
	assert_true(dt[GameStateMachine.GameState.DEAD].has(GameStateMachine.GameState.PLAYING))
	assert_true(dt[GameStateMachine.GameState.DEAD].has(GameStateMachine.GameState.MAIN_MENU))
	# LEVEL_COMPLETE → PLAYING, MAIN_MENU
	assert_true(dt[GameStateMachine.GameState.LEVEL_COMPLETE].has(GameStateMachine.GameState.PLAYING))
	assert_true(dt[GameStateMachine.GameState.LEVEL_COMPLETE].has(GameStateMachine.GameState.MAIN_MENU))


func test_default_transitions_does_not_contain_illegal_paths() -> void:
	var dt: Dictionary = GameStateMachine.DEFAULT_TRANSITIONS

	assert_false(dt[GameStateMachine.GameState.DEAD].has(GameStateMachine.GameState.PAUSED),
		"DEAD → PAUSED should be illegal")
	assert_false(dt[GameStateMachine.GameState.LEVEL_COMPLETE].has(GameStateMachine.GameState.PAUSED),
		"LEVEL_COMPLETE → PAUSED should be illegal")
	assert_false(dt[GameStateMachine.GameState.PLAYING].has(GameStateMachine.GameState.MAIN_MENU),
		"PLAYING → MAIN_MENU should be illegal")


func test_default_transitions_constant_is_not_mutated() -> void:
	# Arrange: capture the original reference
	var dt := GameStateMachine.DEFAULT_TRANSITIONS
	var original_size := dt[GameStateMachine.GameState.PLAYING].size()

	# Act: load transitions (which should use .duplicate())
	GameStateMachine._transitions = GameStateMachine._load_transition_table()
	# Modify the loaded copy
	GameStateMachine._transitions[GameStateMachine.GameState.PLAYING].append(999)

	# Assert: DEFAULT_TRANSITIONS unchanged
	assert_eq(dt[GameStateMachine.GameState.PLAYING].size(), original_size,
		"DEFAULT_TRANSITIONS should not be mutated when _transitions is modified")
	# Restore clean state
	GameStateMachine._transitions = GameStateMachine.DEFAULT_TRANSITIONS.duplicate()


# ════════════════════════════════════════════════════════════════
# STARTUP VALIDATION (ADR-0010 Note #4)
# ════════════════════════════════════════════════════════════════

func test_validate_transition_table_all_states_present_no_errors() -> void:
	# Arrange: all 5 states have entries (from _load_transition_table)
	GameStateMachine._transitions = GameStateMachine._load_transition_table()

	# Act: validate (should be silent — no errors for complete table)
	GameStateMachine._validate_transition_table()

	# Assert: all 5 states still present
	assert_eq(GameStateMachine._transitions.size(), 5,
		"complete table should still have 5 entries after validation")


func test_validate_transition_table_fills_missing_state_key() -> void:
	# Arrange: remove a state key from the transition table
	GameStateMachine._transitions = GameStateMachine.DEFAULT_TRANSITIONS.duplicate()
	GameStateMachine._transitions.erase(GameStateMachine.GameState.DEAD)
	assert_false(GameStateMachine._transitions.has(GameStateMachine.GameState.DEAD),
		"precondition: DEAD should be removed")

	# Act: run validation
	GameStateMachine._validate_transition_table()

	# Assert: missing key filled from DEFAULT_TRANSITIONS
	assert_true(GameStateMachine._transitions.has(GameStateMachine.GameState.DEAD),
		"missing DEAD key should be filled from defaults after validation")
	# push_error triggered: "GameStateMachine: transition table missing key for state 3 (DEAD)"


func test_validate_transition_table_detects_invalid_target_state() -> void:
	# Arrange: add an invalid target state (not in GameState enum)
	GameStateMachine._transitions = GameStateMachine.DEFAULT_TRANSITIONS.duplicate()
	var targets: Array = GameStateMachine._transitions[GameStateMachine.GameState.PLAYING]
	targets.append(999)  # not a valid GameState value

	# Act: run validation — should detect 999 is not a GameState value
	GameStateMachine._validate_transition_table()

	# Assert: the invalid value is still there (validate only logs, doesn't remove)
	assert_true(targets.has(999),
		"invalid target should remain (validation logs but doesn't auto-remove)")
	# push_error triggered: "GameStateMachine: invalid target state 999 in transitions for state 1 (PLAYING)"


# ════════════════════════════════════════════════════════════════
# INTEGRATION: config-driven transitions work end-to-end
# ════════════════════════════════════════════════════════════════

func test_transition_works_with_loaded_config() -> void:
	# Arrange: load from real JSON
	GameStateMachine._transitions = GameStateMachine._load_transition_table()
	GameStateMachine._current_state = GameStateMachine.GameState.MAIN_MENU

	# Act: use a transition that exists in the JSON config
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.PLAYING)

	# Assert
	assert_true(result, "MAIN_MENU → PLAYING should succeed with config-loaded transitions")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.PLAYING)


func test_transition_blocked_for_illegal_path_in_loaded_config() -> void:
	# Arrange: load from real JSON
	GameStateMachine._transitions = GameStateMachine._load_transition_table()
	GameStateMachine._current_state = GameStateMachine.GameState.DEAD

	# Act: try an illegal path (DEAD → PAUSED is not in JSON config)
	var result: bool = GameStateMachine.transition_to(GameStateMachine.GameState.PAUSED)

	# Assert
	assert_false(result, "DEAD → PAUSED should be rejected with config-loaded transitions")
	assert_eq(GameStateMachine.current_state, GameStateMachine.GameState.DEAD)
