# ADR-0008: 武器系统与弹药管理架构

## Status
Accepted

## Date
2026-05-22

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Godot 4.6 |
| **Domain** | Core |
| **Knowledge Risk** | LOW — 武器系统是纯 GDScript 逻辑：JSON 配置加载、状态机、shoot_interval CD 计时。不涉及 Godot 引擎 API |
| **References Consulted** | `docs/engine-reference/godot/VERSION.md`, `docs/engine-reference/godot/breaking-changes.md`, `docs/engine-reference/godot/deprecated-apis.md` |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | 连续快速切换武器时状态一致性（RELOADING 中途切换 → 新武器 READY）；弹匣耗尽后自动 reload vs 手动 reload 的玩家体验 |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Autoload + Direct Signal) — WeaponSystem 作为 Autoload；ADR-0007 (子弹生命周期) — fire_current 委托 ShootingSystem.fire()；ADR-0002 (场景加载) — 房间重置时弹药恢复到满状态 |
| **Enables** | None — WeaponSystem 是射击链路的末端消费者，不启用其他 ADR |
| **Blocks** | Weapon System Epic, Player Controller Epic — 必须先确定武器切换/弹药管理接口才能实现玩家射击输入 |
| **Ordering Note** | 必须在 ADR-0007 之后实现——fire_current 依赖 ShootingSystem.fire() 的接口 |

## Context

### Problem Statement

武器系统是"玩家意图"和"子弹飞出"之间的翻译层。当玩家按下射击按钮时，系统需要：检查当前武器是否可射击（冷却、弹药）、查找武器配置中的 bullet_type、委托 ShootingSystem 发射子弹、更新弹药计数、启动冷却/换弹计时。MVP 提供 2 把武器——标准步枪（20 发弹匣，0.3s 射速）和粘弹发射器（3 发弹匣，0.8s 射速，需换弹）。

核心架构问题：

1. **职责边界**: 射速限制（shoot_interval）在哪里实现？WeaponSystem 还是 ShootingSystem？如果 ShootSystem 管射速，那不同武器的不同 shoot_interval 如何传递？

2. **弹药模型**: 标准步枪弹匣 20 发——20 发用完后自动阻止射击还是自动换弹？粘弹发射器 3 发——换弹时间 2.0s 期间玩家能切换武器吗？

3. **武器切换与状态传递**: 换弹中途切换武器 → 取消换弹 → 新武器 READY。但旧武器的弹药状态是否保留？下次切回来是空弹匣还是已装填？

4. **房间重置**: 玩家死亡后房间重置 → 弹药恢复满状态。这个重置逻辑在 WeaponSystem 还是 SceneManager？

### Constraints

- 所有武器属性从配置文件读取（coding-standards: 数据驱动）
- fire_current 委托给 ShootingSystem.fire()（ADR-0007 接口）
- Signal-First 通信（ADR-0001）——HUD 通过信号获取武器状态
- MVP 2 武器——Alpha 扩展至 6-8 把。设计必须支持新增武器只加配置不改代码
- shoot_interval 限制创建频率——不是 ShootingSystem 的职责（ShootingSystem 可被 AI 直接调用，不走武器 CD）

### Requirements

- 数据驱动——新增武器只需在 weapon_config.json 中添加条目
- 射击 CD 在 WeaponSystem 层——ShootingSystem 可被 EnemyAI 绕过 CD 调用（敌人有自己的射速逻辑）
- 弹药追踪按武器独立存储——切换武器时保留弹药状态
- 换弹可被切换武器打断——新武器 READY，旧武器弹药不变
- 房间重置时全部武器弹药恢复满状态
- HUD 通过 signal 订阅武器/弹药变化——不轮询

## Decision

