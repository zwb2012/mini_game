# 死亡与重生系统 (Death & Respawn)

> **Status**: In Design
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-21
> **Implements Pillar**: Pillar 4（通关靠脑子——失败是学习的一部分）

## Overview

死亡与重生系统是"失败→学习→再试"循环的执行者。当生命值与伤害系统宣告 `entity_died`，本系统接管后续流程：对于玩家——触发死亡状态（冻结输入、播放死亡动画、展示死亡原因），短暂停留后将玩家送回房间起点，完整重置所有物理要素；对于敌人——播放死亡动画、移除实体、通知敌人生成系统。这个系统给 Pillar 4 "通关靠脑子、不靠反应"提供了基础——死亡不是惩罚，是物理实验的又一次尝试：你知道这次该打哪根柱子了。

## Player Fantasy

死亡与重生系统承载 Pillar 4 的情感契约——"失败不是结束，是下一次更好的开始"。当玩家被自己引发的连锁炸死时，短暂的死亡画面不是惩罚，而是**物理反思时刻**：你看到致死一击的来源（"那颗碎片从爆炸桶弹到了我身上"），在脑中修正下一次的连锁路径。0.5 秒后回到房间起点——所有物理要素完好如初，你已经比上一次更聪明了。

这与传统横版射击的"丢命→续关→挫败"完全不同。坍塌禁区不数命——失败的唯一代价是回到房间起点。这让玩家敢于实验："这次我试试打天花板，上次打油桶被炸死了"。死亡是物理实验的自然组成部分。

参考：Celeste 的"死亡→瞬回"零摩擦循环（死得越快，学得越快）；Dead Cells 的死亡即重置节奏。

## Detailed Design

### Core Rules

**1. 玩家死亡流程**

```
entity_died(player, killer, overkill) → 游戏状态 → DEAD
  → 冻结输入（game-state-machine 负责）
  → 死亡摄像机效果（慢动作 0.5s + 拉近致死位置）
  → 展示死亡原因（killer_source 类型 + 简短提示）
  → 停留 1.0s（玩家反思窗口）
  → 调用 scene-manager.reset_current_room()
  → 游戏状态 → PLAYING
  → 玩家回到房间起点，HP 回满
```

**2. 敌人死亡流程**

```
entity_died(enemy, killer, overkill) → 播放死亡动画（0.3s）
  → 从物理空间中移除（保留尸体粒子 1s 后回收）
  → 通知 enemy-spawn 系统（"敌人数 -1"）
  → 如果房间内敌人全部死亡 → 触发房间通关
```

**3. 无限重试**: 无生命数限制。玩家可无限次死亡和重试。MVP 不跟踪死亡次数（Alpha 加入评分系统）。

**4. 重生无敌**: 重生后 1.0s 内玩家无敌（不接受伤害）。防止重生时被残留碎片/爆炸秒杀。

**5. 物理重置**: 场景重置时全部物理物体恢复初始状态——位置、HP、accumulated_damage、状态。对象池回收所有活跃碎片。

### States and Transitions

| 状态 | 说明 |
|------|------|
| **IDLE** | 无死亡事件处理中 |
| **DEATH_ANIMATION** | 播放死亡效果（0.5s） |
| **DEATH_PAUSE** | 死亡原因展示（1.0s） |
| **RESETTING** | 场景重置中（瞬切） |

### Interactions with Other Systems

| 系统 | 方向 | 数据流 |
|------|------|--------|
| 生命值与伤害系统 | 上游 | 接收 `entity_died(entity, killer_source, overkill)` |
| 游戏状态机 | 上游 | 触发 `transition_to(DEAD)` / `transition_to(PLAYING)` |
| 场景管理器 | 下游 | 调用 `reset_current_room()` |
| 敌人生成与波次 | 下游 | 通知敌人死亡（波次计数） |
| 2D 摄像机 | 下游 | 触发死亡镜头效果 |

## Formulas

本系统无独立计算公式。所有时序由 Tuning Knobs 中的可配置参数控制。

## Edge Cases

