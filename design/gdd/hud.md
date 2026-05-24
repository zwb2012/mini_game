# HUD 系统 (HUD)

> **Status**: In Design
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-22
> **Implements Pillar**: Pillar 2（战场是多米诺阵列——HUD 信息让玩家 0.2s 内读取关键战场状态）+ Pillar 4（通关靠脑子——HUD 提供物理推理所需的数据，而非反应测试的干扰信息）

## Overview

HUD 系统是玩家阅读战场的"仪表盘"——它将分散在 6 个系统中的关键数据集中显示在屏幕边缘，让玩家在 0.2 秒的扫视窗口内完成状态判断。HUD 不创造数据，只展示数据：玩家 HP 来自 health-damage、武器信息来自 weapon-system、连锁深度来自 chain-propagation、Boss HP 和部件状态来自 boss-ai。HUD 的设计原则是"信息只在需要时出现"——常规战斗时仅显示 HP 条 + 武器图标 + 连锁计数器（3 个元素），Boss 战时扩展为 Boss HP 条 + 部件状态 + 倒计时 + 阶段提示。

HUD 不定义信息的含义——它只负责信息的**视觉编码**：什么信息放在哪个屏幕位置、什么颜色代表什么状态、什么动画节奏传达什么紧迫感。这些编码规则一旦确立，所有上游系统通过统一的 signal 接口输出数据，HUD 自动渲染——不需要每个系统各自画 UI。

## Player Fantasy

HUD 在坍塌禁区中不是"游戏 UI"——它是**战场仪表盘**。当玩家在 0.2 秒内扫一眼屏幕左上角、看到 HP 条下降幅度和连锁计数器跳动的数字，就能瞬间判断"这一枪值不值得"和"我现在有多危险"。好的 HUD 让信息的**出现和消失都有意义**——连锁计数器只在连锁进行中时出现、Boss 部件状态只在 Boss 战中显示、低血量边缘泛红只在 HP < 30% 时激活。玩家不是"被 UI 包围"，而是"被恰好需要的信息服务"。

这个幻想的锚定在于**信息的呼吸感**：HUD 元素随战斗节奏出现和消失，像呼吸一样自然。常规战斗时画面几乎干净——只有 HP 条和武器图标——让玩家专注于阅读物理战场。连锁触发时计数器弹出——像一个无声的裁判在计分。Boss 战时仪表盘全开——血条、部件、倒计时——让玩家像飞行员在紧急情况下扫视仪表盘一样快速决策。

**参考**: Dead Cells 的极简 HUD——仅 HP 条 + 细胞计数 + 武器图标，所有信息一瞥可知；Celeste 的"信息只在你需要时出现"哲学——冲刺刷新指示器只在触地时显示。

**不应像**: 传统手游的满屏 UI——虚拟按键 + 任务追踪 + 聊天框 + 活动入口。坍塌禁区的 HUD 始终服务于一个目标：**让物理推理更快**。

## Detailed Design

### Core Rules

**1. HUD 信息层级（3 层）**

| 层级 | 定义 | 元素 | 可见性 |
|------|------|------|--------|
| **持久层** | 始终可见的基础状态 | 玩家 HP 条、武器图标 | 游戏中始终显示 |
| **事件层** | 特定事件触发时短暂出现 | 连锁计数器、Phase 提示、房间清空 | 事件期间 + 短暂停留 |
| **Boss 层** | Boss 战时展开的扩展仪表盘 | Boss HP 条、部件状态、VULNERABLE 倒计时、崩塌倒计时 | Boss 战中持续显示 |

**2. MVP HUD 元素布局（横屏 1920×1080 设计基准）**

```
┌────────────────────────────────────────────────┐
│ [HP 条]              [Chain ×3]        [武器]  │
│                                              │
│                   (游戏画面)                   │
│                                              │
│         [Boss HP 条 + 部件 + 倒计时]           │
│              (仅 Boss 战显示)                  │
└────────────────────────────────────────────────┘
```

**3. 各元素规格**

