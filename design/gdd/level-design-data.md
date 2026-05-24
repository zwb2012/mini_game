# 关卡设计数据系统 (Level Design Data)

> **Status**: In Design (Revised after /design-review — 2026-05-22)
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-22
> **Implements Pillar**: Pillar 2（战场是多米诺阵列）—— 关卡数据定义每个房间的物理谜题布局

## Overview

关卡设计数据系统是"物理谜题房间"的数据定义层——它不渲染画面、不执行逻辑，而是定义每个战斗房间里**有什么、在哪里、怎么配置**。一套房间数据包含：敌人出生点与巡逻路径、物理要素（爆炸桶/悬挂物/可破坏墙/酸液池）的位置与类型、导航网格引用、摄像机边界和连锁传播的初始条件。scene-manager 按 room_id 加载数据并实例化房间，enemy-ai 从中读取导航和巡逻信息，chain-propagation 从中获取物理要素的初始配置。

从设计视角看，这个系统是 **Pillar 2 的数据化身**：每一个"多米诺骨牌阵列"的布局——哪个爆炸桶放在哪个敌人旁边、哪根柱子支撑着悬空平台——都在关卡数据中定义。关卡设计师通过配置这个系统的数据来"出题"，玩家通过理解物理规则来"解题"。MVP 阶段数据格式为 JSON（可被 Godot .tres Resource 替代），每房间一个数据文件，手工编写以精确控制物理谜题质量。

## Player Fantasy

玩家不会直接感知关卡设计数据系统——但他们能感知**好的关卡数据**：走进新房间，0.5 秒就能识别"那个油桶在那个敌人旁边"、"那根柱子支撑着平台"、"巡逻路径会让敌人经过酸液池上方"。关卡数据的质量直接决定 Pillar 2 的兑现——物理要素的位置如果"刚好在让你想到连锁的地方"，玩家感受到的不是设计师放了东西，而是**"我发现了这条连锁路径"**。

这个系统的幻想锚定在**"可读性"**：一套好的关卡数据让房间像精心布置的多米诺阵列——无需教程，物理要素的空间关系本身就在无声地说"打这里"。

## Detailed Rules

### Core Rules

**1. 数据格式与存储**

MVP 使用 JSON 格式——人类可读写、git-diff 友好、Godot 通过 `JSON.parse_string()` 原生解析。每房间一个 `.json` 文件，存放于 `assets/data/rooms/`，由 scene-manager 按 `room_id` 加载。Alpha 阶段可迁移至 Godot `.tres` Resource 格式以支持可视化编辑器。

**2. 房间数据结构**

```json
{
  "room_id": "room_01",
  "room_type": "combat",
  "scene_path": "res://scenes/rooms/room_01.tscn",
  "display_name": "第一关 — 引爆教学",
  "camera_bounds": { "left": 0, "right": 1920, "top": 0, "bottom": 1080 },
  "navigation": {
    "polygon_path": "res://assets/navigation/room_01_nav.tres"
  },
  "enemies": [
    {
      "id": "enemy_01",
      "archetype": "scout",
      "spawn_pos": { "x": 400, "y": 500 },
      "face_right": false,
      "initial_state": "idle",
      "patrol_path": [
        { "x": 300, "y": 500 },
        { "x": 600, "y": 500 }
      ],
      "group_id": null
    }
  ],
  "physics_objects": [
    {
      "id": "obj_01",
      "type": "explosive_barrel",
      "position": { "x": 800, "y": 480 },
      "material": "metal",
      "one_shot": true
    }
  ],
  "room_transitions": {
    "entry": { "x": 100, "y": 500 },
    "exit": { "x": 1820, "y": 500 }
  }
}
```

