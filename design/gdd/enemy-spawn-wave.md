# 敌人生成与波次管理系统 (Enemy Spawn & Wave)

> **Status**: In Design
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-22
> **Implements Pillar**: Pillar 2（战场是多米诺阵列——敌人在物理要素周围布局）+ Pillar 4（通关靠脑子——波次设计创造战术决策而非反应测试）

## Overview

敌人生成与波次管理系统是战斗节奏的控制层——它决定敌人**何时、以何种方式**进入战斗房间。在 MVP 最简单形态下，它读取关卡设计数据中的 `enemies[]` 数组，按 `spawn_pos` 逐一实例化，赋予 enemy-ai 定义的原型属性。在 Alpha 阶段扩展为波次模式后，它按时间或条件分批释放敌人，在同一个房间内创造**逐步升级的张力曲线**——早期波次让玩家熟悉房间物理布局，中期波次迫使玩家利用前几波造成的碎片废墟，后期波次将多种原型混合投放以验证玩家对物理系统的全面掌握。

从架构视角看，这个系统是静态房间数据（level-design-data）和动态战斗体验（enemy-ai）之间的桥梁——它不定义"敌人怎么打"（那是 enemy-ai 的职责），也不定义"房间里有什么敌人"（那是 level-design-data 的职责），而是决定"敌人以什么节奏出现在玩家面前"。没有它，战斗房间要么空无一物，要么瞬间塞满所有敌人——没有节奏、没有递进、没有"又来了一波"的紧张时刻。

## Player Fantasy

在坍塌禁区中，敌人出现的方式本身就是一种**可读的战场信息**。玩家走进一个房间时看到的不是"所有敌人已经在等我了"——而是"第一批敌人来了，我知道它们是什么类型，我能在它们之间找到连锁路径"。当第一批敌人被清除、房间暂时安静的那 2-3 秒里，玩家不是在等待——是在**阅读刚被破坏的战场**：刚才炸碎的柱子现在是一堆碎片，敌人的尸体还在滑落，新的可交互物理要素已经暴露出来。然后下一波敌人从这些废墟中出现——玩家不是"又刷怪了"，而是"正好，我上一波砸出的碎片可以用来对付这一波"。

这个系统的幻想锚定在**节奏的可预测性**：波次之间的间隙不是死时间，是物理战场的"阅读窗口"。好的波次设计让每波敌人都是上一波物理后果的**利用者**——新出现的敌人站在刚被破坏的结构旁边、巡逻路径穿过刚被炸出的碎片区、射击位置正好在刚暴露的连锁要素附近。

**参考**: Dead Cells 中敌人位置的手工感——每次遭遇都像被设计过的战术谜题而非随机事件；Hotline Miami 中清晰的分波节奏让玩家在每波前有"计划窗口"；魂斗罗中同一关卡内敌人种类的逐步升级让每种新敌人出场都像一次"教学升级"。

**不应像**: 无尽肉鸽的刷怪逻辑——敌人从屏幕边缘随机涌入、靠数量压制。坍塌禁区的每一波都是关卡设计师提出的一个**物理问题**。

## Detailed Design

### Core Rules

**1. MVP 生成模式：房间加载时一次性批量生成**

MVP 不做波次系统。所有敌人在房间加载时一次性实例化——但通过 `spawn_stagger` 延迟逐个出场，避免"瞬间全部出现"的生硬感。

流程：
1. scene-manager 调用 `spawn_room_enemies(room_id)`
2. 系统从 level-design-data 读取当前房间的 `enemies[]` 数组
3. 按 `enemies[].id` 排序（或自定义 `spawn_order` 字段），生成有序队列
4. 每 `spawn_stagger_seconds`（默认 0.3s）从队列中取出一个敌人实例化
5. 实例化：加载原型 `.tscn` → 设置 position = `spawn_pos` → 设置 `face_right` / `initial_state` → 播放入场动画 → 激活 AI
6. 队列清空后，发出 `all_enemies_spawned(room_id)` signal 给 scene-manager

**2. 敌人实例化规则**

| 步骤 | 操作 | 数据来源 |
|------|------|---------|
| 1 | 加载原型场景 | `archetype` → `res://scenes/enemies/{archetype}.tscn` |
| 2 | 设置初始位置 | `spawn_pos` |
| 3 | 设置朝向 | `face_right`（默认 true） |
| 4 | 设置初始 AI 状态 | `initial_state`（`idle` / `patrol`） |
| 5 | 设置巡逻路径 | `patrol_path`（仅 `initial_state=patrol` 时有效） |
| 6 | 设置组 ID | `group_id`（用于士兵协同射击） |
| 7 | 初始化 HP/dtc/speed | 从 enemy-ai.md 原型表读取默认值 |
| 8 | 播放入场动画 | 统一 0.3s 闪烁出现（Alpha 可做原型差异化入场） |
| 9 | 激活 AI | 调用 `enemy_ai.activate()` → 进入 IDLE 或 PATROL |

