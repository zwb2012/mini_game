# 敌人 AI 系统 (Enemy AI)

> **Status**: In Review
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-22
> **Implements Pillar**: Pillar 4（通关靠脑子——敌人是物理环境的参与者，而非弹幕发射器）

## Overview

敌人 AI 系统定义了所有非 Boss 敌人的行为——它们不是向玩家倾泻子弹的移动炮台，而是坍塌禁区物理沙盒中的**主动参与者**。每个敌人会根据自身类型（轻型/中型/重型）和房间物理布局做出不同反应：轻型敌人利用掩体躲避、中型敌人协同推进、重型敌人无视掩护但成为连锁传播的理想锚点。敌人会被冲击力击飞、被碎片砸伤、被倒塌结构压死——它们和玩家一样受物理规则支配。这套 AI 的核心设计原则来自 Pillar 4（通关靠脑子，不靠反应）：敌人的威胁不在于弹幕密度，而在于它们如何迫使玩家重新评估物理战场——一个躲在爆炸桶后面的敌人不是掩体后的靶子，而是一个等待被引爆的连锁起点。

## Player Fantasy

在坍塌禁区中，敌人不是"需要被点掉的红色血条"——它们是**可读的物理对象**。玩家面对一个敌人时，第一反应不应该是"我需要开几枪"，而应该是"它站在哪里？它后面有什么？我能用什么砸它？"

这个幻想的精髓在于**敌人和环境不可分割**：一个站在悬空平台下的重型敌人是一个等待被压死的目标；一群躲在爆炸桶后面的轻型敌人是一次连锁清场的邀请。敌人 AI 的职责是让这种阅读成立——敌人行为必须有可预测的物理反应，让玩家能够"计算"而非"反应"。

**参考游戏**：Noita 中敌人被物理击飞、被环境杀死的涌现感；Dead Cells 中敌人攻击前摇清晰可读、让玩家有"判断窗口"的设计。

**不应像**：传统射击游戏的刷怪逻辑——敌人从屏幕边缘涌入、靠数量压制。坍塌禁区的每个敌人都是一个物理决策点。

## Detailed Design

### Core Rules

**1. 敌人原型**

本系统定义 4 种敌人原型，覆盖 MVP 阶段 3 个物理谜题房间的战术需求。具体数值由生命值与伤害系统提供 HP 和 dtc，本系统定义行为参数。

| 原型 | HP | dtc | 移动速度 | 行为特征 | 战术角色 |
|------|-----|-----|---------|---------|---------|
| **侦察兵 (Scout)** | 200 | 1.0 | 350 px/s | 快速移动、主动寻找掩体、射击频率低 | 让玩家练习"预判移动+利用环境" |
| **士兵 (Soldier)** | 400 | 0.8 | 200 px/s | 标准推进、小群协同、中等射速 | 基线威胁——迫使玩家在"直射"和"连锁"间决策 |
| **重装兵 (Heavy)** | 800 | 0.5 | 100 px/s | 缓慢推进、不找掩体、高冲击抗性 | 行走的连锁锚点——鼓励玩家用环境而非子弹击杀 |
| **自爆兵 (Carrier)** | 200 | 1.0 | 300 px/s | 冲向玩家、死亡时爆炸（AOE半径150px） | 移动物理灾害——玩家想把它引到其他敌人/结构附近再引爆 |

**2. 感知模型**

每个敌人拥有视野锥，参数可按原型配置：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `vision_range` | 600 px | 最大视距 |
| `vision_angle` | 120° | 视野锥总角度（60°左+60°右） |
| `detection_delay` | 0.3 s | 玩家进入视野后到确认威胁的延迟——给玩家反应窗口 |
| `memory_duration` | 3.0 s | 失去视野后记住玩家最后位置的时间 |
| `hearing_range` | 400 px | 枪声/爆炸声感知范围（用于间接激活，Alpha 阶段实现） |

感知判定流程：
1. 每 0.2s 检查玩家是否在 `vision_range` 内
2. 如果在：从敌人位置向玩家发射 3 条射线（头部/躯干/脚部），任一不被 World 层阻挡 → 可见
3. 可见持续 `detection_delay` 后 → 进入 COMBAT 状态
4. 不可见持续 `memory_duration` 后 → 回到 PATROL/IDLE

**3. 移动与导航**

- 使用 Godot NavigationAgent2D + NavigationRegion2D 进行路径寻找
- 每个战斗房间的 NavigationPolygon 在关卡数据中预烘焙
- 移动通过 CharacterBody2D + `move_and_slide()` 执行——敌人同样受物理约束
- **掩体选择**（侦察兵）：识别 PhysicsObject 层或 World 层中敌人与玩家之间的障碍物，移动到障碍物后方
- **协同推进**（士兵）：同组士兵保持 80-150px 间距，不堆叠

**4. 战斗行为**

| 行为 | 规则 |
|------|------|
| **射击** | 士兵和侦察兵向玩家位置发射子弹——调用 `fire(enemy_muzzle_pos, target_pos, "standard", self)`，复用与玩家相同的射击弹道系统。`source_entity=self` 使子弹跳过 hit-stop 并对 Enemy 层(2)关闭碰撞 |
| **射速** | 士兵 1.5s/发、侦察兵 3.0s/发、重装兵 2.0s/发——每发都有意义，不是弹幕 |
| **射击协调** | 每个士兵生成时随机首次射击延迟 0.0–0.3s——天然错开同级敌人的开火节奏，无需显式组内通信 |
| **精度** | 士兵射击有 ±8° 随机偏差、侦察兵 ±15°、重装兵 ±5°——玩家可通过移动躲避 |
| **环境破坏** | 敌人子弹同样能破坏环境要素！士兵误射爆炸桶会触发连锁——这是 Pillar 4 的体现 |
| **友军伤害** | 敌人子弹对 Enemy 层（层2）关闭碰撞——子弹不伤及友军。但 Carrier 自爆 AOE 对所有层生效（包括 Enemy 层），保持物理真实感 |

**5. 物理交互**

