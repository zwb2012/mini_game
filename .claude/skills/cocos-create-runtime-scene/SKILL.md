---
name: cocos-create-runtime-scene
description: "Generate a minimal runnable Cocos Creator 3.8.8 scene with Canvas, Camera, GameRoot, GridRoot, UIRoot and mount all @ccclass components. Validates the scene is openable and Preview-ready. Run once during Technical Setup, before Pre-Production."
argument-hint: "[--force]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Task
agent: cocos-scene-specialist
---

# Cocos Create Runtime Scene

This skill generates the minimum viable Cocos Creator 3.8.8 scene that can run
the game. It bridges the gap between `src/core/` TypeScript components and the
Cocos editor's scene system.

**What it produces**: a GameScene.scene with the full node hierarchy, GameBootstrap
component mounted, and all gameplay components wired up — ready for Preview.

## Phase 1: Audit Current State

1. **Check existing scenes**: glob `assets/scenes/*.scene`
2. **Check @ccclass components**: grep `src/core/` for `@ccclass('...')` decorators
3. **Check GameBootstrap**: verify `src/core/bootstrap/GameBootstrap.ts` exists
4. **Check settings**: verify `settings/v2/packages/project.json` exists

Report findings. If scenes already exist and `--force` is not passed, skip.
If settings are missing, run `/setup-cocos-project` first.

## Phase 2: Generate Scene Structure

Spawn `cocos-scene-specialist` via Task to generate the scene node hierarchy:

```
Canvas (750×1334, UITransform + Canvas + Widget: full-screen)
├── Camera (UITransform + Camera, orthographic, orthoHeight: 667)
├── GameRoot (UITransform)
│   ├── GameBootstrap component (entry — @property gridEngine, canvasNode)
│   ├── GridRoot (UITransform)
│   │   ├── cc.Graphics component
│   │   └── GridConnectionEngine component (@property labelContainer, numberFont)
│   └── LabelContainer (UITransform)
└── UIRoot (UITransform + Widget: full-screen)
    └── [reserved for HUD — implemented in later stories]
```

## Phase 3: Write Scene File

Generate `assets/scenes/GameScene.scene` as a valid Cocos Creator 3.8.8 JSON scene
file. The scene format is a JSON array with scene asset metadata at index 0 and
nodes at indices 1..N.

Generate project-specific UUIDs for the scene .meta file.

Generate supporting .meta files for all directories and assets that don't have them.

## Phase 4: Validate

Run these checks:
1. `assets/scenes/GameScene.scene` exists and is valid JSON
2. Scene contains Canvas, Camera, GameRoot, GridRoot, UIRoot, LabelContainer nodes
3. GameBootstrap component is referenced in GameRoot's components array
4. GridConnectionEngine component is referenced in GridRoot's components array
5. `npm test` still passes (scene files don't affect TypeScript compilation)

## Phase 5: Next Steps

After successful generation:
1. Open project in Cocos Creator 3.8.8
2. In GameScene, select GridRoot → verify GridConnectionEngine component is present
3. In GameScene, select GameRoot → verify GameBootstrap component is present
4. Drag LabelContainer node into GridConnectionEngine's Label Container property
5. Drag Canvas node into GameBootstrap's Canvas Node property
6. Click Preview → verify grid renders and touch input works
