# Cocos Scene Rules

- Every runnable project must have at least one `.scene` file in `assets/scenes/`
- Every scene must contain Canvas + Camera + GameRoot + UIRoot as minimum node hierarchy
- Every `@ccclass` component must be mounted on a scene node — no orphaned components
- Entry logic must be triggered by a Component mounted on a scene node, never a bare TypeScript function
- All UI/render nodes must have `cc.UITransform` component
- Scene transitions must use `director.loadScene()` — never manual DOM manipulation
- Canvas must have `alignCanvasWithScreen: true` for resolution independence
- Camera must be orthographic (2D game) with `orthoHeight` matching design resolution height/2
- Node hierarchy depth must not exceed 4 levels
- Scene files must be tracked in Git (not gitignored)
- All scene asset references must have valid UUIDs matching their `.meta` files
- Component-to-component references must use `@property` decorator + editor binding, not `cc.find()`
- Runtime wiring of cross-cutting systems (state machine, input, audio) must be done in GameBootstrap.start()
- Every node that hosts a custom Component must have a descriptive name matching its function
- The default start scene must be configured in the editor's Project Settings
