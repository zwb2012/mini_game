# Architecture Review Report

**Date**: 2026-05-22
**Engine**: Godot 4.6
**GDDs Reviewed**: 18
**ADRs Reviewed**: 9

---

## Verdict: CONCERNS ⚠️

**PASS**: All requirements covered, no conflicts, engine consistent
**CONCERNS**: Some gaps or partial coverage, but no blocking conflicts
**FAIL**: Critical gaps (Foundation/Core layer requirements uncovered) or blocking cross-ADR conflicts detected

### Blocking Issues

1. 🔴 **ADR-0001 vs ADR-0009 冲突** — ADR-0001 claims all 18 MVP systems are Autoload; ADR-0009 selects PlayerController as a scene node. Must reconcile.
2. 🟡 **6 个系统缺少 ADR** — Camera, Boss body parts, Enemy AI navigation, Touch Control UI, Game State Machine, Death & Respawn lack dedicated ADRs
3. 🟡 **All 9 ADRs are Proposed** — none have been Accepted; stories referencing Proposed ADRs are auto-blocked
4. 🟡 **TR Registry is empty** — no requirement IDs for stories to reference

### Pre-Gate Checklist

| Item | Status |
|------|--------|
| `tests/unit/` directory | ❌ — run `/test-setup` |
| `tests/integration/` directory | ❌ — run `/test-setup` |
| `.github/workflows/tests.yml` | ❌ — run `/test-setup` |
| `design/accessibility-requirements.md` | ❌ — run `/ux-design` |
| `design/ux/interaction-patterns.md` | ❌ — run `/ux-design` |

---

## Traceability Summary

Total technical requirements: ~120 (across 18 GDDs)
✅ Covered: ~85 (71%)
⚠️ Partial: ~20 (17%)
❌ Gaps: ~15 (12%)

## Full Traceability Matrix

### Foundation Layer

| Requirement ID | GDD | System | Requirement | ADR | Status |
|---------------|-----|--------|-------------|-----|--------|
| TR-touch-input-001 | touch-input.md | Touch Input | 5 standardized output signals (move_direction, aim_position, shoot_tapped, shoot_held, is_aiming) | ADR-0009 | ✅ |
| TR-touch-input-002 | touch-input.md | Touch Input | Screen split logic (split_x = screen_width/2) | ADR-0009 | ✅ |
| TR-touch-input-003 | touch-input.md | Touch Input | 2-finger simultaneous support (1 left + 1 right) | ADR-0009 | ✅ |
| TR-touch-input-004 | touch-input.md | Touch Input | Tap vs hold discrimination (tap_threshold=200ms) | ADR-0009 | ✅ |
| TR-touch-input-005 | touch-input.md | Touch Input | Deadzone for movement (default 20px) | ADR-0009 | ✅ |
| TR-touch-input-006 | touch-input.md | Touch Input | Game state integration (paused=suppress, playing=normal) | ADR-0001 | ✅ |
| TR-physics-config-001 | physics-config.md | Physics Config | 5 collision layers (Player, Enemy, Projectile, World, PhysicsObject) | ADR-0001, ADR-0004 | ✅ |
| TR-physics-config-002 | physics-config.md | Physics Config | Collision matrix (who collides with whom) | ADR-0004 | ✅ |
| TR-physics-config-003 | physics-config.md | Physics Config | 4 physics materials (wood/metal/concrete/organic) | ADR-0005 | ✅ |
| TR-physics-config-004 | physics-config.md | Physics Config | Object pool for RigidBody2D fragments (size=50, FIFO) | ADR-0003 | ✅ |
| TR-physics-config-005 | physics-config.md | Physics Config | physics_ticks_per_second=60, max_physics_steps=8 | ADR-0003 | ✅ |
| TR-physics-config-006 | physics-config.md | Physics Config | CCD for projectiles only (CD_MODE_CAST_RAY) | ADR-0003 | ✅ |
| TR-physics-config-007 | physics-config.md | Physics Config | Body type assignment (CharacterBody2D vs RigidBody2D per game object) | ADR-0003 | ✅ |
| TR-game-state-001 | game-state-machine.md | Game State Machine | 5 exclusive states (MAIN_MENU/PLAYING/PAUSED/DEAD/LEVEL_COMPLETE) | — | ❌ GAP |
| TR-game-state-002 | game-state-machine.md | Game State Machine | transition_to() authority — only state machine sets state | — | ❌ GAP |
| TR-game-state-003 | game-state-machine.md | Game State Machine | state_changed(old, new) signal emitted on every transition | ADR-0001 | ✅ |
| TR-game-state-004 | game-state-machine.md | Game State Machine | Invalid transition rejection (e.g., DEAD→PAUSED) | — | ❌ GAP |
| TR-scene-manager-001 | scene-manager.md | Scene Manager | Load/unload/reset room scenes | ADR-0002 | ✅ |
| TR-scene-manager-002 | scene-manager.md | Scene Manager | change_scene_to_file() + reset() for death respawn | ADR-0002 | ✅ |
| TR-scene-manager-003 | scene-manager.md | Scene Manager | Transition fade in/out (300ms) | ADR-0002 | ✅ |
| TR-scene-manager-004 | scene-manager.md | Scene Manager | Load timeout 5s → error → main menu | ADR-0002 | ✅ |
| TR-scene-manager-005 | scene-manager.md | Scene Manager | MVP 5 scenes (main_menu + room_1/2/3 + boss_1) | ADR-0002 | ✅ |
| TR-scene-manager-006 | scene-manager.md | Scene Manager | Room manifest JSON (scene ID → .tscn mapping) | ADR-0002 | ✅ |
| TR-scene-manager-007 | scene-manager.md | Scene Manager | is_loading guard flag + request queue (depth ≤ 2) | ADR-0002 | ✅ |

