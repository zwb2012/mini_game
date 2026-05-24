# 触屏操控界面 (Touch Control UI)

> **Status**: In Design
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-22
> **Implements Pillar**: 间接服务全部支柱——触屏操控是玩家与物理战场之间的交互桥梁

## Overview

触屏操控界面是纯视觉反馈层——它从 touch-input 读取标准化信号（`move_direction`、`aim_position`、`shoot_*`）和配置参数（`split_x`、`deadzone`），渲染虚拟摇杆、瞄准准星和射击脉冲反馈。它不采集触屏事件（那是 touch-input 的职责），也不向 player-controller 输出游戏信号（player-controller 直连 touch-input）。它的全部职责是**让每次触摸都有清晰的视觉/音频反馈**。

## Player Fantasy

好的触屏操控是透明的——玩家不再想"我拇指该放哪里"，而是直接行动。虚拟摇杆出现在手指落下的位置而非固定坐标。射击按钮在按下时有一帧脉冲——手指知道"我打中了"。瞄准准星始终跟随右指移动，让玩家看到子弹将飞向哪里。幻想锚定在**"我的手指知道该做什么，因为控件用视觉和触觉告诉了它"**。

**参考**: Brawlhalla Mobile 的动态摇杆——摇杆中心随手指初始位置移动；Dead Cells Mobile 的极简触控——无固定按钮、仅手势区域。

**不应像**: 传统手游的固定虚拟按键布局——屏幕上 8 个不透明按钮遮挡游戏画面。坍塌禁区的触控元素始终半透明，不遮挡物理战场。

## Detailed Design

### Core Rules

**1. 屏幕分区（横屏 1920×1080 设计基准）**

```
┌──────────────────────────────────────┐
│  HUD: HP条              HUD: 武器   │
│                                      │
│   左区 (移动)    │   右区 (瞄准+射击) │
│   split_x=       │                  │
│   screen_width/2 │                  │
│   (50% 宽度)     │  (50% 宽度)       │
│                  │                  │
│   [虚拟摇杆]     │   [准星]          │
│                  │   [射击反馈]      │
└──────────────────────────────────────┘
```

- `split_x` = 从 touch-input.md 读取（默认 `screen_width / 2`，即 50% 分界）。**此值不由本系统定义**——touch-input.md 是屏幕分区的唯一真实来源。
- 左区：手指落下时出现虚拟摇杆。抬起时消失。
- 右区：手指移动控制瞄准准星。快速点击触发 `shoot_tapped`。按住触发 `shoot_held`。

**2. 虚拟摇杆（左区）**

| 属性 | 规范 |
|------|------|
| **出现方式** | 动态——摇杆中心出现在手指初始落点（非固定位置） |
| **视觉** | 外环（半径 60px，半透明灰白，opacity=0.4）+ 内点（半径 24px，白色，opacity=0.7） |
| **拖动范围** | 最大拖动距离 = 80px。超出后方向仍有效但内点 clamp 在环边缘 |
| **输出** | `move_direction` = normalized(当前手指位置 - 初始落点)，值域 [−1, +1] |
| **死区** | 手指位移 < deadzone（从 touch-input.md 读取，默认 20px）时 `move_direction = (0, 0)`——防止微抖导致角色晃动 |
| **消失** | 手指抬起时摇杆淡出（0.15s fade），`move_direction` 立即归零 |

**3. 瞄准准星（右区）**

| 属性 | 规范 |
|------|------|
| **视觉** | 十字准星（24×24 px，白色 + 1px 黑边，opacity=0.7） |
| **位置** | 跟随当前右区触摸点。无触摸时隐藏。 |
| **输出** | `aim_position` = 准星的世界坐标位置（由 player-controller 用于计算射击方向） |

**4. 射击反馈（右区）**

| 手势 | 判定条件 | 视觉反馈 | 输出 |
|------|---------|---------|------|
| **点击** | 触摸持续时间 < `tap_threshold`（200ms）且位移 < `deadzone`（从 touch-input 读取，默认 20px） | 准星位置一帧白色脉冲环（半径从 24→48px，0.1s 消失） | `shoot_tapped = true`（单帧脉冲） |
| **按住** | 触摸持续时间 ≥ `tap_threshold` | 准星周围持续脉冲环（0.3s 间隔，与 `shoot_interval` 同步） | `shoot_held = true`（每帧） |

