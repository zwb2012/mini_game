# 生命值与伤害系统 (Health & Damage)

> **Status**: In Design
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-20
> **Implements Pillar**: Pillar 1（每一发子弹都有重量——伤害来自物理冲击力）

## Overview

生命值与伤害系统是"命中→后果"链路的终端——它将碰撞与命中判定传递的 HitData 转化为具体的伤害数值，管理所有实体的生命值池，并在生命值归零时触发死亡事件。本系统实现 Pillar 1 的核心承诺——"伤害来自物理冲击力，而非抽象数值"：一颗子弹造成的伤害不是固定的"10 点"，而是由其冲击力（impulse）、命中部位和伤害抗性共同决定的物理后果。同一颗子弹打在敌人胸口和被爆炸桶碎片擦过——伤害完全不同。

本系统同时为下游提供两个关键接口：生命值变化通知（`health_changed` signal 供 HUD 和连锁评分消费）和死亡事件（`entity_died` signal 供死亡重生系统消费）。它不负责死亡后的具体行为（死亡重生系统负责），也不负责生命值的视觉展示（HUD 负责）——它只做一件事：**精确计算伤害、追踪生命值、宣告死亡**。

## Player Fantasy

[To be designed]

## Detailed Design

### Core Rules

**1. 实体类型与生命值**

| 实体 | 默认 HP | 伤害倍率 | 说明 |
|------|---------|----------|------|
| 玩家 (Player) | 1000 | 1.0 | 满血，可被自身连锁伤害 |
| 轻型敌人 | 200 | 1.0 | 一枪残、两枪死 |
| 中型敌人 | 400 | 0.8 | 标准战斗单位 |
| 重型敌人 | 800 | 0.5 | 高耐久，鼓励连锁击杀 |
| Boss | 3000 | 0.3 | 依赖环境连锁，子弹直射效率极低（MVP: Ruin Colossus） |

**2. 伤害计算公式**（精确数值见 Section D）

```
raw_damage = impulse × damage_factor × entity_multiplier
```
- `damage_factor`：冲击力→伤害的全局转换系数（默认 ~0.2）
- `entity_multiplier`：各实体类型的伤害倍率
- 伤害向下游取整

**3. 伤害来源分类**

| 来源 | 生成方 | 说明 |
|------|--------|------|
| 子弹直击 | shooting-projectile | 标准弹/粘弹直接命中 |
| 爆炸波及 | chain-propagation | 爆炸 AOE 范围内 |
| 碎片冲击 | chain-propagation | 碎片命中实体 |
| 倒塌压伤 | chain-propagation | 结构倒塌砸中 |
| 环境伤害 | level-design-data | 酸液池/火焰（Alpha） |

**4. 生命值变化流程**

```
HitData 到达 → 计算 raw_damage → HP = max(0, HP - raw_damage)
             → 发射 health_changed(entity, old_hp, new_hp, damage_source)
             → 如果 new_hp = 0：发射 entity_died(entity, killer_source)
```

**5. 自伤规则**: 玩家受到所有连锁传播的伤害——玩家自身的子弹引发的连锁同样能伤害玩家。这是 Pillar 4 "通关靠脑子"的体现：你必须考虑连锁是否会反噬自己。

**6. 伤害免疫帧**: 无全局伤害免疫帧。同一帧内多次命中独立计算伤害（与 hit-detection 多命中规则一致）。如果需要短暂无敌，由死亡重生系统在重生后提供。

### States and Transitions

| 状态 | 条件 | 行为 |
|------|------|------|
| **ALIVE** | HP > 0 | 正常接受伤害 |
| **LOW_HEALTH** | HP ≤ max_hp × 0.3 | 画面边缘泛红脉冲（HUD 负责视觉），无机制变化 |
| **DEAD** | HP = 0 | 不接受伤害，发射 `entity_died`，等待死亡重生系统处理 |

### Interactions with Other Systems