### Core Layer

| Requirement ID | GDD | System | Requirement | ADR | Status |
|---------------|-----|--------|-------------|-----|--------|
| TR-hit-detection-001 | hit-detection.md | Hit Detection | HitData structure (9 fields: hit_point, hit_normal, hit_object, hit_layer, impulse, source_object, source_layer, damage_type, source_entity) | ADR-0004 | ✅ |
| TR-hit-detection-002 | hit-detection.md | Hit Detection | _integrate_forces + collision_hit custom signal (not body_entered) | ADR-0004 | ✅ |
| TR-hit-detection-003 | hit-detection.md | Hit Detection | AOE query_area() via PhysicsShapeQueryParameters2D + exclude_rids | ADR-0004 | ✅ |
| TR-hit-detection-004 | hit-detection.md | Hit Detection | Raycast for enemy AI vision (direct return, not through hit_detected) | ADR-0004 | ✅ |
| TR-hit-detection-005 | hit-detection.md | Hit Detection | Bullet single-hit (first collision → destroy) | ADR-0004 | ✅ |
| TR-hit-detection-006 | hit-detection.md | Hit Detection | Unified hit_detected signal dispatch to 7 downstream systems | ADR-0004 | ✅ |
| TR-hit-detection-007 | hit-detection.md | Hit Detection | Callable bind/disconnect pattern for pooled objects | ADR-0004 | ✅ |
| TR-player-controller-001 | player-controller.md | Player Controller | velocity = move_direction * move_speed in _physics_process | ADR-0009 | ✅ |
| TR-player-controller-002 | player-controller.md | Player Controller | move_and_slide() — CharacterBody2D physics | ADR-0009 | ✅ |
| TR-player-controller-003 | player-controller.md | Player Controller | face_right = aim_position.x > screen_center_x | ADR-0009 | ✅ |
| TR-player-controller-004 | player-controller.md | Player Controller | shoot_tapped → WeaponSystem.fire_current (via signal) | ADR-0009, ADR-0008 | ✅ |
| TR-player-controller-005 | player-controller.md | Player Controller | shoot_held → poll per frame → fire_current (CD via WeaponSystem) | ADR-0009, ADR-0008 | ✅ |
| TR-player-controller-006 | player-controller.md | Player Controller | Shoot CD delegated to WeaponSystem — PlayerController not responsible | ADR-0008, ADR-0009 | ✅ |
| TR-player-controller-007 | player-controller.md | Player Controller | Scene node (not Autoload) — instantiated per room .tscn | ADR-0009 | ✅ |
| TR-player-controller-008 | player-controller.md | Player Controller | Squeeze damage: 1 HP/s when trapped between 2+ colliders for 1s | ADR-0009 | ✅ |
| TR-player-controller-009 | player-controller.md | Player Controller | Collision: Player layer(1), collides Enemy|World|PhysicsObject | ADR-0009, ADR-0004 | ✅ |
| TR-camera-system-001 | camera-system.md | Camera System | Horizontal follow: lerp(camera.x, target.x + look_ahead, speed * delta) | — | ❌ GAP |
| TR-camera-system-002 | camera-system.md | Camera System | Vertical deadzone (30% screen height) | — | ❌ GAP |
| TR-camera-system-003 | camera-system.md | Camera System | Scene boundary limits (limit_left/right/top/bottom) | — | ❌ GAP |
| TR-camera-system-004 | camera-system.md | Camera System | shake(intensity, duration) — decaying oscillation | — | ❌ GAP |
| TR-camera-system-005 | camera-system.md | Camera System | hit_stop(duration, time_scale) — with debounce | ADR-0007 (partial) | ⚠️ |
| TR-camera-system-006 | camera-system.md | Camera System | Concurrency resolution (max intensity for shake, min time_scale for hit_stop) | — | ❌ GAP |

