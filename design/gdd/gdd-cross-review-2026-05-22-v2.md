# Cross-GDD Review Report v2
**Date**: 2026-05-22
**GDDs Reviewed**: 19 (18 MVP + game-concept)
**Previous Review**: 2026-05-22 (v1) — 11 blocking, 20 warnings
**Verdict**: FAIL — 13 blocking, 30 warnings
**Review type**: Full (consistency + design theory)

---

## Executive Summary

19 GDDs across 18 MVP systems were reviewed for cross-document consistency and game design holism. The previous review (v1) found 11 blocking items — 6 file-level fixes have been applied in this session (C1 fire signature, C2 weapon-system routing, C3 hit_stop, C4 Boss HP, C5/C6 false claims, C7 dependency direction, W5 debris TTL, W6 shake units, W10 Jolt references). However, the 4 design-theory blocking issues (D1-D4) remain fully valid, and 7 new consistency blocking issues were discovered — primarily in the touch input architecture and camera death state.

The most critical finding: **touch-input.md and touch-control-ui.md have conflicting definitions** for screen split ratio (50% vs 30%), deadzone (20px vs 15px), and signal routing architecture. These are the foundation of all player input and must be resolved before any implementation begins.

---

## Part 1: Previous Review Fix Verification

| Issue | Status | Notes |
|-------|--------|-------|
| C1: fire() signature | ✅ Fixed | All 4 GDDs now use `fire(origin, target, bullet_type, source_entity)` |
| C2: player-controller bypass weapon-system | ✅ Fixed | player-controller now routes through `weapon_system.fire_current()` |
| C3: hit_stop time_scale=0.05 | ✅ Fixed | shooting-projectile now uses time_scale=0.1 |
| C4: Boss HP range vs fixed | ✅ Fixed | health-damage now lists 3000 (matching entities.yaml + boss-ai) |
| C5: enemy-ai false claims | ✅ Fixed | Stale cross-validation claims removed |
| C6: boss-ai false claim | ✅ Fixed | False material-destruction reference removed |
| C7: scene-manager dependency contradiction | ✅ Fixed | death-respawn consistently labeled "上游（触发本系统）" |
| W5: debris TTL mismatch | ✅ Fixed | boss-ai now references material-destruction 7.0s default + ADR-0003 pool |
| W6: camera shake units | ✅ Fixed | boss-ai now uses normalized intensity (0-1), camera max_shake_pixels=20 |
| W10: Jolt references | ✅ Fixed | boss-ai Jolt notes updated to GodotPhysics2D |
| D1: Direct shooting dominant | 🔴 STILL VALID | No mechanical changes — still optimal for 4/5 enemy types |
| D2: Cognitive overload | 🔴 STILL VALID | 6-7 active systems in combat, mobile limit is 3-4 |
| D3: chain_score orphaned | 🔴 STILL VALID | Formula defined but no consuming system exists |
| D4: Touch precision vs physics | 🔴 STILL VALID | 2000px/s bullets vs ±20-40px thumb accuracy |

---

## Part 2: Cross-GDD Consistency (Phase 2)

### 🔴 Blocking (7 issues)

#### RC-1 — 屏幕分界线默认值矛盾
- **GDDs**: touch-input.md (§2), touch-control-ui.md (§2)
- **What**: touch-input splits screen at 50% (`split_x = screen_width / 2`), touch-control-ui uses 30% (`split_x = screen_width × 0.3`). Each system assigns touch ownership differently — a touch at 35% screen width belongs to "right zone" in one system and "left zone" in the other.
- **Fix**: Establish touch-input as single source of truth for zone calculation. touch-control-ui should read split position from touch-input, not define it independently.

#### RC-2 — 死区默认值矛盾
- **GDDs**: touch-input.md (deadzone ~20px), touch-control-ui.md (DEAD_ZONE=15px)
- **What**: One system deadens input at 20px displacement, the other at 15px. Inconsistent behavior when both systems process the same touch stream.
- **Fix**: Single deadzone value owned by touch-input. touch-control-ui reads it, does not define it.

#### RC-3 — 死亡状态摄像机行为矛盾
- **GDDs**: camera-system.md (§3: "DEAD 状态下冻结"), death-respawn.md (§3: "死亡摄像机效果慢动作 0.5s + 拉近")
- **What**: Camera declares DEAD state = frozen (no follow, no shake). Death-respawn requires camera to play death-cam effect. Cannot both be true simultaneously.
- **Fix**: Redefine camera DEAD state as "animation-only mode — plays scripted death cam sequence, then freezes." Or add a dedicated DeathCamController that overrides standard camera during death.

#### MBL-1 — shooting-projectile 未将 weapon-system 列为上游
- **GDDs**: shooting-projectile.md (Dependencies), weapon-system.md (Dependencies)
- **What**: weapon-system calls `fire(origin, target, bullet_type, source_entity)` on shooting-projectile, but shooting-projectile's dependency table omits weapon-system entirely.
- **Fix**: Add weapon-system as "上游（调用方）" in shooting-projectile Dependencies.

