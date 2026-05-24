# 连锁传播系统 (Chain Propagation)

> **Status**: In Design
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-20
> **Implements Pillar**: Pillar 2（战场是多米诺骨牌阵列）、Pillar 3（规则稳定，结果惊喜——70% 可预测 + 30% 惊喜）

## Overview

连锁传播系统是"坍塌禁区"核心循环的物理收束环节——它让一次破坏触发下一次破坏，将独立物理事件串联成连锁反应。当材质破坏系统报告"某物体已破坏"，本系统立即查询该位置周围的物理要素（爆炸桶、不稳定结构、敌人），计算传播波及范围和冲击力衰减，并对范围内物体施加二次冲击——可能触发新的破坏，形成多米诺效应。玩家看到的不只是一个物体碎裂，而是一条物理因果链在战场上展开：柱子砸倒油桶、油桶爆炸震碎玻璃天花、玻璃碎片刺穿下方敌人。

本系统同时负责追踪连锁深度（一次触发导致的连锁步数），为评分结算系统提供核心数据。它还实现了 Pillar 3 的关键承诺——**70% 可预测 + 30% 惊喜**：传播规则透明稳定（爆炸半径固定、冲击力衰减公式明确），但碎片飞散方向、物体初始位置和碰撞结果的微小偏差让每次连锁都有不可完全复现的独特展开。

## Player Fantasy

连锁传播系统服务于一种独特的智力快感——**"我扣下一次扳机，战场替我完成了剩下的工作"**。玩家不是用子弹逐一消灭敌人，而是扮演"连锁反应设计师"：在开枪前的 0.5 秒内快速预判传播路径（"打掉这根柱子→砸爆那个油桶→爆炸推倒旁边的墙→墙后的敌人被压死"），然后开火，观看自己的物理预测在屏幕上一步步被验证。

这与传统射击游戏的"瞄准→扣血→下一目标"循环完全不同。在坍塌禁区中，瞄准只是手段，**看连锁展开才是回报**。当一条 5+ 步连锁按预期展开时，玩家体验到的不仅是胜利，更是"我读懂了战场"的智力满足——这正是 Pillar 2（战场是多米诺骨牌阵列）和 Pillar 4（通关靠脑子、不靠反应）在玩家感受层面的交汇点。

同时，Pillar 3（70% 可预测 + 30% 惊喜）决定了连锁传播的情感节奏：70% 的传播路径按物理规则稳定展开——玩家感到**掌控**；30% 的意外偏差（碎片恰好击中未预料的要素、爆炸范围略微超出预期）——玩家感到**惊喜**。这 30% 的惊喜不是随机数——它是物理规则在复杂场景中自然涌现的结果，玩家事后可以**理解**为什么发生了偏差（"因为那块碎片正好碰到了藏在烟雾里的燃料罐"），而不是感到被系统欺骗。

参考：Noita 的"法术+环境=意外连锁"让每次遭遇都有独特叙事；Teardown 的"计划→引爆→观察倒塌"循环让破坏本身成为主角；多米诺骨牌装置艺术的"设置→推倒→观看"节奏。

## Detailed Design

### Core Rules

**1. 传播类型**

| 类型 | MVP | 触发源 | 传播方式 |
|------|-----|--------|----------|
| `debris` | ✓ | 任意物体破坏 | 碎片飞散命中附近物体 |
| `explosion` | ✓ | 爆炸桶、粘弹、燃料罐 | AOE 冲击波 |
| `collapse` | ✓ | 悬挂物/支撑结构破坏 | 上方物体坠落 |

Alpha 阶段扩展：`fire`（火焰传播）、`acid`（酸液腐蚀）。

**2. 传播入口**

系统有两个入口点：
- **间接入口**：监听材质破坏系统的 `object_destroyed(position, material_type, debris_list)` signal
- **直接入口**：射击与弹道系统调用 `trigger_explosion(position, radius, force)`（粘弹引爆）

**3. 传播流程**