**3. 字段规范**

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `room_id` | string | ✓ | 唯一标识——scene-manager 按此加载/重置房间 |
| `room_type` | enum | ✓ | `combat` / `boss` / `transition`——决定加载逻辑和 schema 校验规则 |
| `scene_path` | string | ✓ | Godot `.tscn` 场景文件路径（包含 World 层地形和背景） |
| `display_name` | string | — | 调试/编辑器用名称，运行时不可见 |
| `camera_bounds` | rect | ✓ | 摄像机限制范围（px）——left/right/top/bottom |
| `navigation.polygon_path` | string | ✓ | 预烘焙 NavigationRegion2D `.tres` 资源路径 |
| `enemies[]` | array | — | 房间内敌人列表——空数组 = 无敌人 |
| `physics_objects[]` | array | ✓ | 连锁物理要素列表——Pillar 2 要求 ≥2 种要素 |
| `room_transitions.entry` | vec2 | ✓ | 玩家进入房间的初始位置 |
| `room_transitions.exit` | vec2 | ✓ | 清空房间后玩家前往下一房间的出口位置 |

**4. 敌人配置字段**（`enemies[]` 中每个元素）

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | ✓ | 房间内唯一标识 |
| `archetype` | enum | ✓ | `scout` / `soldier` / `heavy` / `carrier`——必须匹配 enemy-ai.md 定义的 4 种原型 |
| `spawn_pos` | vec2 | ✓ | 出生位置 |
| `face_right` | bool | — | 初始面向方向，默认 true |
| `initial_state` | enum | — | `idle`（默认）/ `patrol`——enemy-ai 据此设置初始 AI 状态 |
| `patrol_path` | vec2[] | — | 巡逻路径点数组——仅 `initial_state=patrol` 时有效 |
| `group_id` | string/null | — | 同组敌人 ID——同一 group_id 的士兵共享射击协调（enemy-ai §4 射击协调） |

**5. 物理要素配置字段**（`physics_objects[]` 中每个元素）

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | ✓ | 房间内唯一标识 |
| `type` | enum | ✓ | 物理要素类型（见 §6 枚举表） |
| `position` | vec2 | ✓ | 初始位置 |
| `material` | enum | ✓ | 关联材质——`wood` / `metal` / `concrete` / `composite`——对应 material-destruction.md 定义的五种材质中除 `organic`（仅用于敌人身体）外的四种物理材质 |
| `one_shot` | bool | — | 默认 false——若 true，破坏后不重生（房间重置时此物体不恢复） |

**6. 物理要素类型枚举**（MVP 5 种）

| type | 说明 | 推荐材质 | 战术角色 |
|------|------|---------|---------|
| `explosive_barrel` | 橙色爆炸桶——冲击力 ≥ 阈值引爆，AOE 150px | metal | 连锁引爆起点 |
| `hanging_object` | 悬挂物——射断吊索后向重力方向坠落，砸碎下方物体 | concrete/wood | 垂直破坏源 |
| `destructible_wall` | 可破坏墙/地板——碎片沿倒塌方向飞散 | concrete | 改变地形/开辟新路径 |
| `acid_pool` | 酸液池——腐蚀落入的 RigidBody2D（destroy on contact） | — | 永久消除威胁 |
| `unstable_structure` | 裂缝结构——冲击力 ≥ 阈值即整体倒塌，产生大量碎片 | concrete | 大范围碎片杀伤 |

Pillar 2 硬约束：每个房间 `physics_objects[]` 数组必须包含 **≥2 种不同类型**的物理要素，确保至少存在一条连锁路径。

**7. Boss 房间扩展字段**（`room_type="boss"` 时生效）

Boss 房间 JSON 复用通用房间结构，并在顶层增加以下扩展字段。Schema 由 boss-ai.md §"临时假设（关卡设计数据系统未设计）"定义，此处正式纳入：

| 扩展字段 | 类型 | 必需 | 说明 |
|---------|------|------|------|
| `boss_archetype` | string | ✓ | Boss 原型 ID——MVP 阶段为 `"ruin_colossus"` |
| `anchor_points[]` | array | ✓ | Boss 移动锚点序列——每房间推荐 5–8 个锚点（schema 见下表） |
| `body_parts[]` | array | ✓ | Boss 身体部件初始配置（位置、朝向、初始 HP 覆盖） |
| `room_center` | vec2 | ✓ | 房间中心安全坐标——所有锚点不可用时 Boss 回退至此 |
| `trigger_zone` | rect | ✓ | Boss 激活区域边界——玩家进入后触发 INTRO |