**WeaponSystem 作为射击 CD 和弹药管理的唯一权威——ShootingSystem 不做限速。每把武器独立追踪弹药/冷却/换弹状态。武器切换保留弹药状态（不自动装填）。**

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                     WeaponSystem (Autoload)                            │
│                                                                        │
│  配置加载 (_ready):                                                    │
│    weapons/weapon_config.json → _weapon_defs: Dictionary               │
│                                                                        │
│  运行时状态:                                                            │
│    _current_weapon_id: String        # 当前装备武器                     │
│    _weapon_states: Dictionary        # weapon_id → WeaponState         │
│                                                                        │
│    WeaponState:                                                        │
│      {                                                                 │
│        ammo: int,                    # 当前弹药                        │
│        state: String,               # READY | FIRING | RELOADING      │
│        last_fire_time: int,         # 上次射击时间戳 (msec)            │
│        reload_start_time: int       # 换弹开始时间戳 (msec)            │
│      }                                                                 │
│                                                                        │
│  fire_current(origin, target)  ←── PlayerController / EnemyAI          │
│    │                                                                   │
│    ├─ 1. _current_weapon_id 对应的 WeaponState 存在?                   │
│    ├─ 2. state == RELOADING? → IGNORE (换弹中不可射击)                 │
│    ├─ 3. ammo == 0? → _start_reload() → IGNORE                         │
│    ├─ 4. Time.get_ticks_msec() - last_fire_time < shoot_interval?     │
│    │      → IGNORE (CD 中)                                             │
│    ├─ 5. ShootingSystem.fire(origin, target, bullet_type, source)     │
│    ├─ 6. ammo -= 1 (仅当 magazine_size > 0)                            │
│    ├─ 7. last_fire_time = now                                          │
│    ├─ 8. emit ammo_changed(weapon_id, ammo, magazine_size)             │
│    └─ 9. if ammo == 0: _start_reload()                                 │
│                                                                        │
│  switch_weapon()                                                       │
│    ├─ 保存当前 WeaponState (ammo 不变——保留弹药状态)                   │
│    ├─ 若当前在 RELOADING: 取消 reload → 旧武器 ammo 不变               │
│    ├─ _current_weapon_id = 下一个武器 ID                              │
│    └─ emit weapon_changed(id, name, ammo, magazine_size)               │
│                                                                        │
│  _start_reload()                                                       │
│    ├─ state → RELOADING                                                │
│    ├─ reload_start_time = now                                          │
│    ├─ emit weapon_state_changed(weapon_id, "RELOADING")                │
│    └─ await reload_duration → ammo = magazine_size, state → READY     │
│                                                                        │
│  房间重置 (SceneManager.room_active signal):                           │
│    └─ 所有 WeaponState.ammo = magazine_size (满弹匣)                   │
└──────────────────────────────────────────────────────────────────────┘

调用链:
  PlayerController._on_shoot()
    → WeaponSystem.fire_current(gun_pos, aim_target)
      → [CD check] [ammo check]
      → ShootingSystem.fire(origin, target, "standard", "player")
        → PhysicsObjectPool.acquire_projectile()
        → bullet_fired signal
```

### Key Interfaces

```gdscript
# WeaponSystem Autoload (Core Layer)
extends Node

# ── 武器定义 ──

## 从 res://assets/data/weapons/weapon_config.json 加载
## {
##   "weapons": [
##     {
##       "weapon_id": "standard_rifle",
##       "weapon_name": "标准步枪",
##       "bullet_type": "standard",
##       "shoot_interval": 0.3,
##       "magazine_size": 20,
##       "reload_time": 1.5,
##       "unlock_condition": "default"
##     },
##     {
##       "weapon_id": "sticky_launcher",
##       "weapon_name": "粘弹发射器",
##       "bullet_type": "sticky",
##       "shoot_interval": 0.8,
##       "magazine_size": 3,
##       "reload_time": 2.0,
##       "unlock_condition": "default"
##     }
##   ]
## }

var _weapon_defs: Dictionary = {}       # weapon_id → weapon definition
var _weapon_order: Array[String] = []   # 武器切换顺序
var _current_index: int = 0
var _weapon_states: Dictionary = {}     # weapon_id → WeaponState

# ── Signals ──

## 武器切换
signal weapon_changed(weapon_id: String, weapon_name: String, ammo: int, magazine_size: int)

## 弹药变化
signal ammo_changed(weapon_id: String, ammo: int, magazine_size: int)

## 武器状态变化（供 HUD 显示换弹进度）
signal weapon_state_changed(weapon_id: String, state: String)

# ── 核心 API ──