**3. 敌人原型场景映射**

| archetype | 场景路径 | Body 类型 |
|-----------|---------|----------|
| `scout` | `res://scenes/enemies/scout.tscn` | CharacterBody2D |
| `soldier` | `res://scenes/enemies/soldier.tscn` | CharacterBody2D |
| `heavy` | `res://scenes/enemies/heavy.tscn` | CharacterBody2D |
| `carrier` | `res://scenes/enemies/carrier.tscn` | RigidBody2D |

**4. Boss 房间独立路径**

Boss 房间（`room_type="boss"`）的 `enemies[]` 为空。Boss 生成不经过本系统的 `spawn_room_enemies()`——由 enemy-spawn-wave 暴露的 `activate_boss(boss_id, room_config)` 接口直接调用 boss-ai 的初始化流程。

MVP 时 `activate_boss()` 简单转发到 boss-ai：
```
activate_boss(boss_id, room_config):
    boss = load("res://scenes/bosses/" + boss_id + ".tscn").instantiate()
    boss.configure(room_config)  # anchor_points, body_parts, etc.
    get_tree().current_scene.add_child(boss)
    return boss
```

**5. Alpha 波次系统扩展（本节仅定义接口占位）**

Alpha 阶段将引入波次定义文件 `assets/data/waves/{room_id}_waves.json`，每波定义触发条件和敌人组合。MVP 不使用，但 spawn 接口预留 `wave_index` 参数。

### States and Transitions

| 状态 | 含义 | 触发条件 |
|------|------|---------|
| **IDLE** | 无生成进行中 | 系统初始化后 / 房间未激活 |
| **SPAWNING** | 正在逐个生成敌人（stagger 循环中） | scene-manager 调用 `spawn_room_enemies(room_id)` |
| **ACTIVE** | 所有敌人已生成并激活 | stagger 队列清空 → `all_enemies_spawned` 发出 |
| **CLEARED** | 房间内所有敌人死亡 | 最后一个敌人 `entity_died` → `room_cleared` 发出 |
| **BOSS_SPAWNING** | Boss 生成序列进行中 | `activate_boss()` 调用 |
| **BOSS_ACTIVE** | Boss 已激活并战斗中 | Boss 入场动画结束 → `boss_spawned` 发出 |

### Interactions with Other Systems

| 系统 | 方向 | 数据流 |
|------|------|--------|
| **scene-manager** | 上游 | 接收 `spawn_room_enemies(room_id)` 调用；发出 `all_enemies_spawned(room_id)` / `room_cleared(room_id)` |
| **level-design-data** | 上游 | 读取 `enemies[]`、`room_type`、各敌人配置字段 |
| **enemy-ai** | 下游 | 实例化敌人原型、设置 AI 初始状态、激活 AI |
| **boss-ai** | 下游 | 通过 `activate_boss()` 初始化 Boss（独立路径） |
| **health-damage** | 下游 | 订阅 `entity_died` 以追踪房间清空状态 |
| **HUD** | 下游 | 发出 `wave_info_changed`（Alpha 波次提示）、`room_cleared`（清空提示） |

## Formulas

### 1. 生成交错延迟 (Spawn Stagger)

```
spawn_time[i] = room_load_time + i × spawn_stagger_seconds
```

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 敌人队列位置 | `i` | int | 0–N-1 | N = `enemies[]` 数组长度 |
| 交错间隔 | `spawn_stagger_seconds` | float | 0.1–1.0 | 默认 0.3s，可在 Tuning Knobs 中调整 |
| 生成时间 | `spawn_time[i]` | float | 0–5.0s | 第 i 个敌人自 `room_load_time` 起的生成时间 |

**示例**: 5 个敌人，stagger=0.3s → 总生成时长 = 4×0.3 = 1.2s。最后一个敌人在房间加载后 1.2s 激活。

### 2. 房间清空检测 (Room Clear Detection)

```
room_cleared = (active_enemy_count == 0) AND (spawn_queue.empty()) AND (state == ACTIVE or BOSS_ACTIVE)
```