| 事件 | 响应 |
|------|------|
| **被冲击力（≥阈值）击中** | 进入 STUNNED 状态，最小时长 0.4s，被击退方向由冲量方向决定 |
| `stun_threshold` | 侦察兵 150 impulse、士兵 300、重装兵 600、自爆兵 100 |
| **被爆炸 AOE 波及** | 受到推力（RigidBody2D 类型）或击退状态（CharacterBody2D 类型） |
| **被碎片命中** | 正常伤害计算 + 短暂硬直（0.15s） |
| **被倒塌结构砸中** | 即死（crush 伤害系数 0.30 × 结构质量通常远超 HP） |
| **被 PhysicsObject 推动** | 如果使用 RigidBody2D 变体：正常物理响应。CharacterBody2D：通过代码施加推力 |

**6. 敌人 RigidBody2D 变体**

部分敌人使用 RigidBody2D 而非 CharacterBody2D（与 physics-config 第5条一致——"可被击飞的敌人"）：
- 自爆兵：使用 RigidBody2D，被击中时产生物理级击飞
- 侦察兵：使用 CharacterBody2D（精准移动优先）
- 士兵：使用 CharacterBody2D
- 重装兵：使用 CharacterBody2D（高抗性不适用 RigidBody）

### States and Transitions

```
            ┌─────────┐
            │  IDLE   │ ← 玩家不可见，巡逻/静止
            └────┬────┘
                 │ 检测到玩家（vision + detection_delay）
                 ▼
            ┌─────────┐
            │ COMBAT  │ ← 主动战斗：移动+射击
            └────┬────┘
                 │ 失去玩家视野 ≥ memory_duration
                 ▼
            ┌──────────┐
            │ SEARCHING│ ← 移动到玩家最后已知位置
            └────┬─────┘
                 │ 搜索 5s 后仍无玩家 → IDLE
                 │ 重新发现玩家 → COMBAT
                 ▼
            ┌─────────┐
            │ STUNNED │ ← 被冲击力/爆炸击晕（0.3-0.5s）
            └────┬────┘
                 │ 眩晕结束 → 返回之前状态（COMBAT 或 SEARCHING）；
                 │ 若之前为 IDLE 则进入 COMBAT（被冲击力命中
                 │ 说明玩家在附近活动）
                 ▼
            ┌─────────┐
            │  DEAD   │ ← HP = 0，等待死亡重生系统回收
            └─────────┘
```

状态行为明细：

| 状态 | 移动 | 射击 | 感知 | 物理响应 |
|------|------|------|------|---------|
| IDLE | 静止或巡逻路径移动 | 不射击 | 持续检测视野 | 正常 |
| COMBAT | 按原型行为移动（掩体/推进/冲锋） | 按原型射速射击 | 更新玩家位置 | 正常 |
| SEARCHING | 移动到 last_known_player_pos | 不射击 | 持续检测视野 | 正常 |
| STUNNED | 不可控——被击退 | 中断 | 中断 | 仅接受推力 |
| DEAD | 停止 | 停止 | 停止 | 碰撞体保留（等待回收） |

### Interactions with Other Systems

| 系统 | 方向 | 数据流 |
|------|------|--------|
| 玩家控制器 | 上游 | 读取玩家位置（`global_position`）、面向方向——用于 AI 感知和瞄准 |
| 物理引擎配置 | 上游 | 使用 CharacterBody2D/RigidBody2D（层2）、碰撞矩阵、重力 |
| 生命值与伤害系统 | 上游+下游 | 下游提供 HP 池初始化和 `health_changed`/`entity_died` 订阅；上游传出受到伤害的 HitData |
| 射击与弹道系统 | 下游 | 敌人调用 `fire(enemy_muzzle_pos, target_pos, "standard", self)` 创建子弹 |
| 关卡设计数据系统 | 上游 | 读取巡逻路径点、NavigationPolygon 引用、初始状态配置 |
| 敌人生成与波次管理 | 上游 | 接收激活/停用信号、出生点位置

## Formulas

### 1. 视野检测 (Vision Detection)

```
is_visible = (dist_player ≤ vision_range) AND (|view_deviation| ≤ half_vision_angle) AND (any_raycast_clear)
```

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 距离玩家 | `dist_player` | float | 0–2000 px | 敌人到玩家的欧几里得距离 |
| 视野范围 | `vision_range` | float | 400–800 px | 按原型可配，默认 600 |
| 视角偏差 | `view_deviation` | float | 0–180° | 敌人朝向与 (玩家位置 - 敌人位置) 之间的绝对角度 |
| 半视野角 | `half_vision_angle` | float | 60° | `vision_angle / 2`，固定 60° |
| 任一射线畅通 | `any_raycast_clear` | bool | {true, false} | 3 条 PhysicsRayQuery2D（头/躯干/脚）任一不被 World 层（层4）阻挡 |

**输出**: `true`（可见）或 `false`（不可见）

**示例**: 侦察兵 (0,0) 面向右，玩家 (400,-100)。`dist_player ≈ 412 ≤ 600` ✓、`view_deviation ≈ 14° < 60°` ✓、头部射线畅通 ✓ → `is_visible = true`

---

### 2. 眩晕时长 (Stun Duration)

```
if impulse < stun_threshold: return 0  // 低于阈值不触发眩晕

multiplier = 1.0 + (excess_ratio / (excess_ratio + FALLOFF_K)) × (MAX_MULT - 1.0)
stun_duration = clamp(BASE_STUN × multiplier, MIN_STUN, MAX_STUN)
excess_ratio = max(impulse / stun_threshold - 1.0, 0.0)
```

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 接收冲量 | `impulse` | float | 0–5000 | 来自 hit-detection 的碰撞冲量大小 |
| 眩晕阈值 | `stun_threshold` | float | 100–600 | Scout=150, Soldier=300, Heavy=600, Carrier=100 |
| 超出比率 | `excess_ratio` | float | 0.0–∞ | 超过阈值的比例；0.0=刚好阈值，1.0=2×阈值 |
| 基础眩晕时长 | `BASE_STUN` | float | 0.4 s | 刚好达到阈值时的眩晕持续时间 |
| 衰减常数 | `FALLOFF_K` | float | 2.0 | 控制递减收益速度 |
| 最大倍数 | `MAX_MULT` | float | 3.0 | 时长的硬上限倍数 |
| 下限/上限 | `MIN_STUN` / `MAX_STUN` | float | 0.3 / 1.2 s | 绝对最小/最大眩晕时长 |

**输出范围**: 0.0 s（冲量 < 阈值，不触发眩晕）至 1.2 s（上限）