## 射击入口——PlayerController 和 EnemyAI 调用
## 射击 CD 和弹药检查在此层完成——ShootingSystem 不做限速
func fire_current(origin: Vector2, target: Vector2, source_entity: String = "player") -> bool:
    var weapon_id := _weapon_order[_current_index]
    var defn: Dictionary = _weapon_defs[weapon_id]
    var state: Dictionary = _weapon_states[weapon_id]
    
    # CD 检查
    if state["state"] == "RELOADING":
        return false
    
    var now := Time.get_ticks_msec()
    var interval_ms := int(defn["shoot_interval"] * 1000)
    if now - state["last_fire_time"] < interval_ms:
        return false  # CD 中
    
    # 弹药检查
    var magazine := defn.get("magazine_size", 0) as int
    if magazine > 0 and state["ammo"] <= 0:
        _start_reload(weapon_id)
        return false
    
    # 委托射击
    var bullet := ShootingSystem.fire(origin, target, defn["bullet_type"], source_entity)
    if not bullet:
        return false  # pool 耗尽或其他错误
    
    # 更新状态
    if magazine > 0:
        state["ammo"] -= 1
    state["last_fire_time"] = now
    
    ammo_changed.emit(weapon_id, state["ammo"], magazine)
    
    if magazine > 0 and state["ammo"] <= 0:
        _start_reload(weapon_id)
    
    return true

## 切换武器——保留各武器独立弹药状态
func switch_weapon() -> void:
    # 取消当前换弹
    var old_id := _weapon_order[_current_index]
    var old_state: Dictionary = _weapon_states[old_id]
    if old_state["state"] == "RELOADING":
        old_state["state"] = "READY"  # 打断换弹——弹药不恢复
    
    # 切换到下一个
    _current_index = (_current_index + 1) % _weapon_order.size()
    var new_id := _weapon_order[_current_index]
    var new_defn: Dictionary = _weapon_defs[new_id]
    var new_state: Dictionary = _weapon_states[new_id]
    
    weapon_changed.emit(new_id, new_defn["weapon_name"],
        new_state["ammo"], new_defn.get("magazine_size", 0))

## 手动换弹
func reload() -> void:
    var weapon_id := _weapon_order[_current_index]
    var state: Dictionary = _weapon_states[weapon_id]
    if state["state"] == "RELOADING":
        return  # 已在换弹中
    var defn: Dictionary = _weapon_defs[weapon_id]
    if state["ammo"] >= defn.get("magazine_size", 0):
        return  # 弹匣已满
    _start_reload(weapon_id)

# ── 内部 ──

func _start_reload(weapon_id: String) -> void:
    var state: Dictionary = _weapon_states[weapon_id]
    state["state"] = "RELOADING"
    weapon_state_changed.emit(weapon_id, "RELOADING")
    
    var defn: Dictionary = _weapon_defs[weapon_id]
    var reload_time := defn.get("reload_time", 1.5) as float
    
    # Tween 延时——与 ADR-0007 的 lifetime timer 一致风格
    var tween := create_tween()
    tween.tween_interval(reload_time)
    tween.tween_callback(func():
        # 检查在此期间是否切换了武器
        if _weapon_order[_current_index] == weapon_id:
            state["ammo"] = defn.get("magazine_size", 0)
            state["state"] = "READY"
            ammo_changed.emit(weapon_id, state["ammo"], defn.get("magazine_size", 0))
            weapon_state_changed.emit(weapon_id, "READY")
        # 若已切换到其他武器——此武器 ammo 仍为 0，下次切回来时若 ammo=0 会再次触发 reload
    )

# ── 房间重置 ──

func _on_room_reset(_room_id: String) -> void:
    for weapon_id in _weapon_states:
        var defn: Dictionary = _weapon_defs[weapon_id]
        var state: Dictionary = _weapon_states[weapon_id]
        state["ammo"] = defn.get("magazine_size", 0)
        state["state"] = "READY"
        state["last_fire_time"] = 0
    
    # 通知 HUD 更新当前武器显示
    var current_id := _weapon_order[_current_index]
    var current_defn: Dictionary = _weapon_defs[current_id]
    var current_state: Dictionary = _weapon_states[current_id]
    weapon_changed.emit(current_id, current_defn["weapon_name"],
        current_state["ammo"], current_defn.get("magazine_size", 0))