### Core Gameplay Layer

| Requirement ID | GDD | System | Requirement | ADR | Status |
|---------------|-----|--------|-------------|-----|--------|
| TR-shooting-projectile-001 | shooting-projectile.md | Shooting | fire(origin, target, bullet_type, source_entity) | ADR-0007 | ✅ |
| TR-shooting-projectile-002 | shooting-projectile.md | Shooting | Standard bullet: speed=2000, mass=0.5, impact=500, CCD, gravity_scale=0.3 | ADR-0007 | ✅ |
| TR-shooting-projectile-003 | shooting-projectile.md | Shooting | Sticky bullet: speed=1500, mass=1.0, fuse=1.5s, explosion_radius=150, force=1000 | ADR-0007 | ✅ |
| TR-shooting-projectile-004 | shooting-projectile.md | Shooting | Bullet lifecycle: FLYING→HIT/ATTACHED/DETONATING→EXPIRED→release | ADR-0007 | ✅ |
| TR-shooting-projectile-005 | shooting-projectile.md | Shooting | hit-stop only for player bullets (source_entity="player") | ADR-0007 | ✅ |
| TR-shooting-projectile-006 | shooting-projectile.md | Shooting | Enemy bullet: no Enemy layer collision (友军伤害防止) | ADR-0007 | ✅ |
| TR-shooting-projectile-007 | shooting-projectile.md | Shooting | Bullet from pool — no instantiate() at runtime | ADR-0007, ADR-0003 | ✅ |
| TR-shooting-projectile-008 | shooting-projectile.md | Shooting | Lifetime timer via Tween+set_loops (not recursive create_timer) | ADR-0007 | ✅ |
| TR-shooting-projectile-009 | shooting-projectile.md | Shooting | Sticky parent tree_exited CONNECT_ONE_SHOT (premature detonation) | ADR-0007 | ✅ |
| TR-material-destruction-001 | material-destruction.md | Material Destruction | 5 materials with thresholds (wood=200, metal=500, concrete=1000, organic=300, composite=1500) | ADR-0005 | ✅ |
| TR-material-destruction-002 | material-destruction.md | Material Destruction | Damage accumulation: accumulated_damage += impulse; destroy when ≥ threshold | ADR-0005 | ✅ |
| TR-material-destruction-003 | material-destruction.md | Material Destruction | Crack stages (0/1/2) — crack_stage_changed signal | ADR-0005 | ✅ |
| TR-material-destruction-004 | material-destruction.md | Material Destruction | Collapse direction rules (gravity_down, impact_direction, impact_reverse) | ADR-0005 | ✅ |
| TR-material-destruction-005 | material-destruction.md | Material Destruction | Debris generation via PhysicsObjectPool.acquire_debris() | ADR-0005, ADR-0003 | ✅ |
| TR-material-destruction-006 | material-destruction.md | Material Destruction | object_destroyed(position, material, debris_list) signal | ADR-0005 | ✅ |
| TR-material-destruction-007 | material-destruction.md | Material Destruction | Material config from JSON (data-driven) | ADR-0005 | ✅ |
| TR-weapon-system-001 | weapon-system.md | Weapon System | Weapon data: weapon_id, bullet_type, shoot_interval, magazine_size, reload_time | ADR-0008 | ✅ |
| TR-weapon-system-002 | weapon-system.md | Weapon System | MVP 2 weapons: standard_rifle + sticky_launcher | ADR-0008 | ✅ |
| TR-weapon-system-003 | weapon-system.md | Weapon System | fire_current → CD check → ammo check → ShootingSystem.fire() | ADR-0008, ADR-0007 | ✅ |
| TR-weapon-system-004 | weapon-system.md | Weapon System | Independent per-weapon ammo state (preserved on switch) | ADR-0008 | ✅ |
| TR-weapon-system-005 | weapon-system.md | Weapon System | Reload interruptible by weapon switch | ADR-0008 | ✅ |
| TR-weapon-system-006 | weapon-system.md | Weapon System | Room reset → all weapons ammo restored to magazine_size | ADR-0008, ADR-0002 | ✅ |
| TR-chain-propagation-001 | chain-propagation.md | Chain Propagation | 3 propagation types (debris/explosion/collapse) with params | ADR-0006 | ✅ |
| TR-chain-propagation-002 | chain-propagation.md | Chain Propagation | Dual entry: object_destroyed signal + trigger_explosion() call | ADR-0006 | ✅ |
| TR-chain-propagation-003 | chain-propagation.md | Chain Propagation | Two-phase model: Phase 1 physics (same frame) + Phase 2 visual (staggered) | ADR-0006 | ✅ |
| TR-chain-propagation-004 | chain-propagation.md | Chain Propagation | Iterative queue (not recursive) — max_chain_depth=20 | ADR-0006 | ✅ |
| TR-chain-propagation-005 | chain-propagation.md | Chain Propagation | F_source formula: D_threshold + max(0, I_incoming - D_threshold) × 0.25 | ADR-0006 | ✅ |
| TR-chain-propagation-006 | chain-propagation.md | Chain Propagation | F_received formula with Attn_dist, DepthMult, C_type | ADR-0006 | ✅ |
| TR-chain-propagation-007 | chain-propagation.md | Chain Propagation | De-duplication via _processed_in_chain set | ADR-0006 | ✅ |
| TR-chain-propagation-008 | chain-propagation.md | Chain Propagation | COOLDOWN 0.1s + pending queue (max 5) | ADR-0006 | ✅ |
| TR-health-damage-001 | health-damage.md | Health & Damage | final_damage = floor(impulse × type_factor × dtc) | ADR-0004 | ✅ |
| TR-health-damage-002 | health-damage.md | Health & Damage | 5 damage types: bullet=0.20, explosion=0.15, fragment=0.25, crush=0.30, environment=0.20 | ADR-0004 | ✅ |
| TR-health-damage-003 | health-damage.md | Health & Damage | Entity HP pools (Player=1000, Light=200, Medium=400, Heavy=800, Boss=3000) | — | ⚠️ PARTIAL |
| TR-health-damage-004 | health-damage.md | Health & Damage | health_changed(entity, old, new) + entity_died(entity, killer) signals | ADR-0001 | ✅ |
| TR-health-damage-005 | health-damage.md | Health & Damage | Multi-hit same frame: sequential processing, first death blocks subsequent | ADR-0004 | ✅ |
| TR-health-damage-006 | health-damage.md | Health & Damage | DEAD guard: ignore hits on dead entities | — | ❌ GAP |
| TR-death-respawn-001 | death-respawn.md | Death & Respawn | Player death flow: DEAD → death anim → pause → reset_room → PLAYING | — | ❌ GAP |
| TR-death-respawn-002 | death-respawn.md | Death & Respawn | Infinite retry (no life limit) | — | ❌ GAP |
| TR-death-respawn-003 | death-respawn.md | Death & Respawn | Respawn invulnerability 1.0s | — | ❌ GAP |
| TR-death-respawn-004 | death-respawn.md | Death & Respawn | Enemy death flow: death anim 0.3s → remove → notify spawn system | — | ❌ GAP |