> ⚠️ **适用范围**: 本公式仅适用于 CharacterBody2D 敌人（Scout / Soldier / Heavy）。RigidBody2D 敌人（Carrier）被爆炸 AOE 波及时不进入眩晕状态——而是通过 `apply_impulse()` 接受物理推力（符合 physics-config 中"可被击飞的敌人"设计）。

**递减收益曲线**: excess=0 → 0.4s, excess=0.5 → 0.56s, excess=1.0 → 0.67s, excess=2.0 → 0.93s, excess=4.0 → 1.20s（硬上限）

**示例**: 士兵（threshold=300）被大碎片击中（impulse=900）→ excess_ratio=2.0 → multiplier=2.0 → stun_duration=0.8s

---

### 3. 掩体选择评分 (Cover Selection Scoring)

侦察兵（Scout）专有。扫描范围内候选掩体位置，对每个计算评分。

```
cover_score = block_bonus × (w_reach × reach_score + w_safety × safety_score)
reach_score = 1.0 - clamp(|dist_to_cover - PREFER_COVER_DIST| / MAX_SEARCH_RADIUS, 0.0, 1.0)
safety_score = clamp(dist_cover_to_player / MIN_SAFE_DIST, 0.2, 1.0)
```

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 阻挡奖励 | `block_bonus` | float | {0.0, 1.0} | 玩家→掩体连线是否被 PhysicsObject/World 层阻挡 |
| 到达权重 | `w_reach` | float | 0.4 | 距离偏好的权重 |
| 安全权重 | `w_safety` | float | 0.6 | 远离玩家安全性的权重 |
| 到达评分 | `reach_score` | float | 0.0–1.0 | 掩体距离与理想距离（250px）的匹配度 |
| 安全评分 | `safety_score` | float | 0.2–1.0 | 掩体距离玩家的安全度 |
| 偏好掩体距离 | `PREFER_COVER_DIST` | float | 250 px | 侦察兵到达掩体的理想距离 |
| 最大搜索半径 | `MAX_SEARCH_RADIUS` | float | 500 px | 掩体搜索最大范围 |
| 最小安全距离 | `MIN_SAFE_DIST` | float | 200 px | 距玩家 200px 得满分安全评分 |

**输出范围**: 0.0（无效掩体）至 1.0（完美掩体）

---

### 4. 目标优先级 (Target Priority)

敌人每 0.5s 评估感知范围内所有潜在目标，选择最高分目标射击。

```
priority = type_value × distance_factor × los_factor + urgency_bonus
distance_factor = 1.0 / (1.0 + distance / FALLOFF_DIST)
```

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 类型值 | `type_value` | float | 10–100 | 目标类型基础优先级（见下表） |
| 距离因子 | `distance_factor` | float | 0.14–1.0 | 距离越近得分越高 |
| 视野因子 | `los_factor` | float | {1.0, 1.5} | 1.5=直接可见，1.0=仅记忆位置 |
| 紧急加成 | `urgency_bonus` | float | 0–50 | +50 如果目标正在向敌人飞来（如坠落碎片） |
| 衰减距离 | `FALLOFF_DIST` | float | 600 px | 距离因子=0.5 时的距离 |

**类型值表**:

| 目标类型 | 默认 | Scout | Soldier | Heavy | Carrier |
|---------|------|-------|---------|-------|---------|
| 玩家 | 100 | 100 | 100 | 100 | 100 |
| 玩家附近的爆炸桶 | 80 | 85 | 80 | 70 | — |
| 玩家下方的结构支撑 | 70 | 75 | 70 | 60 | — |
| 威胁自身的物理物体 | 90 | 95 | 85 | 75 | 85 |
| 阻挡视线的障碍物 | 50 | 65 | 55 | 30 | — |
| 玩家附近的物理物体 | 40 | 40 | 35 | 25 | — |
| 通用物理物体 | 10 | 10 | 10 | 10 | 10 |

(Carrier 的 "—" 表示自爆兵始终冲向玩家，不重新评估目标)

**输出范围**: 10 至 ~200（理论最大 `100 × 1.0 × 1.5 + 50 = 200`）

**示例**: 士兵评估两个目标：(A) 玩家 400px，视线被墙挡住 → priority=60；(B) 玩家附近的爆炸桶 353px，可见 → priority=80 × 0.63 × 1.5 = 75.6。**士兵射击爆炸桶**——触发连锁！

---

### 5. 射击精度偏差 (Shooting Accuracy Deviation)

使用角度偏移 + 距离缩放生成子弹散布。

```
spread_angle_deg = base_spread_deg × clamp(1.0 + distance / SPREAD_DIST_SCALE, 1.0, MAX_SPREAD_MULT)
offset_deg = randf_range(-spread_angle_deg, +spread_angle_deg)
shot_direction = aim_direction.rotated(deg_to_rad(offset_deg))
```

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 基础散布 | `base_spread_deg` | float | 5–15° | Scout=15°, Soldier=8°, Heavy=5° |
| 目标距离 | `distance` | float | 0–1200 px | 敌人到目标的欧几里得距离 |
| 散布距离标尺 | `SPREAD_DIST_SCALE` | float | 800 px | 此距离处基础散布加倍 |
| 最大散布倍数 | `MAX_SPREAD_MULT` | float | 3.0 | 散布硬上限 |
| 有效散布 | `spread_angle_deg` | float | 5–45° | 距离缩放后的最终散布 |
| 偏移角度 | `offset_deg` | float | -45 至 +45° | 均匀随机分布的射击方向偏移 |

**像素偏差**: `pixel_error = tan(spread_angle_deg × π/180) × distance`

| 距离 | 士兵 (base 8°) | 像素偏差 | 重型兵 (base 5°) | 像素偏差 |
|------|-------------|---------|----------------|---------|
| 200 px | 8.0° | ±28 px | 5.0° | ±17 px |
| 600 px | 14.0° | ±150 px | 8.75° | ±92 px |
| 1000 px | 18.0° | ±325 px | 11.25° | ±198 px |

**示例**: 重型兵射击 500px 外的玩家 → spread=8.125° → offset_deg 随机 ~+3.2° → 像素偏差约 ±71px。玩家碰撞体约 48px 宽 → 约 50% 命中概率。

---

### 6. 寻路 Hazard 代价 (Pathfinding Hazard Cost)

危险区域通过修改 NavigationRegion2D 的 `travel_cost` 影响敌人路径。

```
region_travel_cost = 1.0 + hazard_level × arch_hazard_weight
```

动态 hazard 叠加时：