```

### 武器状态机

```
         ┌──────────┐
    ┌───│  READY   │◄────── 换弹完成 / 切换武器开始 / 房间重置
    │   └────┬─────┘
    │        │ fire_current() 成功 → ammo -= 1
    │        ▼
    │   ┌──────────┐
    │   │  FIRING  │  CD 中 (shoot_interval ms)
    │   └────┬─────┘
    │        │ CD 到期 → READY
    │        │ ammo == 0 → RELOADING
    │        ▼
    │   ┌──────────┐
    │   │RELOADING │  reload_time 秒倒计时
    │   └────┬─────┘
    │        │ reload 完成 → ammo = magazine_size → READY
    │        │ switch_weapon() → 打断 → READY (ammo 不变)
    └────────┘
```

> **FIRING 不是持久状态**——它是瞬时的（fire_current 调用结束后立即进入 CD）。状态机中 FIRING 表示"CD 计时进行中"。对外表现为：在 shoot_interval 内再次调用 fire_current() → 返回 false。

### 武器切换时弹药状态保留

```
场景: 玩家使用 sticky_launcher（3 发弹匣），发射 2 发（剩余 1 发），切换到 standard_rifle

  sticky_launcher state:  ammo=1, state=READY    ← 保留！下次切回来 ammo 仍为 1
  standard_rifle state:   ammo=20, state=READY    ← 独立状态

场景: sticky_launcher 正在 RELOADING（剩余 0 发），玩家切换武器

  sticky_launcher state:  ammo=0, state=READY    ← 打断换弹，ammo 保持 0
  standard_rifle state:   ammo=20, state=READY
  → 下次切回 sticky_launcher: ammo=0 → fire_current() → 检测 ammo==0 → 自动 reload