**`anchor_points[]` 元素 schema**（由 boss-ai.md 定义，此处为数据实现参考）：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | ✓ | 锚点唯一标识 |
| `position` | vec2 | ✓ | 锚点世界坐标 |
| `wait_duration` | float | ✓ | 到达后停留时间（秒），0=立即前往下一锚点 |
| `next_anchor_id` | string | ✓ | 下一锚点 ID（支持分支路径） |
| `facing_direction` | vec2 | — | Boss 在该锚点的朝向，默认 `(1,0)`（正右） |
| `phase_mask` | int | ✓ | `1`=仅 Phase 1, `2`=仅 Phase 2, `3`=全部 Phase |
| `allowed_attacks` | string[] | — | 该锚点可执行的攻击 ID 列表，空=全部可用 |
| `trigger_condition` | string | ✓ | `"immediate"` / `"cooldown_complete"` / `"player_in_zone"` |

**`body_parts[]` 元素 schema**：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `part_id` | string | ✓ | 部件标识——`"left_leg"` / `"right_leg"` / `"left_arm"` / `"right_arm"` / `"core"` |
| `position` | vec2 | ✓ | 部件初始世界坐标 |
| `hp_override` | float | — | 覆盖默认部件 HP 份额——不填则使用 boss-ai.md 默认值 |
| `facing_offset` | vec2 | — | 相对于 Boss 根节点的朝向偏移 |

Boss 房间 JSON 完整示例见附录 A。

### States and Transitions

关卡数据本身无运行时状态。房间实例的状态由 scene-manager 管理，本系统仅定义**数据生命周期**：

| 阶段 | 触发者 | 操作 |
|------|--------|------|
| **LOAD** | scene-manager | 按 `room_id` 读取 JSON → 解析 → 实例化 enemies + physics_objects → 应用 camera_bounds → 加载 navigation polygon |
| **RESET** | scene-manager（玩家死亡后） | 重新读取同一 JSON → 销毁当前房间实例 → 重新实例化（所有 `one_shot=false` 的物体恢复） |
| **UNLOAD** | scene-manager（房间通关后） | 销毁所有实例 → 释放数据缓存 |

### Interactions with Other Systems

| 系统 | 方向 | 数据流 |
|------|------|--------|
| **scene-manager** | 下游 | 读取 `room_id` → 获取 `scene_path`、`camera_bounds`、`room_transitions`；触发 LOAD/RESET/UNLOAD |
| **enemy-ai** | 下游 | 读取 `enemies[]` → 初始化敌人 Archetype、`spawn_pos`、`initial_state`、`patrol_path`、`group_id` |
| **material-destruction** | 下游 | 读取 `physics_objects[].material` → 为每个物理要素设置破坏阈值、倒塌方向、碎片参数 |
| **chain-propagation** | 下游 | 读取 `physics_objects[]` 完整列表 → 初始化连锁图中的节点及其空间关系 |
| **enemy-spawn-wave**（未来） | 下游 | 读取 `enemies[]` 作为初始波次；后续波次由 enemy-spawn-wave 自行管理 |
| **boss-ai** | 下游 | Boss 房间数据包含额外字段：Boss `archetype`、身体部件配置、阶段触发条件——结构见 boss-ai.md |

## Formulas

本系统为数据定义层，无可计算运行时公式。以下为设计阶段验证约束：

### 1. Pillar 2 物理要素约束

```
physics_types_in_room = count_distinct(physics_objects[].type)
VALID: physics_types_in_room ≥ 2
```

每个房间的 `physics_objects[]` 至少包含 2 种不同类型。若违反，数据加载时报错并拒绝启动房间。

### 2. 原型存在性约束

```
for each enemy in enemies[]:
    VALID: enemy.archetype ∈ {"scout", "soldier", "heavy", "carrier"}
```

引用的敌人原型必须存在于 enemy-ai.md 定义的 4 种原型中。

### 3. 材质存在性约束

```
for each obj in physics_objects[]:
    VALID: obj.material ∈ {"wood", "metal", "concrete", "composite"}
```

引用的材质必须为 material-destruction.md 定义的五种材质中的四种物理材质（`wood`/`metal`/`concrete`/`composite`）。`organic` 仅用于敌人身体，不在 `physics_objects` 中使用。

## Edge Cases