```
modified_cost = base_cost × Π(1.0 + hazard_severity × arch_hazard_weight)
```

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| Hazard 等级 | `hazard_level` | float | 0.0–5.0 | 关卡设计师为 nav 区域指定的危险等级 |
| Hazard 强度（动态） | `hazard_severity` | float | 0–1.0 | 动态 Hazard（火焰/坠落碎片）中心=1.0，边缘=0.3 |
| 原型 Hazard 权重 | `arch_hazard_weight` | float | 0.5–3.0 | Scout=2.5, Soldier=2.0, Heavy=0.5, Carrier=1.5 |
| 基础代价 | `base_cost` | float | 1.0 | 非 Hazard 区域的默认 travel_cost |
| 修正代价 | `region_travel_cost` | float | 1.0–16.0 | 应用于 NavigationRegion2D 的最终 travel_cost |

**archetype_hazard_weight 设计理由**:
- Scout 2.5 — 脆弱，严重规避危险，绕远路
- Soldier 2.0 — 中等耐久，规避但不过度
- Heavy 0.5 — 高 HP+高眩晕抗性，几乎不规避，踏火而行
- Carrier 1.5 — 低 HP 但自毁特性，中等规避

**输出范围**: 1.0（无 Hazard）至 ~16.0（5.0×3.0 或 6 个叠加 Hazard）

**示例**: 士兵（weight=2.0）面临直路有火焰区（hazard_level=3.0）→ travel_cost=7.0。绕路增加 30% 距离但 cost=1.0 → A* 选择绕路。若火焰区占据必经点 → travel_cost=7.0 意味着士兵会加速通过。

## Edge Cases

- **玩家躲在可破坏掩体后方（如木质箱子，PhysicsObject 层）**: 3 条射线全被阻挡→判定不可见。但敌人的目标优先级系统会对"阻挡视线的障碍物"评分（默认 type_value=50，各原型不同：Scout=65 / Soldier=55 / Heavy=30）→如果障碍物在射程内，敌人会射击它→障碍物被破坏后玩家重新可见→进入 COMBAT。这是预期行为——敌人不会"无视"可破坏掩体。

- **多个侦察兵选择同一掩体位置**: 先到先得——第一个到达掩体的侦察兵标记该掩体为占用（`cover_claimed_by = scout_id`）。后续侦察兵在评分中对该掩体施加 ×0.3 惩罚，优先寻找其他掩体。如果所有掩体被占用且 block_bonus 全为 0：侦察兵移动至最近 World 层墙壁附近。

- **敌人在视野范围边界（如恰好 600px）**: `dist_player ≤ vision_range` 使用 ≤ 判断——恰好在边界上视为可见。但 `detection_delay` 0.3s 防止 flickering 检测（出入视野边界的快速切换）。检测状态每 0.2s 更新一次，配合 0.3s 延迟→至少需要 2 个 tick（~0.5s）才能在边界上确认检测或丢失。

- **敌人 STUNNED 状态下被推至悬崖/深渊边缘**: STUNNED 状态下 velocity 由冲量方向驱动，不施加 AI 移动。如果被推到边缘外→重力接管→敌人坠落死亡。这是有意的物理后果——玩家可以利用环境边缘进行"击飞击杀"。

- **NavigationAgent2D 路径被新生成的碎片/废墟阻挡**: 碎片（RigidBody2D，PhysicsObject 层 5）落在导航路径上→敌人 `_physics_process` 中 `NavigationAgent2D.is_target_reachable()` 返回 false→触发路径重算。如果无路可达（如整个房间被废墟阻塞）→敌人原地战斗（shoot at player if visible, else stay IDLE）。

- **开放房间所有掩体位置的 block_bonus=0**（没有 World 层或 PhysicsObject 层障碍物在玩家和掩体之间）: 掩体评分公式中 `cover_score = 0 × (...)` = 0→侦察兵放弃寻找掩体，回退为"保持最大距离移动"策略（与士兵相同的行为模式）。

- **目标优先级评分并列（如玩家和爆炸桶同为 75 分）**: 按 type_value 降序 → distance（近者优先）→ 随机打破并列。优先级链：type_value > distance > random。

- **自爆兵到达玩家 50px 范围内**: 触发自爆序列：(1) 0.2s 预警动画（自爆兵闪烁红色）；(2) 以自爆兵位置为中心创造爆炸 HitData（AOE 半径 150px，type=explosion，impulse=800）；(3) 自爆兵 HP 立即归零→DEAD。预警动画期间自爆兵仍可被击杀（提前引爆）。

- **RigidBody2D 敌人被物理力推出 NavigationRegion2D 范围**: 如果敌人在 nav 区域外且未死亡→AI 移动目标设为最近 nav 区域边缘点（`NavigationServer2D.map_get_closest_point()`）。如果所有 nav 区域均不可达→原地战斗。

- **敌人在射击动画中途死亡**: 如果 `entity_died` 信号在射击动画播放期间到达→立即中断动画→切换到死亡姿态（如果死亡重生系统提供死亡动画）或直接标记碰撞体为禁用（不产生物理碰撞）。已发射的子弹不受影响（已作为独立节点存在于场景中）。

- **重型兵同时被多个冲击力命中**: 每个 HitData 独立触发眩晕判定→选择最长的 stun_duration（多个眩晕不叠加）。眩晕期间新冲击力仍被跟踪→眩晕结束时如果有待处理的更高冲量→重新计算并可能延长眩晕。

- **敌人在 SEARCHING 状态下被玩家从背后接近**: SEARCHING 状态下感知仍然活跃——视野锥面向 `last_known_player_pos` 方向，而非全方位。如果玩家从背后接近（在视野锥外）→敌人不知道→玩家可执行"潜行近身"。但距离 < 100px 时强制感知（"听觉"——脚步），进入 COMBAT。

- **敌人在 IDLE 状态下被爆炸/碎片波及触发 STUNNED**: 敌人在巡逻/静止时被连锁反应（如远处爆炸桶）击中→进入 STUNNED。眩晕结束后进入 COMBAT 而非 IDLE——被冲击力命中说明玩家在附近活动，敌人应进入战斗状态。（已反映在状态机图 STUNNED 恢复规则中）

## Dependencies

