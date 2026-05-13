---
name: cocos-build-wechat
description: "Configure and validate the Cocos Creator 3.8.8 WeChat Mini Game build. Configures builder.json with app ID, orientation, subpackages; validates build output structure; estimates package size; and generates WeChat Developer Tools import instructions."
argument-hint: "[--validate-only]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Task
agent: cocos-build-specialist
---

# Cocos Build WeChat

This skill prepares the project for WeChat Mini Game deployment. It configures
the build profile, validates the build output, and ensures the project meets
WeChat's platform requirements.

## Phase 1: Pre-Build Audit

1. **Check builder.json**: read `settings/v2/packages/builder.json`
2. **Check engine.json**: verify only required modules are enabled (2d, audio, ui, graphics)
3. **Check App ID**: warn if `wx_your_app_id` is still the placeholder
4. **Estimate package size**: count asset file sizes, estimate code compilation size
5. **Check WeChat-specific code**: grep `src/` for `wx.` API calls — verify they're
   behind the IPlatformStorage interface per ADR-004

## Phase 2: Configure Build

If `--validate-only` is not passed, spawn `cocos-build-specialist` via Task to:

1. Update `settings/v2/packages/builder.json` with correct settings:
   - Platform: wechatgame
   - Orientation: portrait
   - MD5 Cache: enabled
   - Main Package Compression: enabled

2. Configure `settings/v2/packages/engine.json` to include only required modules:
   - 2d, audio, ui, graphics, label, tween, profiler
   - Remove: 3d, physics, particle, spine, dragonbones, terrain, animation

3. Plan subpackage strategy if total package exceeds 2MB

## Phase 3: Validate Build Output

If `build/wechatgame/` exists, validate:

- [ ] `game.js` exists (compiled game code)
- [ ] `game.json` exists (WeChat game config)
- [ ] `project.config.json` exists (WeChat DevTools project config)
- [ ] Package size < 2MB
- [ ] No browser-only APIs in compiled output (grep for `window.`, `document.`)

## Phase 4: WeChat DevTools Import

Generate import instructions:

```
1. Open WeChat Developer Tools (微信开发者工具)
2. Select "Mini Game" (小游戏) project type
3. Click "Import" (导入)
4. Directory: select build/wechatgame/
5. App ID: [from builder.json]
6. Click "Compile" (编译) — verify the game loads
7. Click "Preview" (预览) — scan QR code on phone to test
```

## Phase 5: Produce Report

```markdown
## WeChat Build Readiness Report

### Package Estimate
| Category | Size |
|----------|------|
| Engine (minimal) | ~500KB |
| Game code (compiled) | ~150KB |
| Assets (levels, fonts, audio) | [size] |
| **Total** | **[total]** / 2MB |

### Build Configuration
- App ID: [configured / STILL PLACEHOLDER — replace before publishing]
- Orientation: portrait
- Subpackages: [none / configured]

### Verdict: READY TO BUILD / CONCERNS / NOT READY
```

## Delegation

For asset budget issues: delegate to `cocos-asset-specialist`
For platform API integration: delegate to `wechat-platform-specialist`
For CI/CD build automation: delegate to `devops-engineer`