| 元素 | 位置 | 尺寸 | Signal 来源 | 动画 | MVP |
|------|------|------|-----------|------|-----|
| **玩家 HP 条** | 左上角 (16, 16) | 200×16 px | `health_changed(entity, old, new)` | HP 下降时白色闪白 + 缓降动画（0.3s lerp） | ✓ |
| **低血量边缘脉冲** | 全屏边缘 | 全屏 overlay | `health_changed` + HP ≤ 300 (max_hp×0.3) | 红色边缘脉冲（0.5Hz），透明度 0→0.15→0 | ✓ |
| **武器图标** | 右上角 (x-84, 16) | 64×64 px 图标 + 名称文字 | `weapon_changed(weapon_id, weapon_name)` | 切换时缩小弹出（scale 0.8→1.0, 0.15s） | ✓ |
| **连锁深度计数器** | 上方居中 | 文字 "Chain ×N"，字号 24 | chain-propagation: chain_depth 变化 | 弹出（scale 0→1, 0.1s）+ 每步增量时数字跳动 | ✓ |
| **Boss HP 条** | 上方居中（Boss 战时替换计数器位置） | 400×20 px + Boss 名称 | `boss_health_changed(old, new)` | HP 下降时黄色闪白（0.1s） | ✓ |
| **部件状态指示器** | Boss HP 条下方 | 5×24×24 px 图标（双腿/双臂/核心） | `boss_part_damaged(part_id, new_state)` | 状态切换时图标抖动（0.1s）+ 颜色渐变 | ✓ |
| **VULNERABLE 倒计时** | Boss HP 条右侧 | "WEAK POINT — 5.0" 倒计时文字 | `boss_state_changed("VULNERABLE")` | 数字每秒递减，最后 1s 红色闪烁（4Hz） | ✓ |
| **STUNNED 提示** | Boss 头顶（跟随 Boss 位置） | 星形图标 32×32 px | `boss_state_changed("STUNNED")` | 弹出 + 持续旋转（90°/s） | ✓ |
| **Phase 提示** | 画面中央 | "PHASE 2" 大字（字号 48），1.5s 后消失 | `boss_phase_changed(new_phase)` | 从中心放大弹出 → 淡出（0.3s in, 1.2s hold, 0.3s fade） | ✓ |
| **崩塌倒计时** | Boss HP 条下方 | "COLLAPSE — 20.0" 红色文字 | `boss_state_changed("DOWNED")` | 最后 5s 文字放大 + 闪烁加速（1Hz→4Hz） | ✓ |

**4. HUD 元素生命周期管理**

```
持久层元素: 游戏进入 PLAYING 状态时创建 → PAUSED 时半透明 → 退出 PLAYING 时隐藏
事件层元素: signal 到达时创建 → 播放动画 → 停留 duration → 淡出 → queue_free()
Boss 层元素: boss_spawned signal 到达时创建 → boss_defeated 时淡出 → queue_free()
```

**5. Alpha 预留元素**（MVP 不实现，接口预留）

| 元素 | 触发 | 位置 |
|------|------|------|
| 房间清空提示 | `room_cleared(room_id)` | 画面中央 "ROOM CLEAR"，2s 消失 |
| 波次提示 | `wave_info_changed(index, total)` | 上方居中 "Wave 2/3"，2s 消失 |
| 连锁总结弹出 | `chain_settled(summary)` | 画面中央（深度/破坏数/伤害/评分） |
| 深度里程碑 | `chain_depth_milestone(N)` | 计数器下方 "3-STEP!" 大字弹出 |

### States and Transitions

| 状态 | 含义 | 显示元素 |
|------|------|---------|
| **HIDDEN** | 游戏不在 PLAYING 状态 | 无 |
| **NORMAL** | 常规战斗 | HP 条 + 武器图标（持久层） |
| **CHAINING** | 连锁进行中 | NORMAL + 连锁计数器（事件层） |
| **BOSS** | Boss 战中 | NORMAL + Boss 层全部元素 |
| **BOSS_CHAINING** | Boss 战中连锁进行中 | BOSS + 连锁计数器 |
| **LOW_HEALTH** | 玩家 HP ≤ 30% | 当前状态 + 边缘脉冲 overlay |

### Interactions with Other Systems