| 系统 | 方向 | 性质 | 数据接口 |
|------|------|------|----------|
| **玩家控制器** | 上游 | 硬依赖 | 读取 `global_position`（AI 感知目标）、`face_right`（判断玩家朝向） |
| **物理引擎配置** | 上游 | 硬依赖 | CharacterBody2D/RigidBody2D 层2、碰撞矩阵、重力常量 |
| **生命值与伤害系统** | 上游+下游 | 硬依赖 | 上游：读取 HP 池、dtc；下游：接收 `health_changed`/`entity_died`；传出 HitData 触发伤害 |
| **射击与弹道系统** | 下游 | 硬依赖 | 敌人调用 `fire(enemy_muzzle_pos, target_pos, "standard", self)` 创建子弹 |
| **关卡设计数据系统** | 上游 | 软依赖 | 读取巡逻路径点、NavigationPolygon 引用、初始状态配置 |
| **敌人生成与波次管理** | 上游 | 硬依赖 | 接收激活/停用信号、出生位置和初始面向方向 |

**交叉验证**:
- physics-config.md 将敌人 AI 列为下游软依赖（读取 CharacterBody2D/RigidBody2D velocity） ✓

## Tuning Knobs

### 感知参数

| 参数 | 默认值 | 安全范围 | 说明 | 过高后果 | 过低后果 |
|------|--------|----------|------|---------|---------|
| `vision_range` | 600 | 400–800 | 所有原型的默认视距 | 敌人穿墙预知玩家，破坏物理推理感 | 敌人近视，玩家可轻易绕过 |
| `vision_angle` | 120 | 90–180 | 视野锥总角度（度） | 敌人几乎全向感知→掩体无意义 | 玩家只需站在敌人正后方即可无敌 |
| `detection_delay` | 0.3 | 0.1–1.0 | 确认可见后的反应延迟（秒） | 敌人"发呆"→不自然 | 敌人瞬间反应→无判断窗口 |
| `memory_duration` | 3.0 | 1.0–8.0 | 失去视野后记住玩家位置的时间（秒） | 敌人永远追踪→躲藏无意义 | 敌人立即放弃搜索→SEARCHING 状态无存在感 |

### 眩晕参数

| 参数 | 默认值 | 安全范围 | 说明 | 过高后果 | 过低后果 |
|------|--------|----------|------|---------|---------|
| `BASE_STUN` | 0.4 | 0.2–0.8 | 刚好达到阈值时的眩晕时长（秒） | 每发子弹都长时间控敌→过于简单 | 物理反馈感受不到 |
| `FALLOFF_K` | 2.0 | 1.0–5.0 | 眩晕递减收益速度 | 极高冲量眩晕过长→一枪控死 | 递增几乎线性→超大冲量接近上限 |
| `MAX_STUN` | 1.2 | 0.8–2.0 | 眩晕时长硬上限（秒） | 敌人长时间不可互动 | 上限太低→高冲量无额外收益 |
| `stun_threshold_scout` | 150 | 50–250 | 侦察兵眩晕最小冲量 | 任何碎片都击晕→侦察兵无法战斗 | 几乎不会被击晕 |
| `stun_threshold_soldier` | 300 | 150–450 | 士兵眩晕阈值 | — | — |
| `stun_threshold_heavy` | 600 | 400–900 | 重型兵眩晕阈值 | 重型兵永不眩晕→物理反馈丢失 | 大口径子弹轻易击晕→重型兵无威慑力 |
| `stun_threshold_carrier` | 100 | 50–200 | 自爆兵眩晕阈值 | — | — |

### 射击参数

| 参数 | 默认值 | 安全范围 | 说明 | 过高后果 | 过低后果 |
|------|--------|----------|------|---------|---------|
| `base_spread_scout` | 15 | 10–25 | 侦察兵基础散布（度） | 侦察兵子弹无效→无威胁 | 侦察兵太准→远程压制玩家 |
| `base_spread_soldier` | 8 | 5–15 | 士兵基础散布（度） | — | — |
| `base_spread_heavy` | 5 | 3–10 | 重型兵基础散布（度） | — | — |
| `SPREAD_DIST_SCALE` | 800 | 400–1200 | 散布距离标尺（px） | 远程散布轻微→狙击手敌人 | 近距离散布也开始增大→近身射击也打不中 |
| `MAX_SPREAD_MULT` | 3.0 | 2.0–5.0 | 散布上限倍数 | 远距离完全无效 | 散布与距离无关→全是狙击手 |

### 移动与导航参数

| 参数 | 默认值 | 安全范围 | 说明 | 过高后果 | 过低后果 |
|------|--------|----------|------|---------|---------|
| `move_speed_scout` | 350 | 200–500 | 侦察兵移动速度（px/s） | 侦察兵无法被瞄准 | 侦察兵没有速度优势 |
| `move_speed_soldier` | 200 | 100–350 | 士兵移动速度 | 士兵比玩家还快→不爽 | 士兵像炮塔 |
| `move_speed_heavy` | 100 | 50–200 | 重型兵移动速度 | 重型兵速度优势→不符合重量幻想 | 重型兵几乎不动 |
| `move_speed_carrier` | 300 | 200–450 | 自爆兵移动速度 | 无法反应→挫败感 | 自爆无威胁 |
| `arch_hazard_weight_scout` | 2.5 | 1.5–3.0 | 侦察兵规避危险程度 | — | — |
| `arch_hazard_weight_soldier` | 2.0 | 1.0–2.5 | 士兵规避危险程度 | — | — |
| `arch_hazard_weight_heavy` | 0.5 | 0.0–1.5 | 重型兵规避危险程度 | — | — |
| `arch_hazard_weight_carrier` | 1.5 | 0.5–2.5 | 自爆兵规避危险程度 | — | — |

### 掩体选择参数（侦察兵专有）

| 参数 | 默认值 | 安全范围 | 说明 |
|------|--------|----------|------|
| `w_reach` | 0.4 | 0.1–0.9 | 距离偏好权重（w_safety = 1.0 − w_reach） |
| `PREFER_COVER_DIST` | 250 | 100–400 | 侦察兵理想掩体距离（px） |
| `MAX_SEARCH_RADIUS` | 500 | 300–800 | 掩体搜索最大半径（px） |
| `MIN_SAFE_DIST` | 200 | 100–400 | 安全距离阈值（px） |

### 目标优先级参数

| 参数 | 默认值 | 安全范围 | 说明 |
|------|--------|----------|------|
| `FALLOFF_DIST` | 600 | 400–1000 | 优先级距离衰减（px），匹配 vision_range |
| 各 `type_value` | 见 Formulas §4 | 0–100 | 目标类型基础优先级 |