- **玩家在死亡动画期间被新伤害命中**: DEAD 状态下 health-damage 忽略所有伤害。死亡动画不可中断。
- **敌人在死亡动画期间被连锁传播击中**: DEAD 状态忽略伤害。实体已从物理空间移除，不会被 AOE 查询命中。
- **重生无敌期间触发伤害**: invulnerable 标记阻止 health-damage 扣血。无敌结束后正常接受伤害。
- **场景重置时对象池已满**: 重置前强制回收所有活跃碎片→清空对象池→再重置。确保池有空间。
- **玩家在 RESETTING 状态下触发暂停**: 忽略暂停输入——重置必须完成。

## Dependencies

| 系统 | 方向 | 性质 | 数据接口 |
|------|------|------|----------|
| 生命值与伤害系统 | 上游 | 硬依赖 | `entity_died(entity, killer_source, overkill)` |
| 游戏状态机 | 上游 | 硬依赖 | `transition_to(DEAD)` / `transition_to(PLAYING)` |
| 场景管理器 | 下游 | 硬依赖 | `reset_current_room()` |
| 敌人生成与波次 | 下游 | 软依赖 | `enemy_killed(entity_type)` 通知 |
| 2D 摄像机 | 下游 | 软依赖 | 死亡镜头效果触发 |

**交叉验证**:
- health-damage.md 将死亡重生系统列为下游硬依赖 ✓
- game-state-machine.md DEAD 状态由本系统触发 ✓
- scene-manager.md 死亡重置由本系统调用 ✓

## Tuning Knobs

| 参数 | 默认值 | 安全范围 | 说明 | 过高后果 | 过低后果 |
|------|--------|----------|------|---------|---------|
| `death_animation_duration` | 0.5 | 0.2–1.0 | 死亡慢动作时长（秒） | 死亡节奏拖慢 | 玩家来不及看清致死原因 |
| `death_pause_duration` | 1.0 | 0.5–3.0 | 死亡原因展示停留（秒） | 等待过长，打断心流 | 来不及反思就被重置 |
| `respawn_invulnerability` | 1.0 | 0–3.0 | 重生无敌时长（秒） | 无敌过长可被滥用 | 重生可能被残留碎片秒杀 |
| `enemy_death_anim_duration` | 0.3 | 0.1–0.5 | 敌人死亡动画时长（秒） | 死亡反馈拖沓 | 死亡反馈不可见 |

## Visual/Audio Requirements

| 事件 | 视觉 | 音频 | 优先级 |
|------|------|------|--------|
| 玩家死亡 | 慢动作 0.5s + 画面褪色 + 致死位置拉近 | 低频冲击 + 心跳骤停 | MVP |
| 死亡原因展示 | 画面叠加 killer 来源标识 + 简短文字 | 静音（反思时刻） | MVP |
| 重生 | 画面从黑恢复 + 玩家闪烁（无敌指示） | 上升音阶（重新开始） | MVP |
| 敌人死亡 | 敌人碎裂/倒地动画 + 尸体粒子 1s | 死亡音效（按敌人类型区分） | MVP |

## UI Requirements

- **死亡原因提示**: 简短文字（如"碎片冲击"、"爆炸波及"、"倒塌压伤"），画面中央居中，持续 `death_pause_duration`（1.0s）后消失
- **重生闪烁**: 重生无敌期间玩家 sprite 以 4Hz 闪烁，视觉告知无敌状态
- Alpha 阶段可加入死亡计数器（当前房间死亡次数）

## Acceptance Criteria

### 玩家死亡主流程

- **AC1**: GIVEN `entity_died(player, killer, overkill)` signal，WHEN 死亡系统收到，THEN 游戏状态转 DEAD，输入冻结，系统进入 DEATH_ANIMATION
- **AC2**: GIVEN DEATH_ANIMATION 状态，WHEN 0.5s 死亡镜头结束，THEN 显示死亡原因 UI，状态转入 DEATH_PAUSE
- **AC3**: GIVEN 死亡原因已展示，WHEN 1.0s 停留结束，THEN 调用 `scene-manager.reset_current_room()`，状态转入 RESETTING
- **AC4**: GIVEN 房间重置完成，WHEN `reset_current_room()` 返回，THEN 游戏状态转 PLAYING，玩家置于房间起点，HP 回满，无敌激活
- **AC5**: GIVEN 玩家已死亡 N 次，WHEN 第 N 次死亡流程执行，THEN 正常重生，无衰减或惩罚

