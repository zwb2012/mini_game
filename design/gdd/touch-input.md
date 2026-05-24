# 触屏输入系统 (Touch Input)

> **Status**: In Design
> **Author**: game-designer + Claude
> **Last Updated**: 2026-05-20
> **Implements Pillar**: 间接服务全部 4 个支柱——输入是所有玩家动作的入口

## Summary

触屏输入系统是玩家所有操作的唯一入口——将原始触屏事件转化为标准化的游戏输入信号。屏幕左半区驱动移动（滑动手势→方向向量），右半区驱动瞄准与射击（点击=单发射击，按住=持续射击+瞄准）。作为 Foundation 层系统，它不关心游戏逻辑——只负责准确、低延迟地告诉上层"玩家的手指在做什么"。

> **Quick reference** — Layer: `Foundation` · Priority: `MVP` · Key deps: `游戏状态机 (upstream)`

## Overview

触屏输入系统是坍塌禁区所有玩家操作的唯一入口。玩家通过触屏手势控制角色——左半屏滑动手势驱动角色移动，右半屏点击/手势驱动瞄准与射击。系统将原始触屏事件（按下、移动、抬起、多点触控）转化为标准化的游戏输入信号（移动方向向量、瞄准坐标、射击触发），供玩家控制器及其他系统消费。作为 Foundation 层系统，它不关心"移动到哪里"或"射中了什么"——只负责准确、低延迟地告诉上层"玩家的手指在做什么"。它是玩家肉身与游戏世界之间的第一层翻译器。

## Player Fantasy

触屏输入系统本身没有独立的玩家幻想——它是一个"无感"的基础设施层。玩家不会说"这个输入系统真棒"，但他们会说"操控好顺手"或"操作有延迟"。本系统的幻想是**负向定义的**：它的成功体现在玩家**从未注意到它的存在**。

当它正常工作时，玩家沉浸在"射击→连锁→清场"的循环中，完全不思考手指在屏幕上的位置。当它失败时——延迟、误触、手势识别错误——玩家感到的挫败不是"我判断错了"，而是"我明明点了那里却没有反应"。这直接破坏了 Pillar 4（通关靠脑子）的公平性基础：如果操作本身不可靠，"靠脑子"就失去了意义。

**一句话幻想**：让玩家忘记自己是在触屏上操作。

## Detailed Design

### Core Rules

1. **屏幕分区**：系统以屏幕垂直中线为界（`split_x = screen_width / 2`，默认 50%），将触屏区域分为左右两区。此值为所有下游系统的唯一真实来源——触屏操控界面（touch-control-ui）的视觉分区必须从此处读取，不可独立定义。
   - **左区（移动区）**：滑动手势 → 产生移动方向信号
   - **右区（瞄准/射击区）**：点击 → 产生射击信号；按住拖动 → 产生瞄准位置信号

2. **触控点归属**：每个触控点（Touch ID）在 `pressed` 时根据其初始坐标判定所属分区，之后即使手指跨越中线也不改变归属，直到 `released`。

3. **移动信号生成**（左区）：
   - 触控按下时记录初始位置作为移动原点
   - 拖动时计算当前点相对于原点的偏移向量
   - 偏移向量归一化为方向向量（长度为 0~1），方向即移动方向
   - 偏移向量长度 < 死区阈值（deadzone）时输出 `Vector2.ZERO`
   - 触控抬起时输出归零

4. **瞄准信号生成**（右区）：
   - 触控按下时记录触点位置（屏幕坐标）
   - 拖动时更新触点位置
   - 持续输出当前瞄准坐标（屏幕坐标，由上层系统转换为世界坐标）

5. **射击信号生成**（右区）：
   - 快速点击（按下到抬起 < 200ms 且位移 < 死区阈值）→ 触发 `shoot_tapped` 脉冲信号
   - 按住超过 200ms → 进入持续射击模式，每帧输出 `shoot_held = true`，直到抬起

6. **多点触控**（MVP）：
   - 支持 2 指同时操作——左区 1 指 + 右区 1 指可同时活跃
   - 同区内的第 2 个触控点被忽略（不触发任何信号）
   - 预留 3 指接口（第 3 指用于未来可能的武器切换或其他功能）

7. **标准化输出信号**：