### 射击频率参数

| 原型 | 射速 | 安全范围 |
|------|------|----------|
| 侦察兵 | 3.0 s | 2.0–6.0 |
| 士兵 | 1.5 s | 0.8–3.0 |
| 重型兵 | 2.0 s | 1.0–4.0 |
| 自爆兵 | 不射击 | — |

## Visual/Audio Requirements

### 敌人视觉差异化

| 原型 | 视觉特征 | 颜色编码 | 体量 |
|------|---------|---------|------|
| **侦察兵** | 小型不规则形状、细边缘、快速移动时产生运动拖尾 | 亮灰 + 黄色高亮（眼睛/传感器） | 小（~48×48 px） |
| **士兵** | 标准人形轮廓、中等边缘粗细、肩部装甲辨识点 | 灰棕 + 红色肩章 | 中（~56×64 px） |
| **重装兵** | 厚块状轮廓、粗边缘、头顶重型装甲板明显 | 暗灰 + 暗红装甲 | 大（~72×80 px） |
| **自爆兵** | 不规则圆形、脉动光晕、背负显眼橙色燃料罐 | 暗绿 + 橙色罐（Hazard Language 爆炸性） | 中（~56×56 px） |

设计原则遵循 Art Bible：
- 危险色语言：自爆兵燃料罐使用橙色 = 爆炸性
- 重量感传达：重装兵粗边缘+暗色→"这个东西需要很多子弹"
- 可读性废墟：所有敌人在物理废墟背景中通过高对比度剪影区分

### VFX 需求

| 事件 | VFX | 优先级 |
|------|-----|--------|
| 射击（枪口闪光） | 1 帧白色闪光 + 后坐力方向粒子（2-3 碎片粒子） | MVP |
| 被击中 | 白色闪白（~50ms）+ 被击退方向的冲击火花 | MVP |
| 进入 STUNNED | 头顶星形图标 + 身体小幅度震动（0.3-0.5s） | MVP |
| STUNNED 恢复 | 星形图标消失 + 重新站立动画（0.15s 过渡） | Alpha |
| 死亡（普通） | 身体褪色（0.3s fade → 50% opacity）+ 撞击火花 | MVP |
| 自爆兵引爆 | 橙色 AOE 圆形扩展（150px 半径）+ 身体碎片飞溅 | MVP |
| 自爆兵预警 | 身体红色脉动闪烁（0.2s，4 次闪烁） | MVP |
| 检测到玩家（IDLE→COMBAT） | 头顶感叹号图标（"!"，0.3s） | MVP |

### 音频需求

| 事件 | 音频 | 优先级 |
|------|------|--------|
| 检测到玩家 | 短促警示音（音高随原型变化：侦察兵高频、重装兵低频） | Alpha |
| 射击 | 材质差异化枪声（3 种基础变体） | MVP |
| 被击中 | 击中反馈音（音高随机偏差 ±10%） | MVP |
| 进入 STUNNED | 低频冲击音 + 眩晕嗡声（loop，stun 期间持续） | Alpha |
| 死亡 | 死亡音效（原型差异化：侦察兵短促、重装兵低沉长音） | Alpha |
| 自爆兵引爆 | 低频爆炸音 + 碎片飞溅高频层 | MVP |
| 自爆兵预警 | 急促 beep 声（0.2s 内 4 次，音高递增） | MVP |
| 脚步声 | 材质相关脚步声（地面/金属/瓦砾），Alpha 阶段实现 | Alpha |

📌 **Asset Spec** — 视觉和音频需求已定义。在 Art Bible 批准后，运行 `/asset-spec system:enemy-ai` 生成每个敌人原型的具体 asset 描述、尺寸和 AI 生成 prompt。

---

## UI Requirements

本系统不直接渲染玩家可见 UI。以下 UI 需求供开发和调试使用：

### 开发/调试 UI

| UI 元素 | 用途 | 可见性 |
|---------|------|--------|
| AI 状态标签 | 在敌人头顶显示当前状态（IDLE/COMBAT/SEARCHING/STUNNED/DEAD）文字 | 仅调试模式 |
| 视野锥可视化 | 半透明锥形（绿色=未检测/红色=已检测）显示当前视野范围 | 仅调试模式 |
| 导航网格叠加 | 半透明蓝色叠加显示 NavigationRegion2D 网格 | 仅调试模式 |
| 目标优先级排名 | 显示敌人当前评估的前 3 个目标及其优先级分数 | 仅调试模式 |
| AI 性能面板 | 实时显示活跃敌人数量、AI 总帧时间、每敌人平均 μs | 仅开发/QA 构建 |

### 玩家可见 UI

无——敌人的状态信息通过视觉反馈（动画、VFX、颜色变化）传达，不通过 UI 元素。例如：
- 眩晕 → 星形图标（VFX，非 UI）
- 低血量 → 身体冒烟（VFX）
- 检测玩家 → 感叹号图标（VFX）

### Cross-References

| 本文档引用 | 目标文档 | 引用的具体元素 | 性质 |
|-----------|---------|--------------|------|
| 敌人 HP/dtc 数值 | `design/gdd/health-damage.md` | Light 200/dt1.0, Medium 400/dt0.8, Heavy 800/dt0.5 | 数据依赖 |
| 敌人碰撞层（层2） | `design/gdd/physics-config.md` | 碰撞矩阵、CharacterBody2D/RigidBody2D 规范 | 数据依赖 |
| 敌人调用 fire(origin, target, bullet_type) | `design/gdd/shooting-projectile.md` | 射击弹道创建接口——`fire()` 定义于 shooting-projectile.md Detailed Design §1，敌人传入 `bullet_type="standard"` | 接口依赖 |
| 敌人子弹伤害计算 | `design/gdd/health-damage.md` | damage_formula、type_factors | 公式依赖 |
| Patrol paths/NavPolygon | `design/gdd/level-design-data.md`（未设计） | 巡逻路径点、NavigationRegion2D | 数据依赖 |
| Spawn/despawn signals | `design/gdd/enemy-spawn-wave.md`（未设计） | 激活/停用信号 | 接口依赖 |
| Boss AI extension | `design/gdd/boss-ai.md`（Approved） | Boss 继承/扩展敌人基础 AI | 继承依赖 |