```
破坏事件 → 读取源物体的 propagation_type 和 propagation_radius
         → 调用 hit-detection.query_area(position, radius, layer_mask=PhysicsObject|Enemy)
         → 对每个命中对象：
            - 计算距离衰减：effective_force = base_force × (1 - distance/radius)
            - PhysicsObject → apply_impulse(effective_force)
            - Enemy → 生成 HitData 传递给生命值系统
         → 如果命中对象因冲击力被破坏 → 进入递归（新 object_destroyed signal）
         → 连锁深度 +1
```

**4. 连锁深度追踪**

| 字段 | 说明 |
|------|------|
| `chain_depth` | 当前连锁步数（每次传播 +1） |
| `total_destroyed` | 连锁中累计破坏物体数 |
| `total_damage` | 连锁中累计伤害量 |
| `trigger_weapon` | 触发连锁的武器 ID |

连锁终止时（无更多可传播对象或达到最大深度），将 ChainSummary 发送给评分结算系统。

**5. 70/30 规则实现**

传播的核心逻辑（查询半径、力衰减、命中判定）完全确定性。30% 的"惊喜"来自物理模拟层的自然偏差：
- 碎片初速度随机范围（material-destruction 的 `randf_range(200, 800)`）
- 物体在世界中的精确位置微差
- 多碎片并行飞行的命中时序差异

本系统不主动注入随机数——"惊喜"是涌现属性，非随机属性。

**6. 传播链终止条件**

- AOE 查询范围内无 PhysicsObject 或 Enemy
- chain_depth ≥ max_chain_depth（默认 20，防无限循环）
- 玩家死亡（立即终止当前连锁）

### States and Transitions

| 状态 | 说明 |
|------|------|
| **IDLE** | 无连锁进行中，等待触发 |
| **PROPAGATING** | 连锁正在传播，逐帧处理每个传播步骤 |
| **COOLDOWN** | 连锁结束后短暂冷却（0.1s），防止重复触发 |

### Interactions with Other Systems

| 系统 | 方向 | 数据流 |
|------|------|--------|
| 材质破坏系统 | 上游 | 接收 `object_destroyed(position, material, debris_list)` |
| 射击与弹道系统 | 上游 | 接收 `trigger_explosion(position, radius, force)` |
| 碰撞与命中判定 | 上游 | 调用 `query_area()` 获取范围内物体 |
| 材质破坏系统 | 下游 | 对物体施加冲击力（可能触发二次破坏） |
| 生命值与伤害系统 | 下游 | 传递敌人受到的传播伤害 |
| 2D 摄像机系统 | 下游 | 每个传播步骤触发屏幕震动 |
| 评分结算系统 | 下游 | 输出 ChainSummary（深度、破坏数、伤害量） |
| 音频系统 | 下游 | 触发连锁反应音效事件 |

## Formulas

### 传播源冲击力

传播事件的源冲击力 `F_source` 定义如下：

```
F_source = D_threshold + max(0, I_incoming - D_threshold) × 0.25
```

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 材质破坏阈值 | `D_threshold` | float | 200–1000 | 源物体的材质破坏阈值 |
| 入射冲击力 | `I_incoming` | float | 0–2000 | 触发破坏的那次冲击力大小 |
| 过杀贡献系数 | — | const | 0.25 | 超过阈值的能量有多少进入传播 |

**输出范围**: 200（木材被刚好阈值击中）到 1250（混凝土被 2000 冲击力击中后过杀）

**示例**: 木材物体（D_threshold=200）被 impact_force=500 的子弹击中 → `F_source = 200 + (500-200) × 0.25 = 275`

### 传播力距离衰减

传播冲击力随距离衰减，不同类型使用不同曲线：

```
F_received = F_source × C_type × DepthMult(depth) × Attn_dist(d, r)

Attn_dist(d, r) = 1 - (d / r)^exp
```

**传播类型参数**:

