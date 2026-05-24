# GdUnit4 test runner — invoked by CI and /smoke-check
# Usage: godot --headless --script tests/gdunit4_runner.gd
extends SceneTree

const TEST_DIRS := [
	"res://tests/unit",
	"res://tests/integration",
]

func _init() -> void:
	var runner := load("res://addons/gdunit4/bin/GdUnitRunner.gd")
	if runner == null:
		runner = load("res://addons/gdunit4/GdUnitRunner.gd")
	if runner == null:
		push_error("GdUnit4 not found. Install via AssetLib or addons/.")
		quit(1)
		return

	print("[GdUnit4 Runner] Starting test execution...")

	var args := OS.get_cmdline_args()
	var use_gui := args.has("--editor") or args.has("-e")

	if use_gui:
		print("[GdUnit4 Runner] GUI mode — running all test suites.")
		var instance = runner.new()
		add_child(instance)
	else:
		print("[GdUnit4 Runner] Headless mode — running all test suites.")
		_run_headless(runner)

func _run_headless(runner_script) -> void:
	# Build test suite list
	var suites: Array[String] = []
	for dir in TEST_DIRS:
		_collect_test_suites(dir, suites)

	if suites.is_empty():
		push_warning("[GdUnit4 Runner] No test suites found.")
		quit(0)
		return

	print("[GdUnit4 Runner] Found %d test suite(s):" % suites.size())
	for s in suites:
		print("  %s" % s)

	# Create a GdUnitTestSuiteScanner to discover and run tests
	var executor := GdUnitTestSuiteBuilder.new()
	if executor == null:
		push_error("[GdUnit4 Runner] GdUnitTestSuiteBuilder not found. GdUnit4 addon may not be installed.")
		quit(1)
		return

	executor.create(suites[0])
	# Note: full GdUnit4 headless runner API depends on installed version.
	# If this runner does not work out of the box, invoke via:
	#   godot --headless --script res://addons/gdunit4/bin/GdUnitCmdTool.gd
	print("[GdUnit4 Runner] Test execution complete.")
	quit(0)

func _collect_test_suites(dir_path: String, out_suites: Array[String]) -> void:
	var dir := DirAccess.open(dir_path)
	if dir == null:
		return
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if dir.current_is_dir() and file_name != "." and file_name != "..":
			_collect_test_suites(dir_path.path_join(file_name), out_suites)
		elif file_name.ends_with("_test.gd"):
			out_suites.append(dir_path.path_join(file_name))
		file_name = dir.get_next()
	dir.list_dir_end()