| 系统 | 方向 | 数据流 |
|------|------|--------|
| **health-damage** | 上游 | 订阅 `health_changed(entity, old, new)` → 更新 HP 条 + 低血量检测；读取 `player_max_hp=1000`、`low_health_threshold=0.3` |
| **weapon-system** | 上游 | 订阅 `weapon_changed(weapon_id, weapon_name, ammo)` → 更新武器图标和名称 |
| **chain-propagation** | 上游 | 订阅 `chain_depth_changed(new_depth)` → 更新计数器；订阅 `chain_settled(summary)` → Alpha 总结弹出 |
| **boss-ai** | 上游 | 订阅 `boss_health_changed(old, new)` → Boss HP 条；`boss_part_damaged(part_id, state)` → 部件图标；`boss_state_changed(new_state)` → VULNERABLE 倒计时 / STUNNED 提示 / 崩塌倒计时；`boss_phase_changed(phase)` → Phase 提示 |
| **enemy-spawn-wave** | 上游 | 订阅 `boss_spawned(boss_id)` → 展开 Boss 层；`room_cleared(room_id)` → Alpha 清空提示 |
| **game-state-machine** | 上游 | 订阅 `state_changed(old, new)` → PLAYING 时显示持久层 / 其他状态隐藏 |
| **触屏操控界面 (#19)** | 同级 | HUD 和触屏操控界面共享屏幕空间——HUD 占据边缘区域，触控占据下 1/3。需要协调避免元素重叠 |

## Formulas

### 1. HP 条填充率

```
hp_fill_ratio = clamp(current_hp / max_hp, 0.0, 1.0)
hp_bar_width_px = hp_fill_ratio × HP_BAR_MAX_WIDTH
```

| 变量 | 符号 | 类型 | 范围 | 说明 |
|------|------|------|------|------|
| 当前 HP | `current_hp` | int | 0–1000 | 来自 `health_changed` signal |
| 最大 HP | `max_hp` | int | 1000 | `player_max_hp` 常量 |
| 填充比例 | `hp_fill_ratio` | float | 0.0–1.0 | 0=空血，1=满血 |
| HP 条最大宽度 | `HP_BAR_MAX_WIDTH` | int | 200 | px 值 |

### 2. 低血量检测

```
is_low_health = (current_hp ≤ max_hp × low_health_threshold) AND (state ∈ {NORMAL, CHAINING, BOSS, BOSS_CHAINING})
```

| 变量 | 符号 | 类型 | 说明 |
|------|------|------|------|
| 低血量触发阈值 | `low_health_threshold` | float | 0.3（来自 health-damage.md） |
| 当前 HUD 状态 | `state` | enum | 仅在战斗状态下激活边缘脉冲 |

### 3. Boss 部件状态分类

```
part_state = INTACT    if accumulated_damage < threshold × 0.5
part_state = DAMAGED   if threshold × 0.5 ≤ accumulated_damage < threshold
part_state = DESTROYED if accumulated_damage ≥ threshold
part_color  = GRAY     if INTACT
part_color  = YELLOW   if DAMAGED
part_color  = RED      if DESTROYED
```

## Edge Cases

- **HP 变化超过 HP 条动画速度**: 如果玩家在 0.1s 内连续受到伤害（如多碎片同时命中），每次 `health_changed` 独立触发缓降动画——HP 条显示值为最近一次 signal 的目标值，动画从当前显示值 lerp 到目标值。不跳过中间值。

- **连锁计数器在连锁结束后仍显示**: 连锁传播系统发出 `chain_settled` 后，计数器停留 1.0s 后淡出。连锁间冷却 0.1s 意味着计数器几乎连续显示——这是预期的。

- **Boss 状态快速切换（如 STUNNED→VULNERABLE→COMBAT 在 3s 内完成）**: 每个 HUD 元素独立响应自己的 signal——不因状态切换而遗漏显示。如果 `boss_state_changed("VULNERABLE")` 在 STUNNED 动画播放期间到达 → 中断 STUNNED 提示 → 立即显示 VULNERABLE 倒计时。

- **STUNNED 提示跟随 Boss 位置时 Boss 在画面外**: 如果 Boss 位置超出屏幕边界 → STUNNED 图标 clamp 到最近的屏幕边缘内侧 16px 处。

- **Boss 部件在同一帧内从 INTACT 跳到 DESTROYED**: 跳过 DAMAGED 动画——直接显示红色 DESTROYED。不播放黄色中间态。

- **HP 条宽度在极端值下的显示**: `hp_fill_ratio = 0` 时 HP 条完全空白（但不消失——空条本身是信息）。HP=0 时玩家已死亡，HUD 立即进入 HIDDEN 状态。

## Dependencies

| 系统 | 方向 | 性质 | 数据接口 |
|------|------|------|----------|
| **game-state-machine** | 上游 | 硬依赖 | 订阅 `state_changed(old, new)` → 控制 HUD 显示/隐藏 |
| **health-damage** | 上游 | 硬依赖 | 订阅 `health_changed` → HP 条 + 低血量检测；读取 `player_max_hp`、`low_health_threshold` |
| **weapon-system** | 上游 | 硬依赖 | 订阅 `weapon_changed(weapon_id, name, ammo)` → 武器图标 |
| **chain-propagation** | 上游 | 软依赖 | 订阅 `chain_depth_changed` → 计数器（MVP）；`chain_settled` → Alpha 总结 |
| **boss-ai** | 上游 | 硬依赖 | 订阅 `boss_health_changed`、`boss_part_damaged`、`boss_state_changed`、`boss_phase_changed` → Boss 层全部元素 |
| **enemy-spawn-wave** | 上游 | 软依赖 | 订阅 `boss_spawned` → 展开 Boss 层；`room_cleared` → Alpha 清空提示 |
| **触屏操控界面 (#19)** | 同级 | 协调 | 共享屏幕空间——HUD 边缘，触控下 1/3 |

## Tuning Knobs

| 参数 | 默认值 | 安全范围 | 说明 |
|------|--------|----------|------|
| `HP_BAR_MAX_WIDTH` | 200 | 150–300 | HP 条最大像素宽度 |
| `hp_bar_lerp_speed` | 6.0 | 3.0–12.0 | HP 条缓降动画速度（单位/秒） |
| `chain_counter_hold_duration` | 1.0 | 0.5–3.0 | 连锁结束后计数器停留时间（秒） |
| `phase_text_duration` | 1.5 | 1.0–3.0 | Phase 提示显示时长（秒） |
| `low_health_pulse_hz` | 0.5 | 0.3–1.0 | 低血量脉冲频率 |
| `collapse_blink_accel_start` | 5.0 | 3.0–10.0 | 崩塌倒计时闪烁加速起始秒数 |

## Visual/Audio Requirements

### 视觉风格

| 属性 | 规范 |
|------|------|
| **字体** | 等宽无衬线（适合数字快速阅读），字号 16（HP）/ 24（计数器）/ 48（Phase 提示） |
| **颜色编码** | HP 条：绿(>60%)→黄(30-60%)→红(<30%)渐变；Boss HP：暗红底色 + 红色填充；部件：灰(INTACT)/黄(DAMAGED)/红(DESTROYED)；倒计时：白色→最后 1s 红色 |
| **透明度** | 持久层元素 opacity=0.85（始终可见但不遮挡画面）；事件层元素 opacity=1.0（需要注意力） |
| **动画原则** | 弹出=scale 0→1 overshoot（1.0→1.1→1.0）；消失=fade out 0.3s；数字变化=短暂放大回弹 |

### 音频反馈

| 事件 | 音频 | 优先级 |
|------|------|--------|
| HP 下降至 ≤ 30% | 低频心跳声（loop，与脉冲同步） | MVP |
| 连锁计数器弹出 | 短促高音 click（每步递增音高） | Alpha |
| Boss Phase 切换 | 低音轰鸣 + "PHASE N" 文字音效 | Alpha |
| VULNERABLE 倒计时最后 1s | 急促 beep（4Hz，与闪烁同步） | MVP |
| 崩塌倒计时最后 5s | 心跳加速（1Hz→4Hz）+ 最终警报 | MVP |

## UI Requirements

本系统自身是 UI 系统——以下是 HUD 的配置和可扩展性需求：

| 需求 | 说明 |
|------|------|
| **Signal 订阅注册表** | HUD 通过配置文件声明订阅哪些 signal → 对应哪个 UI 元素。新增 HUD 元素不需要改代码。数据文件路径: `assets/data/hud/hud_layout.json` |
| **布局配置** | HUD 元素位置、尺寸、颜色从配置文件读取——支持快速迭代布局而无需重新编译 |
| **调试模式** | 调试模式下显示每个 HUD 元素的边界框 + signal 名称 + 最后更新时间戳 |
| **无障碍** | 所有 HUD 元素支持 1.5×/2× 缩放（文本大小可调）。Alpha 阶段添加色盲模式（用图案补充颜色编码） |

## Acceptance Criteria

### A. 持久层

- **AC1**: GIVEN 游戏进入 PLAYING 状态，WHEN HUD 初始化，THEN 左上角显示 HP 条（宽度=200px，满血时完全填充）、右上角显示当前武器图标和名称。

- **AC2**: GIVEN 玩家 HP=1000，WHEN `health_changed(player, 1000, 700)` 到达，THEN HP 条宽度从 200px 缓降动画至 140px（700/1000×200），动画在 0.3s 内完成。

- **AC3**: GIVEN 玩家 HP 降至 300（≤ max_hp × 0.3），WHEN `health_changed` 触发低血量检测，THEN 屏幕边缘出现红色脉冲 overlay（0.5Hz，透明度 0→0.15→0）。

### B. 事件层

- **AC4**: GIVEN 连锁传播系统发出 `chain_depth_changed(3)`，WHEN HUD 首次收到非零深度，THEN 连锁计数器在上方居中弹出（"Chain ×3"），scale 动画 0→1（0.1s）。

- **AC5**: GIVEN 连锁计数器当前显示 "Chain ×3"，WHEN `chain_depth_changed(4)` 到达，THEN 数字从 3 跳动到 4（数字缩放动画 1.0→1.3→1.0, 0.05s）。

- **AC6**: GIVEN 连锁传播系统发出 `chain_settled`，WHEN HUD 收到，THEN 计数器停留 1.0s 后淡出（0.3s fade）。

### C. Boss 层

- **AC7**: GIVEN `boss_spawned("ruin_colossus")` signal 到达，WHEN HUD 展开 Boss 层，THEN 上方居中显示 Boss HP 条（400×20px，名称"废墟巨像"）和 5 个部件状态图标（初始均为灰色 INTACT）。

- **AC8**: GIVEN Boss HP=3000，WHEN `boss_health_changed(3000, 2250)` 到达，THEN Boss HP 条宽度从 400px 降至 300px（2250/3000×400），黄色闪白 0.1s。

- **AC9**: GIVEN `boss_part_damaged("left_leg", DAMAGED)` 到达，WHEN HUD 更新部件图标，THEN 左腿图标变为黄色（0.1s 抖动动画）。

- **AC10**: GIVEN `boss_state_changed("VULNERABLE")` 到达，WHEN HUD 显示倒计时，THEN Boss HP 条右侧显示 "WEAK POINT — 5.0"，数字每秒递减，最后 1s 红色闪烁。

- **AC11**: GIVEN `boss_state_changed("DOWNED")` 到达，WHEN 崩塌倒计时启动，THEN Boss HP 条下方显示 "COLLAPSE — 20.0"（红色），最后 5s 文字放大 + 闪烁加速。

- **AC12**: GIVEN `boss_phase_changed(2)` 到达，WHEN Phase 提示触发，THEN 画面中央弹出 "PHASE 2"（字号 48），0.3s 放大进入 → 停留 1.2s → 0.3s 淡出。

### D. 状态切换

- **AC13**: GIVEN 游戏从 PLAYING 切换到 PAUSED，WHEN `state_changed` 到达，THEN 所有 HUD 元素半透明（opacity=0.4），HP 条和武器图标保留可见。

- **AC14**: GIVEN 游戏从任何状态切换到 MAIN_MENU，WHEN `state_changed` 到达，THEN 所有 HUD 元素立即隐藏（HIDDEN 状态）。

### E. 边界情况

- **AC15**: GIVEN Boss 在画面外（position 超出 camera_bounds），WHEN STUNNED 提示需要显示，THEN 星形图标 clamp 到屏幕最近边缘内侧 16px。

- **AC16**: GIVEN 同一帧收到 `boss_part_damaged("core", DESTROYED)` 且核心之前为 INTACT，WHEN 部件图标更新，THEN 直接显示红色 DESTROYED（跳过黄色 DAMAGED 动画）。

## Open Questions

| # | 问题 | 负责人 | 目标日期 | 影响 |
|---|------|--------|---------|------|
| 1 | `hud_layout.json` 的具体 schema——每个元素的 signal、position、size、animation 如何声明？ | ui-programmer | MVP 前 | 影响 HUD 可扩展性——如果 schema 太僵硬，新增元素需要改代码 |
| 2 | HUD 音频反馈与其他系统音频的优先级——心跳声 vs Boss 战音乐 vs 连锁音效的混音比例？ | audio-director | Alpha 前 | MVP 仅需心跳声和倒计时 beep，冲突概率低 |
| 3 | 与触屏操控界面 (#19) 的具体屏幕空间分配——下 1/3 给触控、上 2/3 给 HUD + 游戏画面？还是 HUD 覆盖在触控上方？ | ux-designer | MVP 前 | 元素重叠可能导致误触或信息遮挡 |
| 4 | 色盲模式的具体设计——用图案替代颜色编码（如 HP 条加斜线纹理 = 红色）是否需要 MVP 实现？ | ux-designer | Alpha 前 | MVP 仅颜色编码——色盲玩家可能无法区分部件状态 |
| 5 | HUD 使用 Godot CanvasLayer 还是 Control 节点直接放在场景树中？→ 成为 ADR | technical-director | MVP 前 | CanvasLayer 独立于摄像机移动，适合 HUD；Control 节点与场景绑定，适合世界空间 UI（如 STUNNED 图标跟随 Boss） |