| 类型 | exp | C_type（效率） | r（半径 px） | 设计理由 |
|------|-----|---------------|-------------|----------|
| `debris` | 3.0 | 0.85 | 100 | 近端几乎满力，远端急剧衰减 |
| `explosion` | 1.5 | 0.70 | 250 | 中等衰减，宽范围 |
| `collapse` | 1.0 | 1.00 | 200 | 线性衰减，重力传递高效 |

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 传播源冲击力 | `F_source` | float | 200–1250 | 由上一公式计算 |
| 类型效率系数 | `C_type` | float | 0.70–1.00 | 传播类型的基础效率 |
| 到源点距离 | `d` | float | 0–r | 命中对象到破坏中心距离 |
| 传播半径 | `r` | float | 100–250 | 传播类型决定 |
| 衰减指数 | `exp` | float | 1.0–3.0 | 衰减曲线形状 |
| 深度惩罚 | `DepthMult(depth)` | float | 0–1.0 | 见下公式 |

**示例**: 木材爆炸（F_source=275, C_type=0.70, r=250, exp=1.5），距离源点 100px 处 → `Attn_dist = 1 - (100/250)^1.5 = 0.747` → `F_received = 275 × 0.70 × DepthMult × 0.747`

### 连锁深度惩罚

```
DepthMult(depth) = 1 - (depth / 20)²       （depth < 20 时）
DepthMult(depth) = 0                        （depth ≥ 20 时——硬上限终止）
```

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 当前连锁深度 | `depth` | int | 1–20 | 从 1 开始计数 |

| depth | DepthMult | 剩余力 |
|-------|-----------|--------|
| 1 | 0.9975 | ~100% |
| 5 | 0.9375 | 94% |
| 10 | 0.75 | 75% |
| 15 | 0.4375 | 44% |
| 20 | 0 | 硬终止 |

### 传播破坏判定

传播力与直接命中使用完全相同的破坏判定逻辑（引用材质破坏系统公式）：

```
will_destroy = (accumulated_damage + F_received) ≥ D_threshold
```

传播不给破坏阈值加额外折扣——衰减本身已经让传播力天然低于直接命中。

### 连锁评分

```
chain_score = (Σ destroyed_value × 100 + total_damage × 0.5) × depth_bonus

depth_bonus = chain_depth^1.5
```

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 连锁中每个被破坏物的价值 | `destroyed_value` | float | 1–5 | 物体重要性（普通=1, 爆炸桶=2, Boss 关联=5） |
| 连锁总伤害 | `total_damage` | float | 0–10000 | 连锁对敌人造成的总伤害 |
| 连锁深度 | `chain_depth` | int | 1–20 | 传播步数 |
| 深度加成 | `depth_bonus` | float | 1.0–89.4 | depth^1.5 |

**示例**: 深度 5 连锁，破坏 3 个普通物体 + 1 个爆炸桶 + 累计伤害 200:
`chain_score = (3×1×100 + 1×2×100 + 200×0.5) × 5^1.5 = (300 + 200 + 100) × 11.18 = 6708`

## Edge Cases

- **同一帧两个物体同时被破坏**: 每个破坏事件独立排队处理，按破坏发生的时间戳顺序逐一展开传播查询。第二个事件查询时，第一个事件已破坏的物体已从物理空间移除（不再命中）。

- **两个传播波前重叠**: 每个物体在单次连锁中只被处理一次。通过 `processed_in_chain` 标记集去重——如果一个物理物体同时出现在两次 AOE 查询结果中，只在第一次命中时施加冲击力。

- **源物体在传播处理中已失效**: 传播处理前检查 `is_instance_valid(source_object)`。如果源物体已被 free（如碎片回收），使用其最后已知位置继续传播查询。

- **碎片飞出场景边界**: 碎片超出关卡边界后回收（material-destruction 负责），回收时不再触发传播。但如果碎片在边界外命中其他物体——该物体仍在传播范围内，正常处理。

- **敌人同时被多个传播源命中**: 每个传播源独立生成 HitData → 伤害系统分别处理。不存在"合并伤害"逻辑——与 hit-detection 的多命中规则一致。

- **连锁深度达到硬上限时仍有物体在范围内**: 连锁立即标记为 SETTLED，不施加剩余范围内物体的冲击力。ChainSummary 记录 `terminated_by_depth_limit = true`，供评分系统决定是否扣分。

- **爆炸传播命中已处于 DAMAGED 状态的可破坏物**: 传播冲击力累积到 `accumulated_damage` 中（与直接命中相同判定逻辑）。如果累积超过阈值 → 触发破坏 → 连锁继续。

