---
name: cocos-preview-check
description: "Validate that the Cocos Creator 3.8.8 project is Preview-ready: scene file exists, Canvas/Camera present, GameBootstrap component mounted, all @ccclass components have scene homes, and build settings are configured. Produces a PASS/CONCERNS/FAIL report. Run before /smoke-check or as part of the Pre-Production gate."
argument-hint: ""
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Cocos Preview Check

This skill validates that the project is in a state where Cocos Creator 3.8.8's
Preview button will work — scene exists, components are mounted, and no critical
gaps exist.

It is the Cocos-specific complement to `/smoke-check`. Where `/smoke-check`
validates TypeScript logic (Jest), this validates editor integration.

**Output**: a PASS / CONCERNS / FAIL report with specific gaps.

## Phase 1: Structural Checks (Automatic)

### 1.1 Project Files
- [ ] `settings/v2/packages/project.json` exists
- [ ] `settings/v2/packages/engine.json` exists
- [ ] `settings/v2/packages/builder.json` exists

### 1.2 Scene Files
- [ ] At least one `.scene` file exists in `assets/scenes/`
- [ ] Scene file is valid JSON (parseable)
- [ ] Scene contains a Canvas node
- [ ] Scene contains a Camera node
- [ ] Scene contains a GameRoot node
- [ ] Scene contains a UIRoot node

### 1.3 Component Mounting
- [ ] Grep `src/core/` for all `@ccclass('...')` decorators
- [ ] For each @ccclass component, search the scene JSON for the component's class name
- [ ] Flag any component NOT found in any scene file

### 1.4 Asset Integrity
- [ ] Every file in `assets/` has a corresponding `.meta` file
- [ ] `assets/resources/levels.json` exists
- [ ] No broken asset references in scene files

### 1.5 TypeScript Compilation
- [ ] `tsconfig.json` is valid
- [ ] All imports resolve (check `src/core/` for `from 'cc'` imports — these
      require Cocos runtime; acceptable if tsconfig has paths configured)

## Phase 2: Entry Point Check

- [ ] GameBootstrap component exists: `grep "@ccclass('GameBootstrap')" src/core/`
- [ ] GameBootstrap is mounted on a scene node (check scene JSON for GameBootstrap reference)
- [ ] GameBootstrap has `@property gridEngine` and `@property canvasNode`

## Phase 3: Data Flow Check

- [ ] Level data can be loaded: verify `src/core/level-data-schema/` has a provider
- [ ] GameStateMachine initializes without errors (verify constructor has no missing dependencies)
- [ ] InputManager pipe connects to GridConnectionEngine (verify in GameBootstrap wiring)

## Phase 4: Produce Report

```markdown
## Cocos Preview Readiness Report

### PASS ([N])
- [check that passed]

### CONCERNS ([N])
- [check with advisory issue — won't block Preview but should be addressed]

### FAIL ([N])
- [check that blocks Preview — must fix before Preview works]

### Verdict: [READY / CONCERNS / NOT READY]

READY: all PASS, zero FAIL — Preview should work
CONCERNS: all PASS but some CONCERNS exist — Preview may work but gaps remain
NOT READY: one or more FAIL — Preview will not work until fixed
```

## Phase 5: Next Steps

If NOT READY: list the exact files to modify and which skill to run:
- Scene missing → `/cocos-create-runtime-scene`
- Settings missing → `/setup-cocos-project`
- Component not mounted → `/cocos-scaffold-feature [story-path]`
- Asset missing → delegate to `cocos-asset-specialist`

If READY or CONCERNS: "Project is Preview-ready. Open Cocos Creator 3.8.8 →
File → Open Project → double-click assets/scenes/GameScene.scene → click Preview."