- **`physics_objects[]` 为空或仅 1 种类型**: 违反 Pillar 2 约束——数据加载时验证，报错 `"room [id]: Pillar 2 violation — need ≥2 physics object types, got [N]"`，拒绝启动房间。
- **敌人 `spawn_pos` 落在 NavigationPolygon 外**: 加载时调用 `NavigationServer2D.map_get_closest_point()` 将出生点吸附到最近可导航位置。如果无导航区域可达→报错但不阻止加载（静态敌人原地战斗）。
- **`patrol_path` 仅含 1 个点**: 视为无效路径→敌人回退为静止 IDLE（不移动）。
- **`camera_bounds` 小于视口尺寸**（如 200×200 但视口 1920×1080）: 加载时 clamp——`right ≥ left + viewport_width` 和 `bottom ≥ top + viewport_height` 强制执行最小尺寸。设计基准为横屏 1920×1080——`right` 控制横向滚动范围，`bottom` 控制纵向滚动范围。
- **JSON 格式错误**: `JSON.parse_string()` 返回 null→报错 `"room [id]: JSON parse error at [filepath]"`，拒绝加载，回退到主菜单。
- **引用不存在的敌人原型或材质**: `archetype` 不在 {"scout","soldier","heavy","carrier"} 中或 `material` 不在 {"wood","metal","concrete","composite"} 中→报错 `"unknown archetype/material: [value]"`，拒绝加载。
- **`room_id` 重复**: 加载时检查已加载房间 ID 集合——重复 ID 报错 `"duplicate room_id: [id]"`，拒绝加载第二个。
- **Boss 房间缺少 Boss 专属字段**: boss-ai.md 期望的 `boss_archetype`、`body_parts[]` 等字段缺失→boss-ai 初始化失败，报错 `"room [id]: boss data missing"`。
- **`navigation.polygon_path` 指向的文件不存在**: `ResourceLoader.exists()` 返回 false→报错 `"nav polygon not found: [path]"`，敌人导航功能不可用，但房间仍加载（敌人原地战斗）。
- **`scene_path` 指向的 .tscn 文件不存在**: 致命错误——无法实例化房间场景→报错并回退到主菜单。
- **房间重置时 `one_shot=true` 物体已在上次被破坏**: 重置期间跳过该物体的实例化——"一次性"物体在首次破坏后永久消失。

## Dependencies

> **方向说明**：本表使用**数据流方向**——"上游"=本系统依赖它提供数据或调用本系统，"下游"=它消费本系统提供的数据。与 Interactions 表中 scene-manager 被标记为"下游"（消费数据）不矛盾——两个表从不同视角描述同一关系。

| 系统 | 方向 | 性质 | 数据接口 |
|------|------|------|----------|
| **scene-manager** | 上游（调用方） | 硬依赖 | 调用本系统的 `load_room(room_id)` / `reset_room(room_id)` / `unload_room(room_id)`；提供场景生命周期触发 |
| **enemy-ai** | 下游（数据消费） | 硬依赖 | 读取 `enemies[]` → 获取 archetype、spawn_pos、initial_state、patrol_path、group_id |
| **material-destruction** | 下游（数据消费） | 硬依赖 | 读取 `physics_objects[].material` → 设置破坏阈值、倒塌方向、碎片参数 |
| **chain-propagation** | 下游（数据消费） | 硬依赖 | 读取 `physics_objects[]` → 初始化连锁节点图及其空间邻接关系 |
| **boss-ai** | 下游（数据消费） | 硬依赖 | Boss 房间的 `enemies[]` 包含 `archetype="ruin_colossus"` 及 `body_parts[]` 配置——扩展字段见 Detailed Rules §7 |
| **enemy-spawn-wave**（未来） | 下游（数据消费） | 软依赖 | 读取 `enemies[]` 作为初始波次模板——后续波次由该系统的外部 wave 配置定义 |
| **physics-config** | 间接 | — | 不直接依赖——通过 material-destruction 间接使用物理材质定义 |

**交叉验证**:
- scene-manager.md 将本系统列为上游依赖（"读取场景配置——哪个 ID 对应哪个 .tscn，房间内有什么"）✓
- enemy-ai.md 将本系统列为上游软依赖（"读取巡逻路径点、NavigationPolygon 引用、初始状态配置"）✓
- boss-ai.md 将本系统（#16）列为上游依赖 ✓