| 信号 | 类型 | 来源 | 说明 |
|------|------|------|------|
| `move_direction` | Vector2 | 左区 | 归一化移动方向，无输入时为 (0,0) |
| `aim_position` | Vector2 | 右区 | 瞄准点屏幕坐标，无输入时为最后一次有效值 |
| `shoot_tapped` | bool (脉冲) | 右区 | 快速点击射击，单帧 true 后复位 |
| `shoot_held` | bool | 右区 | 持续按住射击 |
| `is_aiming` | bool | 右区 | 右区是否有活跃触控点（UI 层可能用此显示/隐藏瞄准线） |

### States and Transitions

系统整体状态由活跃触控点数量和分布决定：

| 状态 | 条件 | 行为 |
|------|------|------|
| **IDLE** | 0 个活跃触控点 | 所有输出信号为默认值（零向量/false） |
| **MOVE_ONLY** | 仅左区有活跃触控点 | `move_direction` 活跃，其他信号默认 |
| **AIM_ONLY** | 仅右区有活跃触控点 | `aim_position` 活跃，`move_direction = (0,0)` |
| **MOVE_AND_AIM** | 左区和右区各有活跃触控点 | `move_direction` 和 `aim_position` 同时活跃 |
| **MOVE_AND_SHOOT** | 左区活跃 + 右区满足射击条件 | `move_direction` + 射击信号同时活跃 |

### Interactions with Other Systems

| 目标系统 | 方向 | 数据流 | 接口说明 |
|----------|------|--------|----------|
| 玩家控制器 | 输出 | `move_direction`, `aim_position`, `shoot_tapped`, `shoot_held` | 玩家控制器每帧读取这些信号并转换为角色行为 |
| 触屏操控界面 | 输出 | `aim_position`, `is_aiming` | UI 层读取瞄准位置以渲染瞄准线和辅助瞄准指示器 |
| 游戏状态机 | 输入 | 游戏状态（playing/paused/dead） | 仅在 `playing` 状态时处理输入；`paused` 时透传事件给 UI 层；`dead` 时忽略 |
| 无障碍系统 | 输出 | 所有标准化信号 + 触控点原始坐标 | 无障碍系统可能重新映射输入（如外接手柄替代触屏） |

## Formulas

### 屏幕中线计算

```
split_x = screen_width / 2
```

| 变量 | 类型 | 范围 | 说明 |
|------|------|------|------|
| `screen_width` | int | 设备相关 | 当前窗口/屏幕像素宽度 |
| `split_x` | int | 0 ~ screen_width | 左右分区的 x 坐标边界 |

**触控点归属判定**：`touch.position.x < split_x` → 左区（移动）；`touch.position.x >= split_x` → 右区（瞄准/射击）

### 移动方向计算

```
raw_offset = current_touch_pos - origin_pos
offset_length = √(raw_offset.x² + raw_offset.y²)
move_direction = offset_length > deadzone ? raw_offset / offset_length × clamp(offset_length / max_radius, 0, 1) : Vector2.ZERO
```

| 变量 | 类型 | 范围 | 说明 |
|------|------|------|------|
| `origin_pos` | Vector2 | 屏幕坐标 | 触控按下时的初始位置，作为移动原点 |
| `current_touch_pos` | Vector2 | 屏幕坐标 | 当前帧触控位置 |
| `raw_offset` | Vector2 | — | 原点指向当前点的向量 |
| `deadzone` | float | 10~50 px | 死区半径，低于此值输出 (0,0)，防止手指微颤导致角色抖动 |
| `max_radius` | float | 100~300 px | 达到满速的最大偏移距离，超出的偏移被 clamp 到 1 |
| `move_direction` | Vector2 | 长度 0~1 | 最终输出的移动方向向量 |

### 点击 vs 按住判定

```
hold_duration = release_time - press_time
hold_distance = |release_pos - press_pos|
is_tap = hold_duration < tap_threshold AND hold_distance < deadzone
is_hold = hold_duration >= tap_threshold
```

| 变量 | 类型 | 范围 | 说明 |
|------|------|------|------|
| `press_time` | int (ms) | — | 触控按下的时间戳 |
| `release_time` | int (ms) | — | 触控抬起的时间戳 |
| `tap_threshold` | int (ms) | 150~300 | 判定为"点击"的最大持续时间，默认 200ms |
| `hold_distance` | float | 0~∞ | 按下到抬起的位移距离 |
| `is_tap` | bool | — | true = 触发单发射击脉冲 |
| `is_hold` | bool | — | true = 进入持续射击模式 |