| 系统 | 方向 | 数据流 |
|------|------|--------|
| 碰撞与命中判定 | 上游 | 接收 `hit_detected(hit_data)` signal |
| 连锁传播系统 | 上游 | 接收爆炸/碎片/倒塌的 HitData |
| HUD 系统 | 下游 | 发射 `health_changed(entity, old_hp, new_hp)` |
| 死亡与重生系统 | 下游 | 发射 `entity_died(entity, killer_source)` |
| 数据埋点系统 | 下游 | 所有伤害事件和死亡事件 |

## Formulas

### 最终伤害值

```
final_damage = floor(impulse × type_factor × dtc)
```

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 冲击力 | `impulse` | float | 0–5000 | 由 HitData 传入的碰撞冲量大小 |
| 伤害类型系数 | `type_factor` | float | 0.05–0.50 | 伤害来源的类型系数，见下表 |
| 实体伤害减免系数 | `dtc` | float | 0.1–1.0 | Damage Taken Coefficient，越低越抗打 |
| 最终伤害 | `final_damage` | int | 0–∞ | 从实体 HP 中扣除的整数伤害值 |

**输出范围**: 0 至 impulse × max(type_factor)——受当前 HP 约束，实际扣减不超过剩余 HP。

### 伤害类型系数

| 伤害类型 | type_factor | 物理机理 | 设计理由 |
|---------|-------------|---------|---------|
| `bullet` | 0.20 | 动能集中传递 | 基线校准：500 impulse 对 dtc=1.0 产生 100 伤害 |
| `explosion` | 0.15 | 冲击波钝伤，能量分散 | AOE 已有范围优势，降低单目标效率 |
| `fragment` | 0.25 | 锐利碎片穿透 | 冲击力转化效率最高，鼓励诱发连锁 |
| `crush` | 0.30 | 重力质量碾压 | 倒塌是大场面核心，高效转化给予连锁反馈 |
| `environment` | 0.20 | 环境危险物 | Alpha 阶段预留 |

**示例**: 轻型敌人（dtc=1.0）被爆炸 F_received=523 impulse 波及 → `floor(523 × 0.15 × 1.0) = 78` 伤害

### 伤害应用与过杀记录

```
armor_damage = floor(final_damage × armor_penalty)     # MVP 阶段 armor_penalty=1.0
hp_loss = min(final_damage, current_hp)
overkill = max(0, final_damage - current_hp)
current_hp = current_hp - hp_loss
```

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 装甲修正 | `armor_penalty` | float | 0–1.0 | Alpha 预留，MVP 恒为 1.0 |
| 实际扣血 | `hp_loss` | int | 0–current_hp | 不会让 HP 变负 |
| 过杀量 | `overkill` | int | 0–∞ | 超出剩余 HP 的溢出伤害 |
| 当前生命值 | `current_hp` | int | 0–max_hp | 受击后剩余 HP |

**示例**: 轻型敌人 HP=50 时受到 fragment 伤害 200 → `hp_loss = min(200, 50) = 50, overkill = 150`

### 致死冲量（推导指标）

```
lethal_impulse = floor(HP / (type_factor × dtc))
```

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 最大生命值 | `HP` | int | 实体 max_hp | 用于设计验证和关卡调优 |
| 致死冲量 | `lethal_impulse` | int | 0–∞ | 需要多少 impulse 才能击杀该实体 |

**示例**: 重型敌人（HP=800, dtc=0.5）被子弹击中的致死冲量 = `floor(800 / (0.20 × 0.5)) = 8000`。标准弹单发 500 impulse，需 16 发。

## Edge Cases

- **同一帧多个 HitData 命中同一实体**: 每个 HitData 独立计算 final_damage，按时间戳顺序依次从 current_hp 扣除。第一个命中若已使 HP 归零，后续命中仍记录 overkill 但不改变 current_hp（保持 0）。

