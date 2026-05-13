---
name: cocos-scaffold-feature
description: "For a given Story, generate the Cocos-specific scaffolding plan: which scene nodes to create, which Components to mount on which nodes, which @property bindings to wire in the editor, and which assets to create. Produces a scene integration spec that ensures the feature is Preview-ready."
argument-hint: "<story-path>"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Task
agent: cocos-scene-specialist
---

# Cocos Scaffold Feature

Given a Story file, this skill produces the Cocos integration plan — what must
exist in the scene and asset system for the story's code to actually run in
the Cocos Creator editor.

Without this step, `/dev-story` creates working TypeScript code that has no
scene home and therefore cannot run. This skill closes that gap.

## Phase 1: Analyze the Story

Read the story file and extract:
- **Components created**: grep the story's implementation files for `@ccclass`
- **Assets required**: scan for asset path references (fonts, audio, textures, JSON)
- **UI elements added**: detect Label, Button, Layout, Widget usage
- **Scene integration needs**: determine if new nodes or property bindings are required

## Phase 2: Audit Current Scene

Read `assets/scenes/GameScene.scene` (or whichever scene the story targets).
Extract the current node hierarchy. Identify:
- Nodes that already exist and can host new components
- Nodes that need to be created
- Property bindings that need to be wired in the editor

## Phase 3: Produce Integration Spec

Output a structured specification:

```markdown
## Scene Integration Spec — [Story Name]

### New Nodes Required
| Node | Parent | Components | Purpose |
|------|--------|-----------|---------|
| StepCounter | UIRoot/HUDLayer | cc.Label, cc.UITransform, cc.Widget | Displays step count |
| UndoButton | UIRoot/HUDLayer | cc.Button, cc.UITransform, cc.Widget | Undo button |

### Component Mounting
| Component | Mount On | @property Bindings |
|-----------|----------|-------------------|
| HUDController | UIRoot/HUDLayer | stepLabel → StepCounter.Label, undoButton → UndoButton.Button |

### New Assets Required
| Asset | Path | Type | Size Est. |
|-------|------|------|----------|
| undo_icon.png | assets/resources/icons/ | Sprite | ~2KB |

### Editor Steps After Code Implementation
1. Open assets/scenes/GameScene.scene
2. Create nodes: StepCounter, UndoButton per the hierarchy above
3. Mount HUDController to UIRoot/HUDLayer
4. Drag StepCounter.Label → HUDController.stepLabel property
5. Drag UndoButton.Button → HUDController.undoButton property
6. Save scene
```

## Phase 4: Implement if Requested

If the user says "implement this", spawn the appropriate specialist agent(s):
- New scene nodes: `cocos-scene-specialist`
- UI components: `cocos-ui-specialist`
- New assets: `cocos-asset-specialist`

Otherwise, present the spec and wait for user approval.