#### MBL-13 — touch-control-ui 架构描述与实际数据流矛盾
- **GDDs**: touch-control-ui.md (cross-validation), player-controller.md (Dependencies)
- **What**: touch-control-ui claims to be middleware between touch-input and player-controller. player-controller directly reads from touch-input signals — touch-control-ui is bypassed.
- **Fix**: Update touch-control-ui cross-validation to reflect actual architecture: touch-input → player-controller (signal consumer), touch-input → touch-control-ui (visual layer only — renders joystick/crosshair).

#### DK-3 — deadzone 双所有权（值冲突）
- **GDDs**: touch-input.md (20px), touch-control-ui.md (15px)
- **What**: Same as RC-2 from the ownership perspective. Two systems claim to define deadzone with different values.
- **Fix**: touch-input owns deadzone. touch-control-ui reads it as input, does not redefine it.

#### AC-1 — 摄像机冻结 AC 与死亡效果 AC 直接矛盾
- **GDDs**: camera-system.md (AC6 implied: freeze on DEAD), death-respawn.md (AC24: death cam effect triggers)
- **What**: These two acceptance criteria cannot both pass. Camera cannot be both frozen and playing a death cam effect.
- **Fix**: Align with RC-3 fix. Add death-cam as explicit camera state or dedicated controller.

### ⚠️ Warnings (20 issues)

**Dependency Bidirectionality (MBL-2 through MBL-12)**: 11 one-directional dependency listings across player-controller→weapon-system, chain-propagation→physics-config, hit-detection→death-respawn/enemy-ai, health-damage→shooting-projectile/enemy-ai, camera-system→shooting-projectile/death-respawn/boss-ai, game-state-machine→boss-ai, scene-manager→boss-ai, physics-config→game-state-machine, player-controller→HUD. All are the same pattern: System A lists System B as dependency, but System B doesn't list System A as dependent. These are low-risk individually but collectively represent incomplete dependency documentation.

**Stale References (SR-1, SR-2)**: touch-control-ui cross-validation describes outdated architecture; physics-config cross-references still use "待设计" tags for 4 systems that are now fully designed.

**Ownership Conflicts (DK-1, DK-2, DK-4)**: recoil_force (shooting-projectile vs weapon-system), shoot_interval (player-controller vs weapon-system), hit_stop_duration (shooting-projectile vs camera-system). Weapon-system correctly claims override authority for weapon-specific values, but the base GDDs haven't acknowledged this split.

**Formula Compatibility (FC-1, FC-2, FC-3)**: chain_score has no consumer; boss dtc_effective bullet=0.0 rule not cross-referenced in health-damage; material thresholds duplicated across 7 GDDs without shared constant registry.

**Missing System References (RC-6, RC-7, RC-8)**: Audio system, scoring/rating system, and analytics system are referenced as dependencies by multiple GDDs but have no GDD files.

**AC Cross-Check (AC-2 through AC-5)**: Chain termination vs death timing race condition; multiple ACs reference systems without GDDs; room clear detection ownership unclear; touch-control-ui has no pause-related ACs.

---

## Part 3: Game Design Holism (Phase 3)

### 🔴 Blocking (6 issues)

#### H1 (D1) — 直接射击是统治策略（违反 Pillar 4）
- **Systems**: health-damage, shooting-projectile, chain-propagation, enemy-ai
- **What**: Standard bullets kill Scout(1 shot/0.3s), Soldier(2 shots/0.6s), Carrier(1 shot/0.3s), Heavy(4 shots/1.2s). Unlimited ammo. Zero death penalty. Boss is the ONLY enemy where direct shooting fails (bullet dtc=0.0). Pillar 4 "brain over reflexes" is a wish, not a mechanic, for 80% of combat.
- **Recommendation**: (A) Increase bullet dtc resistance on Soldier→0.4, Heavy→0.2 to force chain usage. (B) Limit standard ammo to 20/room. (C) Add bullet-immune enemy archetype to Room 2-3.

#### H2 (D3) — chain_score 无消费者（悬空激励）
- **Systems**: chain-propagation (producer), scoring system (consumer — MISSING)
- **What**: `chain_score = (Σ destroyed_value × 100 + total_damage × 0.5) × chain_depth^1.5` is fully defined but no system reads it. Core feedback loop is broken.
- **Recommendation**: Add scoring-system.md GDD at minimum MVP scope: room rating 1-3 stars based on average chain depth.

