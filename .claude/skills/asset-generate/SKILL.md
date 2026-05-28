---
name: asset-generate
description: "Generate game assets using external AI services. Image modes: 'concept' (mood board after art-bible) and 'final' (production assets after dev-story). Audio mode: 'audio' (music/SFX after asset-spec). Reads asset specs, calls configured AI backend, saves assets, updates manifest."
argument-hint: "[concept | final [asset-id|system:name|all|--dry-run] | audio [asset-id|all|--dry-run] | --setup | --approve [asset-id|all] | --dry-run]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, AskUserQuestion
model: sonnet
---

When this skill is invoked:

## Phase 0: Parse Mode

Parse the first argument:

```
if arg == "concept":
    → Phase 3 (Concept Mode)
elif arg == "final":
    if sub-arg == "--dry-run":
        → Phase 4b (Dry-Run)
    else:
        → Phase 4 (Final Mode, optionally scoped by asset-id / system:name / all / --regenerate)
elif arg == "audio":
    if sub-arg == "--dry-run":
        → Phase 8b (Audio Dry-Run)
    else:
        → Phase 8 (Audio Mode, optionally scoped by asset-id / all)
elif arg == "--setup":
    → Phase 2 (Setup Mode)
elif arg == "--approve":
    → Phase 6 (Approve Mode)
elif arg == "--dry-run":
    → Phase 4b (Dry-Run — scans all Needed assets)
else:
    → Interactive mode below
```

### Argument Reference

| Argument | Mode | Description |
|----------|------|-------------|
| `concept` | Concept Art | Generate mood board / reference images from art bible |
| `final` | Production Assets | Generate all prompt-ready assets |
| `final [asset-id]` | Single Asset | Generate one specific asset (e.g. `final ASSET-003`) |
| `final system:[name]` | System Assets | Generate all assets for a system |
| `final all` | Batch | Generate all prompt-ready assets |
| `final --dry-run` | Preview (scoped) | Show what would be generated for final target, no API calls |
| `--setup` | Setup | Configure AI backend interactively |
| `--approve [asset-id\|all]` | Approve | Mark generated assets as Approved |
| `audio` | Audio | Generate all prompt-ready audio assets |
| `audio [asset-id]` | Single Audio | Generate one specific audio (e.g. `audio ASSET-003`) |
| `audio all` | Batch Audio | Generate all prompt-ready audio |
| `audio --dry-run` | Audio Preview | Show what audio would be generated, no API calls |
| `--dry-run` | Preview (all) | Show all Needed assets, no API calls |
| _(no argument)_ | Interactive | Ask user which mode |

If no argument is provided, use `AskUserQuestion`:
- "What do you want to generate?"
  - Options: `[A] Concept art (mood board / style reference)` / `[B] Final production assets (replace placeholders)` / `[C] Audio — music & SFX` / `[D] Setup — configure AI backend` / `[E] Dry-run — preview without generating`

---

## Phase 1: Read Configuration

Read `design/assets/ai-services.yaml`. If it does not exist:
> "No AI service configuration found at `design/assets/ai-services.yaml`. Run `/asset-generate --setup` to configure an AI backend."
> Exit.

### Image mode config check

If mode is `concept` or `final`, check image services:

If `active_service` is `none`:
> "No image backend selected. Run `/asset-generate --setup` to choose one. Available: OpenAI DALL-E 3, Seedream (火山引擎), LiblibAI (哩布哩布), ComfyUI (local)."
> Exit.

Check that the required configuration is present for the active service:
- `openai_dalle3` → check `$OPENAI_API_KEY`
- `seedream` → check `$ARK_API_KEY`
- `liblib` → check `$LIBLIB_ACCESS_KEY` and `$LIBLIB_SECRET_KEY`
- `comfyui_local` → read `services.comfyui_local.url` from `ai-services.yaml` (default: `http://localhost:8188`)

### Audio mode config check

If mode is `audio`, read `audio_services` section:

If `audio_services.active` is `none`:
> "No audio backend selected. Run `/asset-generate --setup` to choose one. Available: 通义音乐 (Tongyi), Stable Audio 3.0, Lyria 3 Pro."
> Exit.

Check that the required environment variable is set:
- `tongyi` → check `$DASHSCOPE_API_KEY`
- `stable_audio` → check `$STABILITY_API_KEY`
- `lyria` → check `$GOOGLE_API_KEY`

---

## Phase 2: Setup Mode (`--setup`)

First, ask which type of backend to configure. Use `AskUserQuestion`:
- "What type of AI backend do you want to configure?"
  - Options: `[A] Image generation` / `[B] Audio generation` / `[C] Both`