## Acceptance Criteria

### A. 敌人原型

- **AC1**: GIVEN 一个 Scout 处于 COMBAT 状态且导航范围内有可用掩体位，WHEN Scout 评估战斗位置，THEN Scout 在进入战斗 3.0s 内向 cover_score 最高的掩体移动（按 F3 公式计算）

- **AC2**: GIVEN 两个 Soldier 敌人相距 400px 以内均处于 COMBAT 状态，WHEN 任一 Soldier 将玩家锁定为目标，THEN 两者射击间隔错开至少 0.3s（同级敌人不同时开火）

- **AC3a（眩晕触发守卫）**: GIVEN Heavy（stun_threshold=600）受到 impulse=500 的冲击（< 阈值），WHEN 眩晕判定执行，THEN 不触发眩晕（stun_duration=0，状态不变）

- **AC3b（眩晕时长公式）**: GIVEN Heavy（stun_threshold=600）受到 impulse=900 的冲击（≥ 阈值，excess_ratio=0.5），WHEN 按 F2 公式计算，THEN multiplier=1+(0.5/2.5)×2=1.4, stun_duration=clamp(0.4×1.4, 0.3, 1.2)=0.56s。GIVEN Heavy 受到 impulse=600（刚好阈值，excess_ratio=0），THEN multiplier=1.0, stun_duration=clamp(0.4, 0.3, 1.2)=0.4s（最小基础值）

- **AC4**: GIVEN Carrier 已将玩家锁定为目标且距离 ≤ 50px 持续 0.2s，WHEN 自爆序列触发，THEN Carrier 先闪烁红色预警 0.2s，然后自爆，对 150px 半径内所有物理体造成 AOE 伤害（impulse=800, type=explosion）

### B. 感知模型

- **AC5**: GIVEN 敌人在 vision_range（600px）和 vision_angle（120°锥形）内面向玩家，WHEN 3 条射线（头/躯干/脚）均被 World 层遮挡，THEN 敌人不检测到玩家。WHEN 至少一条射线无遮挡且玩家在范围/角度内，THEN 敌人经过 detection_delay（0.3s）后检测到玩家

- **AC6**: GIVEN 敌人处于非 DEAD 状态，WHEN 距上次感知检查已过 0.2s，THEN 敌人执行一次完整感知检查（距离+角度+射线）。距上次检查不足 0.2s 时跳过

### C. 状态机

- **AC7**: GIVEN 敌人处于 IDLE 状态，WHEN 感知系统检测到玩家且 detection_delay（0.3s）期满后玩家仍可见，THEN 敌人转入 COMBAT 状态

- **AC8**: GIVEN 敌人处于 COMBAT 状态，WHEN 玩家已连续 ≥ 3.0s（memory_duration）未被检测到，THEN 敌人转入 SEARCHING 状态并记录玩家最后已知位置

- **AC9**: GIVEN 敌人处于 SEARCHING 状态移向 last_known_pos，WHEN 5.0s 内未重新检测到玩家，THEN 敌人转入 IDLE。WHEN 在 SEARCHING 期间重新检测到玩家，THEN 立即切换回 COMBAT

- **AC10**: GIVEN 处于 COMBAT 状态的敌人被眩晕，WHEN stun_duration 期满，THEN 敌人恢复 COMBAT 状态（而非 IDLE）。GIVEN 处于 SEARCHING 状态的敌人被眩晕，WHEN 眩晕结束，THEN 恢复 SEARCHING

- **AC11**: GIVEN 敌人 HP 降至 0，WHEN entity_died 信号触发，THEN 敌人转入 DEAD 状态，停止所有行为处理，碰撞体保留（等待死亡重生系统回收），发出 `state_changed("DEAD")` 信号

### D. 战斗行为

- **AC12**: GIVEN 敌人处于 COMBAT 状态且有有效目标和冷却已过，WHEN 调用 `fire(enemy_muzzle_pos, target_pos, "standard", self)`，THEN 生成一个朝目标飞行的子弹，弹道散布按 F5 公式计算。source_entity=self → 子弹对 Enemy 层（层2）关闭碰撞、不触发 hit-stop——仅伤害玩家和可破坏环境元素，不伤及其他敌人

- **AC13**: GIVEN 敌人射程内同时有玩家和爆炸桶，WHEN 爆炸桶的优先级得分（type_value × distance_factor × los_factor）超过玩家，THEN 敌人射击爆炸桶而非玩家。目标优先级每 0.5s 重新计算

### E. 公式验证

- **AC14（F1 视野检测）**: GIVEN 敌人在 (0,0) 面朝右，玩家在 (500,200)，WHEN 感知检查执行，THEN is_visible = (500≤600) AND (atan2(200,500)≈21.8°≤60°) AND 射线无遮挡 → TRUE。GIVEN 玩家在 (700,0)，THEN 700>600 → FALSE。GIVEN 玩家在 (0,500)，THEN 夹角 90°>60° → FALSE

- **AC15（F2 眩晕时长）**: GIVEN Scout（threshold=150）受到 impulse=160（≥阈值），WHEN excess_ratio=max(160/150-1,0)≈0.067, multiplier=1+(0.067/2.067)×2≈1.065，THEN stun_duration=clamp(0.4×1.065, 0.3, 1.2)≈0.426s。GIVEN Scout 受到 impulse=300（excess_ratio=1.0），multiplier=1+(1.0/3.0)×2≈1.667，THEN stun_duration=clamp(0.4×1.667, 0.3, 1.2)=0.667s

- **AC16（F3 掩体评分）**: GIVEN Scout 评估两个掩体 A（block=1.0, reach=0.9, safety=0.3）和 B（block=0.8, reach=0.4, safety=0.9），WHEN score(A)=1.0×(0.4×0.9+0.6×0.3)=0.54，score(B)=0.8×(0.4×0.4+0.6×0.9)=0.56，THEN Scout 选择 B

- **AC17（F4 目标优先级）**: GIVEN 敌人评估玩家（type=100, dist=300, los=1.0）→ priority=100×0.667=66.7。爆炸桶（type=80, dist=200, los=1.0）→ priority=80×0.75=60.0。THEN 玩家被优先瞄准（66.7 > 60.0）

- **AC18（F5 散布）**: GIVEN Soldier（base_spread=8°）在距离 800px 处射击，WHEN spread=8×clamp(1+800/800,1,3)=8×2.0=16°，THEN 子弹方向在瞄准方向 ±16° 范围内随机偏移。GIVEN 距离 2000px，WHEN clamp(1+2000/800,1,3)=3.0，THEN spread=24°