## Tuning Knobs

本系统的"调优旋钮"本质上是每房间 JSON 文件中的可配置值。关卡设计师通过调整以下参数控制房间难度和连锁复杂度：

### 房间级参数

| 参数 | 默认值 | 安全范围 | 说明 | 过高后果 | 过低后果 |
|------|--------|----------|------|---------|---------|
| 敌人总数 | 3–6 | 1–10 | 房间内 `enemies[]` 数组长度 | 认知过载（>7 活跃系统） | 房间空洞，无战斗压力 |
| 物理要素类型数 | 3 | 2–5 | `physics_objects[]` 中 distinct type 数量 | 要素过多→玩家无法 0.5s 扫描 | <2 违反 Pillar 2 约束 |
| 物理要素总数 | 4–8 | 2–15 | `physics_objects[]` 数组长度 | 性能——同时活跃 RigidBody2D 超过 50 上限 | 连锁路径不够 |
| 巡逻路径点数 | 2–4 | 0–8 | 每敌人的 `patrol_path[]` 长度 | 巡逻范围过大→敌人不可预测 | 静止敌人→掩体系统无意义 |

### 连锁设计参数

| 参数 | 默认值 | 安全范围 | 说明 |
|------|--------|----------|------|
| 建议连锁深度 | 3 | 2–6 | 设计师标注的预期连锁步数——可在 JSON 顶层增加 `"design_notes": {"expected_chain_depth_min": 3, "expected_chain_depth_max": 6}` 字段，仅用于设计审查，不用于运行时 |
| 爆炸桶间距 | 250–400 px | 150–600 px | 相邻爆炸桶的理想间距——过近=一发全清（无趣），过远=无法连锁（Pillar 2 失效） |

### 跨系统引用

以下参数不由本系统定义，但房间数据直接引用——修改时需跨 GDD 同步：

| 参数 | 定义位置 | 引用方式 |
|------|---------|---------|
| 敌人原型属性（HP/dtc/speed） | enemy-ai.md | `archetype` 字段引用原型 ID |
| 材质破坏阈值 | material-destruction.md | `material` 字段引用材质 ID |
| 导航网格 | NavigationRegion2D .tres | `navigation.polygon_path` 引用预烘焙资源 |
| 碰撞层定义 | physics-config.md | 运行时按实体类型自动分配到层 2/4/5 |

## Visual/Audio Requirements

本系统为纯数据层，无运行时视觉/音频输出。以下为开发调试需求：

| 需求 | 用途 | 可见性 |
|------|------|--------|
| 数据校验错误弹窗 | JSON 解析/验证失败时显示具体错误位置和原因 | 仅开发/QA 构建 |
| 物理要素位置预览 | 在编辑器中以图标标记 physics_objects 位置和类型 | 仅编辑器模式 |
| 巡逻路径可视化 | 以虚线 + 箭头显示 patrol_path | 仅调试模式 |

## UI Requirements

无玩家可见 UI。数据校验错误通过 Godot `push_error()` 输出到控制台。开发构建可显示错误弹窗（见 Visual/Audio）。

## Acceptance Criteria

### A. 数据加载

- **AC1**: GIVEN 有效 `room_id`，WHEN scene-manager 调用 `load_room(room_id)`，THEN JSON 被正确解析，房间场景实例化，所有敌人和物理要素出现在 `spawn_pos`/`position` 指定位置
- **AC2**: GIVEN `physics_objects[]` 仅含 1 种类型，WHEN 数据加载，THEN 报错 `"Pillar 2 violation"` 并拒绝启动房间
- **AC3**: GIVEN JSON 文件包含语法错误，WHEN `JSON.parse_string()` 返回 null，THEN 报错 `"JSON parse error"` 并回退到主菜单
- **AC4**: GIVEN 敌人 `archetype` 不在 4 种原型中，WHEN 验证，THEN 报错 `"unknown archetype"` 并拒绝加载

### B. 房间重置

