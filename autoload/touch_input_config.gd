## Configuration for touch input move signal generation.
##
## Provides deadzone and max_radius values that control how touch offset
## is converted to normalized move_direction (length 0-1).
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