## Edge Cases

- **触控点恰好落在中线上**: 判定为右区（瞄准/射击区）。`position.x >= split_x` 的 ≥ 保证中线归属右区。
- **手指跨越中线**: 触控点归属在 `pressed` 时锁定，跨越不改变分区。防止玩家手指从移动区滑到瞄准区时角色突然停止移动。
- **同区同时出现第 2 个触控点**: 忽略——不触发任何新信号，不替换已有触控点。第 1 个触控点继续正常驱动该区信号。防止手掌误触干扰操作。
- **第 2 个触控点先抬起，第 1 个后抬起**: 第 2 个触控点从未被注册，其抬起无影响。第 1 个触控点正常驱动到抬起。
- **设备旋转（横屏↔竖屏）**: MVP 阶段不支持旋转——游戏锁定横屏。如果在未来支持，旋转时所有活跃触控点立即失效（触发 `cancel`），防止坐标映射错乱。
- **系统手势冲突**（iOS 底部横条 / Android 返回手势）: 游戏应请求全屏沉浸模式，在游戏区域内抑制系统手势。MVP 由引擎设置处理；如果特定设备仍有冲突，通过 `InputEventScreenTouch` 消费事件阻止传递给系统。
- **极快速点击（< 30ms 按下到抬起）**: 正常识别为 tap，触发 `shoot_tapped`。不做最小时长过滤——如果硬件能产生这个事件，游戏就响应。
- **屏幕边缘触控**: 不做特殊限制。但死区原点不应因边缘而偏移——玩家手指在屏幕最边缘按下时，可以向内拖动产生移动信号。
- **游戏切换到后台（来电/通知）**: 引擎自动发送所有活跃触控点的 `released` 事件。系统应在恢复前台时重置所有状态到 IDLE。
- **死区设为 0**: 合法——此时任何微小偏移都产生移动信号。但可能导致手指静止时的角色抖动，不推荐。安全范围见 Tuning Knobs。
- **大拇指根部误触**（左手拇指操作移动区时，拇指根部可能触到右区）: MVP 不做手掌 rejection。此问题留待 Alpha 阶段根据测试数据决定是否需要。
- **湿手/手套操作**: 不专门支持。电容屏本身对此类场景的响应不一致，不在软件层面处理。

## Dependencies

| 系统 | 方向 | 依赖性质 | 接口说明 |
|------|------|----------|----------|
| **游戏状态机** | 上游（本系统依赖它） | 硬依赖——无状态机则输入无法正确屏蔽 | 读取 `current_state`（playing/paused/dead/menu），playing 时正常处理，其他状态时抑制或透传 |
| **玩家控制器** | 下游（依赖本系统） | 硬依赖——无输入则玩家无法操作 | 提供全部 5 个标准化输出信号（move_direction, aim_position, shoot_tapped, shoot_held, is_aiming） |
| **触屏操控界面** | 下游（依赖本系统） | 软依赖——UI 层读取信号做视觉反馈 | 提供 aim_position + is_aiming 用于渲染瞄准线和辅助瞄准 UI |
| **无障碍系统** | 下游（依赖本系统） | 软依赖——无障碍系统可能需要重映射输入 | 提供所有标准化信号 + 原始触控点坐标，允许无障碍系统插入替代输入源 |

**说明**：
- 唯一的上游硬依赖是游戏状态机——没有状态上下文，输入系统无法判断何时处理/忽略触控事件。
- **玩家控制器是本系统的直接消费者**（信号路径：touch-input → player-controller）。玩家控制器直接从本系统读取 5 个标准化信号——不经过 touch-control-ui 中转。
- **触屏操控界面是本系统的视觉消费者**（信号路径：touch-input → touch-control-ui → 渲染摇杆/准星/射击反馈）。touch-control-ui 不向 player-controller 输出任何游戏信号——它是纯视觉反馈层。
- 无障碍系统是"消费但不阻塞"的下游——本系统不感知它们是否存在。
- **本系统是以下参数的唯一真实来源**：`split_x`（屏幕分界线）、`deadzone`（死区半径）、`tap_threshold`（点击判定阈值）、`max_radius`（最大移动半径）。所有下游系统（含 touch-control-ui）必须从此处读取，不可独立定义。

## Tuning Knobs