- **AC5**: GIVEN 房间处于 ACTIVE 状态且玩家死亡，WHEN scene-manager 调用 `reset_room(room_id)`，THEN 所有敌人重生到 `spawn_pos`、所有 `one_shot=false` 的物理要素恢复到 `position`、巡逻路径重置
- **AC6**: GIVEN `one_shot=true` 的物体已在上一轮被破坏，WHEN 房间重置，THEN 该物体不重新实例化——永久消失

### C. 跨系统接口

- **AC7**: GIVEN `enemies[]` 包含 3 个敌人（scout/soldier/heavy），WHEN 数据传递给 enemy-ai，THEN 每个敌人的 HP/dtc/move_speed/stun_threshold 与 enemy-ai.md 定义的原型值一致
- **AC8**: GIVEN `physics_objects[]` 包含 5 个要素（2 explosive_barrel + 1 hanging_object + 1 destructible_wall + 1 acid_pool），WHEN 数据传递给 chain-propagation，THEN 连锁节点图包含 5 个节点且空间邻接关系正确
- **AC9**: GIVEN `physics_objects[]` 中 material 为 "wood"/"metal"/"concrete"/"composite"，WHEN 数据传递给 material-destruction，THEN 每个物体的破坏阈值和碎片参数与 material-destruction.md 定义一致

### D. 验证与容错

- **AC10**: GIVEN 敌人 `spawn_pos` 落在 NavigationPolygon 外，WHEN 加载，THEN 位置被吸附至最近可导航点——不报阻挡性错误
- **AC11**: GIVEN `patrol_path` 仅含 1 个点，WHEN 传递给 enemy-ai，THEN 敌人回退为静止 IDLE——不因单点路径崩溃
- **AC12**: GIVEN `camera_bounds` 宽度设为 100（< 视口 1080），WHEN 加载，THEN right 被 clamp 至 left + 1080——不因摄像机范围过小而黑屏

### E. 性能

- **AC13**: GIVEN 房间数据包含 10 个敌人 + 15 个 physics_objects，WHEN `load_room()` 调用，THEN JSON 解析 + 验证 + 实例化总耗时 ≤ 500ms（目标 60fps 移动端）

## Open Questions

| # | 问题 | 负责人 | 目标日期 | 影响 |
|---|------|--------|---------|------|
| 1 | NavigationPolygon 预烘焙工具链——关卡设计师用什么工具生成/编辑 nav 网格？Godot 内置 TileMap 烘焙还是外部工具？ | engine-programmer | MVP 前 | 如果工具链复杂，考虑 MVP 简化为手动 A* 方格导航 |
| 2 | JSON 向 .tres 迁移的时间点——Alpha 阶段是否需要可视化房间编辑器？ | producer | Alpha 前 | 影响关卡设计师的工作效率——JSON 手写可支持 3 房间，但 20+ 房间需要可视化工具 |
| 3 | ~~Boss 房间数据结构是否需要独立的 JSON schema？~~ **已解决（2026-05-22）**：采用共用通用房间结构 + Boss 专属扩展字段（`boss_archetype`、`anchor_points[]`、`body_parts[]`、`room_center`、`trigger_zone`）——详见 Detailed Rules §7 和附录 A | game-designer | 2026-05-22（已解决） | 已反映至 Detailed Rules §7 |
| 4 | **【MVP 阻塞】** 物理要素的位置精度——JSON 手写坐标（px）在移动端不同分辨率下如何适配？使用绝对像素还是归一化坐标（0-1）？当前 schema 使用绝对像素坐标（设计基准 1920×1080 横屏），但移动端设备分辨率和宽高比差异大——如果使用绝对像素，场景在 2340×1080 等异形屏上会错位。必须在 MVP 实现前由 technical-director 决定适配方案（推荐：设计基准 1920×1080 + 运行时按宽度等比缩放 + 摄像机映射处理异形屏黑边） | technical-director | **MVP 前（阻塞）** | 不同设备分辨率可能导致要素错位，影响所有物理谜题的连锁路径正确性 |

---

## 附录 A — Boss 房间 JSON 完整示例