- **HP 归零后仍有待处理伤害事件**: 在 ALIVE→DEAD 转换时立即标记实体为 DEAD，后续 HitData 被忽略（不计算伤害、不发射 health_changed）。但第一帧内已排队的同帧事件按上条处理。

- **伤害减免导致 final_damage = 0**: 合法结果——极低 impulse（如远距离碎片擦过）可能因 floor() 导致伤害归零。不发射 health_changed signal（HP 未实际变化），但仍记录事件供数据埋点。

- **impulse = 0 的命中**: HitData 本身仍有效（可能用于 AI 通知），但伤害计算后 final_damage = 0。不触发 health_changed。

- **已死亡实体被连锁传播命中**: hit-detection 的碰撞矩阵不排除已死亡实体层——但 health-damage 在 DEAD 状态下忽略所有后续 HitData。死亡实体的物理碰撞体仍存在（等待死亡重生系统移除）。

- **负 impulse（理论上不可能）**: HitData 的 impulse 字段为碰撞冲量 magnitude，始终 ≥ 0。如果 API 误用传入负值——`final_damage = 0`（公式取 max(0, impulse) 保护）。

- **实体 HP 上限动态变化（Alpha 预留）**: 如果 max_hp 在运行时被修改且 current_hp > 新 max_hp——`current_hp = min(current_hp, new_max_hp)`（向下钳制，不向上填充）。

## Dependencies

| 系统 | 方向 | 性质 | 数据接口 |
|------|------|------|----------|
| 碰撞与命中判定 | 上游 | 硬依赖 | 接收 `hit_detected(hit_data)` signal |
| 连锁传播系统 | 上游 | 软依赖 | 接收爆炸/碎片/倒塌的 HitData |
| HUD 系统 | 下游 | 硬依赖 | 发射 `health_changed(entity, old_hp, new_hp, source)` |
| 死亡与重生系统 | 下游 | 硬依赖 | 发射 `entity_died(entity, killer_source, overkill)` |
| 数据埋点系统 | 下游 | 软依赖 | 伤害事件、死亡事件日志 |

**交叉验证**:
- hit-detection.md 将生命值与伤害系统列为下游硬依赖 ✓
- chain-propagation.md 将生命值与伤害系统列为下游硬依赖 ✓

## Tuning Knobs

| 参数 | 默认值 | 安全范围 | 说明 | 过高后果 | 过低后果 |
|------|--------|----------|------|---------|---------|
| `player_max_hp` | 1000 | 500–2000 | 玩家最大生命值 | 玩家过强，战斗无紧张感 | 玩家过脆，挫败感强 |
| `light_enemy_hp` | 200 | 100–400 | 轻型敌人 HP | 标准弹需 3+ 发，节奏拖慢 | 一枪一个，连锁无意义 |
| `medium_enemy_hp` | 400 | 200–600 | 中型敌人 HP | — | — |
| `heavy_enemy_hp` | 800 | 500–1200 | 重型敌人 HP | 过于依赖连锁 | 直射即可击杀 |
| `type_factor_bullet` | 0.20 | 0.10–0.40 | 子弹伤害系数 | 直射效率过高，连锁失去意义 | 子弹无伤害感 |
| `type_factor_explosion` | 0.15 | 0.05–0.30 | 爆炸伤害系数 | 爆炸秒杀一切 | 爆炸无威胁 |
| `type_factor_fragment` | 0.25 | 0.10–0.40 | 碎片伤害系数 | 碎片连锁过强 | 碎片连锁无意义 |
| `type_factor_crush` | 0.30 | 0.10–0.50 | 倒塌伤害系数 | 倒塌秒杀 | 倒塌无威慑力 |
| `low_health_threshold` | 0.3 | 0.1–0.5 | 低血量触发比例（max_hp 百分比） | 过早触发，画面干扰 | 触发太晚，无预警 |
| `armor_penalty` | 1.0 | 0–1.0 | 装甲修正（Alpha 启用） | — | — |

## Visual/Audio Requirements

