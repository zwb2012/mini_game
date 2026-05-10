# Cocos Creator — Deprecated APIs

*Last verified: 2026-05-10*

> **Rule**: Agents MUST check this table before suggesting engine API code.
> Always use the replacement, not the deprecated API.

## Animation System (3.3+)

| Deprecated | Replacement | Notes |
|-----------|-------------|-------|
| `AnimationClip.times` | Track/channel API | Auto-converted at runtime |
| `AnimationClip.curves` | Track/channel API | Auto-converted at runtime |
| `AnimationClip.commonTargets` | Track/channel API | Auto-converted at runtime |

## Asset Manager (2.x → 3.x)

| Deprecated (2.x) | Replacement (3.x) |
|------------------|-------------------|
| `cc.loader.loadRes(url, callback)` | `resources.load(url, callback)` |
| `cc.loader.load(url, callback)` | `assetManager.loadRemote(url, callback)` |
| `cc.loader.release(url)` | `assetManager.releaseAsset(asset)` |
| `cc.loader.getRes(url)` | `resources.get(url, type)` |
| `cc.loader.loadResDir(url)` | `resources.loadDir(url)` |

## Node / Scene Management

| Deprecated | Replacement | Notes |
|-----------|-------------|-------|
| `cc.find(path)` | `@property(Node)` + editor binding | Avoid in runtime — cache references |
| `node.getChildByName(name)` | `@property(Node)` + editor binding | Never use in update loops |
| `director.loadScene(name, callback)` | `director.loadScene(name)` + scene event listener | Callback form still works but event-based is preferred |

## WeChat Mini Game Platform

| API | Status | Notes |
|-----|--------|-------|
| `wx.getSystemInfoSync()` | Use cached wrapper | 3.8.8+ has built-in cache |
| `wx.createRewardedVideoAd()` | Active | Rate-limit show() calls to avoid WeChat rejection |
| `wx.requestPayment()` | Active | Must be server-verified (never trust client-side payment result) |