| 变量 | 符号 | 类型 | 说明 |
|------|------|------|------|
| 活跃敌人计数 | `active_enemy_count` | int | 当前房间中 HP > 0 的敌人数量 |
| 生成队列状态 | `spawn_queue.empty()` | bool | stagger 队列是否已全部生成完毕 |
| 当前状态 | `state` | enum | 仅在 ACTIVE/BOSS_ACTIVE 状态下才检测清空 |

**输出**: `true` 时发射 `room_cleared(room_id)` signal → scene-manager 处理通关过渡。

### 3. 原型场景路径解析 (Archetype Scene Path Resolution)

```
scene_path = "res://scenes/enemies/" + archetype + ".tscn"
```

| 变量 | 符号 | 类型 | 说明 |
|------|------|------|------|
| 敌人原型 | `archetype` | string | `scout` / `soldier` / `heavy` / `carrier` |
| 场景路径 | `scene_path` | string | Godot .tscn 资源路径 |

**验证**: `ResourceLoader.exists(scene_path)` → false 时报错 `"enemy scene not found: [path]"`，跳过该敌人，继续生成下一个。

## Edge Cases

- **`enemies[]` 为空数组**: 房间无敌人——直接标记为 CLEARED，`room_cleared` 在 `all_enemies_spawned` 后立即发出。适用于纯物理谜题房间或过渡区域。

- **原型场景文件不存在**: `ResourceLoader.exists()` 返回 false → 报错 `"enemy scene not found: res://scenes/enemies/[archetype].tscn"`，**跳过该敌人**继续生成下一个。不阻止房间加载——一个缺失的敌人原型不应让整个房间不可玩。

- **`spawn_pos` 落在 NavigationPolygon 外**: 生成前调用 `NavigationServer2D.map_get_closest_point()` 将位置吸附到最近可导航点。此行为与 level-design-data.md Edge Cases 一致——敌人不会被生成在不可达位置。

- **同一帧多个敌人死亡导致 `active_enemy_count` 归零**: 连锁爆炸可能在单帧内清空所有敌人。`entity_died` signal 逐个到达 → 每次更新计数 → 最后一个触发 `room_cleared`。如果在 SPAWNING 状态下达到零（stagger 尚未完成）→ **不触发 `room_cleared`**，等待 `all_enemies_spawned` 后再检测。

- **房间重置时 `one_shot=true` 敌人生成**: level-design-data 中的 `one_shot` 字段仅适用于 `physics_objects[]`，不适用于 `enemies[]`。所有敌人在房间重置时正常重生——不存在"一次性敌人"。

- **场景加载中断（玩家在 SPAWNING 期间死亡）**: 中断 stagger 循环——未生成的敌人取消。已生成的敌人由 scene-manager 的 reset 流程清理。

- **Boss 房间的 `enemies[]` 不为空**: MVP 中 Boss 房间 `enemies[]` 应为空——如果数据意外包含敌人条目 → 报 warning `"boss room [id] has non-empty enemies[] — ignoring"`，跳过敌人生成，仅走 `activate_boss()` 路径。

- **`activate_boss()` 在非 Boss 房间被调用**: 报错 `"activate_boss called for non-boss room [id]"`，返回 null，不崩溃。

- **`spawn_stagger_seconds` 设为 0**: 所有敌人在同一帧生成——合法但视觉上"瞬间全出"。建议最小值 0.05s。

- **同一房间被连续两次调用 `spawn_room_enemies()`**: 第二次调用时如果状态非 IDLE → 报 warning `"room [id] already spawning"`，忽略重复请求。

## Dependencies

| 系统 | 方向 | 性质 | 数据接口 |
|------|------|------|----------|
| **scene-manager** | 上游 | 硬依赖 | 接收 `spawn_room_enemies(room_id)` 调用；发出 `all_enemies_spawned(room_id)` → 场景管理器确认房间可玩；发出 `room_cleared(room_id)` → 场景管理器触发通关过渡 |
| **level-design-data** | 上游 | 硬依赖 | 读取 `room_type`（判断 combat/boss）、`enemies[]` 数组（archetype、spawn_pos、face_right、initial_state、patrol_path、group_id） |
| **enemy-ai** | 下游 | 硬依赖 | 实例化敌人原型场景、设置初始 AI 状态（IDLE/PATROL）、传递 patrol_path 和 group_id、调用 `activate()` 激活 AI |
| **boss-ai** | 下游 | 硬依赖 | 通过 `activate_boss(boss_id, room_config)` 接口转发 Boss 初始化——读取房间配置中的 `boss_archetype`、`anchor_points[]`、`body_parts[]`、`room_center`、`trigger_zone` |
| **health-damage** | 下游 | 软依赖 | 订阅 `entity_died(entity_id)` signal——追踪 `active_enemy_count`，检测房间清空条件 |
| **HUD** | 下游 | 软依赖 | 发出 `room_cleared(room_id)` → HUD 显示通关提示；Alpha 阶段发出 `wave_info_changed(wave_index, total_waves)` |
| **physics-config** | 间接 | — | 不直接依赖——通过 enemy-ai 的 CharacterBody2D/RigidBody2D 实例化间接使用碰撞层配置 |