| 事件 | 视觉 | 音频 | 优先级 |
|------|------|------|--------|
| 受到伤害 | 屏幕短暂红闪（~100ms）+ 命中方向指示线 | 受伤音效（音高随伤害量变化） | MVP |
| 进入 LOW_HEALTH（≤30%） | 画面边缘持续红色脉冲 + 心跳节律 | 低血量环境音（低频心跳） | MVP |
| 死亡 | 画面褪色/慢动作 0.5s | 低频冲击 + 静音过渡 | MVP |
| 子弹命中敌人 | 小型命中火花 + 伤害数字（可选） | 命中反馈音 | Alpha |
| 爆炸波及伤害 | 橙色屏幕闪 + 冲击方向 | 低频震音 | MVP |

## UI Requirements

本系统不直接渲染 UI——它定义 HUD 系统消费的数据接口：
- `health_changed(entity, old_hp, new_hp, source)` — HUD 据此更新血条
- `entity_died(entity, killer_source, overkill)` — 死亡重生系统据此触发死亡流程
- `current_hp / max_hp` 比率 — 供 HUD 计算血条填充百分比
- LOW_HEALTH 状态标记 — 供 HUD 切换低血量视觉模式

## Acceptance Criteria

### Core Rules

- **AC1**: GIVEN Player entity initialized with max_hp=1000, dtc=1.0, WHEN created, THEN current_hp=1000, state=ALIVE
- **AC2**: GIVEN Light enemy initialized with max_hp=200, dtc=1.0, WHEN created, THEN current_hp=200
- **AC3**: GIVEN Medium enemy initialized with max_hp=400, dtc=0.8, WHEN created, THEN current_hp=400
- **AC4**: GIVEN Heavy enemy initialized with max_hp=800, dtc=0.5, WHEN created, THEN current_hp=800
- **AC5**: GIVEN Boss entity initialized with max_hp=3000, dtc=0.3, WHEN created, THEN current_hp=3000
- **AC6**: GIVEN Medium enemy (dtc=0.8), WHEN bullet hit with impulse=500 arrives, THEN final_damage=floor(500×0.20×0.8)=80
- **AC7**: GIVEN entity with dtc=1.0, WHEN explosion hit with impulse=1000 arrives, THEN final_damage=floor(1000×0.15×1.0)=150
- **AC8**: GIVEN entity with dtc=1.0, WHEN fragment hit with impulse=1000 arrives, THEN final_damage=floor(1000×0.25×1.0)=250
- **AC9**: GIVEN entity with dtc=1.0, WHEN crush hit with impulse=1000 arrives, THEN final_damage=floor(1000×0.30×1.0)=300
- **AC10**: GIVEN entity with current_hp=200, WHEN hit deals final_damage=50, THEN HP=150, health_changed emitted, no entity_died
- **AC11**: GIVEN entity with current_hp=30, WHEN hit deals final_damage=50, THEN HP=0, health_changed emitted, entity_died emitted with overkill=20
- **AC12**: GIVEN Player with HP=1000, WHEN chain-propagation explosion caused by player's own bullet deals final_damage=150, THEN player HP reduced to 850
- **AC13**: GIVEN Light enemy with HP=200, WHEN two separate bullet hits (each final_damage=100) arrive in same frame, THEN first reduces HP to 100, second reduces HP to 0

### Formulas

- **AC14**: GIVEN Heavy enemy (dtc=0.5), WHEN fragment hit with impulse=600 arrives, THEN final_damage=floor(600×0.25×0.5)=75
- **AC15**: GIVEN entity with current_hp=50, WHEN final_damage=200, THEN hp_loss=min(200,50)=50, current_hp=0
- **AC16**: GIVEN entity with current_hp=200, WHEN final_damage=50, THEN hp_loss=min(50,200)=50, current_hp=150
- **AC17**: GIVEN entity with current_hp=50, WHEN final_damage=200, THEN overkill=max(0,200-50)=150
- **AC18**: GIVEN entity with current_hp=200, WHEN final_damage=150, THEN overkill=max(0,150-200)=0
- **AC19**: GIVEN Medium enemy (HP=400, dtc=0.8) and type_factor_bullet=0.20, THEN lethal_impulse=floor(400/(0.20×0.8))=2500