**5. 布局协调规则**

- 触控元素全部位于 HUD 下方——HUD 占据屏幕顶部 48px，触控占据剩余区域
- 所有触控视觉元素 opacity ≤ 0.7——物理战场始终可见
- 暂停/菜单状态下触控元素完全隐藏

### States and Transitions

| 状态 | 含义 | 显示元素 |
|------|------|---------|
| **HIDDEN** | 不在游戏中（菜单/暂停/死亡） | 无 |
| **IDLE** | 游戏中但无触摸 | 无（干净画面） |
| **MOVING** | 左指在屏幕上（移动中） | 虚拟摇杆 |
| **AIMING** | 右指在屏幕上（瞄准中） | 瞄准准星 |
| **AIMING_AND_MOVING** | 双指同时在屏幕上 | 摇杆 + 准星 |
| **SHOOTING** | 正在射击（点击或按住） | 准星 + 脉冲反馈 |

### Interactions with Other Systems

| 系统 | 方向 | 数据流 |
|------|------|--------|
| **touch-input** | 上游 | 读取标准化信号（`move_direction`、`aim_position`、`shoot_tapped`、`shoot_held`、`is_aiming`、`split_x`、`deadzone`）——用于驱动视觉反馈 |
| **player-controller** | 同级（视觉消费方） | 不直接输出游戏信号给 player-controller。player-controller 直接从 touch-input 读取信号。本系统仅提供视觉反馈——渲染摇杆/准星/射击脉冲 |
| **HUD (#18)** | 同级 | 协调屏幕空间——HUD 顶部 48px，触控其余区域 |

## Formulas

### 1. 屏幕分区

```
split_x = touch_input.split_x  # 从 touch-input 读取——不由本系统定义
```

| 变量 | 说明 |
|------|------|
| `touch_input.split_x` | 默认 `screen_width / 2`（50%），定义于 touch-input.md §Formulas |

### 2. 摇杆方向

```
raw_offset = current_pos - origin_pos
clamped_offset = clamp_length(raw_offset, 0, MAX_DRAG)
move_direction = length(raw_offset) < DEAD_ZONE ? (0,0) : normalized(clamped_offset)
```

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MAX_DRAG` | 80 px | 摇杆最大拖动距离 |
| `DEAD_ZONE` | `touch_input.deadzone`（默认 20 px） | 死区半径——从 touch-input 读取，不由本系统定义 |

### 3. 点击 vs 按住判定

委托给 touch-input——此处仅引用其输出:

```
is_tap  = (hold_duration < tap_threshold) AND (hold_distance < deadzone)
is_hold = (hold_duration ≥ tap_threshold)
```

| 常量 | 默认值 | 来源 |
|------|--------|------|
| `tap_threshold` | 200 ms | touch-input.md Tuning Knobs |
| `deadzone` | `touch_input.deadzone`（默认 20 px） | touch-input.md Tuning Knobs——不由本系统独立定义 |

## Edge Cases

- **双指同时落下（左手移动 + 右手瞄准同一帧）**: 两个触摸独立处理——左指创建摇杆、右指显示准星。互不干扰。状态切换为 AIMING_AND_MOVING。

- **双指同时抬起**: 摇杆淡出 + 准星隐藏同时发生。`move_direction` 立即归零。如果按住射击中 → 继续射击直到手指抬起。

- **极快速连点（< 50ms 间隔）**: 每次抬起检测 `is_tap` → 独立触发 `shoot_tapped`。不合并或丢弃点击。以 touch-input 的硬件能力为准——如果硬件产生事件，UI 就响应。

- **split_x 边界上的触摸**: 视觉元素（摇杆 vs 准星）的显示由触摸点归属决定——归属逻辑由 touch-input 执行（`touch.position.x < touch_input.split_x`），本系统读取归属结果后渲染对应控件。不因边界位置产生死区。

- **摇杆初始落点距离屏幕边缘过近（< MAX_DRAG）**: 摇杆中心正常出现。向屏幕内拖动正常；向屏幕外拖动时 clamp 在边缘——不影响方向输出（方向只取决于偏移方向，不取决于距离）。

- **多点触摸（3+ 指）**: 仅处理前 2 个触摸点（按 touch.index 排序）。第 3+ 指忽略。不做手掌误触检测（Alpha 阶段加入）。

## Dependencies

| 系统 | 方向 | 性质 | 数据接口 |
|------|------|------|----------|
| **touch-input** | 上游 | 硬依赖 | 读取标准化信号（`move_direction`、`aim_position`、`shoot_tapped`、`shoot_held`、`is_aiming`）及配置参数（`split_x`、`deadzone`）——驱动摇杆/准星/射击脉冲的视觉渲染 |
| **player-controller** | 同级（视觉反馈消费方） | 软依赖 | 本系统不向 player-controller 输出游戏信号。player-controller 的信号流为 touch-input → player-controller（直连）。本系统仅渲染触控的视觉反馈——摇杆位置、准星、射击脉冲。player-controller 无需感知本系统的存在 |
| **HUD (#18)** | 同级 | 协调 | 共享屏幕空间——HUD 顶部 48px，触控其余区域。需协调避免元素重叠 |

**交叉验证**:
- touch-input.md 将本系统列为视觉消费者（"UI 层读取信号做视觉反馈"）——本系统从 touch-input 读取标准化信号用于渲染摇杆/准星/脉冲，**不向 player-controller 中转信号** ✓
- player-controller.md 将 touch-input 列为上游（直连信号消费）——**本系统不在 touch-input → player-controller 的信号路径上** ✓
- 实际的信号架构：`touch-input → player-controller`（游戏输入直连）；`touch-input → touch-control-ui`（视觉反馈独立通道）

## Tuning Knobs

| 参数 | 默认值 | 安全范围 | 说明 | 过高后果 | 过低后果 |
|------|--------|----------|------|---------|---------|
| `MAX_DRAG` | 80 | 50–150 | 摇杆最大拖动距离（px） | 手指需要大幅移动才能满速 | 微小移动即满速——精度丢失 |
| `JOYSTICK_RING_RADIUS` | 60 | 40–100 | 摇杆外环视觉半径（px） | 遮挡过多画面 | 太小——手指看不到 |
| `CROSSHAIR_SIZE` | 24 | 16–40 | 准星尺寸（px） | 遮挡目标 | 太小——看不清 |
| `SHOOT_PULSE_RADIUS` | 48 | 24–80 | 射击反馈脉冲最大半径（px） | 遮挡过多 | 反馈太弱 |
| `FADE_DURATION` | 0.15 | 0.05–0.3 | 控件淡出动画时长（秒） | 控件残留太久 | 控件瞬间消失——不自然 |

> **注意**: `split_x`、`deadzone`、`tap_threshold`、`max_radius` 的调优在 touch-input.md 中——本系统仅消费其输出，不独立定义。touch-input.md 是所有输入配置参数的唯一真实来源。

## Visual/Audio Requirements

[To be designed]

## UI Requirements

[To be designed]

## Acceptance Criteria

### A. 虚拟摇杆

- **AC1**: GIVEN 左指在左区落下，WHEN 触摸 phase=began，THEN 摇杆外环 + 内点出现在手指落点（动态中心），opacity=0.4/0.7

- **AC2**: GIVEN 左指拖动 40px 向右，WHEN 计算 move_direction，THEN `move_direction ≈ (1.0, 0.0)`（归一化），值域 [−1, +1]

- **AC3**: GIVEN 左指位移 < deadzone（从 touch-input 读取，默认 20px），WHEN 计算 move_direction，THEN `move_direction = (0, 0)`

- **AC4**: GIVEN 左指抬起，WHEN phase=ended，THEN 摇杆 0.15s 淡出，`move_direction` 立即归零

### B. 瞄准与射击

- **AC5**: GIVEN 右指在右区移动，WHEN 触摸 phase=moved，THEN 准星跟随手指位置更新

- **AC6**: GIVEN 右指快速点击（< 200ms，位移 < deadzone 从 touch-input 读取），WHEN 判定 is_tap=true，THEN 准星位置出现白色脉冲环（24→48px，0.1s），`shoot_tapped=true`（单帧）

- **AC7**: GIVEN 右指按住 ≥ 200ms，WHEN is_hold=true，THEN `shoot_held=true`（每帧），准星持续脉冲环（与 shoot_interval 同步）

### C. 双指操作

- **AC8**: GIVEN 左右指同时落下，WHEN 系统处理多点触摸，THEN 左摇杆 + 右准星同时显示，互不干扰

- **AC9**: GIVEN 三指同时在屏幕上，WHEN 触摸处理，THEN 仅处理前 2 指（按 index 排序），第 3 指忽略

### D. 状态与协调

- **AC10**: GIVEN 游戏切换到 PAUSED 状态，WHEN state_changed 到达，THEN 所有触控元素立即隐藏

- **AC11**: GIVEN 触控元素显示中，WHEN 检查与 HUD 的布局，THEN 触控与 HUD 元素无重叠（HUD 顶部 48px，触控其余区域）

## Visual/Audio Requirements

### 视觉

| 元素 | 规格 | 动画 |
|------|------|------|
| **摇杆外环** | 半径 60px，灰白色（#888），opacity=0.4，2px 边框 | 出现时 scale 0→1（0.1s）；消失时 fade 0.15s |
| **摇杆内点** | 半径 24px，白色（#FFF），opacity=0.7 | 跟随手指位置（无延迟） |
| **瞄准准星** | 十字线 24×24px，白色 + 1px 黑边，opacity=0.7 | 跟随手指位置（无延迟） |
| **射击脉冲** | 白色环形，从 24→48px 扩展 | 0.1s 动画后消失——快速而干脆 |
| **按住射击指示器** | 准星周围持续脉冲环（间隔=shoot_interval） | 循环扩展→消失 |

### 音频

| 事件 | 音频 | 优先级 |
|------|------|--------|
| 射击点击 | 短促 click（枪声由 weapon-system 管理） | Alpha |
| 摇杆激活 | 无——触觉反馈已足够 | — |

## UI Requirements

本系统自身是 UI 系统——以下是触控 UI 的配置需求：

| 需求 | 说明 |
|------|------|
| **布局热调整** | `split_x`、`MAX_DRAG`、`DEAD_ZONE`、环半径、颜色 opacity 等参数从配置文件读取——支持 A/B 测试不同的触控方案而无需重新编译 |
| **调试模式** | 显示 split_x 分界线（半透明红色竖线）+ 摇杆死区圆 + 触摸点标记（带 index 编号） |
| **无障碍** | 所有触控元素尺寸支持 1.2×/1.5× 缩放。Alpha 阶段添加外接手柄支持（此时触控 UI 自动隐藏） |

## Open Questions

| # | 问题 | 负责人 | 目标日期 | 影响 |
|---|------|--------|---------|------|
| 1 | MVP 是否需要做 A/B 测试两种触控方案（动态摇杆 vs 固定摇杆）？动态摇杆适合硬核玩家，固定摇杆给休闲玩家确定感 | game-designer | MVP 原型阶段 | 如果只做一种，MVP 选动态摇杆（与 Pillar 4 "通关靠脑子"一致——玩家需要精准移动） |
| 2 | 射击按钮是否需要一个独立的"固定射击键"（右下角固定按钮），还是完全由右区点击代替？ | ux-designer | MVP 前 | 固定按钮减少误触但遮挡画面；点击区域更灵活但需要学习 |
| 3 | 外接蓝牙手柄支持——是否需要 MVP 实现？手柄连接时触控 UI 应自动隐藏 | producer | MVP 前 | technical-preferences 说"可选蓝牙手柄支持"，但 MVP 可不做 |
| 4 | 触控元素的可访问性——是否需要触觉反馈（手机振动）？iOS Taptic Engine / Android Haptic 支持 | ux-designer | Alpha 前 | MVP 不做振动——视觉反馈足够 |