**交叉验证**:
- level-design-data.md 将本系统列为下游软依赖（"读取 enemies[] 作为初始波次模板"）✓
- enemy-ai.md 将本系统列为上游硬依赖（"接收激活/停用信号、出生位置和初始面向方向"）✓
- boss-ai.md 将本系统列为下游硬依赖（"`activate_boss(boss_id, room_config)`"）✓
- scene-manager.md 将本系统列为下游软依赖（"场景加载后触发生成"）✓

## Tuning Knobs

### MVP 参数

| 参数 | 默认值 | 安全范围 | 说明 | 过高后果 | 过低后果 |
|------|--------|----------|------|---------|---------|
| `spawn_stagger_seconds` | 0.3 | 0.05–1.0 | 每个敌人之间的生成延迟（秒） | 生成太慢——玩家等敌人出场 | 瞬间全出——无入场节奏感 |
| `spawn_anim_duration` | 0.3 | 0.1–0.5 | 敌人入场动画时长（秒）——闪烁/落下 | 入场拖沓 | 太快——玩家没注意到新敌人出现 |
| `max_active_enemies` | 15 | 5–30 | 同一房间内最大同时活跃敌人数（超出时新敌人排队等待）——对应 enemy-ai AC34 的性能预算（15 敌人 ≤ 2ms AI 帧时间） | 移动端帧率崩溃 | 房间太空——战斗压力不足 |

### Alpha 预留参数（MVP 不使用，接口预留）

| 参数 | 默认值 | 安全范围 | 说明 |
|------|--------|----------|------|
| `wave_count` | 3 | 1–8 | 每个房间的波次数 |
| `wave_trigger` | `"clear"` | `"clear"` / `"time"` / `"hp_percent"` | 波次触发条件 |
| `inter_wave_delay` | 3.0 | 1.0–8.0 | 波间喘息时间（秒） |

## Visual/Audio Requirements

| 事件 | 视觉 | 音频 | 优先级 |
|------|------|------|--------|
| 敌人生成（入场） | 0.3s 闪烁出现（Alpha 可做原型差异化：Scout 快速跳入 / Heavy 地面升起 / Carrier 天花板坠落） | 短促生成音（原型差异化变体） | MVP |
| Boss 入场 (INTRO) | 由 boss-ai 管理——碎片聚合动画 2.0s | 由 boss-ai 管理 | MVP |
| 房间清空 | 无特殊 VFX——由 HUD 显示通关提示 | 清空提示音（短促胜利音） | Alpha |

> 本系统为数据调度层——主要视觉/音频事件在 enemy-ai（敌人行为）和 boss-ai（Boss 演出）中定义。此处仅列出生成和清空两个专属事件。

## UI Requirements

本系统不直接渲染玩家可见 UI。以下信息通过 signal 传递给 HUD 系统：

| Signal | HUD 响应 | 优先级 |
|--------|---------|--------|
| `room_cleared(room_id)` | HUD 显示"Room Clear" 或通关提示 | Alpha |
| `wave_info_changed(wave_index, total_waves)` | HUD 显示 "Wave 2/3"（Alpha 波次模式） | Alpha |
| `boss_spawned(boss_id)` | HUD 显示 Boss HP 条和名称 | MVP |

## Acceptance Criteria

### A. 生成流程

- **AC1**: GIVEN 房间 `enemies[]` 包含 3 个敌人（scout/soldier/heavy），WHEN scene-manager 调用 `spawn_room_enemies(room_id)`，THEN 系统按 stagger=0.3s 依次生成 3 个敌人——分别出现在各自 `spawn_pos`、携带正确的 archetype 属性、入场动画播完后激活 AI。总耗时 ≈ 0.6s（3 个敌人 = 2×0.3s 间隔）。

- **AC2**: GIVEN 房间 `enemies[]` 为空数组，WHEN `spawn_room_enemies(room_id)` 调用，THEN `all_enemies_spawned` 立即发出（0 延迟），随后 `room_cleared` 发出。从调用到 CLEARED ≤ 1 帧。