- **粘弹附着期间其宿主被连锁破坏**: 附着对象被破坏 → 粘弹变为无 parent 状态，在宿主最后已知位置引爆（使用上次坐标）。与 shooting-projectile GDD 的"附着对象已销毁"规则一致。

- **COOLDOWN 状态下收到新破坏事件**: 新事件放入 pending 队列，COOLDOWN 结束后立即处理。队列深度最大 5——超过 5 个时丢弃最早事件（极端情况，如连锁仍在进行中玩家开始新连锁）。

- **自引用保护**: 传播查询的 layer_mask 排除已被标记为 `processed_in_chain` 的物体节点——已在此链中被破坏的物体不会再次被命中。

## Dependencies

| 系统 | 方向 | 性质 | 数据接口 |
|------|------|------|----------|
| 关卡设计数据系统 | 上游 | 硬依赖 | 读取 `physics_objects[]` 初始化连锁节点图及空间邻接关系 |
| 材质破坏系统 | 上游 | 硬依赖 | 接收 `object_destroyed(position, material, debris_list)` signal |
| 碰撞与命中判定 | 上游 | 硬依赖 | 调用 `query_area(position, radius, layer_mask)` |
| 射击与弹道系统 | 上游 | 软依赖 | 接收 `trigger_explosion(position, radius, force)` 调用 |
| 材质破坏系统 | 下游 | 硬依赖 | 对可破坏物施加冲击力——可能触发二次破坏 |
| 生命值与伤害系统 | 下游 | 硬依赖 | 传递敌人受到的传播伤害 HitData |
| 2D 摄像机系统 | 下游 | 软依赖 | 连锁每一步触发屏幕震动 |
| 评分结算系统 | 下游 | 软依赖 | 输出 ChainSummary（depth, destroyed, damage） |
| 音频系统 | 下游 | 软依赖 | 触发连锁反应音效 |

**交叉验证**:
- material-destruction.md 将连锁传播列为下游软依赖 ✓
- hit-detection.md 将连锁传播列为下游硬依赖（AOE 查询）✓
- shooting-projectile.md 将连锁传播列为下游软依赖（粘弹引爆）✓

## Tuning Knobs

| 参数 | 默认值 | 安全范围 | 说明 | 过高后果 | 过低后果 |
|------|--------|----------|------|---------|---------|
| `max_chain_depth` | 20 | 5–50 | 连锁硬上限深度 | 长连锁拖慢帧率（每步 AOE 查询） | 连锁过早终止，失去多米诺快感 |
| `overkill_coefficient` | 0.25 | 0.0–1.0 | 过杀能量进入传播的比例 | 强力武器连锁过强，弱武器无意义 | 过杀能量浪费，连锁强度只取决于材质 |
| `propagation_cooldown` | 0.1 | 0.0–0.5 | 连锁结束后冷却时间（秒） | 冷却过长，连锁之间不连贯 | 0=无冷却，连锁可能重叠混乱 |
| `debris_radius` | 100 | 50–300 | 碎片传播半径（px） | 碎片传播过远，不真实 | 碎片连锁几乎不存在 |
| `debris_efficiency` | 0.85 | 0.3–1.0 | 碎片传播效率 | 碎片连锁过强 | 碎片无法触发连锁 |
| `debris_exp` | 3.0 | 1.5–5.0 | 碎片衰减曲线指数 | 只有紧贴才有连锁 | 远端衰减不足 |
| `explosion_radius` | 250 | 100–500 | 爆炸传播半径（px） | 爆炸覆盖整个房间，无策略性 | 爆炸范围太小，无法触发连锁 |
| `explosion_efficiency` | 0.70 | 0.3–1.0 | 爆炸传播效率 | 爆炸连锁过强 | 爆炸无法触发连锁 |
| `explosion_exp` | 1.5 | 1.0–3.0 | 爆炸衰减曲线指数 | 近端衰减过快 | 远端衰减不足 |
| `collapse_radius` | 200 | 100–400 | 倒塌传播半径（px） | — | — |
| `collapse_efficiency` | 1.00 | 0.5–1.0 | 倒塌传播效率 | 结构倒塌连锁过强 | 倒塌无连锁效果 |
| `collapse_exp` | 1.0 | 0.5–2.0 | 倒塌衰减曲线指数 | 非线性衰减时重力感丢失 | 远端衰减过强 |
| `depth_bonus_exponent` | 1.5 | 1.0–2.0 | 评分深度指数 | 深度奖励过重（玩家只追深度） | 无深度奖励（浅连锁和深连锁无区别） |
| `pending_queue_max` | 5 | 3–10 | COOLDOWN 期间待处理事件队列上限 | 队列过深时内存压力 | 多事件时丢失连锁 |

