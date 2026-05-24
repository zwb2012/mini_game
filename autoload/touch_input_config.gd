## Configuration for touch input move signal generation and tap/hold discrimination.
##
## Provides deadzone, max_radius, and tap_threshold values that control how
## touch input is converted to game signals (move_direction, aim_position,
## shoot_tapped, shoot_held).
##
## Must not be hardcoded — per TR-touch-input-007.
class_name TouchInputConfig
extends Resource

## Minimum offset distance (in pixels) before move_direction becomes non-zero.
## Offsets shorter than this produce Vector2.ZERO.
@export_range(1.0, 100.0, 0.5) var deadzone: float = 20.0

## Offset distance (in pixels) at which move_direction reaches full length (1.0).
## Offsets beyond this are clamped to length 1.0.
@export_range(50.0, 600.0, 1.0) var max_radius: float = 200.0

## Tap/hold discrimination threshold in seconds.
## A press shorter than this AND within deadzone distance is a "tap"
## (emits shoot_tapped signal, single-frame pulse).
## A press at or longer than this triggers shoot_held continuous state.
@export_range(0.1, 0.5, 0.01) var tap_threshold: float = 0.2

## Tap threshold in milliseconds — convenience accessor for comparing with
## Time.get_ticks_msec() values.
var tap_threshold_ms: int:
	get: return int(tap_threshold * 1000.0)

## Ratio of screen width that defines the left/right zone boundary.
## 0.5 = equal halves. 0.3 = 30% left, 70% right.
@export_range(0.3, 0.7, 0.01) var split_x_ratio: float = 0.5