- **AC3**: GIVEN `enemies[]` 中一个 enemy 的 `archetype="scout"`，WHEN 该敌人被实例化，THEN 其 HP=200、dtc=1.0、move_speed=350、body_type=CharacterBody2D——与 enemy-ai.md 定义的 Scout 原型值一致。其他 3 种原型同理。

### B. Boss 路径

- **AC4**: GIVEN `room_type="boss"` 且房间配置包含有效 `boss_archetype="ruin_colossus"`，WHEN `activate_boss(boss_id, room_config)` 调用，THEN Boss 实例化 → `configure(room_config)` 被调用（anchor_points、body_parts 等传入）→ Boss 进入 INTRO 状态 → `boss_spawned` signal 发出。

- **AC5**: GIVEN `room_type="combat"`（非 Boss 房间），WHEN `activate_boss()` 被错误调用，THEN 报错 `"activate_boss called for non-boss room"`，返回 null，系统状态不变。

### C. 房间清空

- **AC6**: GIVEN 3 个敌人已生成且全部 HP=0，WHEN 最后一个敌人 `entity_died` signal 到达，THEN `active_enemy_count` 减至 0 → `room_cleared(room_id)` signal 发出。

- **AC7**: GIVEN stagger 循环仍在进行中（已生成 2/5 个敌人），WHEN 已生成的 2 个敌人被瞬间击杀（active_enemy_count=0），THEN **不触发** `room_cleared`——等待剩余 3 个敌人完成生成后再检测。

### D. 边界情况

- **AC8**: GIVEN `enemies[]` 包含 `archetype="scout"` 但 `res://scenes/enemies/scout.tscn` 不存在，WHEN 系统尝试实例化该敌人，THEN 报错 `"enemy scene not found"`，**跳过该条目**，继续生成下一个敌人，不阻止房间加载。

- **AC9**: GIVEN 敌人 `spawn_pos` = (100, 100) 但该位置在 NavigationPolygon 外且最近可导航点为 (150, 200)，WHEN 该敌人被生成，THEN 位置被吸附至 (150, 200)。

- **AC10**: GIVEN 系统处于 SPAWNING 状态（stagger 循环进行中），WHEN 第二个 `spawn_room_enemies()` 调用到达，THEN 报 warning `"room already spawning"`，忽略重复请求。

### E. 性能

- **AC11**: GIVEN `spawn_stagger_seconds=0.3`，WHEN 生成 5 个敌人，THEN 实际 stagger 间隔偏差 ≤ 0.05s（±1 帧 @60fps）。

- **AC12**: GIVEN 单个房间 `max_active_enemies=15`，WHEN `spawn_room_enemies()` 完成，THEN 生成 + 实例化 + AI 激活的总耗时 ≤ 5.0s（15×0.3s stagger + 入场动画）。单个敌人实例化耗时 ≤ 50ms。

## Open Questions

| # | 问题 | 负责人 | 目标日期 | 影响 |
|---|------|--------|---------|------|
| 1 | MVP 3 房间中 `enemies[]` 最多 10 个敌人——stagger=0.3s 意味着最后敌人在 2.7s 后才出现。这个等待时间是否过长？是否需要按房间敌人数量调整 stagger？ | game-designer | MVP 前 | 影响玩家进入房间后的初始体验——等太久会破坏节奏 |
| 2 | 敌人入场动画形式——统一 0.3s 闪烁出现，还是按原型差异化（Scout 快速跳入、Heavy 从地面升起、Carrier 从天花板坠落）？ | art-director | Alpha 前 | MVP 统一闪烁足够；Alpha 差异化增强原型识别 |
| 3 | Alpha 波次系统的数据格式——独立 `waves/{room_id}_waves.json` 还是嵌入 `rooms/{room_id}.json` 的扩展字段？ | game-designer | Alpha 前 | 影响关卡数据的结构设计和编辑器工具 |
| 4 | Boss 房间在 Alpha 阶段是否允许有杂兵（杂兵 + Boss 同时在场）？当前设计假设 MVP Boss 战无杂兵 | game-designer | Alpha 前 | 如果 Alpha 加杂兵，`activate_boss()` 接口需要支持与 `spawn_room_enemies()` 共存 |
| 5 | 房间清空后是否需要"喘息窗口"（如 1.5s 冻结 + 文字提示），还是立即触发场景过渡？ | game-designer | MVP 前 | 影响通关节奏——太快可能让玩家来不及感受成果 |