### Feature Layer

| Requirement ID | GDD | System | Requirement | ADR | Status |
|---------------|-----|--------|-------------|-----|--------|
| TR-enemy-ai-001 | enemy-ai.md | Enemy AI | 4 archetypes (Scout/Soldier/Heavy/Carrier) with distinct behaviors | — | ❌ GAP |
| TR-enemy-ai-002 | enemy-ai.md | Enemy AI | Vision cone: range=600, angle=120°, detection_delay=0.3s, memory=3s | — | ❌ GAP |
| TR-enemy-ai-003 | enemy-ai.md | Enemy AI | NavigationAgent2D + NavigationRegion2D pathfinding | — | ❌ GAP |
| TR-enemy-ai-004 | enemy-ai.md | Enemy AI | State machine: IDLE/COMBAT/SEARCHING/STUNNED/DEAD | — | ❌ GAP |
| TR-enemy-ai-005 | enemy-ai.md | Enemy AI | Shooting via fire(enemy_muzzle, target, "standard", self) | ADR-0007 | ✅ |
| TR-enemy-ai-006 | enemy-ai.md | Enemy AI | Stun formula: BASE_STUN=0.4s with excess_ratio multiplier | — | ❌ GAP |
| TR-enemy-ai-007 | enemy-ai.md | Enemy AI | Cover selection scoring (Scout) | — | ❌ GAP |
| TR-enemy-ai-008 | enemy-ai.md | Enemy AI | Target priority: type_value × distance_factor × los_factor | — | ❌ GAP |
| TR-enemy-ai-009 | enemy-ai.md | Enemy AI | AI frame budget ≤ 2ms for 15 enemies @ 60fps | — | ❌ GAP |
| TR-boss-ai-001 | boss-ai.md | Boss AI | 5 body parts (2 legs, 2 arms, 1 core) — independent RigidBody2D with top_level=true | — | ❌ GAP |
| TR-boss-ai-002 | boss-ai.md | Boss AI | Phase system: Phase 1→Phase 2→DOWNED based on HP + leg destruction | — | ❌ GAP |
| TR-boss-ai-003 | boss-ai.md | Boss AI | Bullet damage separation: dtc_effective=0 for bullet type (Pillar 4) | ADR-0004 | ✅ |
| TR-boss-ai-004 | boss-ai.md | Boss AI | Crush penetration: dtc_effective=1.0 for crush type | — | ❌ GAP |
| TR-boss-ai-005 | boss-ai.md | Boss AI | VULNERABLE state: vuln_mult=2.0, 5.0s window | — | ❌ GAP |
| TR-boss-ai-006 | boss-ai.md | Boss AI | 6 attack types with cooldowns and warning animations | — | ❌ GAP |
| TR-boss-ai-007 | boss-ai.md | Boss AI | CharacterBody2D root + top_level RigidBody2D body parts | — | ❌ GAP |
| TR-boss-ai-008 | boss-ai.md | Boss AI | Anchor point path movement (not free navigation) | — | ❌ GAP |
| TR-level-design-001 | level-design-data.md | Level Design Data | Room JSON schema (room_id, enemies[], physics_objects[], camera_bounds, room_transitions) | ADR-0002 | ✅ |
| TR-level-design-002 | level-design-data.md | Level Design Data | 5 physics object types (explosive_barrel, hanging_object, destructible_wall, acid_pool, unstable_structure) | — | ⚠️ PARTIAL |
| TR-level-design-003 | level-design-data.md | Level Design Data | Pillar 2 constraint: ≥2 physics object types per room | — | ⚠️ PARTIAL |
| TR-level-design-004 | level-design-data.md | Level Design Data | Boss room extension fields (anchor_points[], body_parts[], boss_archetype) | — | ❌ GAP |
| TR-enemy-spawn-001 | enemy-spawn-wave.md | Enemy Spawn | MVP: one-shot batch spawn with stagger (default 0.3s) | — | ❌ GAP |
| TR-enemy-spawn-002 | enemy-spawn-wave.md | Enemy Spawn | Boss separate path: activate_boss(boss_id, room_config) | — | ❌ GAP |
| TR-enemy-spawn-003 | enemy-spawn-wave.md | Enemy Spawn | Room clear detection: active_enemy_count=0 + queue empty | — | ❌ GAP |

