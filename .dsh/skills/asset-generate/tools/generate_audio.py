#!/usr/bin/env python3
"""AI audio generation helper for the asset-generate skill.

Routes to different AI music backends based on --backend argument.
Called by `/asset-generate audio`.

Usage:
    # 通义音乐 (Alibaba DashScope)
    python generate_audio.py --backend tongyi \
        --prompt "夏日清新民谣，木吉他与口琴伴奏，轻快节奏" \
        --output assets/audio/music/bgm_travel.ogg

    # Stable Audio 3.0
    python generate_audio.py --backend stable_audio \
        --prompt "dark dungeon ambience, dripping water, distant echo" \
        --duration 30 \
        --output assets/audio/ambient/dungeon.ogg
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


# ── Backend registry ────────────────────────────────────────────────────

BACKENDS = {
    "tongyi": {
        "env": "DASHSCOPE_API_KEY",
        "url": "https://dashscope.aliyuncs.com/api/v1/services/audio/music/generation",
        "model": "fun-music-v1",
    },
    "stable_audio": {
        "env": "STABILITY_API_KEY",
        "url": "https://api.stability.ai/v2alpha/generation/stable-audio/generate",
        "model": "stable-audio-3.0-large",
    },
    "lyria": {
        "env": "GOOGLE_API_KEY",
        "url": "https://generativelanguage.googleapis.com/v1beta/models/lyria-3-pro:generate",
        "model": "lyria-3-pro",
    },
}


# ── Common utilities ────────────────────────────────────────────────────

def api_get(url: str, headers: dict) -> dict:
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")[:500]
        raise RuntimeError(f"HTTP {e.code}: {error_body}")


def api_post(url: str, headers: dict, body: dict) -> dict:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")[:500]
        raise RuntimeError(f"HTTP {e.code}: {error_body}")


def download_file(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=60) as resp:
        dest.write_bytes(resp.read())


# ── Backend generators ──────────────────────────────────────────────────

def gen_tongyi(api_key: str, prompt: str, output: Path, **kwargs) -> None:
    """Tongyi (通义音乐) — Alibaba DashScope API."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    body = {
        "model": BACKENDS["tongyi"]["model"],
        "input": {
            "prompt": prompt,
            "gender": kwargs.get("gender", "female"),
        },
    }
    result = api_post(BACKENDS["tongyi"]["url"], headers, body)
    if "output" not in result:
        raise RuntimeError(f"Unexpected response: {result}")

    audio_url = result["output"].get("audio_url", "")
    if not audio_url:
        raise RuntimeError(f"No audio_url in response: {result}")

    download_file(audio_url, output)
    print(f"  Saved: {output}")


def gen_stable_audio(api_key: str, prompt: str, output: Path, **kwargs) -> None:
    """Stable Audio 3.0 — Stability AI API."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    body = {
        "model": BACKENDS["stable_audio"]["model"],
        "prompt": prompt,
        "duration": kwargs.get("duration", 60),
    }
    result = api_post(BACKENDS["stable_audio"]["url"], headers, body)
    if "data" not in result:
        raise RuntimeError(f"Unexpected response: {result}")

    audio_url = result["data"][0].get("url", "")
    if not audio_url:
        raise RuntimeError(f"No URL in response: {result}")

    download_file(audio_url, output)
    print(f"  Saved: {output}")


def gen_lyria(api_key: str, prompt: str, output: Path, **kwargs) -> None:
    """Lyria 3 Pro — Google Gemini API."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    body = {
        "prompt": prompt,
        "duration": kwargs.get("duration", 60),
    }
    result = api_post(BACKENDS["lyria"]["url"], headers, body)
    if "audio" not in result:
        raise RuntimeError(f"Unexpected response: {result}")

    audio_url = result["audio"].get("url", "")
    if not audio_url:
        raise RuntimeError(f"No audio URL in response: {result}")

    download_file(audio_url, output)
    print(f"  Saved: {output}")


GENERATORS = {
    "tongyi": gen_tongyi,
    "stable_audio": gen_stable_audio,
    "lyria": gen_lyria,
}


# ── Main ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate audio via AI music API")
    parser.add_argument("--backend", required=True, choices=list(BACKENDS.keys()),
                        help="AI music backend to use")
    parser.add_argument("--prompt", required=True, help="Music generation prompt")
    parser.add_argument("--output", required=True, help="Output file path (.ogg)")
    parser.add_argument("--duration", type=int, default=60, help="Duration in seconds (default: 60)")
    parser.add_argument("--gender", type=str, default="female", choices=["female", "male"],
                        help="Vocal gender for tongyi backend (default: female)")
    args = parser.parse_args()

    backend = BACKENDS[args.backend]
    api_key = os.environ.get(backend["env"], "")
    if not api_key:
        print(f"Error: {backend['env']} environment variable not set.", file=sys.stderr)
        sys.exit(1)

    output_path = Path(args.output)
    print(f"Generating audio: {output_path.name}")
    print(f"  Backend: {args.backend} ({backend['model']})")
    print(f"  Prompt: {args.prompt[:120]}...")

    try:
        generator = GENERATORS[args.backend]
        generator(api_key, args.prompt, output_path,
                  duration=args.duration, gender=args.gender)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
