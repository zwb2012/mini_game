# Cocos WeChat Build Rules

- Build target must be `wechatgame` with portrait orientation
- App ID must be configured in `settings/v2/packages/builder.json` before production build
- Engine modules must be minimized: enable only 2d, audio, ui, graphics, label, tween, profiler
- First-packet size must be under 2MB (WeChat Mini Game hard limit)
- Browser-only APIs (`window`, `document`, `localStorage`) must NEVER be used in game code
- All platform-specific code must go through the adapter interface (IPlatformStorage per ADR-004)
- `wx.setStorageSync/getStorageSync` calls must be wrapped in try-catch (ADR-004)
- WeChat lifecycle events (`wx.onHide`, `wx.onShow`) must be handled — pause on hide, resume on show
- Source maps must be disabled in production builds
- MD5 cache must be enabled for cache-busting remote assets
- Development builds must be validated in WeChat Developer Tools before publishing
- Production builds must be tested on a real device (scan QR code from DevTools)
- Subpackage splitting must be planned if main package exceeds 1.5MB
- Remote assets must use `assetManager.loadRemote()` with error handling for network failures
- `game.json` in build output must have correct `deviceOrientation` (portrait) and `subpackages` config
- Build output must NEVER be manually edited — always rebuild from editor
- The `build/` directory must be gitignored (generated output, not source)