### Presentation Layer

| Requirement ID | GDD | System | Requirement | ADR | Status |
|---------------|-----|--------|-------------|-----|--------|
| TR-hud-001 | hud.md | HUD | 3-tier information hierarchy (Persistent / Event / Boss) | — | ❌ GAP |
| TR-hud-002 | hud.md | HUD | 10 MVP elements: HP bar, weapon icon, chain counter, Boss HP, parts, timers, etc. | — | ❌ GAP |
| TR-hud-003 | hud.md | HUD | Signal subscription registry (hud_layout.json config-driven) | ADR-0001 | ✅ |
| TR-hud-004 | hud.md | HUD | CanvasLayer rendering (independent of camera) | — | ❌ GAP |
| TR-hud-005 | hud.md | HUD | Low health edge pulse (HP ≤ 30%, 0.5Hz) | — | ❌ GAP |
| TR-touch-control-ui-001 | touch-control-ui.md | Touch Control UI | Dynamic joystick (center at finger drop, max drag 80px) | — | ❌ GAP |
| TR-touch-control-ui-002 | touch-control-ui.md | Touch Control UI | Crosshair (24×24, follows right finger) | — | ❌ GAP |
| TR-touch-control-ui-003 | touch-control-ui.md | Touch Control UI | Shoot feedback pulse ring (24→48px, 0.1s) | — | ❌ GAP |
| TR-touch-control-ui-004 | touch-control-ui.md | Touch Control UI | Screen space coordination with HUD (top 48px vs rest) | — | ❌ GAP |
| TR-touch-control-ui-005 | touch-control-ui.md | Touch Control UI | CanvasLayer rendering — read-only visual consumer of TouchInput | — | ❌ GAP |