```json
{
  "room_id": "boss_01",
  "room_type": "boss",
  "scene_path": "res://scenes/rooms/boss_01.tscn",
  "display_name": "Boss 关 — 废墟巨像",
  "camera_bounds": { "left": 0, "right": 2400, "top": 0, "bottom": 1080 },
  "navigation": {
    "polygon_path": "res://assets/navigation/boss_01_nav.tres"
  },
  "boss_archetype": "ruin_colossus",
  "room_center": { "x": 1200, "y": 540 },
  "trigger_zone": { "left": 1800, "right": 2400, "top": 0, "bottom": 1080 },
  "anchor_points": [
    {
      "id": "anchor_01",
      "position": { "x": 1200, "y": 500 },
      "wait_duration": 0.0,
      "next_anchor_id": "anchor_02",
      "phase_mask": 3,
      "trigger_condition": "immediate"
    },
    {
      "id": "anchor_02",
      "position": { "x": 800, "y": 500 },
      "wait_duration": 2.0,
      "next_anchor_id": "anchor_03",
      "facing_direction": { "x": -1, "y": 0 },
      "phase_mask": 3,
      "allowed_attacks": ["ground_slam", "debris_throw"],
      "trigger_condition": "cooldown_complete"
    },
    {
      "id": "anchor_03",
      "position": { "x": 1600, "y": 500 },
      "wait_duration": 1.5,
      "next_anchor_id": "anchor_04",
      "facing_direction": { "x": 1, "y": 0 },
      "phase_mask": 3,
      "allowed_attacks": ["ground_slam", "arm_sweep"],
      "trigger_condition": "player_in_zone"
    },
    {
      "id": "anchor_04",
      "position": { "x": 1000, "y": 400 },
      "wait_duration": 1.0,
      "next_anchor_id": "anchor_05",
      "phase_mask": 2,
      "allowed_attacks": ["collapse_charge"],
      "trigger_condition": "cooldown_complete"
    },
    {
      "id": "anchor_05",
      "position": { "x": 1400, "y": 400 },
      "wait_duration": 2.0,
      "next_anchor_id": "anchor_01",
      "phase_mask": 2,
      "allowed_attacks": ["self_destruct_throw"],
      "trigger_condition": "player_in_zone"
    }
  ],
  "body_parts": [
    {
      "part_id": "left_leg",
      "position": { "x": 1150, "y": 650 }
    },
    {
      "part_id": "right_leg",
      "position": { "x": 1250, "y": 650 }
    },
    {
      "part_id": "left_arm",
      "position": { "x": 1080, "y": 380 }
    },
    {
      "part_id": "right_arm",
      "position": { "x": 1320, "y": 380 }
    },
    {
      "part_id": "core",
      "position": { "x": 1200, "y": 350 },
      "hp_override": 3000
    }
  ],
  "enemies": [],
  "physics_objects": [
    {
      "id": "boss_obj_01",
      "type": "explosive_barrel",
      "position": { "x": 600, "y": 480 },
      "material": "metal",
      "one_shot": false
    },
    {
      "id": "boss_obj_02",
      "type": "unstable_structure",
      "position": { "x": 1500, "y": 450 },
      "material": "concrete",
      "one_shot": false
    },
    {
      "id": "boss_obj_03",
      "type": "hanging_object",
      "position": { "x": 1800, "y": 200 },
      "material": "concrete",
      "one_shot": false
    },
    {
      "id": "boss_obj_04",
      "type": "explosive_barrel",
      "position": { "x": 2000, "y": 480 },
      "material": "metal",
      "one_shot": false
    },
    {
      "id": "boss_obj_05",
      "type": "unstable_structure",
      "position": { "x": 2100, "y": 450 },
      "material": "concrete",
      "one_shot": false
    }
  ],
  "room_transitions": {
    "entry": { "x": 100, "y": 500 },
    "exit": { "x": 2350, "y": 500 }
  },
  "design_notes": {
    "expected_chain_depth_min": 4,
    "expected_chain_depth_max": 8
  }
}
```

> **说明**：Boss 房间 `enemies[]` 为空（MVP Boss 战无杂兵）。`physics_objects[]` 包含 5 个要素（3 种类型：explosive_barrel + unstable_structure + hanging_object），满足 Pillar 2 的 ≥2 种要求。`anchor_points[]` 定义了 5 个移动锚点——Phase 1 用 1-3、Phase 2 用 4-5。`design_notes` 记录设计师对连锁深度的预期，仅用于设计审查，不用于运行时。