#### H3 — 移动端认知过载（6-7 活跃系统 > 3-4 上限）
- **Systems**: touch-input, player-controller, chain-propagation, enemy-ai, weapon-system, health-damage, hud
- **What**: Combat moment requires: dual-thumb touch, aim, shoot, chain planning, enemy tracking, HP monitoring, weapon management. Mobile comfort limit is 3-4 concurrent active systems.
- **Recommendation**: Auto-highlight chainable objects (passive chain planning). Add 30px auto-aim to PhysicsObject layer. Reduce dual-thumb to single-thumb + tap-to-shoot.

#### H4 — Room 3 → Boss 难度悬崖
- **Systems**: level-design-data, boss-ai, enemy-ai
- **What**: Rooms 1-3 allow brute-force direct shooting. Boss is immune to bullets. Player reaches Boss without ever being forced to learn chains — then hits a hard wall.
- **Recommendation**: Add one high-bullet-resistance enemy (dtc=0.2-0.3) to Room 2 or 3. Add chain tutorial event at end of Room 1.

#### H5 — Pillar 4 承诺与实际设计矛盾
- **Systems**: game-concept (Pillar 4), health-damage (damage model)
- **What**: Game's core promise is "brain over reflexes" but the damage system makes direct shooting the optimal strategy. This is a fundamental disconnect between marketing/vision and mechanical reality.
- **Recommendation**: Resolve before architecture continues. Either (A) commit to Pillar 4 by redesigning damage economy, or (B) soften Pillar 4 language to "brain AND reflexes" with chains as a high-skill optional path.

#### H6 (D4) — 触屏精度 vs 物理瞄准
- **Systems**: touch-control-ui, shooting-projectile
- **What**: 2000px/s bullets × 48-72px targets × ±20-40px thumb accuracy. The gap between "knowing where to shoot" and "actually hitting it" is finger precision, not physics reasoning.
- **Recommendation**: (A) 30px auto-aim snap on PhysicsObject layer. (B) Increase bullet collision radius. (C) Reduce bullet speed to 1200px/s.

### ⚠️ Warnings (10 issues)

W1 — Cognitive overload details (extension of H3)
W2 — Chain mastery lacks extrinsic reward loop
W3 — Single progression path (room clear) dominates — chains are optional
W4 — Bullet vs chain damage efficiency inverted (bullet > chain despite chains being harder)
W5 — Zero-penalty death eliminates resource management meaning
W6 — Destructible objects are finite and non-renewable (core chain fuel)
W7 — Room 1 insufficient as tutorial (doesn't force chain exposure)
W8 — Boss 20s collapse window may be too short for first-time players
W9 — 7 infrastructure systems have zero pillar coverage
W10 — "Brain planner" vs "marksman" fantasy tension

---

## Part 4: Cross-System Scenario Walkthrough

### Scenario 1: Room 1 first encounter (unchanged from v1)
- ⚠️ Player can clear entirely with direct shooting — never touches chain system
- ⚠️ "Tutorial room" label is misleading — nothing is taught

### Scenario 2: Room 3 → Boss transition (unchanged from v1)
- 🔴 3 rooms of brute-force → Boss immune to bullets → wall
- 🔴 Player has zero chain practice when it becomes mandatory

### Scenario 3: chain_score calculation flow (unchanged from v1)
- 🔴 chain_score calculated → no consumer → feedback loop broken

---

## GDDs Flagged for Revision

| GDD | Reason | Priority |
|-----|--------|----------|
| touch-input.md | Screen split + deadzone conflict with touch-control-ui; signal routing ambiguity | 🔴 Blocking |
| touch-control-ui.md | Redundant signal definitions; architecture description contradicts actual data flow | 🔴 Blocking |
| camera-system.md | DEAD state freeze contradicts death-respawn death-cam requirement | 🔴 Blocking |
| death-respawn.md | Death-cam effect not compatible with camera's DEAD freeze rule | 🔴 Blocking |
| shooting-projectile.md | Missing weapon-system as upstream dependency; hit_stop API mismatch with camera | 🔴 Blocking |
| health-damage.md | Boss dtc_effective bullet=0.0 not cross-referenced; missing upstream callers | ⚠️ Warning |
| chain-propagation.md | chain_score consumer missing; no audio/scoring system GDD exists | ⚠️ Warning |
| player-controller.md | Direct touch-input reading bypasses touch-control-ui's claimed middleware role | ⚠️ Warning |

---

## Required Actions Before Architecture Continues

1. **Resolve touch input architecture** (RC-1, RC-2, DK-3, MBL-13) — single source of truth for split ratio, deadzone, and signal routing
2. **Resolve camera death state** (RC-3, AC-1) — death-cam vs freeze
3. **Resolve Pillar 4 enforcement** (H1, H5) — design decision: commit to brain>reflexes or soften
4. **Resolve difficulty cliff** (H4) — add chain-forcing enemy to Room 2-3
5. **Add scoring system GDD** (H2/D3) — minimum viable: room rating based on chain depth
6. **Fix dependency tables** (MBL-1 through MBL-12) — bidirectional dependency documentation