---

## Cross-ADR Conflicts

### 🔴 Conflict: ADR-0001 vs ADR-0009 — PlayerController Architecture

**Type**: Architecture pattern conflict
**ADR-0001 claims**: "每个 MVP 系统实现为一个 Godot Autoload" — PlayerController is an Autoload in the architecture diagram
**ADR-0009 claims**: "PlayerController 作为场景节点（非 Autoload）——每个房间 .tscn 实例化"

**Impact**: PlayerController would be implemented as both Autoload and scene node simultaneously — impossible. The Autoload count is 17 or 18 depending on which ADR is followed.

**Resolution options**:
1. Revise ADR-0001 to acknowledge PlayerController as the sole scene-node exception; update Autoload count to 17
2. Revise ADR-0009 to follow Autoload pattern; address reparenting during scene switches

### 🟡 Minor: ADR-0006 Code Fragment Issue

ADR-0006's `_process_propagation_queue()` contains malformed code at lines 286-293 — duplicate hit_data key assignments that would cause a GDScript parse error. This is a documentation bug in the ADR, not an architectural conflict.

---

## ADR Dependency Order (Topologically Sorted)

```
Foundation (no dependencies):
  1. ADR-0001: Autoload + Direct Signal Architecture

Depends on Foundation:
  2. ADR-0002: Scene Loading Strategy (requires ADR-0001)
  3. ADR-0003: Physics Object Pool (requires ADR-0001, ADR-0002)

Depends on Core:
  4. ADR-0004: Hit Detection Architecture (requires ADR-0001, ADR-0003)
  5. ADR-0005: Material Destruction Pipeline (requires ADR-0003, ADR-0004)
  6. ADR-0006: Chain Propagation Recursion (requires ADR-0004, ADR-0005)

Depends on Feature:
  7. ADR-0007: Bullet Lifecycle (requires ADR-0003, ADR-0004)
  8. ADR-0008: Weapon System & Ammo (requires ADR-0007)
  9. ADR-0009: Player Controller & Touch Shooting (requires ADR-0007, ADR-0008)
```