**If Image**: Use `AskUserQuestion` → "Choose image backend":
- Options: `OpenAI DALL-E 3` / `Seedream (火山引擎)` / `LiblibAI (哩布哩布)` / `ComfyUI (local)` / `None (disable)`

**If Audio**: Use `AskUserQuestion` → "Choose audio backend":
- Options: `通义音乐 (Tongyi)` / `Stable Audio 3.0` / `Lyria 3 Pro` / `None (disable)`

After selection, write to `design/assets/ai-services.yaml`:

```yaml
active_service: [chosen_service]
# ... or ...
audio_services:
  active: [chosen_audio_service]
# ... service config ...
```

Then prompt for the API key:
> "Set your API key as an environment variable: `export [ENV_VAR]=\"your-key-here\"`"
> "Add this line to your `~/.bashrc` or `~/.zshrc` to make it persistent."

Ask: "May I write the configuration to `design/assets/ai-services.yaml`?"

---

## Phase 3: Concept Mode (`concept`)

Generate mood board / reference images. Does NOT require GDDs or asset specs.

### 3a: Gather Context

Read `design/art/art-bible.md`. Extract:
- Visual Identity Statement (Section 1)
- Mood & Atmosphere targets (Section 2)
- Shape Language (Section 3)
- Color System (Section 4)
- Character Design Direction (Section 5, if complete)
- Environment Design Language (Section 6, if complete)
- UI/HUD Visual Direction (Section 7, if complete)

Read `design/gdd/game-concept.md` for game title and core fantasy. If it does not exist, proceed without it — concept art can be generated from the art bible alone.

If art bible doesn't exist:
> "No art bible found. Run `/art-bible` first to establish visual direction before generating concept art."
> Exit.

### 3b: Build Concept Prompts

From the art bible content, build 3-6 concept prompts covering:
1. **Hero / Key Character** — from Section 5 (Character Design Direction)
2. **Key Environment** — from Section 6 (Environment Design Language)
3. **Mood / Atmosphere** — from Section 2 (primary game state)
4. **UI Style Tile** — from Section 7 (UI/HUD Visual Direction)
5. **Color Script** — from Section 4 (Color System applied to a key scene)

Each prompt should embed the art bible's visual rules:
- Shape language keywords from Section 3
- Color palette anchors from Section 4
- Style keywords from Section 1

Present the prompts to the user:
> "I've prepared [N] concept art prompts based on the art bible. Review before generating:"
> Show each prompt in conversation text.

Use `AskUserQuestion`:
- Options: `[A] Generate all` / `[B] Select which to generate` / `[C] Revise a prompt` / `[D] Cancel`

### 3c: Generate and Save

Ensure output directories exist:
```bash
mkdir -p assets/concept-art/
```

For each approved prompt, call the configured AI backend (see Phase 5: API Dispatch).

Save to `assets/concept-art/`:
- `concept_character_01.png`
- `concept_environment_01.png`
- `concept_mood_01.png`
- `concept_ui_style_01.png`
- `concept_color_script_01.png`

> "Concept art generated. These are reference images for visual alignment — they are NOT game-ready assets. Run `/asset-spec` to create production asset specs, then `/asset-generate final` after features are implemented."

---

## Phase 4: Final Mode (`final [target]`)

Generate production game-ready assets to replace placeholders.

### 4a: Gather Context

> **Recommendation**: Final assets are most effective when features are already implemented with placeholders. This lets you verify generated art in-game immediately. If no code has been written yet, consider waiting until after `/dev-story`.

Read `design/assets/asset-manifest.md`. If it doesn't exist:
> "No asset manifest found. Run `/asset-spec` first to create asset specifications."
> Exit.

Filter assets by status and target:
- `/asset-generate final all` → all assets with status "Needed"
- `/asset-generate final ASSET-NNN` → that specific asset
- `/asset-generate final system:name` → all "Needed" assets in that system context
- `/asset-generate final` → present list, let user choose

If no matching assets found:
> "No assets with status 'Needed' found. All caught up!"

### 4b: Dry-Run Mode (`--dry-run`)

Show what would be generated without calling APIs:

```
## Dry Run — [N] assets to generate

| Asset ID | Name | Category | Target Path | Est. Cost |
|----------|------|----------|-------------|-----------|
| ASSET-001 | hero_idle | Sprite | assets/art/characters/hero_idle.png | ~$0.04 |
| ASSET-002 | combat_hit_vfx | VFX | assets/vfx/combat_hit_01.png | ~$0.04 |
| ...

Total estimated cost: ~$[X.XX]
Backend: [service name]
```

Exit without making API calls.

### 4c: Read Specs and Extract Prompts

For each target asset, read its spec from `design/assets/specs/[target]-assets.md`. Extract:
- Generation Prompt
- Dimensions
- Category
- Target filename (from naming convention in spec)

### 4d: Confirm Generation