### 敌人死亡主流程

- **AC6**: GIVEN `entity_died(enemy, killer, overkill)`，WHEN 死亡系统收到，THEN 敌人播放 0.3s 死亡动画，期间忽略所有伤害
- **AC7**: GIVEN 敌人死亡动画完毕，WHEN 0.3s 结束，THEN 敌人从物理空间移除，保留尸体粒子 1s 后回收
- **AC8**: GIVEN 敌人被移除，WHEN 处理完成，THEN enemy-spawn 收到 `enemy_killed(entity_type)`，房间敌人数-1；归零则触发通关

### 状态转换

- **AC9**: GIVEN IDLE 状态，WHEN 收到玩家 `entity_died`，THEN 立即转 DEATH_ANIMATION
- **AC10**: GIVEN DEATH_ANIMATION，WHEN 0.5s 耗尽，THEN 转 DEATH_PAUSE
- **AC11**: GIVEN DEATH_PAUSE，WHEN 1.0s 耗尽，THEN 转 RESETTING
- **AC12**: GIVEN RESETTING，WHEN `reset_current_room()` 完成，THEN 转 IDLE
- **AC13**: GIVEN IDLE 状态，WHEN 收到非玩家 `entity_died`，THEN 状态保持 IDLE

### 重生无敌

- **AC14**: GIVEN 玩家进入 PLAYING，WHEN 重生点激活，THEN 获得 invulnerable 标记持续 1.0s
- **AC15**: GIVEN 玩家有 invulnerable 标记，WHEN 任意伤害命中，THEN health-damage 忽略该次伤害
- **AC16**: GIVEN invulnerable 标记激活，WHEN 1.0s 倒计时结束，THEN 标记移除

### 物理重置

- **AC17**: GIVEN `reset_current_room()` 调用，WHEN 重置执行，THEN 所有物理物体恢复初始状态（位置、HP、accumulated_damage）
- **AC18**: GIVEN 对象池存在活跃碎片，WHEN 重置开始，THEN 全部碎片强制回收→清空池→再初始化

### Edge Cases

- **AC19**: GIVEN 玩家处于 DEATH_ANIMATION/DEATH_PAUSE，WHEN 新伤害到达，THEN 静默忽略，流程不中断
- **AC20**: GIVEN 敌人处于死亡动画（已移除），WHEN AOE 查询范围内实体，THEN 该敌人不被命中
- **AC21**: GIVEN RESETTING 状态，WHEN 玩家触发暂停输入，THEN 输入被忽略

### 跨系统接口

- **AC22**: GIVEN 游戏状态 PLAYING，WHEN 玩家死亡，THEN 状态机收到 `transition_to(DEAD)`；重置后收到 `transition_to(PLAYING)`
- **AC23**: GIVEN 调用 `reset_current_room()`，WHEN 返回，THEN scene-manager 确认所有物理对象已恢复初始状态
- **AC24**: GIVEN 玩家死亡流程开始，WHEN 进入 DEATH_ANIMATION，THEN 2D 摄像机收到死亡镜头效果触发
- **AC25**: GIVEN 敌人死亡，WHEN 处理完成，THEN enemy-spawn 收到 `enemy_killed(entity_type)`

## Open Questions

| 问题 | 负责人 | 目标日期 | 状态 |
|------|--------|---------|------|
| 是否需要"击杀回放"——慢动作重播致死一击？ | game-designer | Alpha 前 | MVP 不做 |
| 房间通关时是否需要保留连锁痕迹（废墟画面）短暂展示？ | game-designer | MVP 前 | 需确认场景重置前是否截图 |
| 死亡次数是否影响评分？ | systems-designer | Alpha 前 | Alpha 加入评分系统时决定 |
