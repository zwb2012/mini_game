#!/usr/bin/env python3
"""Image grid slicer for the asset-generate skill.

Splits a single image into sub-frames by grid or tile dimensions.
Used after AI generation to produce individual game-ready sprites.

Usage:
    # Grid mode: 3 columns x 1 row, named explicitly
    python slice_image.py --input hero.png --grid 3x1 \
        --output-dir assets/art/characters/ \
        --names "hero_front,hero_side,hero_back"

    # Grid mode: 4x4 sprite sheet, auto-named with prefix
    python slice_image.py --input walk.png --grid 4x4 \
        --output-dir assets/art/characters/ --prefix "walk"

    # Tile mode: fixed tile size, auto-named
    python slice_image.py --input tileset.png --tile 64x64 \
        --output-dir assets/art/tiles/ --prefix "tile"
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required. Install with: pip install Pillow", file=sys.stderr)
    sys.exit(1)


def slice_grid(img: Image.Image, cols: int, rows: int, output_dir: Path,
               names: list[str] = None, prefix: str = "frame") -> list[Path]:
    """Slice image into cols×rows uniform grid. Return output paths."""
    w, h = img.size
    cell_w, cell_h = w // cols, h // rows
    output_dir.mkdir(parents=True, exist_ok=True)

    outputs = []
    idx = 0
    for row in range(rows):
        for col in range(cols):
            left, top = col * cell_w, row * cell_h
            right, bottom = left + cell_w, top + cell_h
            cell = img.crop((left, top, right, bottom))

            if names and idx < len(names):
                filename = f"{names[idx]}.png"
            elif prefix:
                filename = f"{prefix}_r{row}_c{col}.png"
            else:
                filename = f"frame_{idx:03d}.png"

            path = output_dir / filename
            cell.save(path, "PNG")
            outputs.append(path)
            idx += 1

    return outputs


def slice_tiles(img: Image.Image, tile_w: int, tile_h: int, output_dir: Path,
                prefix: str = "tile") -> list[Path]:
    """Slice image by fixed tile size. Return output paths."""
    w, h = img.size
    cols, rows = w // tile_w, h // tile_h
    output_dir.mkdir(parents=True, exist_ok=True)

    outputs = []
    idx = 0
    for row in range(rows):
        for col in range(cols):
            left, top = col * tile_w, row * tile_h
            right, bottom = left + tile_w, top + tile_h
            cell = img.crop((left, top, right, bottom))

            filename = f"{prefix}_r{row}_c{col}.png"
            path = output_dir / filename
            cell.save(path, "PNG")
            outputs.append(path)
            idx += 1

    return outputs


def parse_grid(arg: str) -> tuple[int, int]:
    parts = arg.split("x")
    if len(parts) != 2:
        raise ValueError(f"Invalid grid format: {arg}. Expected NxM (e.g. 3x1)")
    return int(parts[0]), int(parts[1])


def parse_tile(arg: str) -> tuple[int, int]:
    parts = arg.split("x")
    if len(parts) != 2:
        raise ValueError(f"Invalid tile format: {arg}. Expected WxH (e.g. 64x64)")
    return int(parts[0]), int(parts[1])


def main():
    parser = argparse.ArgumentParser(description="Slice an image into grid sub-frames")
    parser.add_argument("--input", required=True, help="Source image path")
    parser.add_argument("--grid", type=str, help="Grid dimensions: colsxrows (e.g. 3x1)")
    parser.add_argument("--tile", type=str, help="Tile size in pixels: WxH (e.g. 64x64)")
    parser.add_argument("--output-dir", required=True, help="Output directory for sliced frames")
    parser.add_argument("--names", type=str, help="Comma-separated output names (grid mode)")
    parser.add_argument("--prefix", type=str, default=None, help="Output filename prefix")
    args = parser.parse_args()

    if not args.grid and not args.tile:
        print("Error: specify --grid or --tile", file=sys.stderr)
        sys.exit(1)
    if args.grid and args.tile:
        print("Error: use --grid or --tile, not both", file=sys.stderr)
        sys.exit(1)

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    img = Image.open(input_path)
    output_dir = Path(args.output_dir)

    if args.grid:
        cols, rows = parse_grid(args.grid)
        names = [n.strip() for n in args.names.split(",")] if args.names else None
        count = cols * rows
        if names and len(names) != count:
            print(f"Error: grid {cols}x{rows} = {count} cells but {len(names)} names given",
                  file=sys.stderr)
            sys.exit(1)
        print(f"Slicing {input_path.name}: {img.size[0]}x{img.size[1]} → {cols}x{rows} grid ({count} frames)")
        outputs = slice_grid(img, cols, rows, output_dir, names=names,
                           prefix=args.prefix or "frame")

    else:
        tile_w, tile_h = parse_tile(args.tile)
        cols, rows = img.size[0] // tile_w, img.size[1] // tile_h
        count = cols * rows
        print(f"Slicing {input_path.name}: {img.size[0]}x{img.size[1]} → {tile_w}x{tile_h} tiles ({count} tiles)")
        outputs = slice_tiles(img, tile_w, tile_h, output_dir,
                            prefix=args.prefix or "tile")

    print(f"  → {len(outputs)} files saved to {output_dir}")
    for p in outputs:
        print(f"    {p.name}")


if __name__ == "__main__":
    main()