| 参数 | 默认值 | 安全范围 | 增大效果 | 减小效果 |
|------|--------|----------|----------|----------|
| `deadzone` | 20 px | 10~50 px | 需要更大的手指位移才能触发移动——减少误触但感觉"不跟手" | 微小偏移即触发移动——更灵敏但可能手指静止时角色抖动 |
| `max_radius` | 200 px | 100~300 px | 需要更长的手指滑动才能达到满速——移动手感"重" | 短距离滑动即满速——移动手感"轻快"，但精确微调移动变难 |
| `tap_threshold` | 200 ms | 150~300 ms | 更长的按住才判为持续射击——减少误触但快速点击可能被误判为按住 | 更短的按住即判为持续射击——响应更快但"快速双击"的第一击可能丢失 |
| `split_x` | screen_width/2 | 30%~70% 屏幕宽 | 移动区变大、瞄准区变小——适合习惯左手大范围移动的玩家 | 瞄准区变大——适合习惯精确瞄准的玩家 |

**所有参数均应可在运行时通过配置文件调整**，无需重新编译。MVP 阶段至少支持 `deadzone` 和 `tap_threshold` 的热调整（用于 A/B 测试不同手感方案）。

## Visual/Audio Requirements

触屏输入系统本身无视觉/音频输出——它是纯输入层。相关的视觉反馈（瞄准线、虚拟摇杆指示器、射击按钮高亮）属于 [触屏操控界面] 系统的职责范围。

| 事件 | 视觉反馈 | 音频反馈 | 优先级 |
|------|---------|---------|--------|
| 触屏按下（任意区） | 无（由 UI 层负责） | 无 | — |
| 触屏抬起（任意区） | 无 | 无 | — |
| 跨越死区（开始移动） | 无 | 无 | — |

## Game Feel

### Feel Reference

**目标手感**：Dead Cells Mobile 的虚拟摇杆响应——滑动即走、指哪打哪、无感知延迟。**不应像**某些 F2P 手游的延迟摇杆（拖动 100ms 后角色才开始移动）。

### Input Responsiveness

| 动作 | 最大输入到响应延迟 | 帧预算（60fps） | 备注 |
|------|-------------------|----------------|------|
| 移动（左区拖动） | 33ms | 2 帧 | 手指移动后 2 帧内 `move_direction` 必须更新 |
| 瞄准（右区拖动） | 33ms | 2 帧 | `aim_position` 更新延迟 |
| 射击（点击） | 16ms | 1 帧 | 点击抬起后下一帧 `shoot_tapped` 必须为 true |

### Weight and Responsiveness Profile

- **Weight**: 轻量级、灵敏——不应有"迟缓感"。手指滑动即响应，无加速曲线。
- **Player control**: 高控制度——手指位置和 game 内响应之间是直接的、可预测的映射。无惯性、无动量。
- **Snap quality**: 移动方向是模拟量（任意方向），射击是数字量（点击=射击，按住=连射）。瞄准位置是模拟量。
- **Acceleration model**: 移动信号直接跟随手指偏移——无加速曲线或缓入缓出。`max_radius` 决定了"满速需要滑多远"。
- **Failure texture**: 当操作不响应时（如游戏暂停），玩家应能通过 HUD 状态感知原因——而非困惑"为什么没反应"。

### Feel Acceptance Criteria

- [ ] 玩家在盲测中不会使用"延迟"、"不跟手"、"卡"等词描述操控
- [ ] 死区默认值（20px）下，手指静止放在屏幕上时角色不抖动
- [ ] 点击射击的手感等同于按下实体按钮——无等待感

## UI Requirements

本系统不直接渲染任何 UI 元素。它输出标准化信号供 UI 层消费：

| 信号 | UI 消费者 | 用途 |
|------|----------|------|
| `is_aiming` | 触屏操控界面 | 显示/隐藏瞄准线 |
| `aim_position` | 触屏操控界面 | 渲染瞄准线终点和辅助瞄准指示器 |
| `move_direction` | HUD（可选） | 显示虚拟摇杆的视觉位置反馈 |

## Cross-References

| 本文档引用 | 目标文档 | 引用的具体元素 | 性质 |
|-----------|---------|--------------|------|
| `game_state` 在读入时 | `design/gdd/game-state-machine.md`（待设计） | `current_state` 枚举值 | 数据依赖 |
| `move_direction`, `aim_position` 等信号 | `design/gdd/player-controller.md`（待设计） | 全部 5 个输出信号的消费 | 数据依赖 |
| 瞄准线和辅助瞄准 UI | `design/gdd/touch-control-ui.md`（待设计） | `is_aiming` 和 `aim_position` 的消费 | 数据依赖 |

