---
name: setup-cocos-project
description: "Initialize the Cocos Creator 3.8.8 project skeleton from the cocos-game-base template. Creates settings/, GameScene, editor profiles, and the scripts/ → src/core/ symlink. Run once during Technical Setup, after architecture review is complete."
argument-hint: "[--force]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Bash
---

# Setup Cocos Project

This skill bridges the gap between code generation and the Cocos Creator editor.
It initializes the project skeleton (settings, scenes, editor profiles) from the
`templates/cocos-game-base/` template, making the project openable in Cocos
Creator 3.8.8.

The code in `src/core/` is linked into the Cocos project via `assets/scripts/`
so the editor can find and compile scripts without moving any source files.

## Phase 1: Verify Preconditions

Before generating anything, check:

1. **Template exists**: `templates/cocos-game-base/` must exist with settings/,
   assets/scenes/GameScene.scene, and profiles/.
   If missing: **STOP** — "Template not found. Ensure templates/cocos-game-base/
   is present in the repository."

2. **Source code exists**: `src/core/` must exist with .ts files containing at
   least one `@ccclass` decorated component.
   If missing: warn — "No @ccclass components found in src/core/. The Cocos
   project will have an empty scene. Run /dev-story first to create components."

3. **Existing Cocos files**: glob `settings/v2/packages/project.json` and
   `assets/scenes/*.scene`. If both exist, skip generation unless `--force` is
   passed:
   > "Cocos project files already exist. Use `--force` to regenerate."

## Phase 2: Generate Project Files

### 2a: Package Version

Verify root `package.json` contains the `creator.version` field. This is how the
Cocos Dashboard identifies the project engine version. Without it, the Dashboard
misreads the npm `version` field and shows "creator3D 0.1.0".

```json
{
  "creator": {
    "version": "3.8.8"
  }
}
```

If missing, add it after `"version"` in `package.json`. Also verify the template
`templates/cocos-game-base/package.json` has this field — it is the source of
truth for project init.

### 2b: Settings + Profiles

Copy from template:

```
templates/cocos-game-base/settings/  →  settings/
templates/cocos-game-base/profiles/  →  profiles/
```

### 2c: Scene Files

Copy GameScene.scene from template to `assets/scenes/GameScene.scene`.
Generate a project-specific UUID for the .meta file (deterministic, namespace-based).

The scene contains:
- Canvas (750×1334, cc.UITransform + cc.Canvas)
- Camera (orthographic, 2D)
- GridEngine node (placeholder — user mounts GridConnectionEngine in editor)
- LabelContainer child node

### 2d: Scripts Symlink

Create a symlink: `assets/scripts/core → ../../src/core`

On Windows, this requires admin privileges or Developer Mode. If symlink fails,
fall back to creating a `typings/cc.d.ts` in the project root that maps `cc`
imports, and update `tsconfig.json` with a `paths` entry:

```json
{
  "compilerOptions": {
    "paths": {
      "cc": ["./typings/cc.d.ts"],
      "@core/*": ["./src/core/*"]
    }
  }
}
```

### 2e: .meta Files

Generate `.meta` files for every asset directory and file that Cocos Creator
needs to recognize:

```
assets/scenes/.meta
assets/scenes/GameScene.scene.meta
assets/scripts/.meta
assets/resources/.meta
```

Each .meta file contains:
- `ver`: "1.2.0"
- `importer`: "directory" or "scene" or "texture" etc.
- `uuid`: deterministic UUID v5 (namespace: mini-game project name, name: file path)
- `imported`: true

## Phase 3: Scan @ccclass Components

Grep `src/core/` for all `@ccclass('...')` decorators:

```bash
grep -rn "@ccclass\(" src/core/ | sed "s/.*@ccclass('\([^']*\)').*/\1/"
```

For each component found, note in the output which scene node it should mount to.

## Phase 4: Validate

Run these checks after generation:

1. `settings/v2/packages/project.json` exists
2. `assets/scenes/GameScene.scene` exists
3. `assets/scripts/ → ../../src/core/` symlink is valid (or tsconfig paths entry exists)
4. `package.json` contains `"creator": { "version": "3.8.8" }` — **critical** for
   Dashboard version detection. Missing this causes "creator3D 0.1.0".

Report: "Cocos project skeleton initialized. Open this directory in Cocos Creator
3.8.8, then mount @ccclass components to the GridEngine node in GameScene."

## Phase 5: Update .gitignore

Ensure `settings/`, `profiles/`, `assets/scenes/`, and `assets/scripts/` are NOT
gitignored. Check `.gitignore` and append any missing entries:

```
# Cocos Creator project files are tracked
!settings/
!profiles/
!assets/scenes/
!assets/scripts/
```

## Phase 6: Next Steps

After successful initialization:

1. Open project in Cocos Creator 3.8.8
2. In GameScene, select the GridEngine node
3. Add Component → search "GridConnectionEngine" → add
4. Drag LabelContainer child node into the Label Container property
5. Click Preview to verify the game runs

For CI: `npm test` continues to work — no changes to Jest or tsconfig.json for
the test suite.