⚠️  ADR-0002 depends on ADR-0001 — but ADR-0001 is still Proposed.
⚠️  All 9 ADRs are Proposed. None can be safely implemented until Accepted.

---

## Engine Compatibility Cross-Check

### Engine Audit Results

| Check | Result |
|-------|--------|
| **All ADRs reference same engine version (Godot 4.6)** | ✅ PASS |
| **Deprecated API references** | ✅ None found |
| **Post-Cutoff APIs Used** | ✅ All correctly marked as "None" |
| **GodotPhysics2D vs Jolt confusion** | ✅ Correctly resolved in all ADRs |
| **Engine Compatibility sections present** | ✅ 9/9 ADRs have them |

### Engine Specialist Notes (from ADR implementation notes)

- ADR-0003: `freeze` does not disable collision — mitigation documented (collision_layer=0)
- ADR-0004: `body_entered` lacks collision data — fixed via `_integrate_forces`
- ADR-0004: Callable bind causes disconnect failure — fixed via set_meta storage
- ADR-0007: `Engine.time_scale` modification in `_integrate_forces` — fixed via call_deferred

---

## GDD Revision Flags

| GDD | Assumption | Reality (from ADR/engine-reference) | Action |
|-----|-----------|--------------------------------------|--------|
| player-controller.md | shoot_interval managed in PlayerController (§3, §4) | ADR-0008/ADR-0009: CD delegated to WeaponSystem | Revise GDD to remove shoot_interval management; PlayerController only calls fire_current() unconditionally |

---

## Required ADRs (Priority Ordered)

### Foundation Gaps (BLOCKING for gate-check)

1. **ADR-0010: 游戏状态机架构** — 5-state enum, transition_to authority, signal contract. Domain: Core. Engine Risk: LOW.

### Core Gaps (HIGH — write before stories)

2. **ADR-0011: Boss 身体部件架构** — CharacterBody2D root + top_level RigidBody2D children vs PinJoint2D alternative. Domain: Physics. Engine Risk: HIGH (known fragile Godot pattern).
3. **ADR-0012: Enemy AI 导航策略** — NavigationAgent2D pre-baked vs runtime, mobile performance budget, dynamic obstacle handling. Domain: AI/Navigation. Engine Risk: MEDIUM (Godot 4.5 dedicated 2D nav server).
4. **ADR-0013: 摄像机系统架构** — follow smoothing, boundary limits, shake decay, hit-stop debounce. Domain: Rendering/Camera. Engine Risk: LOW.
5. **ADR-0014: 死亡与重生架构** — state machine → scene manager → object pool coordination, invulnerability timer, one_shot persistence. Domain: Core. Engine Risk: LOW.

### Feature/Presentation Gaps (MEDIUM)

6. **ADR-0015: 触控 UI 架构** — CanvasLayer stack, dynamic joystick rendering, HUD coordination, Godot 4.6 dual-focus system. Domain: UI. Engine Risk: MEDIUM.
7. **ADR-0016: JSON 数据管线** — validation timing, schema versioning, .tres migration path. Domain: Data. Engine Risk: LOW.
8. **ADR-0017: HUD 架构** — CanvasLayer, 3-tier info hierarchy, signal subscription registry, config-driven layout. Domain: UI. Engine Risk: LOW.

---

## Architecture Document Coverage

`docs/architecture/architecture.md` (v1.0) coverage check:

| Check | Result |
|-------|--------|
| All 18 MVP systems in architecture layers | ✅ |
| Data flow section covers cross-system communication | ✅ |
| API boundaries support integration requirements | ✅ |
| Signal contracts defined (8 key signals) | ✅ |
| ADR list matches current planning | ⚠️ — Original planned ADRs differ from actual ADRs written |

The architecture document was written before any ADRs existed (states "ADRs Referenced: 0"). Original planned ADR numbering (e.g., ADR-0008 is "2D Navigation" in architecture.md but "Weapon System" in actual ADRs) has diverged. The architecture document should be updated after ADR numbering stabilizes.

---