```

> 设计理由: 保留弹药状态（而非切换时自动装填）让武器切换成为有意义的战术决策。玩家必须在"切回粘弹发射器并等待 2.0s 换弹"和"继续用标准步枪射击"之间选择。这实现了 Pillar 4（武器选择是战术决策，非数值堆砌）。

### 与 ADR-0007（ShootingSystem）的职责边界

| 职责 | WeaponSystem | ShootingSystem |
|------|-------------|---------------|
| **武器定义** (bullet_type, magazine, interval) | ✓ 拥有 | — |
| **射击 CD** (shoot_interval 限制) | ✓ 执行 | — 不感知 |
| **弹药追踪** (ammo, magazine_size) | ✓ 拥有 | — 不感知 |
| **换弹** (reload_time 倒计时) | ✓ 执行 | — |
| **子弹创建** (pool acquire, config, velocity) | — | ✓ 拥有 |
| **子弹飞行/碰撞** (_integrate_forces, CCD) | — | ✓ 拥有 |
| **hit-stop** | — | ✓ 执行 |
| **子弹回收** (release_projectile) | — | ✓ 拥有 |

关键设计决策: **ShootingSystem.fire() 可以被 EnemyAI 直接调用**——绕过武器 CD 和弹药限制。这意味着：
- 敌人射击走自己的射速逻辑（由 enemy-ai GDD 的 shoot_cooldown 控制）
- 敌人不需要弹药追踪
- WeaponSystem 的 CD 限制仅对玩家生效

### 武器配置格式

```json
// res://assets/data/weapons/weapon_config.json
{
  "weapons": [
    {
      "weapon_id": "standard_rifle",
      "weapon_name": "标准步枪",
      "bullet_type": "standard",
      "shoot_interval": 0.3,
      "magazine_size": 20,
      "reload_time": 1.5,
      "unlock_condition": "default"
    },
    {
      "weapon_id": "sticky_launcher",
      "weapon_name": "粘弹发射器",
      "bullet_type": "sticky",
      "shoot_interval": 0.8,
      "magazine_size": 3,
      "reload_time": 2.0,
      "unlock_condition": "default"
    }
  ],
  "weapon_order": ["standard_rifle", "sticky_launcher"]
}
```

Alpha 阶段扩展字段: `display_sprite`, `fire_sfx`, `reload_sfx`, `unlock_level`。

## Alternatives Considered

### Alternative A: ShootingSystem 统一管理射速

- **Description**: WeaponSystem 不追踪 CD——`fire_current` 直接调用 `ShootingSystem.fire()`，ShootingSystem 内部根据 `source_entity` 和 `bullet_type` 决定是否允许射击（全局 last_fire_time）。
- **Pros**: WeaponSystem 更薄——仅做武器切换和弹药追踪；射击逻辑集中在同一位置
- **Cons**: EnemyAI 射击也被玩家的 CD 限制——如果 EnemyAI 的射速 0.5s 而玩家 CD 0.3s，敌人会被玩家 CD 阻塞；ShootingSystem 需要理解武器概念（bullet_type → shoot_interval 映射）——职责膨胀
- **Rejection Reason**: WeaponSystem 的"门"和 ShootingSystem 的"路"应该分离。CD 是"门"——属于 WeaponSystem。ShootingSystem 需要保持简单：有调用就发射（只要池有容量）。

### Alternative B: 武器配置嵌入 bullet_config.json

- **Description**: 将武器定义和子弹属性合并到同一个 JSON 文件——`weapon_id` 直接引用 bullet type 的属性。不需要两个配置文件。
- **Pros**: 单一配置文件——减少加载和验证点；武器和子弹的属性自然对应
- **Cons**: bullet_config.json 被 ShootingSystem 消费——如果 WeaponSystem 也消费它，两个 Autoload 共享同一文件的解析逻辑。耦合了两个系统的配置加载；Alpha 阶段子弹类型可能被多把武器共享（如 "standard" bullet 被 3 把不同步枪使用）——合并配置会导致重复
- **Rejection Reason**: 武器和子弹是不同的概念——武器定义"射速/弹匣/换弹"，子弹定义"速度/质量/冲量"。分离配置使子弹属性可被多把武器复用（Alpha 的 3 把步枪共享同一 bullet_type="standard"），武器属性独立调优。

### Alternative C: 弹药为全局池而非按武器

- **Description**: 所有武器共享一个弹药池——"弹药"是通用资源（如 30 发"标准弹药"），不同武器消耗不同数量的弹药。类似 Doom Eternal 的弹药模型。
- **Pros**: 简化 HUD——显示一个弹药数而非每个武器一个；鼓励武器切换（因为弹药共享）
- **Cons**: MVP 只有 2 把武器——弹药独立更直观；粘弹发射器只有 3 发——如果和标准步枪共享弹药，玩家会困惑"为什么 20 发用完了粘弹也不能射"
- **Rejection Reason**: Pillar 3（规则稳定、可学习）要求玩家清楚理解每把武器的限制。独立弹药让玩家一目了然——"标准步枪 20 发、粘弹发射器 3 发"。共享弹药池增加了不必要的认知负担。

## Consequences

### Positive
- 射击 CD 和弹药在 WeaponSystem 层——ShootingSystem 保持简单，可被 EnemyAI 绕过 CD 调用
- 武器独立弹药状态——切换武器是有意义的战术决策（不是"切过去自动满弹匣"）
- 纯数据驱动——新增武器只需在 weapon_config.json 添加条目 + bullet_config.json 已有对应 bullet_type
- 换弹可被打断——玩家不需要等待换弹完成即可切换武器
- 房间重置干净——所有弹药恢复满状态，不需要追踪"弹匣中的子弹和备用弹药"的区分

### Negative
- 如果 Alpha 扩展到 8 把武器——`_weapon_states` Dictionary 增长但每个条目 <100 字节（总共 <1KB），可忽略
- 武器切换保留弹药状态的规则需要向玩家明确——HUD 的武器图标旁应显示弹药数
- reload 使用 Tween callback——与 ADR-0007 的 lifetime timer 模式一致但每个换弹创建一个 Tween。最坏情况：玩家反复触发 reload（在 0 发时）——需 de-duplicate（`_start_reload` 检查 state == RELOADING）

### Risks
- **快速切换武器导致 reload Tween 堆积**: 玩家在 RELOADING 期间频繁切换武器 → 每个 switch_weapon 打断 reload 但旧 Tween 未 kill。缓解：`_start_reload` 中存储 `_reload_tweens[weapon_id]`——switch_weapon 时 `tween.kill()`
- **黏弹发射器 ammo==0 且玩家切走后再切回来**: 此时自动触发 reload——但玩家可能忘记粘弹是空弹匣。缓解：HUD 的武器图标在 ammo==0 时闪烁红色——即使当前未装备该武器
- **武器切换顺序硬编码**: `_weapon_order` 来自 JSON——Alpha 阶段增加武器时需更新此数组。缓解：已设计为数据驱动——不需要代码修改
- **`fire_current` 被高频调用（按住射击按钮）**: PlayerController 的 `_process` 每帧调用 → WeaponSystem 的 CD 检查(<0.001ms) 快速拒绝。缓解：PlayerController 应使用 `Input.is_action_just_pressed` 而非每帧轮询（属于 PlayerController ADR 的范围）

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| weapon-system.md | §1 武器数据结构 (weapon_id/bullet_type/shoot_interval/magazine/reload) | weapon_config.json 完整定义 |
| weapon-system.md | §2 MVP 武器表: standard_rifle + sticky_launcher | JSON 配置中定义 2 把武器 + weapon_order |
| weapon-system.md | §3 武器切换——一次一把，无冷却 | switch_weapon() 切换 + 立即 READY |
| weapon-system.md | §4 射击委托: fire_current → ShootingSystem.fire | fire_current() 验证 CD/ammo → ShootingSystem.fire() |
| weapon-system.md | §5 解锁逻辑 (Alpha) | JSON 中 unlock_condition 字段预留 |
| weapon-system.md | AC1-AC2: standard_rifle → bullet_type="standard", sticky → "sticky" | bullet_type 从 weapon_config 读取 |
| weapon-system.md | AC3: shoot_interval 0.3s 内第二次调用被忽略 | CD 检查: now - last_fire_time < interval_ms → return false |
| weapon-system.md | AC4: sticky_launcher 3 发后第 4 发无效 | magazine_size=3 → ammo 0 → auto reload → fire 返回 false |
| weapon-system.md | AC5: 切换武器后新武器 READY | switch_weapon() 立即设置新武器为 READY |
| weapon-system.md | AC6: 所有武器属性从配置文件读取 | weapon_config.json 数据驱动 |
| shooting-projectile.md | §2-3 子弹属性 | 不在此 ADR 范围——由 bullet_config.json (ADR-0007) 管理 |
| player-controller.md | 射击输入 | 不在此 ADR 范围——PlayerController 负责输入 → 调用 fire_current |

## Performance Implications
- **CPU**: fire_current() 单次: CD 检查 + ammo 检查 + 委托 <0.005ms（纯数值比较 + Dictionary 查表）。CD 拒绝路径 <0.001ms
- **Memory**: _weapon_defs (2 条目) + _weapon_states (2 条目) <1KB。Alpha 8 武器 <4KB
- **Load Time**: weapon_config.json 加载 <1ms（2 武器 × ~200 字节）
- **Network**: N/A

## Migration Plan
本项目尚无代码——此为初始架构决策。实施步骤:
1. WeaponSystem Autoload 实现 fire_current()、switch_weapon()、reload()、_start_reload()
2. 创建 `assets/data/weapons/weapon_config.json`
3. `_ready()` 中加载 JSON + 初始化 _weapon_states + 连接 SceneManager.room_active
4. PlayerController 中实现武器切换输入 → WeaponSystem.switch_weapon()
5. HUD 连接 weapon_changed / ammo_changed / weapon_state_changed signals
6. 集成测试: fire_current → CD 阻塞 → ammo 递减 → 0 发 → auto reload → ammo 恢复
7. 武器切换测试: RELOADING 中途切换 → 旧武器打断 → 新武器 READY

## Validation Criteria
- standard_rifle fire_current() → ShootingSystem 收到 fire(bullet_type="standard", source_entity="player") (AC1)
- sticky_launcher fire_current() → ShootingSystem 收到 fire(bullet_type="sticky", source_entity="player") (AC2)
- 0.1s 内两次 fire_current()（standard_rifle, CD=0.3s）→ 第二次返回 false (AC3)
- sticky_launcher 连射 3 次 → 第 4 次返回 false（ammo=0, 进入 RELOADING）(AC4)
- 切换到 standard_rifle → weapon_changed signal 携带 ammo=20, 状态 READY (AC5)
- 所有武器属性从 weapon_config.json 读取 (AC6)
- 房间重置 → 所有武器 ammo 恢复 magazine_size
- RELOADING 中途切换武器 → 旧武器状态变为 READY（ammo 不变），新武器 READY
- 手动 reload（ammo 未满时）→ 正确进入 RELOADING → reload_time 后 ammo 恢复

## Related Decisions
- ADR-0001: Autoload + Direct Signal（WeaponSystem 作为 Autoload）
- ADR-0002: 场景加载策略（房间重置 → 弹药恢复满）
- ADR-0007: 子弹生命周期（fire_current → ShootingSystem.fire 委托）
- ADR-0009: 玩家控制器（射击输入 → fire_current 调用）