- **AC19（F6 Hazard 代价）**: GIVEN 导航区域 hazard_level=2，Scout arch_weight=2.5，WHEN travel_cost=1+2×2.5=6.0，THEN A* 优先选择 3 格普通地砖（总成本 3.0）而非 1 格经过危险区（成本 6.0）

### F. 边缘案例

- **AC20**: GIVEN 玩家躲在可破坏掩体后方且敌人视线仅被该掩体阻挡，WHEN 敌人处于 COMBAT 状态，THEN 敌人优先射击可破坏掩体（type_value=50）直到掩体摧毁、视线恢复

- **AC21**: GIVEN 两个 Scout 争夺同一掩体，WHEN 第一个 Scout 到达掩体，THEN 第二个 Scout 将该掩体标记为占用（cover_score ×0.3 惩罚），改选次优掩体

- **AC22**: GIVEN 玩家在视野范围边界（~600px）来回进出，WHEN 离开和重新进入的时间间隔 < 0.3s（detection_delay），THEN 敌人不在 IDLE 和 COMBAT 之间来回切换

- **AC23**: GIVEN 敌人在 STUNNED 状态下被击退至悬崖边缘外，THEN 敌人正常受重力下落死亡。不瞬移回可通行地形——有意的环境击杀

- **AC24**: GIVEN 单个敌人已有一条通往玩家的计算路径，WHEN 新碎片（爆炸瓦砾）阻挡该路径，THEN 该敌人在 0.5s 内使用更新后的导航数据重新计算路径。并发敌人≥5 时 tolerance 放宽至 1.0s

- **AC25**: GIVEN Scout 处于无任何 cover_score>0 的开阔房间，WHEN 掩体选择评估完成，THEN Scout 回退到最大距离策略——定位到房间内距玩家最远的可到达位置

- **AC26**: GIVEN 两个目标优先级得分完全相同，WHEN 破平处理，THEN 按 type_value > distance（近者优先）> random 顺序选择

- **AC27**: GIVEN Carrier 距玩家 ≤ 50px 持续 0.2s，WHEN 自爆序列触发，THEN 先闪烁红色 0.2s 再爆炸。IF Carrier 在闪烁期间 HP 降至 0，THEN 立即爆炸（无等待）

- **AC28**: GIVEN Carrier（RigidBody2D）被推出导航区域边界，WHEN 下一个 AI tick 执行，THEN Carrier 导航到最近 nav 边缘点并施加移动力返回

- **AC29**: GIVEN 敌人在射击动画中 HP 降至 0，WHEN entity_died 信号触发，THEN 射击动画立即中断，不产生子弹，状态转入 DEAD

- **AC30**: GIVEN Heavy 同时受到两股冲击（impulse_A=900→stun=0.667s, impulse_B=1200→stun=0.8s），WHEN 计算最终眩晕时长，THEN 使用最长时长（0.8s），不累加

- **AC31**: GIVEN 敌人处于 SEARCHING 状态，WHEN 玩家从敌人视野锥外背后接近且距离 > 100px，THEN 敌人不检测到玩家。距离 < 100px 时强制感知（进入 COMBAT）

### G. 跨系统接口

- **AC32**: GIVEN 敌人状态机发生转换（IDLE→COMBAT、COMBAT→SEARCHING、SEARCHING→IDLE、任意→STUNNED、任意→DEAD），THEN 发出 `state_changed(from_state, to_state)` 信号。MVP 阶段仅验证信号正确发出——消费者（音频/VFX/UI）为 Alpha 阶段实现

- **AC33**: GIVEN 敌人发射的子弹飞向玩家，WHEN 子弹先碰到 World 层可破坏元素，THEN 子弹对该元素施加碰撞伤害并被消耗（不能穿透元素后继续击中玩家）

### H. 性能

- **AC34**: GIVEN 场景中存在 15 个各种状态的激活敌人，WHEN 游戏以 60fps 运行，THEN 所有敌人的 AI 更新总成本（感知+状态机+寻路+战斗决策）每帧 ≤ 2ms

## Open Questions

| # | 问题 | 负责人 | 目标日期 | 影响 |
|---|------|--------|---------|------|
| 1 | 敌人射击环境物体是否会产生意外难度峰值？（如士兵连续射击爆炸桶导致连锁超出设计预期） | game-designer | MVP 测试前 | 可能需要"环境射击冷却"防止敌人连续引爆 |
| 2 | NavigationPolygon 在关卡中被破坏后如何动态更新？重新烘焙 nav 网格的成本在移动端是否可控？ | engine-programmer | MVP 前 | 如果 nav 网格重新烘焙太慢，需要备选方案（简化 A* 在 PhysicsObject 之间的方格导航） |
| 3 | 低端 Android（如 Snapdragon 625）上 15 个 NavigationAgent2D 的性能表现未知 | engine-programmer | MVP 前（与 physics-config profiling 同步） | 如果性能超标，需要"休眠远处敌人 AI"机制（>1200px 的敌人仅保留感知，不导航） |
| 4 | 侦察兵的掩体选择在复杂废墟环境中是否能找到有意义的掩体位置？ | game-designer | MVP 测试阶段 | 可能需要增加"World 层拐角"作为掩体候选（非 PhysicsObject 掩体） |
| 5 | 自爆兵在 RigidBody2D 模式下的物理响应是否与预期一致——被击中后飞向玩家还是远离玩家？ | gameplay-programmer | MVP 原型阶段 | impulse 方向和物理力方向的对应关系需要验证 |
| 6 | 敌人被设计为"可射击环境物体"——这是否可能导致玩家完全不需要亲自射击环境，而是"让敌人帮我打"的被动策略？ | game-designer | MVP 测试阶段 | 如果被动策略过于有效，削弱 Pillar 2（战场是多米诺阵列）的玩家主动权 |
| 7 | ~~是否需要"友军伤害"——自爆兵爆炸是否伤及其他敌人？~~ **已决定**：敌人子弹对 Enemy 层（层2）关闭碰撞（不伤友军）；Carrier 自爆 AOE 对所有层生效（包括 Enemy 层），保持物理真实感 | game-designer | 2026-05-22（已解决） | 已反映至 Detailed Rules §4 和 AC12 |