## Acceptance Criteria

- [ ] **AC1**: GIVEN 屏幕上无手指，且右区先前 `aim_position` 为 (300, 400)，WHEN 检查全部 5 个输出信号，THEN `move_direction = (0,0)`, `aim_position = (300,400)`（保留上次有效值）, `shoot_tapped = false`, `shoot_held = false`, `is_aiming = false`
- [ ] **AC2**: GIVEN `max_radius = 200`, `deadzone = 20`，WHEN 左区手指从原点向右拖动恰好 100px，THEN `move_direction.x = 0.5`, `move_direction.length() = 0.5`
- [ ] **AC3**: GIVEN `deadzone = 20`，WHEN 左区手指距原点 5px，THEN `move_direction = (0,0)`
- [ ] **AC4**: GIVEN `tap_threshold = 200`，WHEN 右区手指在 150ms 内按下并抬起且位移 < deadzone，THEN `shoot_tapped = true` 在抬起帧，下一帧复位为 false
- [ ] **AC5**: GIVEN `tap_threshold = 200`，WHEN 右区手指按住 300ms，THEN 自按下后 200ms 起每帧 `shoot_held = true`，抬起帧变为 false
- [ ] **AC6**: GIVEN 左区手指在位置 L0、右区手指在位置 R0，WHEN 左指移到 L1 且右指移到 R1，THEN `move_direction` 仅由 L0→L1 计算，`aim_position = R1`
- [ ] **AC7**: GIVEN 左区已有 1 个活跃触控点，WHEN 同区出现第 2 个触控点，THEN 第 2 个被忽略，第 1 个继续驱动 `move_direction`
- [ ] **AC8**: GIVEN 游戏状态机报告 `state = paused`，且暂停前有活跃触控点，WHEN 检查下一帧信号，THEN `move_direction = (0,0)`, `shoot_held = false`, `is_aiming = false`（集成测试）
- [ ] **AC9**: GIVEN 屏幕中线 `split_x = screen_width/2`，WHEN 触控点恰好落在中线上，THEN 归属右区
- [ ] **AC10**: GIVEN 触控点在左区按下，WHEN 拖动跨越中线进入右区，THEN 继续驱动左区 `move_direction`，`aim_position` 不受影响
- [ ] **AC11**: GIVEN 左右区各有一个活跃触控点，WHEN 应用收到 `NOTIFICATION_APPLICATION_FOCUS_OUT`，THEN `move_direction = (0,0)`, `shoot_tapped = false`, `shoot_held = false`, `is_aiming = false`, `aim_position` 保留最后有效值（集成测试）
- [ ] **AC12**: GIVEN 左区有活跃手指 + 右区按住满足 `shoot_held` 条件，WHEN 两指各自移动，THEN `move_direction` 更新 + `shoot_held` 保持 true（覆盖 MOVE_AND_SHOOT 状态）
- [ ] **AC13**: GIVEN 右区手指按住并拖动（`hold_distance > deadzone`），WHEN 检查信号，THEN `shoot_held = true` 且 `aim_position` 随手指位置持续更新
- [ ] **AC14**: GIVEN `split_x` 配置为 `screen_width * 0.3`，WHEN 触控点在 30% 左侧，THEN 归属于左区；在 30% 右侧则归属右区
- [ ] **AC15**: 无硬编码值——所有调优参数（deadzone, max_radius, tap_threshold, split_x）均从配置文件读取

## Open Questions

| 问题 | 负责人 | 目标日期 | 状态 |
|------|--------|---------|------|
| 3 指操作的第 3 指应映射到什么功能？（武器切换？特殊能力？） | game-designer | Alpha 前 | 开放——MVP 仅 2 指 |
| 是否需要保留"仅左区操作时自动向右瞄准"（无右指时自动瞄准模式）？ | game-designer | MVP 前 | 开放——取决于触屏操控界面的 A/B 测试结果 |
| 不同屏幕比例（16:9 vs 19.5:9 vs 4:3 iPad）的分区是否需要按比例缩放？还是固定像素？ | game-designer | MVP 前 | 开放——按比例缩放更合理但需要验证 |