## Visual/Audio Requirements

| 事件 | 视觉 | 音频 | 优先级 |
|------|------|------|--------|
| 传播步骤触发 | 从破坏中心扩散的冲击波环（半透明、快速衰减，~150ms） | 低音脉冲（音高随深度递减） | MVP |
| 爆炸传播 | 橙色冲击波 + 火花粒子 + 屏幕微震 | 低频爆炸 + 碎片飞溅声 | MVP |
| 碎片传播 | 细小冲击线从碎片飞出方向延伸 | 轻微碎裂声 | Alpha |
| 倒塌传播 | 尘土上升 + 结构倾斜 | 低沉倒塌声 + 地面震动 | MVP |
| 连锁深度里程碑（3/5/10/15步） | 屏幕边缘闪烁（颜色随深度加深：白→橙→红） | 递增音阶（每级提高半音） | Alpha |
| 连锁终止 | 最终冲击波收缩回中心 → 消失 | 余音衰减（reverb tail, 0.5s） | Alpha |

> **Asset Spec**: 传播冲击波环可用圆形 Polygon2D + 径向 ShaderMaterial（alpha 衰减 + 厚度变化），无需位图素材。

## UI Requirements

| UI 元素 | 显示内容 | 触发时机 | 位置 | 优先级 |
|---------|---------|---------|------|--------|
| 连锁深度计数器 | "Chain ×N"（N=当前深度） | 连锁进行中持续显示 | 画面上方居中 | MVP |
| 连锁总结弹出 | 深度/破坏数/伤害量/评分 | 连锁终止后 0.5s | 画面中央短暂显示（2s 后消失） | Alpha |
| 深度里程碑提示 | "3-STEP" / "5-STEP" / "10-STEP" 大字弹出 | 达到对应深度时 | 计数器下方 | Alpha |

## Acceptance Criteria

### 传播类型与核心流程

- **AC1**: GIVEN 木材物体被破坏（propagation_type=debris, radius=100），WHEN material-destruction 发射 `object_destroyed` signal，THEN 系统调用 hit-detection.query_area(position, 100, PhysicsObject|Enemy)，开始传播处理
- **AC2**: GIVEN shooting-projectile 调用 `trigger_explosion(position, 250, 1000)`，WHEN 粘弹引爆，THEN 系统以 position 为中心、radius=250 使用 explosion 参数（c_type=0.70, exp=1.5）进行 AOE 查询
- **AC3**: GIVEN 支撑结构被破坏（propagation_type=collapse, radius=200），WHEN object_destroyed signal 到达，THEN 系统使用 collapse 参数（c_type=1.00, exp=1.0）线性衰减计算传播力
- **AC4**: GIVEN AOE 查询返回一个 PhysicsObject，WHEN 执行传播步骤，THEN 对该 PhysicsObject 调用 `apply_impulse(F_received)`
- **AC5**: GIVEN AOE 查询返回一个 Enemy，WHEN 执行传播步骤，THEN 生成包含 impulse=F_received 的 HitData 传递给生命值与伤害系统
- **AC6**: GIVEN PhysicsObject 收到传播冲击力且 `accumulated_damage + F_received ≥ D_threshold`，WHEN 物体被破坏，THEN 触发新 `object_destroyed` signal → 递归传播，chain_depth +1

### 公式验证