Present summary to user:
> "Ready to generate [N] assets using [service name]. Estimated cost: ~$[X.XX]."

Use `AskUserQuestion`:
- Options: `[A] Generate all` / `[B] Select specific assets` / `[C] Cancel`

### 4e: Generate and Save

Ensure output directories exist for each asset category:
```bash
mkdir -p assets/art/characters/ assets/art/environments/ assets/art/props/
mkdir -p assets/vfx/ assets/ui/
```

For each asset, call the configured AI backend (see Phase 5: API Dispatch).

Save each image to its target path (from spec Dimensions and naming convention).

After each successful generation, apply post-processing:

**Slice** (if spec's Slice field != "none"):
Parse the Slice value and build the `slice_image.py` command:
- `grid:3x1, names:front,side,back` → `--grid 3x1 --names "front,side,back"`
- `grid:4x4, prefix:walk` → `--grid 4x4 --prefix "walk"`
- `tile:64x64` → `--tile 64x64`

```bash
python .claude/skills/asset-generate/tools/slice_image.py \
  --input "[output_path]" \
  --output-dir "[output_dir]" \
  [--grid NxM | --tile WxH] \
  [--names "a,b,c" | --prefix "name"]
```

After successful slice, delete the raw (un-sliced) image.

Update the asset's status in `design/assets/asset-manifest.md`:
- `Needed` → `Generated`

Also record the generation seed (if returned by API) in the manifest.

### 4f: Report Results

```
## Generation Complete

| Asset ID | Name | Status | Path |
|----------|------|--------|------|
| ASSET-001 | hero_idle | Generated | assets/art/characters/hero_idle.png |
| ASSET-002 | combat_hit_vfx | Failed (timeout) | — |

[N] generated, [M] failed.

Next: review generated assets in-engine, then run `/asset-generate --approve [asset-id]` to mark approved.
```

---

## Phase 5: API Dispatch

Route based on `active_service` in `ai-services.yaml`. Each backend has a different calling method.

### Generic Flow (all backends)

1. Read asset spec → get prompt, dimensions, slice config
2. Build and execute API call per backend format below
3. Parse response → extract image URL or base64 data
4. Download image to target path
5. **If slice config != "none"**: run `slice_image.py` → produce sub-frames, delete raw image
6. Return success/failure + output paths

### Backend: OpenAI DALL-E

Uses `curl` — no additional scripts needed. Simple Bearer token auth.

```bash
curl -s -o "[output_path]" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"dall-e-3\",\"prompt\":\"[prompt]\",\"size\":\"[width]x[height]\",\"quality\":\"standard\",\"n\":1}" \
  https://api.openai.com/v1/images/generations
```

Parse response: `jq -r '.data[0].url'` → download that URL to target path.

### Backend: Seedream (火山引擎)

Uses `curl` — OpenAI-compatible API format. No additional scripts needed.

```bash
curl -X POST https://ark.cn-beijing.volces.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d "{\"model\":\"doubao-seedream-4-5-251128\",\"prompt\":\"[prompt]\",\"size\":\"[size]\",\"sequential_image_generation\":\"disabled\",\"response_format\":\"url\",\"stream\":false,\"watermark\":true}"
```

Parse response: `jq -r '.data[0].url'` → download that URL to target path.
Size: `1K` | `2K` | `3K` | `4K` or custom `"1920x1080"`.
Supports `seed` for reproducibility, `sequential_image_generation` for multi-image.

### Backend: LiblibAI (哩布哩布)

**Requires `.claude/skills/asset-generate/tools/generate_liblib.py`** — HMAC-SHA1 signature auth cannot be done with curl alone.

```bash
python .claude/skills/asset-generate/tools/generate_liblib.py \
  --prompt "[prompt]" \
  --output "[output_path]" \
  --width [width] --height [height] \
  [--remove-bg]  # add for UI/props assets
```

Credentials: `LIBLIB_ACCESS_KEY` and `LIBLIB_SECRET_KEY` environment variables.
The script handles authentication, task submission, polling, and download.

### Backend: ComfyUI (local)

Uses `curl` against local ComfyUI instance.

```bash
# Submit workflow
curl -s -X POST "[comfyui_url]/prompt" \
  -H "Content-Type: application/json" \
  -d '{"prompt": {"3": {"inputs": {"text": "[prompt]", "seed": [random]}}, ...}}'

# Poll /history/{prompt_id} until complete
# Download output image to target path
```

> **Implementation note**: ComfyUI workflow JSON is environment-specific. Placeholder until user configures their ComfyUI setup.

### Audio Backends

Audio generation uses `generate_audio.py` as a unified CLI that routes to the configured backend.

```bash
python .claude/skills/asset-generate/tools/generate_audio.py \
  --backend [tongyi|stable_audio|lyria] \
  --prompt "[prompt]" \
  --output "[output_path]"
```

Backend routing is read from `design/assets/ai-services.yaml` → `audio_services`.

#### Backend: 通义音乐 (Tongyi)

Uses `curl` — Bearer token auth to Alibaba DashScope.

```bash
curl -s -X POST "https://dashscope.aliyuncs.com/api/v1/services/audio/music/generation" \
  -H "Authorization: Bearer $DASHSCOPE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"fun-music-v1\",\"input\":{\"prompt\":\"[prompt]\"}}"
```

Response contains an audio URL. Download to output path.

#### Backend: Stable Audio 3.0

`curl` against Stability AI API.

```bash
curl -s -X POST "https://api.stability.ai/v2alpha/generation/stable-audio/generate" \
  -H "Authorization: Bearer $STABILITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"stable-audio-3.0-large\",\"prompt\":\"[prompt]\",\"duration\":[duration]}"
```

#### Backend: Lyria 3 Pro

`curl` against Google Gemini API.

```bash
curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/lyria-3-pro:generate?key=$GOOGLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"[prompt]\",\"duration\":[duration]}"
```

---

## Phase 6: Post-Generation Actions

### Approve Assets

`/asset-generate --approve [asset-id|all]`

Update manifest status: `Generated` → `Approved`.

### Regenerate

`/asset-generate final [asset-id] --regenerate`

Re-generate an already-generated asset (e.g., to iterate on prompt). Backs up the existing file before overwriting.

### Asset Audit Integration

After generation, suggest:
> "Run `/asset-audit` to validate generated assets against specs (naming, format, dimensions)."

---

## Phase 7: Close

Use `AskUserQuestion`:
- "Assets generated. What's next?"
- Options:
  - `[A] Generate more assets — /asset-generate final [target]`
  - `[B] Approve generated assets — /asset-generate --approve`
  - `[C] Run /asset-audit — validate against specs`
  - `[D] Generate audio — /asset-generate audio`
  - `[E] Stop here`

---

## Phase 8: Audio Mode (`audio [asset-id|all|--dry-run]`)

Generate music and SFX assets using AI audio services.

### 8a: Gather Context

Read `design/assets/ai-services.yaml` → `audio_services` section. If `active` is `none`:
> "No audio backend selected. Run `/asset-generate --setup` to configure one. Available: 通义音乐 (Tongyi), Stable Audio 3.0, Lyria 3 Pro."

Read `design/assets/asset-manifest.md`. Filter for Category starting with "Audio" and Status = "Needed".
If no matching assets:
> "No audio assets with status 'Needed' found. Run `/asset-spec` to define audio assets first, then `/asset-generate audio` to generate them."

### 8b: Dry-Run

Show what would be generated:
```
## Audio Dry-Run — [N] tracks to generate

| Asset ID | Name | Category | Duration | Est. Cost |
|----------|------|----------|----------|-----------|
| ASSET-010 | bgm_main_theme | Audio - Music | 120s | ~$0.04 |
```

Exit without calling API.

### 8c: Generate

For each audio asset, read spec → extract Generation Prompt and Duration.

Confirm with user, then for each asset:

```bash
mkdir -p assets/audio/music/ assets/audio/sfx/ assets/audio/ambient/

python .claude/skills/asset-generate/tools/generate_audio.py \
  --backend [from audio_services.active] \
  --prompt "[generation prompt]" \
  --output "[naming from spec]"
```

Save to path matching Category:
- `Audio - Music` → `assets/audio/music/[naming]`
- `Audio - SFX` → `assets/audio/sfx/[naming]`
- `Audio - Ambient` → `assets/audio/ambient/[naming]`

Update manifest: `Needed` → `Generated`.

### 8d: Report

```
## Audio Generation Complete

| Asset ID | Name | Status | Path |
|----------|------|--------|------|
| ASSET-010 | bgm_main_theme | Generated | assets/audio/music/bgm_main_theme.ogg |

Next: listen to generated audio, run `/asset-generate --approve [asset-id]` to mark approved.
```

---

## Error Recovery

- **API timeout/error**: Retry once after 5 seconds. If still failing, skip that asset and continue with remaining. Report all failures at end.
- **Disk full**: Stop immediately, report remaining assets not generated.
- **Invalid response**: Log the raw response to `production/session-logs/asset-generate-errors.log`, skip asset, continue.
- **Missing spec prompt**: Flag asset as "Blocked — missing prompt" in manifest, skip, continue.

---

## Collaborative Protocol

- Always present prompts for review before calling API (concept mode)
- Always show cost estimate before batch generation (final mode)
- Never generate without user confirmation
- Report failures transparently — never silently skip
- Concept art is reference-only, clearly communicated as such
