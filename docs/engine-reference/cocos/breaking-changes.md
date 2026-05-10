# Cocos Creator — Breaking Changes (3.8.x)

*Last verified: 2026-05-10*

## 3.8.0 Major Changes

### Scene Auto-Release Policy
Scene asset auto-release behavior changed from 3.7.x. Assets from previous scene
are no longer auto-released the same way. Projects relying on auto-release may
need manual `assetManager.releaseAsset()` calls.

### Spine: WASM Runtime
Spine now uses WebAssembly on Web/WeChat platforms (asm.js fallback). API is
unified across platforms, but bundle size and runtime behavior differ from the
old JS runtime. Check `build settings` to control WASM/asm.js inclusion.

### Physics: WASM Backends
Bullet and PhysX backends use WASM on supported platforms. iOS native does NOT
support WASM yet — asm.js only. Platform-specific physics code should check
backend capabilities.

### Post-Processing → Custom Render Pipeline
FXAA, TAA, Bloom, HBAO, FSR, and Color Grading are ONLY available through the
Custom Render Pipeline (RenderGraph-based). Legacy forward pipeline does not
support built-in post-processing.

### Animation Deprecation (from 3.3+)
Old animation API fields are kept for compatibility but deprecated:
- `times` → use track-based API
- `curves` → use track-based API
- `commonTargets` → use track-based API

### Asset Manager: loader Removed
The v2.x `cc.loader` module is fully removed. All loading MUST use:
- `assetManager.loadBundle()` for bundle loading
- `resources.load()` for resources/ directory
- `assetManager.releaseAsset()` for memory management

## 3.8.5+ WeChat Mini Game Changes

- System info caching: `getSystemInfoSync` now has built-in cache (3.8.8+)
- WASM subpackage loading: improved for mini-game size limits
- Ad and payment APIs: updated to match WeChat SDK changes in 2025

## 3.8.8 Changes

- MSAA support completed — resolves aliasing when using Bloom and other post effects
- Google Play 16KB page alignment support
- HarmonyOS SDK 6.0.1 (21) + Gamepad support
- Render pass auto-merging for performance
- `getSystemInfoSync` caching on mini-game platforms