- **AC7**: GIVEN 木材物体（D_threshold=200）被 impact_force=500 命中破坏，WHEN 计算 F_source，THEN F_source = 200 + (500-200) × 0.25 = 275
- **AC8**: GIVEN 金属物体（D_threshold=500）被刚好阈值命中（无过杀），WHEN 计算 F_source，THEN F_source = 500 + 0 = 500
- **AC9**: GIVEN 混凝土物体（D_threshold=1000）被 impact_force=2000 命中破坏，WHEN 计算 F_source，THEN F_source = 1000 + (2000-1000) × 0.25 = 1250
- **AC10**: GIVEN debris 传播（F_source=275, d=50, r=100, exp=3.0, c_type=0.85），WHEN 计算 F_received，THEN Attn_dist = 0.875, F_received = 275 × 0.85 × 0.875 × DepthMult ≈ 204.53 × DepthMult
- **AC11**: GIVEN explosion 传播（F_source=275, d=100, r=250, exp=1.5, c_type=0.70），WHEN 计算 F_received，THEN Attn_dist = 0.747, F_received = 275 × 0.70 × 0.747 × DepthMult ≈ 143.80 × DepthMult
- **AC12**: GIVEN collapse 传播（F_source=275, d=100, r=200, exp=1.0, c_type=1.00），WHEN 计算 F_received，THEN Attn_dist = 0.5, F_received = 275 × 1.00 × 0.5 × DepthMult = 137.50 × DepthMult
- **AC13**: GIVEN chain_depth=5，WHEN 计算 DepthMult，THEN DepthMult = 1 - (5/20)² = 0.9375
- **AC14**: GIVEN chain_depth=20（硬上限），WHEN 计算 DepthMult，THEN DepthMult = 0，连锁硬终止
- **AC15**: GIVEN chain_depth=19，WHEN 计算 DepthMult，THEN DepthMult = 1 - (19/20)² = 0.0975
- **AC16**: GIVEN 木材物体 accumulated_damage=0，F_received=250，WHEN 执行破坏判定，THEN 250 ≥ 200，will_destroy = true
- **AC17**: GIVEN 金属物体 accumulated_damage=400，F_received=150，WHEN 执行破坏判定，THEN 400+150=550 ≥ 500，will_destroy = true
- **AC18**: GIVEN 混凝土物体 accumulated_damage=0，F_received=800，WHEN 执行破坏判定，THEN 800 < 1000，will_destroy = false，accumulated_damage=800
- **AC19**: GIVEN 深度 5 连锁（3 普通物体 value=1 + 1 爆炸桶 value=2 + total_damage=200），WHEN 计算 chain_score，THEN chain_score = (300+200+100) × 5^1.5 = 600 × 11.18 = 6708
- **AC20**: GIVEN 连锁 1 步、无破坏、无伤害，WHEN 计算 chain_score，THEN chain_score = 0

### Edge Cases

- **AC21**: GIVEN 同一帧两个物体同时被破坏，WHEN 两个 object_destroyed signal 到达，THEN 按时间戳顺序独立排队处理，第二个事件查询时第一个事件的物体已从空间移除
- **AC22**: GIVEN 同一次连锁中两次 AOE 范围重叠、同一 PhysicsObject 在两次结果中，WHEN 第二次命中，THEN processed_in_chain 标记阻挡重复处理
- **AC23**: GIVEN 源物体在传播处理前被 free（is_instance_valid=false），WHEN 传播步骤执行，THEN 使用最后已知位置进行 AOE 查询，不崩溃
- **AC24**: GIVEN chain_depth=20 已达 max_chain_depth、范围内仍有物体，WHEN 下一传播步骤，THEN 连锁立即 SETTLED，ChainSummary.terminated_by_depth_limit=true
- **AC25**: GIVEN 某物体已在本轮连锁中标记为 processed_in_chain，WHEN 后续 AOE 查询，THEN 该物体不在结果中，不产生自引用命中
- **AC26**: GIVEN 系统处于 COOLDOWN 状态，WHEN 收到新 object_destroyed signal，THEN 事件放入 pending 队列，COOLDOWN 结束后立即处理
- **AC27**: GIVEN 金属物体 accumulated_damage=450（DAMAGED），收到爆炸传播 F_received=100，WHEN 执行破坏判定，THEN 450+100=550 ≥ 500，触发破坏
- **AC28**: GIVEN COOLDOWN 期间收到 7 个新事件（pending_queue_max=5），WHEN 入队处理，THEN 保留最新 5 个，丢弃最早 2 个
- **AC29**: GIVEN 粘弹附着在 PhysicsObject 上、宿主被连锁破坏，WHEN 宿主进入 DESTROYED，THEN 粘弹在宿主最后已知位置引爆