### States

- **AC20**: GIVEN Player with max_hp=1000, current_hp=400, WHEN hit deals final_damage=120, THEN new HP=280 ≤ 300, transitions to LOW_HEALTH
- **AC21**: GIVEN entity in LOW_HEALTH, WHEN any hit received, THEN damage calculation identical to ALIVE state (no mechanic change)
- **AC22**: GIVEN entity with current_hp=50, WHEN hit deals final_damage ≥ 50, THEN current_hp=0, state transitions to DEAD
- **AC23**: GIVEN entity in DEAD state (HP=0), WHEN new HitData arrives in subsequent frame, THEN no damage calculated, no health_changed emitted

### Edge Cases

- **AC24**: GIVEN entity with HP=30, WHEN two hits (final_damage=50 and 40) arrive same frame in timestamp order, THEN first reduces HP to 0 (overkill=20), second records overkill=40 without further HP reduction
- **AC25**: GIVEN entity that transitioned to DEAD in previous frame, WHEN new HitData arrives in current frame, THEN DEAD guard rejects it
- **AC26**: GIVEN entity with dtc=1.0, WHEN bullet hit with impulse=4 arrives (final_damage=0), THEN HP unchanged, health_changed NOT emitted
- **AC27**: GIVEN any entity, WHEN HitData with impulse=0 arrives, THEN final_damage=0, HP unchanged
- **AC28**: GIVEN entity in DEAD state whose collider still active, WHEN chain-propagation HitData hits it, THEN health-damage ignores it (DEAD guard)
- **AC29**: GIVEN any entity, WHEN HitData with impulse=-50 (API misuse) arrives, THEN max(0,-50)=0, final_damage=0
- **AC30**: GIVEN entity with max_hp=1000, current_hp=800, WHEN max_hp reduced to 500, THEN current_hp clamped to min(800,500)=500

### Cross-System Interfaces

- **AC31**: GIVEN health-damage subscribed to hit_detected signal, WHEN hit_detected(hit_data) emitted, THEN final_damage calculated from hit_data.impulse and applied to target
- **AC32**: GIVEN chain-propagation emits HitData with type=explosion/fragment/crush, WHEN received, THEN correct type_factor used and damage applied to all affected entities
- **AC33**: GIVEN HP changed by damage, WHEN change applied, THEN health_changed(entity, old_hp, new_hp, source) emitted for HUD
- **AC34**: GIVEN HP reaches 0, WHEN entity_died(entity, killer_source, overkill) emitted, THEN death-respawn system receives it
- **AC35**: GIVEN final_damage > 0 applied, WHEN damage applied, THEN damage event record (entity_id, source, final_damage, new_hp) emitted for analytics
- **AC36**: GIVEN final_damage = 0 calculated, WHEN processing completes, THEN zero-damage event still recorded for analytics (health_changed suppressed)

## Open Questions

| 问题 | 负责人 | 目标日期 | 状态 |
|------|--------|---------|------|
| 是否需要"受伤方向指示"——屏幕边缘箭头指向伤害来源？ | ux-designer | MVP 前 | 有助于玩家理解物理连锁为何伤到自己 |
| 玩家死亡后是否保留"击杀镜头"（慢动作展示致死一击）？ | game-designer | Alpha 前 | MVP 不做 |
| Alpha 的 armor_penalty 机制如何与材质/装备系统交互？ | systems-designer | Alpha 前 | 留待 Alpha GDD |
| 是否需要"处决阈值"——HP 低于一定值时连锁传播伤害翻倍？ | game-designer | Alpha 前 | MVP 不做 |
