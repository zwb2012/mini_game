#!/usr/bin/env python3
"""LiblibAI image generation helper for the asset-generate skill.

Called by `/asset-generate final` to generate a single image via liblib AI API.

Authentication: HMAC-SHA1 signature with AccessKey + SecretKey.
Credentials from environment: LIBLIB_ACCESS_KEY, LIBLIB_SECRET_KEY.

Usage:
    python .claude/skills/asset-generate/tools/generate_liblib.py \
        --prompt "game character, ..." \
        --output "assets/art/characters/hero_idle.png" \
        --width 1024 --height 1024

    python .claude/skills/asset-generate/tools/generate_liblib.py \
        --prompt "UI icon, ..." \
        --output "assets/ui/button.png" \
        --width 512 --height 512 \
        --remove-bg
"""

import argparse
import base64
import hashlib
import hmac
import json
import os
import random
import string
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────────────

BASE_URL = "https://openapi.liblibai.cloud"
EP_TEXT2IMG_ULTRA = "/api/generate/webui/text2img/ultra"
EP_STATUS = "/api/generate/webui/status"
TPL_ULTRA_F1 = "5d7e67009b344550bc1aa6ccbfa1d7f4"

POLL_INTERVAL = 3
POLL_TIMEOUT = 120

ACCESS_KEY = os.environ.get("LIBLIB_ACCESS_KEY", "")
SECRET_KEY = os.environ.get("LIBLIB_SECRET_KEY", "")


# ── Auth ────────────────────────────────────────────────────────────────

def make_signature(endpoint: str, timestamp_ms: int, nonce: str) -> str:
    data = f"{endpoint}&{timestamp_ms}&{nonce}"
    sig = hmac.new(SECRET_KEY.encode(), data.encode(), hashlib.sha1).digest()
    return base64.urlsafe_b64encode(sig).rstrip(b"=").decode()


def api_request(endpoint: str, body: dict) -> dict:
    timestamp_ms = int(time.time() * 1000)
    nonce = "".join(random.choice(string.ascii_letters + string.digits) for _ in range(16))
    signature = make_signature(endpoint, timestamp_ms, nonce)

    url = (
        f"{BASE_URL}{endpoint}"
        f"?AccessKey={ACCESS_KEY}"
        f"&Signature={signature}"
        f"&Timestamp={timestamp_ms}"
        f"&SignatureNonce={nonce}"
    )

    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json",
        "Accept": "application/json",
        }, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")[:500]
        raise RuntimeError(f"HTTP {e.code}: {error_body}")
    except Exception as e:
        raise RuntimeError(f"Request failed: {e}")


# ── Generation ──────────────────────────────────────────────────────────

def generate_image(prompt: str, width: int, height: int) -> str:
    body = {
        "templateUuid": TPL_ULTRA_F1,
        "generateParams": {
            "prompt": prompt,
            "imageSize": {"width": width, "height": height},
            "imgCount": 1,
        },
    }
    result = api_request(EP_TEXT2IMG_ULTRA, body)
    if result.get("code") != 0:
        raise RuntimeError(f"Generate failed: code={result.get('code')}, msg={result.get('msg')}")
    return result["data"]["generateUuid"]


def poll_status(generate_uuid: str, timeout: int = POLL_TIMEOUT) -> dict:
    start = time.time()
    while time.time() - start < timeout:
        result = api_request(EP_STATUS, {"generateUuid": generate_uuid})
        if result.get("code") != 0:
            raise RuntimeError(f"Status check failed: {result}")
        data = result.get("data", {})
        status = data.get("generateStatus", 0)
        if status == 5:
            return data
        if status == 4:
            raise RuntimeError(f"Generation failed: {data.get('generateMsg', 'unknown')}")
        elapsed = int(time.time() - start)
        print(f"  Polling... status={status}, {elapsed}s elapsed", flush=True)
        time.sleep(POLL_INTERVAL)
    raise RuntimeError(f"Timeout after {timeout}s for uuid={generate_uuid}")


def download_image(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as resp:
        dest.write_bytes(resp.read())


# ── Post-processing (optional) ──────────────────────────────────────────

def remove_background(src: Path, dest: Path) -> None:
    """Remove dark background (#04041A) and save as RGBA PNG."""
    try:
        from PIL import Image
        import numpy as np
    except ImportError:
        print("  Warning: Pillow/numpy not installed, skipping background removal")
        import shutil
        shutil.copy2(src, dest)
        return

    img = Image.open(src)
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    arr = np.array(img)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    bg_r, bg_g, bg_b = 4, 4, 26
    from numpy import sqrt, where, clip
    dist = sqrt((r.astype(float) - bg_r) ** 2 +
                (g.astype(float) - bg_g) ** 2 +
                (b.astype(float) - bg_b) ** 2)
    threshold = 30
    arr[:, :, 3] = where(dist < threshold, 0, a)
    edge_zone = (dist >= threshold) & (dist < threshold * 2)
    if edge_zone.any():
        edge_alpha = ((dist[edge_zone] - threshold) / threshold * 255).clip(0, 255).astype(np.uint8)
        arr[:, :, 3][edge_zone] = edge_alpha
    img = Image.fromarray(arr, "RGBA")
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "PNG")


# ── Main ────────────────────────────────────────────────────────────────

def main():
    if not ACCESS_KEY or not SECRET_KEY:
        print("Error: Set LIBLIB_ACCESS_KEY and LIBLIB_SECRET_KEY environment variables.", file=sys.stderr)
        sys.exit(1)

    parser = argparse.ArgumentParser(description="Generate an image via liblib AI API")
    parser.add_argument("--prompt", required=True, help="Generation prompt")
    parser.add_argument("--output", required=True, help="Output file path (.png)")
    parser.add_argument("--width", type=int, default=1024, help="Image width (default: 1024)")
    parser.add_argument("--height", type=int, default=1024, help="Image height (default: 1024)")
    parser.add_argument("--remove-bg", action="store_true", help="Remove dark background (for UI/props)")
    parser.add_argument("--timeout", type=int, default=POLL_TIMEOUT, help=f"Polling timeout in seconds (default: {POLL_TIMEOUT})")
    args = parser.parse_args()

    output_path = Path(args.output)
    raw_path = output_path.with_suffix(".raw.png")

    print(f"Generating: {output_path.name}")
    print(f"  Prompt: {args.prompt[:120]}...")
    print(f"  Size: {args.width}x{args.height}")

    try:
        uuid = generate_image(args.prompt, args.width, args.height)
        print(f"  UUID: {uuid}")

        data = poll_status(uuid, timeout=args.timeout)
        images = data.get("images", [])
        if not images:
            print("Error: No images returned", file=sys.stderr)
            sys.exit(1)

        image_url = images[0]["imageUrl"]
        cost = data.get("pointsCost", 0)
        balance = data.get("accountBalance", 0)
        print(f"  Done! Cost: {cost} pts, Balance: {balance} pts")

        download_image(image_url, raw_path)

        if args.remove_bg:
            remove_background(raw_path, output_path)
            raw_path.unlink(missing_ok=True)
        else:
            raw_path.rename(output_path)

        print(f"  Saved: {output_path}")

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