### 性能约束

- **AC30**: GIVEN 连锁已达 max_chain_depth=20，WHEN 下一传播步骤，THEN 系统立即终止，不进行 AOE 查询，不施加冲击力
- **AC31**: GIVEN 一次连锁传播循环，WHEN 传播进行中，THEN AOE 查询总次数 ≤ max_chain_depth

### 跨系统接口

- **AC32**: GIVEN material-destruction 发射 `object_destroyed(position, material_type, debris_list)`，WHEN 系统监听此 signal，THEN 正确读取三个参数，根据 material_type 确定 propagation_type 和 propagation_radius
- **AC33**: GIVEN 传播步骤需要查询范围内物体，WHEN 调用 `query_area(position, radius, layer_mask=PhysicsObject|Enemy)`，THEN 返回范围内所有 PhysicsObject 和 Enemy 列表
- **AC34**: GIVEN AOE 查询返回 Enemy 且 F_received > 0，WHEN 执行传播步骤，THEN 生成 HitData（impulse=F_received）传递给生命值与伤害系统
- **AC35**: GIVEN 一次连锁终止，WHEN 生成 ChainSummary，THEN 输出包含 chain_depth、total_destroyed、total_damage、trigger_weapon、terminated_by_depth_limit
- **AC36**: GIVEN shooting-projectile 调用 `trigger_explosion(position, radius, force)`，WHEN 粘弹引爆，THEN 使用 explosion 传播参数进行 AOE 传播，radius 和 force 从调用参数读取

### 状态机

- **AC37**: GIVEN 系统处于 IDLE 状态，WHEN 收到 object_destroyed signal 或 trigger_explosion 调用，THEN 系统进入 PROPAGATING 状态
- **AC38**: GIVEN 系统处于 PROPAGATING 状态，WHEN 传播终止条件满足，THEN 进入 COOLDOWN 状态，持续 propagation_cooldown=0.1s
- **AC39**: GIVEN 系统处于 COOLDOWN 状态，WHEN 0.1s 冷却到达，THEN 进入 IDLE 状态；若 pending 队列非空则立即处理下一个事件

### 连锁终止条件

- **AC40**: GIVEN AOE 查询结果为空列表，WHEN 传播步骤执行，THEN 连锁终止，chain_depth 不再增加
- **AC41**: GIVEN 连锁传播进行中（PROPAGATING），WHEN 玩家死亡事件触发，THEN 连锁立即终止，不处理 pending 队列
- **AC42**: GIVEN 玩家使用 weapon_id="standard_rifle" 触发初始破坏，WHEN 连锁开始，THEN ChainSummary.trigger_weapon = "standard_rifle"

## Open Questions

| 问题 | 负责人 | 目标日期 | 状态 |
|------|--------|---------|------|
| 是否需要"连锁路径预测"——开枪前显示可能的连锁路径？ | game-designer | Alpha 前 | MVP 不做——让玩家自己学习 |
| 深度里程碑的 UI 弹出是否打断战斗节奏？ | ux-designer | MVP 前 | 需实际测试 2 种方案（大字弹出 vs 仅计数器数字变大） |
| 碎片传播（debris）的冲击波视觉是否必要？还是碎片飞行本身就是视觉反馈？ | art-director | MVP 前 | MVP 仅碎片飞行为主，冲击波可选 |
| fire/acid 传播类型进入 Alpha 时的具体传播规则？ | systems-designer | Alpha 前 | 留待 Alpha GDD 扩展 |
| 连锁总结界面是否需要"回放"功能（慢动作重播连锁过程）？ | game-designer | Full Vision | MVP/Alpha 不做 |
